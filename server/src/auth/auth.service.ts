import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { PasswordResetToken } from 'src/db/entities/PasswordResetToken';
import { User, UserRole } from 'src/db/entities/User';
import { hashPassword } from 'src/helpers/authHelper';
import { MailService } from 'src/mail/mail.service';
import { buildPasswordResetMail } from 'src/mail/order-mail.templates';
import { UserInRequest } from 'src/types/express/custom';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/LoginDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 час

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly mailService: MailService,
		@InjectRepository(PasswordResetToken)
		private readonly resetTokenRepository: Repository<PasswordResetToken>,
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>
	) {}

	async signIn(loginDto: LoginDto) {
		const user = await this.userService.findOneByMailAndPass(
			loginDto.mail,
			loginDto.password
		);
		if (!user) {
			throw new UnauthorizedException('Неправильный логин или пароль');
		}

		const { access_token } = await this.generateAccess(user);
		return {
			user,
			access_token
		};
	}

	async generateAccess(user: User): Promise<{ access_token: string }> {
		const payload: UserInRequest = {
			id: user.id,
			mail: user.mail,
			fio: user.fio
		};
		return {
			access_token: await this.jwtService.signAsync(payload)
		};
	}

	isUserAdmin(user?: Pick<User, 'role'>): boolean {
		return user?.role === UserRole.ADMIN;
	}

	private hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	// Не раскрываем, существует ли пользователь с таким email
	async requestPasswordReset(mail: string): Promise<void> {
		const user = await this.usersRepository.findOne({ where: { mail } });
		if (!user) {
			return;
		}

		const rawToken = randomBytes(32).toString('hex');
		const tokenHash = this.hashToken(rawToken);
		const expiresAt = new Date(Date.now() + RESET_TTL_MS);

		await this.resetTokenRepository.save({
			user,
			tokenHash,
			expiresAt,
			usedAt: null
		});

		const resetUrl = `${this.mailService.getAppUrl().replace(/\/$/, '')}/recover?token=${rawToken}`;
		const mailBody = buildPasswordResetMail({ fio: user.fio, resetUrl });
		await this.mailService.sendMail({ to: user.mail, ...mailBody });
	}

	async resetPassword(dto: ResetPasswordDto): Promise<void> {
		if (dto.password !== dto.rePassword) {
			throw new BadRequestException('Пароли не совпадают');
		}

		const tokenHash = this.hashToken(dto.token);
		const record = await this.resetTokenRepository.findOne({
			where: {
				tokenHash,
				usedAt: IsNull(),
				expiresAt: MoreThan(new Date())
			},
			relations: { user: true }
		});

		if (!record?.user) {
			throw new BadRequestException(
				'Ссылка для сброса недействительна или устарела'
			);
		}

		record.user.password = await hashPassword(dto.password);
		await this.usersRepository.save(record.user);

		record.usedAt = new Date();
		await this.resetTokenRepository.save(record);

		// Инвалидируем остальные активные токены пользователя
		await this.resetTokenRepository
			.createQueryBuilder()
			.update(PasswordResetToken)
			.set({ usedAt: () => 'NOW()' })
			.where('"userId" = :userId', { userId: record.user.id })
			.andWhere('"usedAt" IS NULL')
			.execute();
	}
}

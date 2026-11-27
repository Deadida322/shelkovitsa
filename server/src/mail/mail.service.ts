import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { EnvironmentVariables } from 'src/config/env.validation';
import { SendMailInput, SentMail } from './mail.types';

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);
	private readonly transporter: Transporter;
	private readonly from: string;
	private readonly smtpConfigured: boolean;
	private readonly sentMails: SentMail[] = [];

	constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {
		const host = this.config.get('SMTP_HOST', { infer: true });
		this.smtpConfigured = Boolean(host);
		this.from = this.config.get('MAIL_FROM', { infer: true }) || 'noreply@localhost';

		if (this.smtpConfigured) {
			this.transporter = nodemailer.createTransport({
				host,
				port: this.config.get('SMTP_PORT', { infer: true }) ?? 587,
				secure: false,
				auth: {
					user: this.config.get('SMTP_USER', { infer: true }),
					pass: this.config.get('SMTP_PASS', { infer: true })
				}
			});
		} else {
			// Без SMTP — jsonTransport: письма не уходят наружу, но доступны в getSentMails()
			this.transporter = nodemailer.createTransport({ jsonTransport: true });
			this.logger.warn(
				'SMTP_HOST не задан: письма пишутся в mock-транспорт (для тестов/локальной разработки)'
			);
		}
	}

	isSmtpConfigured(): boolean {
		return this.smtpConfigured;
	}

	getOrderInbox(): string | undefined {
		return this.config.get('MAIL_ORDER_TO', { infer: true });
	}

	getAppUrl(): string {
		return (
			this.config.get('MAIL_APP_URL', { infer: true }) ||
			this.config.get('CORS', { infer: true })?.split(',')[0]?.trim() ||
			'http://localhost:3000'
		);
	}

	getSentMails(): readonly SentMail[] {
		return this.sentMails;
	}

	clearSentMails() {
		this.sentMails.length = 0;
	}

	async sendMail(input: SendMailInput): Promise<void> {
		const info = await this.transporter.sendMail({
			from: this.from,
			to: input.to,
			subject: input.subject,
			text: input.text,
			html: input.html ?? input.text.replace(/\n/g, '<br>')
		});

		if (!this.smtpConfigured) {
			// Фиксируем исходный input — удобнее для e2e, чем сырой jsonTransport
			this.sentMails.push({
				from: this.from,
				to: input.to,
				subject: input.subject,
				text: input.text,
				html: input.html ?? input.text.replace(/\n/g, '<br>')
			});
			void info;
		}

		this.logger.log(`Письмо отправлено: «${input.subject}» → ${input.to}`);
	}
}

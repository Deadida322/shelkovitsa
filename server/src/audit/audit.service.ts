import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditLog } from 'src/db/entities/AuditLog';
import { AuditRecordInput } from './audit.types';

@Injectable()
export class AuditService {
	private readonly logger = new Logger(AuditService.name);

	constructor(
		@InjectRepository(AuditLog)
		private readonly auditRepository: Repository<AuditLog>
	) {}

	/**
	 * Не блокирует бизнес-операцию: ошибки журнала только в ops-лог.
	 * Вызывать после успешной мутации.
	 */
	record(input: AuditRecordInput): void {
		void this.persist(input);
	}

	private async persist(input: AuditRecordInput): Promise<void> {
		try {
			await this.auditRepository.save(
				this.auditRepository.create({
					actorId: input.actor?.id ?? null,
					actorMail: input.actor?.mail ?? null,
					action: input.action.slice(0, 64),
					entity: input.entity.slice(0, 64),
					entityId:
						input.entityId == null || input.entityId === ''
							? null
							: String(input.entityId).slice(0, 64),
					meta: input.meta ?? null
				})
			);
		} catch (error) {
			this.logger.warn(
				`Не удалось записать audit ${input.action}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_3AM)
	async purgeOld(): Promise<void> {
		const days = Math.max(1, Number(process.env.AUDIT_RETENTION_DAYS || 90));
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
		try {
			const result = await this.auditRepository.delete({
				created_at: LessThan(cutoff)
			});
			const removed = result.affected ?? 0;
			if (removed > 0) {
				this.logger.log(
					`Audit purge: удалено ${removed} записей старше ${days} дн.`
				);
			}
		} catch (error) {
			this.logger.warn(
				`Audit purge failed: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

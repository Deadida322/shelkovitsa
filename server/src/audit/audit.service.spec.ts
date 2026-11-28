import { describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';

describe('AuditService', () => {
	it('record не бросает при ошибке save', async () => {
		const create = vi.fn((row) => row);
		const save = vi.fn().mockRejectedValue(new Error('db down'));
		const service = new AuditService({ create, save } as never);
		expect(() =>
			service.record({
				action: 'order.create',
				entity: 'order',
				entityId: 1
			})
		).not.toThrow();
		await new Promise((r) => setTimeout(r, 20));
		expect(save).toHaveBeenCalled();
	});
});

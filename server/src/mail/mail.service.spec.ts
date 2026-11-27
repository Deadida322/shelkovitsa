import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
	it('без SMTP пишет письма в mock и отдаёт их через getSentMails', async () => {
		const config = {
			get: (key: string) =>
				({
					MAIL_FROM: 'from@test.local',
					MAIL_ORDER_TO: 'orders@test.local',
					MAIL_APP_URL: 'http://localhost:3000'
				})[key]
		} as unknown as ConfigService;

		const mail = new MailService(config);
		expect(mail.isSmtpConfigured()).toBe(false);

		await mail.sendMail({
			to: 'user@test.local',
			subject: 'Тест',
			text: 'Привет'
		});

		expect(mail.getSentMails()).toHaveLength(1);
		expect(mail.getSentMails()[0]).toMatchObject({
			to: 'user@test.local',
			subject: 'Тест',
			text: 'Привет'
		});
	});
});

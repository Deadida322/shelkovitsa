import { Order } from 'src/db/entities/Order';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import {
	buildAdminOrderMail,
	buildCustomerOrderMail,
	buildPasswordResetMail
} from './order-mail.templates';

function sampleOrder(): Order {
	const article = Object.assign(new ProductArticle(), {
		name: 'Бюстгальтер',
		article: 'ART-1',
		price: 150000
	});
	const product = Object.assign(new Product(), {
		id: 7,
		productArticle: article,
		productColor: Object.assign(new ProductColor(), { name: 'Чёрный' }),
		productSize: Object.assign(new ProductSize(), { name: '75B' })
	});
	const op = Object.assign(new OrderProduct(), {
		amount: 2,
		price: 150000,
		product
	});
	return Object.assign(new Order(), {
		id: 42,
		fio: 'Иван Иванов',
		tel: '+79991234567',
		mail: 'ivan@example.com',
		region: 'Москва',
		address: 'ул. Тестовая, 1',
		description: 'Позвонить вечером',
		price: 300000,
		orderProducts: [op]
	});
}

describe('order-mail.templates', () => {
	it('админское письмо содержит контакты, состав и сумму', () => {
		const mail = buildAdminOrderMail(sampleOrder());
		expect(mail.subject).toBe('Новый заказ #42');
		expect(mail.text).toContain('Иван Иванов');
		expect(mail.text).toContain('+79991234567');
		expect(mail.text).toContain('ivan@example.com');
		expect(mail.text).toContain('Москва, ул. Тестовая, 1');
		expect(mail.text).toContain('Бюстгальтер');
		expect(mail.text).toContain('3000,00');
		expect(mail.html).toContain('Позвонить вечером');
	});

	it('клиентское письмо — заказ принят', () => {
		const mail = buildCustomerOrderMail(sampleOrder());
		expect(mail.subject).toBe('Заказ #42 принят');
		expect(mail.text).toMatch(/заказ #42 принят/i);
		expect(mail.text).toContain('Ожидайте связи');
	});

	it('письмо сброса пароля содержит ссылку', () => {
		const mail = buildPasswordResetMail({
			fio: 'Иван',
			resetUrl: 'http://localhost:3000/recover?token=abc'
		});
		expect(mail.subject).toBe('Сброс пароля');
		expect(mail.text).toContain('http://localhost:3000/recover?token=abc');
	});
});

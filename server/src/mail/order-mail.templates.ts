import { Order } from 'src/db/entities/Order';
import { formatKopecks } from 'src/helpers/money';

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function formatItems(order: Order): { text: string; html: string } {
	const lines = (order.orderProducts ?? []).map((op) => {
		const name =
			op.product?.productArticle?.name ||
			op.product?.productArticle?.article ||
			`товар #${op.product?.id ?? '?'}`;
		const color = op.product?.productColor?.name;
		const size = op.product?.productSize?.name;
		const variant = [color, size].filter(Boolean).join(' / ');
		const label = variant ? `${name} (${variant})` : name;
		const lineSum = formatKopecks(op.price * op.amount);
		return {
			text: `• ${label} × ${op.amount} = ${lineSum} ₽`,
			html: `<li>${escapeHtml(label)} × ${op.amount} = ${escapeHtml(lineSum)} ₽</li>`
		};
	});

	return {
		text: lines.map((l) => l.text).join('\n') || '• (нет позиций)',
		html: `<ul>${lines.map((l) => l.html).join('') || '<li>(нет позиций)</li>'}</ul>`
	};
}

export function buildAdminOrderMail(order: Order): {
	subject: string;
	text: string;
	html: string;
} {
	const items = formatItems(order);
	const sum = formatKopecks(order.price);
	const subject = `Новый заказ #${order.id}`;
	const text = [
		`Новый заказ #${order.id}`,
		``,
		`ФИО: ${order.fio}`,
		`Телефон: ${order.tel}`,
		`Email: ${order.mail}`,
		`Адрес: ${order.region}, ${order.address}`,
		order.description ? `Комментарий: ${order.description}` : null,
		``,
		`Состав:`,
		items.text,
		``,
		`Сумма: ${sum} ₽`,
		`ID: ${order.id}`
	]
		.filter((line) => line !== null)
		.join('\n');

	const html = [
		`<h2>Новый заказ #${order.id}</h2>`,
		`<p><strong>ФИО:</strong> ${escapeHtml(order.fio)}<br>`,
		`<strong>Телефон:</strong> ${escapeHtml(order.tel)}<br>`,
		`<strong>Email:</strong> ${escapeHtml(order.mail)}<br>`,
		`<strong>Адрес:</strong> ${escapeHtml(`${order.region}, ${order.address}`)}`,
		order.description
			? `<br><strong>Комментарий:</strong> ${escapeHtml(order.description)}`
			: '',
		`</p>`,
		`<p><strong>Состав:</strong></p>`,
		items.html,
		`<p><strong>Сумма:</strong> ${escapeHtml(sum)} ₽<br>`,
		`<strong>ID:</strong> ${order.id}</p>`
	].join('');

	return { subject, text, html };
}

export function buildCustomerOrderMail(order: Order): {
	subject: string;
	text: string;
	html: string;
} {
	const items = formatItems(order);
	const sum = formatKopecks(order.price);
	const subject = `Заказ #${order.id} принят`;
	const text = [
		`Здравствуйте, ${order.fio}!`,
		``,
		`Ваш заказ #${order.id} принят.`,
		``,
		`Состав:`,
		items.text,
		``,
		`Сумма: ${sum} ₽`,
		``,
		`Ожидайте связи — мы свяжемся с вами для подтверждения.`
	].join('\n');

	const html = [
		`<p>Здравствуйте, ${escapeHtml(order.fio)}!</p>`,
		`<p>Ваш заказ <strong>#${order.id}</strong> принят.</p>`,
		`<p><strong>Состав:</strong></p>`,
		items.html,
		`<p><strong>Сумма:</strong> ${escapeHtml(sum)} ₽</p>`,
		`<p>Ожидайте связи — мы свяжемся с вами для подтверждения.</p>`
	].join('');

	return { subject, text, html };
}

export function buildPasswordResetMail(params: { fio: string; resetUrl: string }): {
	subject: string;
	text: string;
	html: string;
} {
	const subject = 'Сброс пароля';
	const text = [
		`Здравствуйте, ${params.fio}!`,
		``,
		`Чтобы задать новый пароль, перейдите по ссылке (действует ограниченное время):`,
		params.resetUrl,
		``,
		`Если вы не запрашивали сброс — просто проигнорируйте это письмо.`
	].join('\n');
	const html = [
		`<p>Здравствуйте, ${escapeHtml(params.fio)}!</p>`,
		`<p>Чтобы задать новый пароль, перейдите по ссылке (действует ограниченное время):</p>`,
		`<p><a href="${escapeHtml(params.resetUrl)}">${escapeHtml(params.resetUrl)}</a></p>`,
		`<p>Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>`
	].join('');
	return { subject, text, html };
}

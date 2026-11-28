import { Order } from 'src/db/entities/Order';
import { formatKopecks } from 'src/helpers/money';

const BRAND = '#C41924';
const BRAND_SOFT = '#FDF2F3';
const TEXT = '#1a1a1a';
const MUTED = '#667085';
const BORDER = '#E8E8E8';

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function formatItems(order: Order): { text: string; htmlRows: string } {
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
			html: `<tr>
				<td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${TEXT};font-size:14px;">${escapeHtml(label)}</td>
				<td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:14px;text-align:center;white-space:nowrap;">× ${op.amount}</td>
				<td style="padding:10px 12px;border-bottom:1px solid ${BORDER};color:${TEXT};font-size:14px;text-align:right;white-space:nowrap;font-weight:600;">${escapeHtml(lineSum)} ₽</td>
			</tr>`
		};
	});

	return {
		text: lines.map((l) => l.text).join('\n') || '• (нет позиций)',
		htmlRows: lines.map((l) => l.html).join('') ||
			`<tr><td colspan="3" style="padding:12px;color:${MUTED};">(нет позиций)</td></tr>`
	};
}

function wrapMailHtml(params: {
	preheader: string;
	badge: string;
	title: string;
	bodyHtml: string;
}): string {
	const { preheader, badge, title, bodyHtml } = params;
	return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
<tr>
<td style="background:${BRAND};padding:20px 24px;">
<div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.02em;">Шелковица</div>
<div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px;">интернет-магазин</div>
</td>
</tr>
<tr>
<td style="padding:24px;">
<div style="display:inline-block;background:${BRAND_SOFT};color:${BRAND};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:12px;">${escapeHtml(badge)}</div>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${TEXT};">${escapeHtml(title)}</h1>
${bodyHtml}
</td>
</tr>
<tr>
<td style="padding:16px 24px 22px;background:#fafafa;border-top:1px solid ${BORDER};">
<p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">Письмо отправлено автоматически. Отвечать на него не нужно.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemsTableHtml(rows: string): string {
	return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${BORDER};border-radius:8px;overflow:hidden;margin:12px 0 16px;">
<thead>
<tr style="background:${BRAND_SOFT};">
<th align="left" style="padding:10px 12px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Товар</th>
<th align="center" style="padding:10px 12px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Кол-во</th>
<th align="right" style="padding:10px 12px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Сумма</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>`;
}

function kvRow(label: string, value: string): string {
	return `<tr>
<td style="padding:6px 0;color:${MUTED};font-size:13px;width:110px;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:6px 0;color:${TEXT};font-size:14px;font-weight:600;">${value}</td>
</tr>`;
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

	const bodyHtml = [
		`<p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.5;">Поступил новый заказ на сайте. Контакты и состав ниже.</p>`,
		`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">`,
		kvRow('ФИО', escapeHtml(order.fio)),
		kvRow('Телефон', escapeHtml(order.tel)),
		kvRow('Email', escapeHtml(order.mail)),
		kvRow('Адрес', escapeHtml(`${order.region}, ${order.address}`)),
		order.description
			? kvRow('Комментарий', escapeHtml(order.description))
			: '',
		`</table>`,
		itemsTableHtml(items.htmlRows),
		`<div style="background:${BRAND_SOFT};border-radius:8px;padding:14px 16px;">`,
		`<div style="font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Итого</div>`,
		`<div style="font-size:22px;font-weight:700;color:${BRAND};margin-top:4px;">${escapeHtml(sum)} ₽</div>`,
		`<div style="font-size:12px;color:${MUTED};margin-top:6px;">ID заказа: #${order.id}</div>`,
		`</div>`
	].join('');

	const html = wrapMailHtml({
		preheader: `Новый заказ #${order.id} на ${sum} ₽`,
		badge: 'Новый заказ',
		title: `Заказ #${order.id}`,
		bodyHtml
	});

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

	const bodyHtml = [
		`<p style="margin:0 0 8px;color:${TEXT};font-size:15px;line-height:1.5;">Здравствуйте, <strong>${escapeHtml(order.fio)}</strong>!</p>`,
		`<p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.5;">Спасибо за заказ. Мы получили его и скоро свяжемся с вами для подтверждения.</p>`,
		itemsTableHtml(items.htmlRows),
		`<div style="background:${BRAND_SOFT};border-radius:8px;padding:14px 16px;margin-bottom:16px;">`,
		`<div style="font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">К оплате</div>`,
		`<div style="font-size:22px;font-weight:700;color:${BRAND};margin-top:4px;">${escapeHtml(sum)} ₽</div>`,
		`<div style="font-size:12px;color:${MUTED};margin-top:6px;">Номер заказа: #${order.id}</div>`,
		`</div>`,
		`<p style="margin:0;color:${MUTED};font-size:13px;line-height:1.5;">Если заметите ошибку в заказе — ответьте на это письмо или напишите нам с сайта.</p>`
	].join('');

	const html = wrapMailHtml({
		preheader: `Заказ #${order.id} принят — ${sum} ₽`,
		badge: 'Заказ принят',
		title: `Спасибо за покупку!`,
		bodyHtml
	});

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

	const bodyHtml = [
		`<p style="margin:0 0 8px;color:${TEXT};font-size:15px;line-height:1.5;">Здравствуйте, <strong>${escapeHtml(params.fio)}</strong>!</p>`,
		`<p style="margin:0 0 20px;color:${MUTED};font-size:14px;line-height:1.5;">Чтобы задать новый пароль, нажмите кнопку ниже. Ссылка действует ограниченное время.</p>`,
		`<p style="margin:0 0 20px;"><a href="${escapeHtml(params.resetUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;">Задать новый пароль</a></p>`,
		`<p style="margin:0 0 8px;color:${MUTED};font-size:12px;line-height:1.5;">Если кнопка не работает, скопируйте ссылку:</p>`,
		`<p style="margin:0 0 16px;word-break:break-all;font-size:12px;"><a href="${escapeHtml(params.resetUrl)}" style="color:${BRAND};">${escapeHtml(params.resetUrl)}</a></p>`,
		`<p style="margin:0;color:${MUTED};font-size:13px;line-height:1.5;">Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>`
	].join('');

	const html = wrapMailHtml({
		preheader: 'Ссылка для сброса пароля в Шелковице',
		badge: 'Безопасность',
		title: 'Сброс пароля',
		bodyHtml
	});

	return { subject, text, html };
}

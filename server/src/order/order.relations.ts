// Связи, которые нужны для отдачи заказа клиенту и для уведомлений
export const orderRelations = {
	orderProducts: {
		product: {
			productArticle: true,
			productColor: true,
			productSize: true
		}
	},
	telegramMessage: true
};

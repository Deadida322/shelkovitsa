export type AuditActor = {
	id?: number | null;
	mail?: string | null;
};

export type AuditRecordInput = {
	actor?: AuditActor | null;
	action: string;
	entity: string;
	entityId?: string | number | null;
	meta?: Record<string, unknown> | null;
};

export const AuditActions = {
	ORDER_CREATE: 'order.create',
	ORDER_STATUS_CHANGE: 'order.status_change',
	AUTH_REGISTER: 'auth.register',
	AUTH_PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
	AUTH_PASSWORD_RESET: 'auth.password_reset',
	PRODUCT_ARTICLE_UPDATE: 'product_article.update',
	PRODUCT_ARTICLE_DELETE: 'product_article.delete',
	PRODUCT_ARTICLE_IMAGE_UPLOAD: 'product_article.image_upload',
	PRODUCT_ARTICLE_IMAGE_DELETE: 'product_article.image_delete',
	PRODUCT_ARTICLE_LOGO: 'product_article.logo',
	PRODUCT_ARTICLE_IMPORT: 'product_article.import',
	CATEGORY_CREATE: 'category.create',
	CATEGORY_UPDATE: 'category.update',
	CATEGORY_DELETE: 'category.delete',
	SUBCATEGORY_CREATE: 'subcategory.create',
	SUBCATEGORY_UPDATE: 'subcategory.update',
	SUBCATEGORY_DELETE: 'subcategory.delete'
} as const;

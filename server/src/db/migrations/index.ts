import { Init1792767111911 } from './1792767111911-init';
import { PricesToKopecks1792767111912 } from './1792767111912-prices-to-kopecks';
import { OrderStatusCancelled1792767111913 } from './1792767111913-order-status-cancelled';
import { PasswordResetToken1792767111914 } from './1792767111914-password-reset-token';
import { PgTrgmSearch1792767111915 } from './1792767111915-pg-trgm-search';

// Новую миграцию (npm run migrate:add) нужно добавить в этот список
export const migrations = [
	Init1792767111911,
	PricesToKopecks1792767111912,
	OrderStatusCancelled1792767111913,
	PasswordResetToken1792767111914,
	PgTrgmSearch1792767111915
];

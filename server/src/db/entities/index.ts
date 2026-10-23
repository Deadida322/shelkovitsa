import { Benefit } from './Benefit';
import { DeliveryType } from './DeliveryType';
import { Order } from './Order';
import { OrderProduct } from './OrderProduct';
import { Product } from './Product';
import { ProductArticle } from './ProductArticle';
import { ProductCategory } from './ProductCategory';
import { ProductColor } from './ProductColor';
import { ProductFile } from './ProductFile';
import { ProductSize } from './ProductSize';
import { ProductSubcategory } from './ProductSubcategory';
import { TelegramOrderMessage } from './TelegramOrderMessage';
import { User } from './User';

// Явный список вместо glob: TypeORM не грузит файлы сам, а значит одинаково
// работает в собранном приложении, в CLI миграций и в тестах (Vitest/ESM)
export const entities = [
	Benefit,
	DeliveryType,
	Order,
	OrderProduct,
	Product,
	ProductArticle,
	ProductCategory,
	ProductColor,
	ProductFile,
	ProductSize,
	ProductSubcategory,
	TelegramOrderMessage,
	User
];

import {
	BadRequestException,
	Injectable,
	InternalServerErrorException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/db/entities/Order';
import { DataSource, In, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/CreateOrderDto';
import { OrderProduct } from 'src/db/entities/OrderProduct';
import { Product } from 'src/db/entities/Product';
import { convertToJson } from 'src/helpers/convertHelper';
import { OrderDto } from './dto/OrderDto';
import { baseWhere } from 'src/common/utils';
import { GetListDto } from 'src/common/dto/GetListDto';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from 'src/helpers/paginateHelper';
import { OrderAdminDto } from './dto/OrderAdminDto';
import { User } from 'src/db/entities/User';
import { DeliveryType } from 'src/db/entities/DeliveryType';

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order)
		private orderRepository: Repository<Order>,
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
		@InjectRepository(OrderProduct)
		private orderProductRepository: Repository<OrderProduct>,
		private dataSource: DataSource
	) {}

	async create(createOrderDto: CreateOrderDto, userId?: number) {
		const orderProducts = createOrderDto.orderProducts.map(
			({ amount, productId }) => {
				return {
					amount,
					price: 0,
					productId
				};
			}
		);
		const dProducts = await this.productRepository.find({
			where: {
				id: In(orderProducts.map((el) => el.productId)),
				...baseWhere
			},
			relations: {
				productArticle: true
			}
		});

		//проверка на существование продукта
		const dbOrderProductsIds = dProducts.map((el) => el.id);
		if (dProducts.length != orderProducts.length) {
			const notExistProduct = orderProducts.find((op) => {
				return !dbOrderProductsIds.includes(op.productId);
			});
			throw new BadRequestException(
				`Не найден продукт ${notExistProduct.productId ?? ''}`
			);
		}
		//проверка на складские остатки
		let ops = orderProducts.map((el) => {
			const product = dProducts.find((dop) => dop.id == el.productId);
			if (!product) {
				throw new BadRequestException(`Не найден продукт ${el.productId ?? ''}`);
			}
			if (el.amount > product.amount) {
				throw new BadRequestException(
					`Недостаточное кол-во для ${product?.productArticle?.name ?? ''}, Вы можете закать только ${product.amount} единиц`
				);
			}
			return {
				amount: el.amount,
				price: +product.productArticle.price,
				product
			};
		});
		const price = ops.reduce((acc, currentValue) => acc + currentValue.price, 0);

		let payload = {
			...createOrderDto,
			price,
			user: undefined,
			deliveryType: undefined
		};

		const queryRunner = this.dataSource.createQueryRunner();

		await queryRunner.connect();
		await queryRunner.startTransaction();
		try {
			if (userId) {
				const user = await queryRunner.manager.findOne(User, {
					where: {
						id: userId,
						...baseWhere
					}
				});
				if (user) {
					payload.user = user;
				}
			}
			const deliveryType = await queryRunner.manager.findOne(DeliveryType, {
				where: {
					id: createOrderDto.deliveryTypeId,
					...baseWhere
				}
			});
			if (!deliveryType) {
				throw new BadRequestException('Не найден тип доставки');
			}
			payload.deliveryType = deliveryType;
			const order = await queryRunner.manager.save(Order, payload);
			ops = ops.map((el) => {
				return {
					...el,
					order
				};
			});
			await queryRunner.manager.save(OrderProduct, ops);

			await queryRunner.commitTransaction();
			const newOrder = await queryRunner.manager.findOne(Order, {
				where: {
					id: order.id
				},
				relations: {
					orderProducts: {
						product: true
					}
				}
			});
			return convertToJson(OrderDto, newOrder);
		} catch (err) {
			await queryRunner.rollbackTransaction();
			throw new InternalServerErrorException(err);
		} finally {
			await queryRunner.release();
		}
	}

	async getOrderList(
		getListDto: GetListDto,
		userId: number
	): Promise<IPaginateResult<OrderDto>> {
		const [result, total] = await this.orderRepository.findAndCount({
			where: {
				user: {
					id: userId
				},
				...baseWhere
			},
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(OrderDto, result, total, getListDto);
	}

	async getAdminOrderList(
		getListDto: GetListDto
	): Promise<IPaginateResult<OrderAdminDto>> {
		const [result, total] = await this.orderRepository.findAndCount({
			where: {
				...baseWhere
			},
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(OrderAdminDto, result, total, getListDto);
	}
}

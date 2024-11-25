import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Between, In, Repository } from 'typeorm';
import { FullProductDto } from './dto/FullProductDto';
import { convertToClass, convertToJson } from 'src/helpers/convertHelper';
import { GetListDto } from 'src/common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';
import { ParseProductDto } from './dto/ParseProductDto';
import { ProductColor } from 'src/db/entities/ProductColor';
import xlsx from 'node-xlsx';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { UploadFileDto } from './dto/UploadFileDto';
import {
	getPaginateResult,
	getPaginateWhere,
	IPaginateResult
} from '../helpers/paginateHelper';
import { baseWhere } from 'src/common/utils';
import { ProductAdminDto } from './dto/ProductAdminDto';
import { CreateProductDto } from './dto/CreateProductDto';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { GetProductListDto } from './dto/GetProductListDto';
import { GetProductDto } from './dto/GetProductDto';

type BaseWhereType = {
	isVisible: boolean;
	is_deleted: boolean;
};
const baseProductWhere: BaseWhereType = {
	...baseWhere,
	isVisible: true
};
@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,

		@InjectRepository(ProductArticle)
		private productArticleRepository: Repository<ProductArticle>,

		@InjectRepository(ProductColor)
		private ProductColorRepository: Repository<ProductColor>,

		@InjectRepository(ProductSize)
		private ProductSizeRepository: Repository<ProductSize>,

		@InjectRepository(ProductSubcategory)
		private ProductSubcategoryRepository: Repository<ProductSubcategory>
	) {}

	async getById(id: number, isAdmin: boolean) {
		let wherePayload = { id };
		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}
		const p = await this.productArticleRepository.findOne({
			where: wherePayload,
			relations: {
				products: true
			}
		});
		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		return convertToJson(FullProductDto, p);
	}

	async getProduct(payload: GetProductDto) {
		let wherePayload = { id };

		const p = await this.productArticleRepository.findOne({
			where: wherePayload,
			relations: {
				products: true
			}
		});
		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		return convertToJson(FullProductDto, p);
	}

	async getList(
		payload: GetProductListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductDto>> {
		// type commonKeys =  keyof GetListDto

		// type WherePayload =  Omit<GetProductDto, commonKeys> & BaseWhereType;
		// let wherePayload :WherePayload  = {
		// 	...payload
		// };
		let wherePayload = {};

		if (payload.subcategoryId) {
			wherePayload = {
				...wherePayload,
				productSubcategory: {
					id: payload.subcategoryId
				}
			};
		}

		if (payload.categoryId) {
			wherePayload = {
				...wherePayload,
				productSubcategory: {
					productCategory: {
						id: payload.categoryId
					}
				}
			};
		}
		if (payload.minPrice || payload.maxPrice) {
			wherePayload = {
				...wherePayload,
				price: Between(
					payload.minPrice ?? 0,
					payload.maxPrice ?? Number.MAX_VALUE
				)
			};
		}
		if (!isAdmin) {
			wherePayload = { ...baseProductWhere };
		}
		const [result, total] = await this.productArticleRepository.findAndCount({
			...getPaginateWhere(payload),
			where: wherePayload
		});

		return getPaginateResult(isAdmin ? ProductAdminDto : ProductDto, result, total, {
			itemsPerPage: payload.itemsPerPage,
			page: payload.page
		});
	}

	async geProductsByCategory(
		id: number,
		getListDto: GetListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductDto>> {
		let wherePayload = {
			productSubcategory: {
				productCategory: {
					id
				}
			}
		};
		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}
		const [result, total] = await this.productArticleRepository.findAndCount({
			where: wherePayload,
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(ProductDto, result, total, getListDto);
	}

	async geProductsBySubcategory(
		id: number,
		getListDto: GetListDto,
		isAdmin: boolean
	): Promise<IPaginateResult<ProductDto>> {
		let wherePayload = {
			productSubcategory: {
				id
			}
		};
		if (!isAdmin) {
			wherePayload = { ...wherePayload, ...baseProductWhere };
		}
		const [result, total] = await this.productArticleRepository.findAndCount({
			where: wherePayload,
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(ProductDto, result, total, getListDto);
	}

	private async clearProducts() {
		await this.productRepository.update(
			{},
			{
				is_deleted: true
			}
		);
		await this.productArticleRepository.update(
			{},
			{
				is_deleted: true
			}
		);
	}

	async createProduct(createProductDto: CreateProductDto, images?: File[]) {
		const payload = convertToClass(ProductArticle, createProductDto);

		//проверка и нахождение связанных сущностей
		const { productColorIds, productSizeIds, productSubcategoryId } =
			createProductDto;
		const productSizes = await this.ProductSizeRepository.find({
			where: {
				...baseWhere,
				id: In(productSizeIds)
			}
		});
		if (productSizes.length != productSizeIds.length) {
			throw new BadRequestException('Нет такого размера');
		}

		const productColors = await this.ProductColorRepository.find({
			where: {
				...baseWhere,
				id: In(productColorIds)
			}
		});
		if (productColors.length != productColorIds.length) {
			throw new BadRequestException('Нет такого цвета');
		}

		const productSubcategory = await this.ProductSubcategoryRepository.findOne({
			where: {
				...baseWhere,
				id: productSubcategoryId
			}
		});
		if (!productSubcategory) {
			throw new BadRequestException('Нет такой подкатегории');
		}

		const productFiles = await this.productArticleRepository.save([]);
		// const p = await this.productArticleRepository.save();
		// if (!p) {
		// 	throw new NotFoundException('Продукт не найден');
		// }
		// return convertToJson(FullProductDto, p);
	}

	async parseExcelFile(
		filePath: string,
		uploadFileDto: UploadFileDto
	): Promise<Buffer | undefined> {
		const workSheetsFromFile = xlsx.parse(filePath);
		const data = workSheetsFromFile[0].data;

		if (uploadFileDto.isDeletedOther) {
			await this.clearProducts();
		}
		const errorRows: string[][] = [];
		data.forEach(async (row) => {
			try {
				const product: ParseProductDto = {
					article: row[1] ?? '',
					color: row[2] ?? '',
					size: row[3] ?? '',
					amount: Number(row[4] ?? -1),
					price: Number(row[5] ?? -1)
				};

				const values = Object.values(product);
				if (values.includes('') || values.includes(-1)) {
					errorRows.push(row.map((el) => String(el)));
				} else {
					product.article = String(product.article).trim();
					product.color = String(product.color).trim();
					product.size = String(product.size).trim();
					await this.parseProduct(product);
				}
			} catch (err) {
				errorRows.push([String(err)]);
			}
		});
		if (errorRows.length) {
			const buffer = xlsx.build([
				{ name: 'myFirstSheet', data: errorRows, options: {} }
			]);

			return buffer;
		}
		return undefined;
	}

	private async parseProduct(productDto: ParseProductDto): Promise<void> {
		const { amount, article, color, price, size } = productDto;

		let productArticle = await this.productArticleRepository.findOne({
			where: {
				article
			}
		});
		if (!productArticle) {
			productArticle = await this.productArticleRepository.save({
				article,
				price
			});
		} else {
			await this.productArticleRepository.update(
				{ id: productArticle.id },
				{
					is_deleted: false
				}
			);
		}

		let existProduct = await this.productRepository.findOne({
			where: {
				productArticle: {
					article
				},
				productColor: {
					name: color
				},
				productSize: {
					name: size
				}
			}
		});

		if (existProduct) {
			await this.productRepository.update(
				{
					id: existProduct.id
				},
				{ is_deleted: false, amount }
			);
		} else {
			let productColor = await this.ProductColorRepository.findOne({
				where: {
					name: color
				}
			});
			if (!productColor) {
				productColor = await this.ProductColorRepository.save({
					name: color
				});
			} else {
				await this.ProductColorRepository.update(
					{
						id: productColor.id
					},
					{ is_deleted: false }
				);
			}
			//секция с парсингом размеров

			let productSize = await this.ProductSizeRepository.findOne({
				where: {
					name: size
				}
			});

			if (!productSize) {
				productSize = await this.ProductSizeRepository.save({
					name: size
				});
			} else {
				await this.ProductSizeRepository.update(
					{
						id: productSize.id
					},
					{ is_deleted: false }
				);
			}

			const productPayload = {
				amount,
				productColor,
				productSize,
				productArticle
			};

			existProduct = await this.productRepository.save(productPayload);
		}
	}
}

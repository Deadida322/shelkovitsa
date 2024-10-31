import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';
import { FullProductDto } from './dto/FullProductDto';
import { convertToJson } from 'src/helpers/convertHelper';
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
		private ProductSizeRepository: Repository<ProductSize>
	) {}

	async getById(id: number) {
		const p = await this.productArticleRepository.findOne({
			where: {
				id
			}
		});
		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		return convertToJson(FullProductDto, p);
	}

	async getList(getListDto: GetListDto): Promise<IPaginateResult<ProductDto>> {
		const [result, total] = await this.productArticleRepository.findAndCount({
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(ProductDto, result, total, getListDto);
	}

	async geProductsByCategory(
		id: number,
		getListDto: GetListDto
	): Promise<IPaginateResult<ProductDto>> {
		const [result, total] = await this.productArticleRepository.findAndCount({
			where: {
				productSubcategory: {
					productCategory: {
						id
					}
				}
			},
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(ProductDto, result, total, getListDto);
	}

	async geProductsBySubcategory(
		id: number,
		getListDto: GetListDto
	): Promise<IPaginateResult<ProductDto>> {
		const [result, total] = await this.productArticleRepository.findAndCount({
			where: {
				productSubcategory: {
					id
				}
			},
			...getPaginateWhere(getListDto)
		});

		return getPaginateResult(ProductDto, result, total, getListDto);
	}

	private async clearProducts() {
		await this.productRepository.delete({});
		await this.productArticleRepository.delete({});
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
			await this.productRepository.upsert(
				{
					id: existProduct.id,
					is_deleted: false,
					amount
				},
				{ conflictPaths: ['id'] }
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ObjectId, Repository } from 'typeorm';
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
		private productArticleRepository: Repository<ProductArticle>
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

	async parseExcelFile(filePath: string, uploadFileDto: UploadFileDto) {
		const workSheetsFromFile = xlsx.parse(filePath);
		const data = workSheetsFromFile[0].data;

		data.forEach((row) => {
			try {
				const product: ParseProductDto = {
					article: row[1] ?? '',
					color: row[2] ?? '',
					size: row[3] ?? '',
					amount: Number(row[4] ?? -1),
					price: Number(row[5] ?? -1)
				};
				console.log(product);
			} catch (err) {}
		});
	}

	private async parseProduct(productDto: ParseProductDto): Promise<void> {
		const { amount, article, color, price, size } = productDto;

		const existProduct = await this.productRepository.findOne({
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
			let productArticle = await this.productArticleRepository.findOne({
				where: {
					article
				}
			});
			if (!productArticle) {
				productArticle = await this.productArticleRepository.save({
					name: article,
					price
				});
			} else {
			}

			// подумать про цвета и т.д.
		}
	}
}

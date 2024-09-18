import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ObjectId, Repository } from 'typeorm';
import { FullProductDto } from './dto/FullProductDto';
import { convertToClass, convertToClassMany } from 'src/helpers/convertHelper';
import { GetListDto } from 'src/common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';
import { FileDto } from 'src/common/dto/FileDto';
import * as fs from 'fs';
import * as path from 'path';
import { ParseProductDto } from './dto/ParseProductDto';
import { ProductColor } from 'src/db/entities/ProductColor';
import xlsx from 'node-xlsx';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductArticle } from 'src/db/entities/ProductArticle';

@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
		@InjectRepository(ProductColor)
		private productColorRepository: Repository<ProductColor>,
		@InjectRepository(ProductSize)
		private productSizeRepository: Repository<ProductSize>,
		@InjectRepository(ProductArticle)
		private productArticleRepository: Repository<ProductArticle>
	) {}

	async getById(id: number) {
		const p = await this.productRepository.findOne({
			where: {
				id
			}
		});
		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		return convertToClass(FullProductDto, p);
	}

	async getList(getListDto: GetListDto): Promise<ProductDto[]> {
		const { itemsPerPage, page } = getListDto;

		const products = await this.productRepository.find({
			take: itemsPerPage,
			skip: itemsPerPage * page
		});

		return convertToClassMany(ProductDto, products);
	}

	async parseExcelFile(filePath: string) {
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
					amount,
					price
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
					name: article
				});
			}

			// подумать про цвета и т.д.
		}
	}
}

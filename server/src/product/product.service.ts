import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ObjectId, Repository } from 'typeorm';
import { FullProductDto } from './dto/FullProductDto';
import { convertToClass, convertToClassMany } from 'src/helpers/convertHelper';
import { GetListDto } from 'src/common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';
import { CsvParser } from 'nest-csv-parser';
import { FileDto } from 'src/common/dto/FileDto';
import * as fs from 'fs';
import * as path from 'path';
import { ParseProductDto } from './dto/ParseProductDto';
import { ProductColor } from 'src/db/entities/ProductColor';
@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
		@InjectRepository(ProductColor)
		private productColorRepository: Repository<ProductColor>,
		private configService: ConfigService,
		private csvParser: CsvParser
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
	// async parseProducts(file: FileDto): Promise<void> {
	// 	const filePath = path.join(process.cwd(), 'temp', file.filename);
	// 	try {
	// 		const stream = fs.createReadStream(filePath);

	// 		const entities: unknown = await this.csvParser.parse(
	// 			stream,
	// 			ParseProductDto,
	// 			null,
	// 			1
	// 		);
	// 		let i = 0;
	// 		(entities as ParseProductDto[]).forEach((el) => {
	// 			if (i < 2) {
	// 				console.log({ el });
	// 			}
	// 			i++;
	// 		});
	// 	} catch (err) {
	// 		console.log(err);
	// 	}
	// }
	async parseProduct(productDto: ParseProductDto): Promise<void> {
		const { name, amount, article, color, price, size } = productDto;

		const existProduct = await this.productRepository.findOne({
			where: {
				article
			}
		});
		let product: Product;
		if (existProduct) {
			await this.productRepository.update(
				{
					article
				},
				{
					name,
					price
				}
			);
			product = await this.productRepository.findOne({
				where: {
					article
				}
			});
		} else {
			product = await this.productRepository.save({
				name,
				price,
				article
			});
		}

		const existColor = await this.productColorRepository.findOne({
			where: {
				name: color,
				amount
			}
		});
		if (existColor) {
			await this.productColorRepository.update(
				{ name, id: product.id },
				{
					amount
				}
			);
		} else {
			await this.productColorRepository.save({
				color: name,
				amount
			});
		}
	}
}

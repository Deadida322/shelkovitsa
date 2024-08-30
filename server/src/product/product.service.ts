import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';
import { FullProductDto } from './dto/FullProductDto';
import { convertToClass, convertToClassMany } from 'src/helpers/convertHelper';
import { GetListDto } from 'src/common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';
import { CsvParser } from 'nest-csv-parser';
import { FileDto } from 'src/common/dto/FileDto';
import * as fs from 'fs';
import * as path from 'path';
import { ParseProductDto } from './dto/ParseProductDto';
@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
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
	async parseProduct(file: FileDto): Promise<void> {
		const filePath = path.join(process.cwd(), 'temp', file.filename);
		try {
			const stream = fs.createReadStream(filePath);
			// console.log(filePath);

			const entities: unknown = await this.csvParser.parse(stream, ParseProductDto);
		} catch (err) {
			console.log(err);
		}
		// let i = 0;
		// (entities as ParseProductDto[]).forEach((el) => {
		// 	if (i < 2) {
		// 		console.log({ el });
		// 	}
		// 	i++;
		// });
	}
}

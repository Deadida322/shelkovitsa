import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import {
	convertToClass,
	convertToJson,
	convertToJsonMany
} from 'src/helpers/convertHelper';
import { ProductColorDto } from 'src/product/dto/ProductColorDto';
import { Repository } from 'typeorm';
import { CreateProductColorDto } from './dto/CreateProductColorDto';

@Injectable()
export class ProductColorService {
	constructor(
		@InjectRepository(ProductColor)
		private productColorRepository: Repository<ProductColor>
	) {}

	async getList(): Promise<ProductColorDto[]> {
		const productColors = await this.productColorRepository.find({});

		return convertToJsonMany(ProductColorDto, productColors);
	}

	async create(productColorDto: CreateProductColorDto): Promise<ProductColorDto> {
		const existProductColor = await this.productColorRepository.findOne({
			where: {
				name: productColorDto.name
			}
		});
		if (existProductColor) {
			throw new BadRequestException('Данный цвет уже существует');
		}

		const color = convertToClass(ProductColor, productColorDto);

		const newColor = await this.productColorRepository.save(color);

		return convertToJson(ProductColorDto, newColor);
	}
}

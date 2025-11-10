import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { Repository } from 'typeorm';
import * as xlsx from 'node-xlsx';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import { getColorsPath, getSizesPath } from 'src/helpers/storageHelper';
import { ProductSize } from 'src/db/entities/ProductSize';

@Injectable()
export class InitService {
	constructor(
		@InjectRepository(ProductColor)
		private readonly productColorRepository: Repository<ProductColor>,
		@InjectRepository(ProductSize)
		private readonly productSizeRepository: Repository<ProductSize>
	) {}

	public async initColors() {
		try {
			const colorsPath = await getColorsPath();
			const workSheetsFromFile = xlsx.parse(colorsPath);
			const data = workSheetsFromFile[0].data;
			//отбираем 2 колонку
			const allColors = Array.from(new Set(data.map((el) => el[1])));

			const allColorsLower = allColors
				.filter((el) => typeof el === 'string' && !!el)
				.map((el) => el.toLowerCase());

			const existColors = await this.productColorRepository.find({});
			const existColorNamesLower = existColors.map((el) => {
				return el.name.toLowerCase();
			});

			//проверка на существование цвета без заглавной буквы - если так, то обновляем
			const promises = allColorsLower.map((newColor) => {
				if (existColorNamesLower.includes(newColor)) {
					const existColor = existColors.find(
						(color) => color.name.toLowerCase() == newColor
					);

					//здесь не должно быть ошибки никогда
					if (!existColor) {
						throw new Error('Ошибка при нахождении цвета');
					} else {
						return this.productColorRepository.update(existColor.id, {
							...existColor,
							name: capitalizeFirstLetter(existColor.name)
						});
					}
				} else {
					return this.productColorRepository.save({
						name: capitalizeFirstLetter(newColor)
					});
				}
			});
			await Promise.all(promises);
		} catch (err) {
			throw err;
		}
	}

	public async initSizes() {
		try {
			const sizesPath = await getSizesPath();
			const workSheetsFromFile = xlsx.parse(sizesPath);
			const data = workSheetsFromFile[0].data;
			//отбираем 2 колонку
			const allSizes = Array.from(new Set(data.map((el) => el[1])));

			const allSizesLower = allSizes
				.filter((el) => !!el)
				.map((el) => String(el).toUpperCase());

			const existSizes = await this.productSizeRepository.find({});
			const existSizeNamesUpper = existSizes.map((el) => {
				return el.name.toUpperCase();
			});

			const promises = allSizesLower.map((newSize) => {
				if (existSizeNamesUpper.includes(newSize)) {
					const existSize = existSizes.find(
						(color) => color.name.toUpperCase() == newSize
					);

					//здесь не должно быть ошибки никогда
					if (!existSize) {
						throw new Error('Ошибка при нахождении размера');
					} else {
						return this.productSizeRepository.update(existSize.id, existSize);
					}
				} else {
					return this.productSizeRepository.save({
						name: newSize
					});
				}
			});
			await Promise.all(promises);
		} catch (err) {
			throw err;
		}
	}
}

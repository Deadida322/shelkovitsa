import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'node:fs';
import * as xlsx from 'node-xlsx';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import { getColorsPath } from 'src/helpers/storageHelper';

@Injectable()
export class InitService {
	constructor(
		@InjectRepository(ProductColor)
		private productColorRepository: Repository<ProductColor>
	) {}

	public async initColors() {
		try {
			const colorsPath = await getColorsPath();
			const workSheetsFromFile = xlsx.parse(colorsPath);
			//берем второй лист в экселе
			const data = workSheetsFromFile[1].data;
			//отбираем 2 колонку
			const allColors = Array.from(new Set(data.map((el) => el[1])));
			const allColorsLower = allColors.map((el) => el.toLowerCase());

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
}

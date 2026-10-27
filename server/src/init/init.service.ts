import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { readSheet } from 'src/helpers/excelHelper';
import { getColorsPath, getSizesPath } from 'src/helpers/storageHelper';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';

/**
 * Справочники цветов и размеров каталога — второй столбец data/colors.xlsx и
 * data/sizes.xlsx (первый — название у поставщика, им пользуется импорт).
 * Синхронизируются при старте: недостающие добавляются, регистр цветов выравнивается.
 */
@Injectable()
export class InitService implements OnApplicationBootstrap {
	private readonly logger = new Logger(InitService.name);

	constructor(
		@InjectRepository(ProductColor)
		private readonly productColorRepository: Repository<ProductColor>,
		@InjectRepository(ProductSize)
		private readonly productSizeRepository: Repository<ProductSize>
	) {}

	// Ошибка не должна ронять приложение: справочники можно поправить позже
	async onApplicationBootstrap() {
		for (const [name, init] of [
			['цветов', () => this.initColors()],
			['размеров', () => this.initSizes()]
		] as const) {
			try {
				await init();
			} catch (err) {
				this.logger.error(
					`Не удалось загрузить справочник ${name}`,
					err instanceof Error ? err.stack : String(err)
				);
			}
		}
	}

	async initColors() {
		const names = (await readSecondColumn(await getColorsPath())).map((name) =>
			capitalizeFirstLetter(name)
		);
		const existing = await this.productColorRepository.find();

		for (const name of new Set(names)) {
			const color = existing.find(
				(c) => c.name.toLowerCase() === name.toLowerCase()
			);
			if (!color) {
				await this.productColorRepository.save({ name });
			} else if (color.name !== name) {
				await this.productColorRepository.update(color.id, { name });
			}
		}
	}

	async initSizes() {
		const names = (await readSecondColumn(await getSizesPath())).map((name) =>
			name.toUpperCase()
		);
		const existing = new Set(
			(await this.productSizeRepository.find()).map((s) => s.name.toUpperCase())
		);

		for (const name of new Set(names)) {
			if (!existing.has(name)) {
				await this.productSizeRepository.save({ name });
			}
		}
	}
}

async function readSecondColumn(filePath: string): Promise<string[]> {
	return (await readSheet(filePath))
		.map((row) => String(row[1] ?? '').trim())
		.filter((value) => value !== '');
}

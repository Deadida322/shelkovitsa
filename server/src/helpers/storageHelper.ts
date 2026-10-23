import * as path from 'path';
import * as fs from 'node:fs';
import * as fsPromises from 'fs/promises';
import { randomBytes } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import {
	HttpStatus,
	InternalServerErrorException,
	ParseFilePipeBuilder,
	PipeTransform,
	UnprocessableEntityException
} from '@nestjs/common';

const COLORS_PATH = path.join(process.cwd(), 'data', 'colors.xlsx');
const SIZES_PATH = path.join(process.cwd(), 'data', 'sizes.xlsx');

const resolveStoragePath = (targetPath?: string) => {
	const safePath = targetPath ?? '';
	if (path.isAbsolute(safePath)) {
		return safePath;
	}
	return path.join(process.cwd(), safePath);
};

export const baseSrcPath = () => resolveStoragePath(process.env.TEMP_PATH);
export const baseDestPath = () => resolveStoragePath(process.env.DEST_PATH);
const getUploadMaxSizeBytes = () => {
	const rawMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? 20);
	const safeMb = Number.isFinite(rawMb) && rawMb > 0 ? rawMb : 20;
	return Math.floor(safeMb * 1024 * 1024);
};

export function getSrcPath(filePath?: string): string {
	const basePath = baseSrcPath();
	if (filePath) {
		return path.join(basePath, filePath);
	}
	return basePath;
}

export function getDestPath(filePath?: string): string {
	const basePath = baseDestPath();
	if (filePath) {
		return path.join(basePath, filePath);
	}
	return basePath;
}

export function initDiskStorage() {
	const srcPath = baseSrcPath();
	const destPath = baseDestPath();

	try {
		if (!fs.existsSync(srcPath)) {
			fs.mkdirSync(srcPath, { recursive: true });
		}

		if (!fs.existsSync(destPath)) {
			fs.mkdirSync(destPath, { recursive: true });
		}
	} catch (error) {
		console.error('Ошибка создания директорий:', error);
		throw new InternalServerErrorException(
			'Не удалось создать необходимые директории'
		);
	}
}

export const fileInterceptor = FileInterceptor('file', {
	storage: diskStorage({
		destination: function (req, file, cb) {
			const path = getSrcPath();
			cb(null, path);
		},
		filename: function (req, file, cb) {
			cb(null, `${Date.now()}-${file.originalname}`); //Appending extension
		}
	})
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Фото товара: в память (в статику пишем под своим именем), до 5 МБ
export const imageInterceptor = FileInterceptor('image', {
	storage: memoryStorage(),
	limits: { fileSize: MAX_IMAGE_BYTES }
});

const IMAGE_SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
	{
		ext: 'jpg',
		mime: 'image/jpeg',
		test: (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
	},
	{
		ext: 'png',
		mime: 'image/png',
		test: (b) => b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
	},
	{
		ext: 'webp',
		mime: 'image/webp',
		test: (b) =>
			b.subarray(0, 4).toString() === 'RIFF' &&
			b.subarray(8, 12).toString() === 'WEBP'
	}
];

// Проверяем содержимое файла, а не только заявленный Content-Type
export class ParseImagePipe implements PipeTransform<
	Express.Multer.File | undefined,
	Express.Multer.File
> {
	transform(file?: Express.Multer.File): Express.Multer.File {
		if (!file?.buffer?.length) {
			throw new UnprocessableEntityException('Нужен файл изображения в поле image');
		}
		if (
			!IMAGE_SIGNATURES.some(
				(sig) => sig.mime === file.mimetype && sig.test(file.buffer)
			)
		) {
			throw new UnprocessableEntityException(
				'Допустимы только изображения JPEG, PNG или WebP'
			);
		}
		return file;
	}
}

// Excel-импорт: размер ограничен здесь, формат проверяется по сигнатуре в контроллере
export function parseFileBuilder(fileIsRequired: boolean = true) {
	return new ParseFilePipeBuilder()
		.addMaxSizeValidator({
			maxSize: getUploadMaxSizeBytes(),
			message: 'Превышен максимальный размер файла'
		})
		.build({
			fileIsRequired,
			errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
		});
}

export async function moveFileToStatic(image: Express.Multer.File) {
	const ext = IMAGE_SIGNATURES.find((sig) => sig.test(image.buffer))?.ext ?? 'jpg';
	const fileName = `${randomBytes(8).toString('hex')}.${ext}`;
	await fsPromises.writeFile(getDestPath(fileName), image.buffer);
	return fileName;
}

export async function removeFile(fileName: string) {
	const destPath = getDestPath(fileName);
	await fsPromises.unlink(destPath);
}

export async function existsFile(f: string) {
	try {
		await fs.promises.stat(f);
		return true;
	} catch {
		return false;
	}
}

export const mimeTypes = {
	images: ['image/jpeg', 'image/png', 'image/webp']
};

export async function getColorsPath() {
	if (!(await existsFile(COLORS_PATH))) {
		throw new InternalServerErrorException(
			'Файл для преобразования цветов не найден'
		);
	}
	return COLORS_PATH;
}

export async function getSizesPath() {
	if (!(await existsFile(SIZES_PATH))) {
		throw new InternalServerErrorException(
			'Файл для преобразования размеров не найден'
		);
	}
	return SIZES_PATH;
}

import * as path from 'path';
import * as fs from 'node:fs';
import * as fsPromises from 'fs/promises';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
	HttpStatus,
	InternalServerErrorException,
	ParseFilePipeBuilder
} from '@nestjs/common';
import { MemoryStoredFile } from 'nestjs-form-data';

const COLORS_PATH = path.join(process.cwd(), 'data', 'colors.xlsx');
const SIZES_PATH = path.join(process.cwd(), 'data', 'sizes.xlsx');

const resolveStoragePath = (targetPath?: string) => {
	const safePath = targetPath ?? '';
	if (path.isAbsolute(safePath)) {
		return safePath;
	}
	return path.join(process.cwd(), safePath);
};

const baseSrcPath = () => resolveStoragePath(process.env.TEMP_PATH);
const baseDestPath = () => resolveStoragePath(process.env.DEST_PATH);
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

export function imagesInterceptor(filesCount: number = 10) {
	return FilesInterceptor('images', filesCount, {
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
}

export function parseFileBuilder(
	_fileType: string | RegExp,
	fileIsRequired: boolean = true
) {
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

export async function moveFileToStatic(image: MemoryStoredFile) {
	let hash = (Math.random() + 1).toString(36).substring(5);
	const fileName = `${hash}.${image.extension}`;
	const destPath = getDestPath(fileName);
	await fsPromises.writeFile(destPath, image.buffer);
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

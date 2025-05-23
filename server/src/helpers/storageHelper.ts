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

const COLORS_PATH = path.join(process.cwd(), 'docs', 'colors.xlsx');

const baseSrcPath = () => path.join(process.cwd(), process.env.TEMP_PATH);
const baseDestPath = () => path.join(process.cwd(), process.env.DEST_PATH);

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
	if (!fs.existsSync(srcPath)) {
		fsPromises.mkdir(srcPath);
	}

	if (!fs.existsSync(destPath)) {
		fsPromises.mkdir(destPath);
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

// export const logoInterceptor = FileInterceptor('logo', {
// 	storage: diskStorage({
// 		destination: function (req, file, cb) {
// 			const path = getSrcPath();
// 			cb(null, path);
// 		},
// 		filename: function (req, file, cb) {
// 			cb(null, `${Date.now()}-${file.originalname}`); //Appending extension
// 		}
// 	})
// });

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
	fileType: string | RegExp,
	fileIsRequired: boolean = true
) {
	return new ParseFilePipeBuilder()
		.addFileTypeValidator({
			fileType
		})
		.addMaxSizeValidator({
			maxSize: 10000000,
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

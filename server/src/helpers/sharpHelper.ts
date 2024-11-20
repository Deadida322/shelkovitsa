import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';
import { getDestPath } from './storageHelper';

@Injectable()
export class SharpPipe
	implements PipeTransform<Express.Multer.File, Promise<string | undefined>>
{
	async transform(image: Express.Multer.File): Promise<string> {
		if (!image) return undefined;
		const originalName = path.parse(image.originalname).name;
		const filename = Date.now() + '-' + originalName + '.webp';

		console.log(image.buffer);

		await sharp(image.buffer)
			.resize(800)
			.webp({ effort: 3 })
			.toFile(getDestPath(originalName));

		return filename;
	}
}

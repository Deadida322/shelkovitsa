import {
	Body,
	Controller,
	Get,
	Param,
	ParseFilePipeBuilder,
	Post,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { GetListDto } from '../common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';
import { FullProductDto } from './dto/FullProductDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ProductService } from './product.service';
import { CsvParser } from 'nest-csv-parser';
import { diskStorage } from 'multer';
import * as path from 'path';
import { FileDto } from 'src/common/dto/FileDto';
import * as papa from 'papaparse';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { ParseProductDto } from './dto/ParseProductDto';
@Controller('product')
export class ProductController {
	constructor(
		private productService: ProductService,
		private configService: ConfigService,
		private csvParser: CsvParser
	) {}

	@Get(':id')
	async getOne(@Param('id') id: number): Promise<FullProductDto> {
		return this.productService.getById(id);
	}

	@Post()
	async getList(@Body() getListDto: GetListDto): Promise<ProductDto[]> {
		return this.productService.getList(getListDto);
	}

	@Post('upload')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: './temp',
				filename: function (req, file, cb) {
					cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
				}
			})
		})
	)
	async uploadFile(
		@UploadedFile(
			new ParseFilePipeBuilder()
				.addFileTypeValidator({
					fileType: 'csv'
				})
				.addMaxSizeValidator({
					maxSize: 10000000
				})
				.build({
					fileIsRequired: true
				})
		)
		file: Express.Multer.File
	) {
		const filePath = path.join(process.cwd(), 'temp', file.filename);
		const stream = fs.createReadStream(filePath);
		// const result: ParseProductDto[] = [];
		const service = this.productService;
		papa.parse(stream, {
			header: false,
			worker: true,
			delimiter: ';',
			step: async function (row) {
				const productParse: ParseProductDto = {
					article: row.data[0] ?? '',
					name: row.data[1] ?? '',
					color: row.data[2] ?? '',
					size: row.data[3] ?? '',
					amount: Number(row.data[4].replace(',', '.') ?? -1),
					price: Number(row.data[5].replace(',', '.') ?? -1)
				};
				console.log(productParse);

				await service.parseProduct(productParse);
			}
		});
		return {};
	}

	// @Post('upload')
	// @UseInterceptors(
	// 	FileInterceptor('file', {
	// 		storage: diskStorage({
	// 			destination: './temp',
	// 			filename: function (req, file, cb) {
	// 				cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
	// 			}
	// 		})
	// 	})
	// )
	// async uploadFile(
	// 	@UploadedFile(
	// 		new ParseFilePipeBuilder()
	// 			.addFileTypeValidator({
	// 				fileType: 'csv'
	// 			})
	// 			.addMaxSizeValidator({
	// 				maxSize: 10000000
	// 			})
	// 			.build({
	// 				fileIsRequired: true
	// 			})
	// 	)
	// 	file: Express.Multer.File
	// ) {
	// 	await this.productService.parseProduct(file);
	// 	return {};
	// }
}

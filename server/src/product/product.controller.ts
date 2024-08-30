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
	uploadFile(
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
		const response = {
			originalname: file.originalname,
			filename: file.filename
		};
		return response;
	}
}

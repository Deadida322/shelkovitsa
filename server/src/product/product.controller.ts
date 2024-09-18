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
import { diskStorage } from 'multer';
import * as path from 'path';
import { FileDto } from 'src/common/dto/FileDto';
import * as fs from 'fs';
import { ParseProductDto } from './dto/ParseProductDto';
import xlsx from 'node-xlsx';

@Controller('product')
export class ProductController {
	constructor(
		private productService: ProductService,
		private configService: ConfigService
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
					fileType:
						'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel'
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
		this.productService.parseExcelFile(filePath);
		return {};
	}
}

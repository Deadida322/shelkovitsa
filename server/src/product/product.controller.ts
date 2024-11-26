import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	StreamableFile,
	UploadedFile,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common';
import { FullProductArticleDto } from './dto/FullProductArticleDto';
import { ProductService } from './product.service';

import { UploadFileDto } from './dto/UploadFileDto';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { excelFileType, imageFileType } from './product.types';
import { convertToClass } from 'src/helpers/convertHelper';
import { AdminAuth } from 'src/decorators/adminAuth';
import { Request } from 'express';
import { SharpPipe } from 'src/helpers/sharpHelper';
import {
	fileInterceptor,
	getSrcPath,
	imagesInterceptor,
	parseFileBuilder
} from 'src/helpers/storageHelper';
import { CreateProductDto } from './dto/CreateProductDto';
import { GetProductListDto } from './dto/GetProductListDto';
import { GetDetailProductDto } from './dto/GetDetailProductDto';

@Controller('product')
export class ProductController {
	constructor(private productService: ProductService) {}

	@Post(':id')
	async getOne(
		@Param('id') id: number,
		@Body() payload: GetDetailProductDto,
		@Req() request: Request
	): Promise<FullProductArticleDto> {
		return this.productService.getProduct(id, request.isAdmin, payload);
	}

	// @Post('product/:id')
	// async getProduct(@Req() request: Request): Promise<FullProductDto> {
	// 	return this.productService.getById(id, request.isAdmin);
	// }

	@Post()
	async getList(@Body() getListDto: GetProductListDto, @Req() request: Request) {
		return this.productService.getList(getListDto, request.isAdmin);
	}

	// @AdminAuth()
	// @Post('create')
	// @UseInterceptors(imageInterceptor)
	// async create(@UploadedFile(SharpPipe) image: string) {
	// 	console.log(image);

	// 	return '';
	// 	// return this.productService.getList(getListDto, request.isAdmin);
	// }

	@AdminAuth()
	@Post('create')
	@UseInterceptors(imagesInterceptor(10))
	async create(
		@Body() createProductDto: CreateProductDto,
		@UploadedFiles(parseFileBuilder(imageFileType, false)) images?: File[]
	) {
		// console.log({ images });

		return '';
		// return this.productService.getList(getListDto, request.isAdmin);
	}
	// КРУД по продукту (артиклу)
	// Удаление подкатегорий (удаление)
	// разобраться с путями

	@AdminAuth()
	@Post('upload')
	@UseInterceptors(fileInterceptor)
	async uploadFile(
		@UploadedFile(parseFileBuilder(excelFileType))
		file: Express.Multer.File,
		@Body() body
	) {
		const uploadFileDto = convertToClass(UploadFileDto, body);

		const filePath = getSrcPath(file.filename);
		const errorFile = await this.productService.parseExcelFile(
			filePath,
			uploadFileDto
		);

		if (errorFile) {
			return new StreamableFile(errorFile);
		} else {
			return {};
		}
	}
}

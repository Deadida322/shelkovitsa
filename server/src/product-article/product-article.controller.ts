import { ProductArticleService } from './product-article.service';
import {
	Body,
	Controller,
	Param,
	Post,
	Req,
	StreamableFile,
	UploadedFile,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common';
import { FullProductArticleDto } from '../product-article/dto/FullProductArticleDto';

import { UploadProductArticleFileDto } from '../product-article/dto/UploadProductArticleFileDto';
import { excelFileType, imageFileType } from '../product-article/product-article.types';
import { convertToClass } from 'src/helpers/convertHelper';
import { AdminAuth } from 'src/decorators/adminAuth';
import { Request } from 'express';
import {
	fileInterceptor,
	getSrcPath,
	imagesInterceptor,
	parseFileBuilder
} from 'src/helpers/storageHelper';
import { CreateProductArticleDto } from '../product-article/dto/CreateProductArticleDto';
import { GetProductArticleListDto } from '../product-article/dto/GetProductArticleListDto';
import { GetDetailProductArticleDto } from '../product-article/dto/GetDetailProductArticleDto';

@Controller('product-article')
export class ProductArticleController {
	constructor(private productArticleService: ProductArticleService) {}

	@Post(':id')
	async getProductArticle(
		@Param('id') id: number,
		@Body() payload: GetDetailProductArticleDto,
		@Req() request: Request
	): Promise<FullProductArticleDto> {
		return this.productArticleService.getProductArticle(id, request.isAdmin, payload);
	}

	@Post()
	async getList(@Body() getListDto: GetProductArticleListDto, @Req() request: Request) {
		return this.productArticleService.getList(getListDto, request.isAdmin);
	}

	// @AdminAuth()
	// @Post('create')
	// @UseInterceptors(imageInterceptor)
	// async create(@UploadedFile(SharpPipe) image: string) {
	// 	console.log(image);

	// 	return '';
	// 	// return this.productArticleService.getList(getListDto, request.isAdmin);
	// }

	@AdminAuth()
	@Post('create')
	@UseInterceptors(imagesInterceptor(10))
	async create(
		@Body() createProductDto: CreateProductArticleDto,
		@UploadedFiles(parseFileBuilder(imageFileType, false)) images?: File[]
	) {
		// console.log({ images });

		return '';
		// return this.productArticleService.getList(getListDto, request.isAdmin);
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
		const uploadFileDto = convertToClass(UploadProductArticleFileDto, body);

		const filePath = getSrcPath(file.filename);
		const errorFile = await this.productArticleService.parseExcelFile(
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

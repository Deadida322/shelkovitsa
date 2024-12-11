import { ProductArticleService } from './product-article.service';
import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
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
import { FormDataRequest } from 'nestjs-form-data';

@Controller('product-article')
export class ProductArticleController {
	constructor(private productArticleService: ProductArticleService) {}

	// @AdminAuth()
	// @Post('create')
	// @UseInterceptors(imageInterceptor)
	// async create(@UploadedFile(SharpPipe) image: string) {
	// 	console.log(image);

	// 	return '';
	// 	// return this.productArticleService.getList(getListDto, request.isAdmin);
	// }

	//создание продукта  с файлами, лого, получение изображений, привязка цветов и размеров, обновление кол-ва проуктов
	@AdminAuth()
	@Post('create')
	@FormDataRequest()
	// @UseInterceptors(imagesInterceptor(10))
	async create(
		@Body() createProductDto: CreateProductArticleDto
		// @UploadedFiles(parseFileBuilder(imageFileType, false)) images?: File[]
	) {
		console.log(createProductDto);

		await this.productArticleService.createArticleProduct(createProductDto, []);

		return '';
		// return this.productArticleService.getList(getListDto, request.isAdmin);
	}
	// КРУД по продукту (артиклу)
	// Удаление подкатегорий (удаление)
	// разобраться с путями

	@AdminAuth()
	@Put('upload')
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

	@Get('populate')
	async getPopulateList() {
		const articles = this.productArticleService.getPopulateList();
		return articles;
	}
}

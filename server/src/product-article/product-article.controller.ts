import { ProductArticleService } from './product-article.service';
import {
	Body,
	Controller,
	Delete,
	Get,
	InternalServerErrorException,
	Param,
	Patch,
	Post,
	Put,
	StreamableFile,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { FullProductArticleDto } from '../product-article/dto/FullProductArticleDto';

import { UploadProductArticleFileDto } from '../product-article/dto/UploadProductArticleFileDto';
import { excelFileType } from '../product-article/product-article.types';
import { convertToClass } from 'src/helpers/convertHelper';
import { AdminAuth } from 'src/decorators/adminAuth';
import {
	existsFile,
	fileInterceptor,
	getSrcPath,
	parseFileBuilder
} from 'src/helpers/storageHelper';
import { GetProductArticleListDto } from '../product-article/dto/GetProductArticleListDto';
import { GetDetailProductArticleDto } from '../product-article/dto/GetDetailProductArticleDto';
import { FormDataRequest } from 'nestjs-form-data';
import { UploadImageDto } from './dto/UploadImageDto';
import { CommonImageDto } from './dto/CommonImageDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';

@Controller('product-article')
export class ProductArticleController {
	constructor(private readonly productArticleService: ProductArticleService) {}

	// @AdminAuth()
	// @Post('create')
	// @UseInterceptors(imageInterceptor)
	// async create(@UploadedFile(SharpPipe) image: string) {
	// 	console.log(image);

	// 	return '';
	// 	// return this.productArticleService.getList(getListDto, request.isAdmin);
	// }

	// //создание продукта  с файлами, лого, получение изображений, привязка цветов и размеров, обновление кол-ва проуктов
	// @AdminAuth()
	// @Post('create')
	// @FormDataRequest()
	// // @UseInterceptors(imagesInterceptor(10))
	// async create(
	// 	@Body() createProductDto: CreateProductArticleDto
	// 	// @UploadedFiles(parseFileBuilder(imageFileType, false)) images?: File[]
	// ) {
	// 	console.log(createProductDto);

	// 	await this.productArticleService.createArticleProduct(createProductDto, []);

	// 	return '';
	// }

	// КРУД по продукту (артиклу)
	// Удаление подкатегорий (удаление)
	// разобраться с путями

	@Post('getList')
	async getList(@Body() getListDto: GetProductArticleListDto) {
		return this.productArticleService.getList(getListDto, false);
	}

	@Post(':id')
	async getProductArticle(
		@Param('id') id: number,
		@Body() payload: GetDetailProductArticleDto
	): Promise<FullProductArticleDto> {
		return this.productArticleService.getProductArticle(id, false, payload);
	}

	@Get('populate')
	async getPopulateList() {
		return this.productArticleService.getPopulateList();
	}

	@AdminAuth()
	@Post('admin/image')
	@FormDataRequest()
	async uploadImage(@Body() payload: UploadImageDto) {
		await this.productArticleService.uploadImage(payload);

		return '';
	}

	@AdminAuth()
	@Delete('admin/image')
	async deleteImage(@Body() payload: CommonImageDto) {
		await this.productArticleService.deleteImage(payload);
		return '';
	}

	@AdminAuth()
	@Patch('admin/image')
	async changeLogoImage(@Body() payload: CommonImageDto) {
		await this.productArticleService.changeLogo(payload);
		return '';
	}

	@AdminAuth()
	@Post('admin/getList')
	async getAdminList(@Body() getListDto: GetProductArticleListDto) {
		return this.productArticleService.getList(getListDto, true);
	}

	@AdminAuth()
	@Patch('admin/productArticle')
	async updateProductArticle(@Body() payload: UpdateProductArticleDto) {
		const res = await this.productArticleService.updateProductArticle(payload);

		return res;
	}

	@AdminAuth()
	@Post('admin/:id')
	async getAdminProductArticle(
		@Param('id') id: number,
		@Body() payload: GetDetailProductArticleDto
	): Promise<FullProductArticleDto> {
		return this.productArticleService.getProductArticle(id, true, payload);
	}

	@AdminAuth()
	@Put('uploadProducts')
	@UseInterceptors(fileInterceptor)
	async uploadFile(
		@UploadedFile(parseFileBuilder(excelFileType))
		file: Express.Multer.File,
		@Body() body
	) {
		const uploadFileDto = convertToClass(UploadProductArticleFileDto, body);

		const filePath = getSrcPath(file.filename);
		if (!(await existsFile(filePath))) {
			throw new InternalServerErrorException('Файл не найден');
		}
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

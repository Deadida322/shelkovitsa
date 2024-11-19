import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	StreamableFile,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { GetListDto } from '../common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';
import { FullProductDto } from './dto/FullProductDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';

import { UploadFileDto } from './dto/UploadFileDto';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { excelFileType } from './product.types';
import { convertToClass } from 'src/helpers/convertHelper';
import { AdminAuth } from 'src/decorators/adminAuth';
import { Request } from 'express';
import { SharpPipe } from 'src/helpers/sharpHelper';
import {
	fileInterceptor,
	getSrcPath,
	imageInterceptor,
	parseFileBuilder
} from 'src/helpers/storageHelper';

@Controller('product')
export class ProductController {
	constructor(private productService: ProductService) {}

	@Get(':id')
	async getOne(
		@Param('id') id: number,
		@Req() request: Request
	): Promise<FullProductDto> {
		return this.productService.getById(id, request.isAdmin);
	}

	@Post()
	async getList(@Body() getListDto: GetListDto, @Req() request: Request) {
		return this.productService.getList(getListDto, request.isAdmin);
	}

	@Post('/category/:id')
	async getProductByCategory(
		@Param('id') id: number,
		@Body() getListDto: GetListDto,
		@Req() request: Request
	): Promise<IPaginateResult<ProductDto>> {
		return this.productService.geProductsByCategory(id, getListDto, request.isAdmin);
	}

	@Post('/subcategory/:id')
	async getProductBySubcategory(
		@Param('id') id: number,
		@Body() getListDto: GetListDto,
		@Req() request: Request
	): Promise<IPaginateResult<ProductDto>> {
		return this.productService.geProductsBySubcategory(
			id,
			getListDto,
			request.isAdmin
		);
	}

	@AdminAuth()
	@Post('create')
	@UseInterceptors(imageInterceptor)
	async create(@UploadedFile(SharpPipe) image: string) {
		console.log(image);

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

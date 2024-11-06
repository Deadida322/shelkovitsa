import {
	Body,
	Controller,
	Get,
	Param,
	ParseFilePipeBuilder,
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
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadFileDto } from './dto/UploadFileDto';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { excelFileType } from './product.types';
import { convertToClass } from 'src/helpers/convertHelper';
import { AdminAuth } from 'src/decorators/adminAuth';
import { Request } from 'express';

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
					fileType: excelFileType
				})
				.addMaxSizeValidator({
					maxSize: 10000000
				})
				.build({
					fileIsRequired: true
				})
		)
		file: Express.Multer.File,
		@Body() body
	) {
		const uploadFileDto = convertToClass(UploadFileDto, body);

		const filePath = path.join(process.cwd(), 'temp', file.filename);
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

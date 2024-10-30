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
import { ProductService } from './product.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadFileDto } from './dto/UploadFileDto';
import { IPaginateResult } from 'src/helpers/paginateHelper';
import { excelFileType } from './product.types';
import { convertToClass } from 'src/helpers/convertHelper';

@Controller('product')
export class ProductController {
	constructor(private productService: ProductService) {}

	@Get(':id')
	async getOne(@Param('id') id: number): Promise<FullProductDto> {
		return this.productService.getById(id);
	}

	@Post()
	async getList(@Body() getListDto: GetListDto) {
		return this.productService.getList(getListDto);
	}

	@Post('/category/:id')
	async getProductByCategory(
		@Param('id') id: number,
		@Body() getListDto: GetListDto
	): Promise<IPaginateResult<ProductDto>> {
		return this.productService.geProductsByCategory(id, getListDto);
	}

	@Post('/subcategory/:id')
	async getProductBySubcategory(
		@Param('id') id: number,
		@Body() getListDto: GetListDto
	): Promise<IPaginateResult<ProductDto>> {
		return this.productService.geProductsBySubcategory(id, getListDto);
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
		this.productService.parseExcelFile(filePath, uploadFileDto);
		return {};
	}
}

import { ProductArticleService } from './product-article.service';
import { ProductImportService } from './product-import.service';
import {
	BadRequestException,
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
import * as fs from 'node:fs/promises';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiParam,
	ApiConsumes
} from '@nestjs/swagger';
import { FullProductArticleDto } from '../product-article/dto/FullProductArticleDto';

import { UploadProductArticleFileDto } from '../product-article/dto/UploadProductArticleFileDto';
import { excelFileType } from '../product-article/product-article.types';
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

@ApiTags('Product Article')
@Controller('product-article')
export class ProductArticleController {
	constructor(
		private readonly productArticleService: ProductArticleService,
		private readonly productImportService: ProductImportService
	) {}

	@Post('getList')
	@ApiOperation({ summary: 'Получить список артикулов продуктов' })
	@ApiResponse({ status: 200, description: 'Список артикулов' })
	@ApiBody({ type: GetProductArticleListDto })
	async getList(@Body() getListDto: GetProductArticleListDto) {
		return this.productArticleService.getList(getListDto, false);
	}

	@Post(':id')
	@ApiOperation({ summary: 'Получить артикул продукта по ID' })
	@ApiParam({ name: 'id', type: 'number', description: 'ID артикула' })
	@ApiResponse({
		status: 200,
		description: 'Артикул продукта',
		type: FullProductArticleDto
	})
	@ApiBody({ type: GetDetailProductArticleDto })
	async getProductArticle(
		@Param('id') id: number,
		@Body() payload: GetDetailProductArticleDto
	): Promise<FullProductArticleDto> {
		return this.productArticleService.getProductArticle(id, false, payload);
	}

	@Get('populate')
	@ApiOperation({ summary: 'Получить популярные артикулы продуктов' })
	@ApiResponse({ status: 200, description: 'Список популярных артикулов' })
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
	@ApiOperation({
		summary: 'Импорт каталога из Excel (админ). Возвращает Excel со строками-ошибками'
	})
	@ApiConsumes('multipart/form-data')
	async uploadFile(
		@UploadedFile(parseFileBuilder(excelFileType))
		file: Express.Multer.File,
		@Body() uploadFileDto: UploadProductArticleFileDto
	) {
		const filePath = getSrcPath(file.filename);
		try {
			await assertExcelFile(filePath, file);
			const errorFile = await this.productImportService.importFromExcel(
				filePath,
				uploadFileDto
			);
			return new StreamableFile(errorFile);
		} finally {
			// загруженный файл нужен только на время импорта
			await fs.unlink(filePath).catch(() => undefined);
		}
	}
}

const EXCEL_MIME_TYPES = new Set([
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-excel',
	'application/octet-stream'
]);

async function assertExcelFile(filePath: string, file: Express.Multer.File) {
	if (!(await existsFile(filePath))) {
		throw new InternalServerErrorException('Файл не найден');
	}
	const mimeType = (file?.mimetype || '').toLowerCase();
	const hasValidExtension = /\.(xlsx|xls)$/i.test(file?.originalname || '');
	if (!EXCEL_MIME_TYPES.has(mimeType) && !hasValidExtension) {
		throw new BadRequestException(
			`Неверный тип файла: ${mimeType || 'unknown'}. Разрешены только Excel (.xlsx/.xls)`
		);
	}

	const fh = await fs.open(filePath, 'r');
	const header = Buffer.alloc(8);
	await fh.read(header, 0, 8, 0);
	await fh.close();
	const signature = header.toString('hex');
	const isXlsx = signature.startsWith('504b0304'); // ZIP
	const isXls = signature.startsWith('d0cf11e0a1b11ae1'); // OLE Compound File
	if (!isXlsx && !isXls) {
		throw new BadRequestException('Файл не похож на Excel (.xlsx/.xls)');
	}
}

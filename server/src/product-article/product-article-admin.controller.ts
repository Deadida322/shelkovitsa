import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	InternalServerErrorException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	StreamableFile,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as fs from 'node:fs/promises';
import { FormDataRequest } from 'nestjs-form-data';
import { AdminAuth } from 'src/decorators/adminAuth';
import {
	existsFile,
	fileInterceptor,
	getSrcPath,
	parseFileBuilder
} from 'src/helpers/storageHelper';
import { FullProductArticleAdminDto } from './dto/FullProductArticleAdminDto';
import { GetProductArticleListDto } from './dto/GetProductArticleListDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';
import { UploadImageDto } from './dto/UploadImageDto';
import { UploadProductArticleFileDto } from './dto/UploadProductArticleFileDto';
import { ProductArticleService } from './product-article.service';
import { excelFileType } from './product-article.types';
import { ProductImportService } from './product-import.service';

@ApiTags('Admin: Product Article')
@ApiCookieAuth('access_token')
@AdminAuth()
@Controller('admin/product-article')
export class ProductArticleAdminController {
	constructor(
		private readonly productArticleService: ProductArticleService,
		private readonly productImportService: ProductImportService
	) {}

	@Get()
	@ApiOperation({ summary: 'Все артикулы, включая скрытые и архивные' })
	async getList(@Query() query: GetProductArticleListDto) {
		return this.productArticleService.getList(query, true);
	}

	@Get(':id')
	async getOne(
		@Param('id', ParseIntPipe) id: number
	): Promise<FullProductArticleAdminDto> {
		return this.productArticleService.getProductArticle(id, true, {} as never);
	}

	@Patch(':id')
	@ApiOperation({
		summary:
			'Правка артикула: поля, публикация, архив, варианты (цвета × размеры), подкатегория'
	})
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateProductArticleDto
	): Promise<FullProductArticleAdminDto> {
		return this.productArticleService.updateProductArticle(id, payload);
	}

	@Post(':id/images')
	@FormDataRequest()
	@ApiConsumes('multipart/form-data')
	async uploadImage(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UploadImageDto
	): Promise<void> {
		await this.productArticleService.uploadImage(id, payload);
	}

	@Patch('images/:fileId/logo')
	@HttpCode(204)
	async setLogo(@Param('fileId', ParseIntPipe) fileId: number): Promise<void> {
		await this.productArticleService.changeLogo(fileId);
	}

	@Delete('images/:fileId')
	@HttpCode(204)
	async deleteImage(@Param('fileId', ParseIntPipe) fileId: number): Promise<void> {
		await this.productArticleService.deleteImage(fileId);
	}

	@Post('import')
	@HttpCode(200)
	@UseInterceptors(fileInterceptor)
	@ApiConsumes('multipart/form-data')
	@ApiOperation({
		summary: 'Импорт каталога из Excel. Возвращает Excel со строками-ошибками'
	})
	async import(
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

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
	SerializeOptions,
	StreamableFile,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { ApiConsumes, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as fs from 'node:fs/promises';
import { AdminAuth } from 'src/decorators/adminAuth';
import {
	existsFile,
	fileInterceptor,
	getSrcPath,
	imageInterceptor,
	ParseImagePipe,
	parseFileBuilder
} from 'src/helpers/storageHelper';
import { PaginatedDto } from 'src/common/dto/PaginatedDto';
import { FullProductArticleAdminDto } from './dto/FullProductArticleAdminDto';
import { ProductArticleAdminDto } from './dto/ProductArticleAdminDto';
import { GetProductArticleListDto } from './dto/GetProductArticleListDto';
import { UpdateProductArticleDto } from './dto/UpdateProductArticleDto';
import { UploadProductArticleFileDto } from './dto/UploadProductArticleFileDto';
import { ProductArticleService } from './product-article.service';
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

	@SerializeOptions({ type: PaginatedDto(ProductArticleAdminDto) })
	@Get()
	@ApiOperation({ summary: 'Все артикулы, включая скрытые и архивные' })
	async getList(@Query() query: GetProductArticleListDto) {
		return this.productArticleService.getList(query, true);
	}

	@SerializeOptions({ type: FullProductArticleAdminDto })
	@Get(':id')
	async getOne(@Param('id', ParseIntPipe) id: number) {
		return this.productArticleService.getProductArticle(id, true, {} as never);
	}

	@SerializeOptions({ type: FullProductArticleAdminDto })
	@Patch(':id')
	@ApiOperation({
		summary:
			'Правка артикула: поля, публикация, архив, варианты (цвета × размеры), подкатегория'
	})
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateProductArticleDto
	) {
		return this.productArticleService.updateProductArticle(id, payload);
	}

	@Post(':id/images')
	@UseInterceptors(imageInterceptor)
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Загрузить фото (поле image: JPEG, PNG или WebP до 5 МБ)' })
	async uploadImage(
		@Param('id', ParseIntPipe) id: number,
		@UploadedFile(new ParseImagePipe()) image: Express.Multer.File
	): Promise<void> {
		await this.productArticleService.uploadImage(id, image);
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
		@UploadedFile(parseFileBuilder())
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

const XLSX_MIME_TYPES = new Set([
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/octet-stream'
]);

// Старый бинарный .xls не поддерживается: его нужно пересохранить в .xlsx
async function assertExcelFile(filePath: string, file: Express.Multer.File) {
	if (!(await existsFile(filePath))) {
		throw new InternalServerErrorException('Файл не найден');
	}
	const fh = await fs.open(filePath, 'r');
	const header = Buffer.alloc(8);
	await fh.read(header, 0, 8, 0);
	await fh.close();
	const signature = header.toString('hex');
	if (signature.startsWith('d0cf11e0a1b11ae1')) {
		// OLE Compound File
		throw new BadRequestException(
			'Формат .xls не поддерживается — пересохраните файл в Excel как .xlsx'
		);
	}

	const mimeType = (file?.mimetype || '').toLowerCase();
	const hasValidExtension = /\.xlsx$/i.test(file?.originalname || '');
	if (!XLSX_MIME_TYPES.has(mimeType) && !hasValidExtension) {
		throw new BadRequestException(
			`Неверный тип файла: ${mimeType || 'unknown'}. Разрешён только Excel (.xlsx)`
		);
	}
	if (!signature.startsWith('504b0304')) {
		// ZIP
		throw new BadRequestException('Файл не похож на Excel (.xlsx)');
	}
}

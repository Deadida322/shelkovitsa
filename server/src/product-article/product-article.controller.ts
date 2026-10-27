import {
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Query,
	SerializeOptions
} from '@nestjs/common';
import { PaginatedDto } from 'src/common/dto/PaginatedDto';
import { ProductArticleDto } from './dto/ProductArticleDto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FullProductArticleDto } from './dto/FullProductArticleDto';
import { GetDetailProductArticleDto } from './dto/GetDetailProductArticleDto';
import { GetProductArticleListDto } from './dto/GetProductArticleListDto';
import { ProductArticleService } from './product-article.service';

@ApiTags('Product Article')
@Controller('product-article')
export class ProductArticleController {
	constructor(private readonly productArticleService: ProductArticleService) {}

	@SerializeOptions({ type: PaginatedDto(ProductArticleDto) })
	@Get()
	@ApiOperation({
		summary: 'Каталог: опубликованные артикулы с фильтрами и пагинацией'
	})
	async getList(@Query() query: GetProductArticleListDto) {
		return this.productArticleService.getList(query, false);
	}

	@SerializeOptions({ type: ProductArticleDto })
	@Get('popular')
	@ApiOperation({ summary: 'Популярные артикулы за последний месяц' })
	async getPopular() {
		return this.productArticleService.getPopulateList();
	}

	@SerializeOptions({ type: FullProductArticleDto })
	@Get(':id')
	@ApiOperation({ summary: 'Карточка артикула (цвета — по выбранному размеру)' })
	@ApiResponse({ status: 200, type: FullProductArticleDto })
	@ApiResponse({ status: 404, description: 'Артикул не найден или не опубликован' })
	async getOne(
		@Param('id', ParseIntPipe) id: number,
		@Query() query: GetDetailProductArticleDto
	) {
		return this.productArticleService.getProductArticle(id, false, query);
	}
}

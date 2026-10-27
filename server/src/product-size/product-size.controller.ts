import { ProductSizeDto } from './dto/ProductSizeDto';
import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductSizeService } from './product-size.service';

@ApiTags('Product Size')
@SerializeOptions({ type: ProductSizeDto })
@Controller('product-size')
export class ProductSizeController {
	constructor(private readonly productSizeService: ProductSizeService) {}

	@Get()
	@ApiOperation({ summary: 'Получить список размеров продуктов' })
	@ApiResponse({ status: 200, description: 'Список размеров' })
	async getProductSizes() {
		return this.productSizeService.getList();
	}
}

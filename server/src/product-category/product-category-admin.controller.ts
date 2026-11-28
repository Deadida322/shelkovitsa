import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
	SerializeOptions
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuditService } from 'src/audit/audit.service';
import { AuditActions } from 'src/audit/audit.types';
import { AdminAuth } from 'src/decorators/adminAuth';
import { CreateProductCategoryDto } from './dto/CreateProductCategoryDto';
import { CreateProductSubcategoryDto } from './dto/CreateProductSubcategoryDto';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductCategoryDto } from './dto/ProductCategoryDto';
import { ProductSubcategoryDto } from './dto/ProductSubcategoryDto';
import { UpdateProductSubcategoryDto } from './dto/UpdateProductSubcategoryDto';
import { ProductCategoryService } from './product-category.service';

@ApiTags('Admin: Product Category')
@ApiCookieAuth('access_token')
@AdminAuth()
@Controller('admin')
export class ProductCategoryAdminController {
	constructor(
		private readonly productCategoryService: ProductCategoryService,
		private readonly audit: AuditService
	) {}

	private actor(req: Request) {
		return { id: req.user?.id, mail: req.user?.mail };
	}

	@Get('product-category')
	@SerializeOptions({ type: ListProductCategoryDto })
	@ApiOperation({ summary: 'Все категории и подкатегории, включая пустые' })
	@ApiResponse({ status: 200, type: [ListProductCategoryDto] })
	async getList() {
		return this.productCategoryService.getList(true);
	}

	@SerializeOptions({ type: ProductCategoryDto })
	@Post('product-category')
	async createCategory(
		@Body() payload: CreateProductCategoryDto,
		@Req() req: Request
	) {
		const created = await this.productCategoryService.createCategory(payload);
		this.audit.record({
			actor: this.actor(req),
			action: AuditActions.CATEGORY_CREATE,
			entity: 'product_category',
			entityId: created.id,
			meta: { name: payload.name }
		});
		return created;
	}

	@SerializeOptions({ type: ProductCategoryDto })
	@Patch('product-category/:id')
	async updateCategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: CreateProductCategoryDto,
		@Req() req: Request
	) {
		const updated = await this.productCategoryService.updateCategory(id, payload);
		this.audit.record({
			actor: this.actor(req),
			action: AuditActions.CATEGORY_UPDATE,
			entity: 'product_category',
			entityId: id,
			meta: { name: payload.name }
		});
		return updated;
	}

	@Delete('product-category/:id')
	@HttpCode(204)
	async deleteCategory(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: Request
	): Promise<void> {
		await this.productCategoryService.deleteCategory(id);
		this.audit.record({
			actor: this.actor(req),
			action: AuditActions.CATEGORY_DELETE,
			entity: 'product_category',
			entityId: id
		});
	}

	@SerializeOptions({ type: ProductSubcategoryDto })
	@Post('product-category/:id/subcategories')
	async createSubcategory(
		@Param('id', ParseIntPipe) categoryId: number,
		@Body() payload: CreateProductSubcategoryDto,
		@Req() req: Request
	) {
		const created = await this.productCategoryService.createSubCategory(
			categoryId,
			payload
		);
		this.audit.record({
			actor: this.actor(req),
			action: AuditActions.SUBCATEGORY_CREATE,
			entity: 'product_subcategory',
			entityId: created.id,
			meta: { categoryId, name: payload.name }
		});
		return created;
	}

	@SerializeOptions({ type: ProductSubcategoryDto })
	@Patch('product-subcategory/:id')
	async updateSubcategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateProductSubcategoryDto,
		@Req() req: Request
	) {
		const updated = await this.productCategoryService.updateSubCategory(id, payload);
		this.audit.record({
			actor: this.actor(req),
			action: AuditActions.SUBCATEGORY_UPDATE,
			entity: 'product_subcategory',
			entityId: id
		});
		return updated;
	}

	@Delete('product-subcategory/:id')
	@HttpCode(204)
	async deleteSubcategory(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: Request
	): Promise<void> {
		await this.productCategoryService.deleteSubcategory(id);
		this.audit.record({
			actor: this.actor(req),
			action: AuditActions.SUBCATEGORY_DELETE,
			entity: 'product_subcategory',
			entityId: id
		});
	}
}

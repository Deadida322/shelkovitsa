import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductFile } from 'src/db/entities/ProductFile';

@Module({
	imports: [TypeOrmModule.forFeature([ProductFile])],
	controllers: [FileController],
	providers: [FileService]
})
export class FileModule {}

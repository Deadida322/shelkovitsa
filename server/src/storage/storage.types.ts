// Хранилище загруженных файлов (фото товаров и цветов).
// Ключ — имя файла: оно хранится в БД и отдаётся фронту как /static/<ключ>.
export interface FileStorage {
	save(key: string, body: Buffer, contentType?: string): Promise<void>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
	read(key: string): Promise<Buffer>;
}

export const FILE_STORAGE = Symbol('FILE_STORAGE');

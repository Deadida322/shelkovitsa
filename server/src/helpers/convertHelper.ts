import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';

const convertOptions = {
	excludeExtraneousValues: true,
	exposeUnsetFields: false
};
function removeNullFields(plain: any) {
	for (const [key, value] of Object.entries(plain)) {
		if (value == null || value == undefined) {
			delete plain[key];
		}
	}
	return plain;
}
export function convertToJson<T, U>(cls: ClassConstructor<T>, payload: U): any {
	const plain = classToPlain(plainToClass(cls, payload, convertOptions));
	return removeNullFields(plain);
}

export function convertToJsonMany<T, U>(cls: ClassConstructor<T>, payload: U[]): any {
	let classes = plainToClass(cls, payload, convertOptions);
	classes = classes.map((el) => removeNullFields(el));
	const plains = classToPlain(classes);
	return plains;
}

export function convertToClass<T>(cls: ClassConstructor<T>, payload: any): T {
	return plainToClass(cls, payload, {
		...convertOptions
	});
}

export function convertToClassMany<T>(cls: ClassConstructor<T>, payload: any[]): T[] {
	return plainToClass(cls, payload, {
		...convertOptions
	});
}

import { ValidationError } from '@nestjs/common';

// Ошибки class-validator → плоский список { property, message } (вложенные — через точку)
export function errorFormatter(
	errors: ValidationError[],
	parentField?: string
): { property: string; message: string }[] {
	return errors.flatMap((error) => {
		const property = parentField
			? `${parentField}.${error.property}`
			: error.property;
		if (!error.constraints && error.children?.length) {
			return errorFormatter(error.children, property);
		}
		const messages = Object.values(error.constraints ?? {});
		return [{ property, message: messages.pop() ?? 'Invalid value' }];
	});
}

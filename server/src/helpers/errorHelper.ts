import { ValidationError } from '@nestjs/common';

export function errorFormatter(
	errors: ValidationError[],
	errMessage?: any,
	parentField?: string
): any {
	const message = errMessage || {};
	let errorField = '';
	let validationList = [];
	errors.forEach((error) => {
		errorField = parentField ? `${parentField}.${error.property}` : error?.property;
		if (!error.constraints && error.children.length) {
			errorFormatter(error.children, message, errorField);
		} else {
			validationList = Object.values(error?.constraints);
			message[errorField] =
				validationList.length > 0 ? validationList.pop() : 'Invalid value';
		}
	});

	return Object.entries(message).map((el) => {
		return {
			property: el[0],
			message: el[1]
		};
	});
}

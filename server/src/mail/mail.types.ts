export type SentMail = {
	from?: string;
	to?: string | string[];
	subject?: string;
	text?: string;
	html?: string;
};

export type SendMailInput = {
	to: string;
	subject: string;
	text: string;
	html?: string;
};

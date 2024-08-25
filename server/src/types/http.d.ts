import { IncomingHttpHeaders } from 'http';

declare module 'http' {
	interface IncomingHttpHeaders {
		'access-token'?: string;
		'refresh-token'?: string;
	}
}

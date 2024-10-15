import * as express from 'express';
import { UserInRequest } from './custom';
declare module 'express-serve-static-core' {
	export interface Request {
		user: UserInRequest;
		reqId: string;
	}
	// export interface Response {
	// 	message: any;
	// }
}

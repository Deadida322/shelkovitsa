import { SetMetadata } from '@nestjs/common';

export const IS_AUTH = 'isAuth';
export const Public = () => SetMetadata(IS_AUTH, true);

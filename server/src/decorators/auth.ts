import { SetMetadata } from '@nestjs/common';

export const IS_AUTH = 'isAuth';
export const Auth = () => SetMetadata(IS_AUTH, true);

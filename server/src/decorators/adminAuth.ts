import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_AUTH = 'isAdminAuth';
export const AdminAuth = () => SetMetadata(IS_ADMIN_AUTH, true);

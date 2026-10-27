import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';

export { EnvironmentVariables } from './env.validation';

export default ConfigModule.forRoot({
	validate: validateEnv,
	isGlobal: true
});

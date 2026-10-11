import { ConfigService } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleFactoryOptions => {
  const uri =
    configService.get<string>('MONGODB_URI') ||
    configService.get<string>('MONGO_URI');
  const dbName =
    configService.get<string>('DB_NAME') ||
    configService.get<string>('MONGO_DB') ||
    'saisaa_db';
  const isDev =
    configService.get<string>('NODE_ENV', 'development') !== 'production';

  return {
    uri,
    dbName,
    autoIndex: isDev,
    serverSelectionTimeoutMS: 8000,
  };
};

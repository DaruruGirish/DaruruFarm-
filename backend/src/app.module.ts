import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FarmModule } from './farm/farm.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExpenseModule } from './expense/expense.module';
import { DailyActivityModule } from './daily-activity/daily-activity.module';
import { GalleryModule } from './gallery/gallery.module';
import { DiseaseModule } from './disease/disease.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    // Load environmental variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configure TypeORM asynchronously to use environment variables
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'daruru_farm'),
        autoLoadEntities: true,
        // synchronize: true automatically syncs database tables with TypeORM entities.
        // It's helpful in development but should be false/disabled in production.
        synchronize: true,
        logging: true,
      }),
    }),
    AuthModule,
    FarmModule,
    DashboardModule,
    ExpenseModule,
    DailyActivityModule,
    GalleryModule,
    DiseaseModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

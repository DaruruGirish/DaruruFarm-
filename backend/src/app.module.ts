import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ViewerReadOnlyInterceptor } from './auth/viewer-readonly.interceptor';
import { AuthModule } from './auth/auth.module';
import { FarmModule } from './farm/farm.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExpenseModule } from './expense/expense.module';
import { DailyActivityModule } from './daily-activity/daily-activity.module';
import { GalleryModule } from './gallery/gallery.module';
import { DiseaseModule } from './disease/disease.module';
import { ContactModule } from './contact/contact.module';
import { LabReportModule } from './lab-report/lab-report.module';
import { TodoModule } from './todo/todo.module';
import { BillingModule } from './billing/billing.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    // Load environmental variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ScheduleModule.forRoot(),
    // Configure TypeORM asynchronously to use environment variables
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        // Default: sync in non-production. Override with TYPEORM_SYNCHRONIZE=true|false for Docker/first boot.
        synchronize:
          process.env.TYPEORM_SYNCHRONIZE != null
            ? process.env.TYPEORM_SYNCHRONIZE === 'true'
            : process.env.NODE_ENV !== 'production',
        logging: process.env.TYPEORM_LOGGING === 'true',
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
    LabReportModule,
    TodoModule,
    BillingModule,
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ViewerReadOnlyInterceptor },
  ],
})
export class AppModule {}

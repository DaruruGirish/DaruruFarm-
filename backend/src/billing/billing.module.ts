import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PremiumPayment } from './premium-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PremiumPayment]), AuthModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}

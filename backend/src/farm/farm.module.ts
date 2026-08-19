import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './farm.entity';
import { User } from '../auth/user.entity';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, User])],
  controllers: [FarmController],
  providers: [FarmService],
  exports: [FarmService],
})
export class FarmModule {}

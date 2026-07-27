import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactInquiry } from './contact-inquiry.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactInquiry])],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService, TypeOrmModule],
})
export class ContactModule {}

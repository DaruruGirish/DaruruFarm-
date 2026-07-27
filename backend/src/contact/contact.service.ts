import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInquiry } from './contact-inquiry.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactInquiry)
    private contactRepository: Repository<ContactInquiry>,
  ) {}

  async create(
    name: string,
    email: string,
    subject: string,
    message: string,
    user: User,
  ): Promise<ContactInquiry> {
    const inquiry = this.contactRepository.create({
      name,
      email,
      subject,
      message,
      user,
    });
    return this.contactRepository.save(inquiry);
  }

  async findAll(user: User): Promise<ContactInquiry[]> {
    return this.contactRepository.find({
      where: { user: { id: user.id } },
      order: { submittedAt: 'DESC' },
    });
  }
}

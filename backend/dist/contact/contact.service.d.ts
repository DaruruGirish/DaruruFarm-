import { Repository } from 'typeorm';
import { ContactInquiry } from './contact-inquiry.entity';
import { User } from '../auth/user.entity';
export declare class ContactService {
    private contactRepository;
    constructor(contactRepository: Repository<ContactInquiry>);
    create(name: string, email: string, subject: string, message: string, user?: User | null): Promise<ContactInquiry>;
    findAll(user: User): Promise<ContactInquiry[]>;
}

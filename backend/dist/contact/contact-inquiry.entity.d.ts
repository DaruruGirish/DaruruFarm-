import { User } from '../auth/user.entity';
export declare class ContactInquiry {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    submittedAt: Date;
    user: User;
}

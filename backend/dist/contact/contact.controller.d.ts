import { ContactService } from './contact.service';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    create(name: string, email: string, subject: string, message: string, req: any): Promise<import("./contact-inquiry.entity").ContactInquiry>;
    findAll(req: any): Promise<import("./contact-inquiry.entity").ContactInquiry[]>;
}

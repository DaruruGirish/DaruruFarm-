"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const contact_service_1 = require("./contact.service");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let ContactController = class ContactController {
    contactService;
    constructor(contactService) {
        this.contactService = contactService;
    }
    createPublicEnquiry(name, email, subject, message) {
        const trimmedName = (name || '').trim();
        const trimmedEmail = (email || '').trim().toLowerCase();
        const trimmedSubject = (subject || '').trim();
        const trimmedMessage = (message || '').trim();
        if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
            throw new common_1.BadRequestException('All fields (name, email, subject, message) are required');
        }
        if (!EMAIL_PATTERN.test(trimmedEmail)) {
            throw new common_1.BadRequestException('Enter a valid email address');
        }
        return this.contactService.create(trimmedName, trimmedEmail, trimmedSubject, trimmedMessage, null);
    }
    create(name, email, subject, message, req) {
        if (!name || !email || !subject || !message) {
            throw new common_1.BadRequestException('All fields (name, email, subject, message) are required');
        }
        const user = { id: req.user.id };
        return this.contactService.create(name, email, subject, message, user);
    }
    findAll(req) {
        const user = { id: req.user.id };
        return this.contactService.findAll(user);
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, common_1.Post)('enquiry'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a public enquiry (login page, no auth required)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Enquiry logged successfully.' }),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('email')),
    __param(2, (0, common_1.Body)('subject')),
    __param(3, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "createPublicEnquiry", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a support inquiry or message' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Inquiry logged successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing required parameters.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('email')),
    __param(2, (0, common_1.Body)('subject')),
    __param(3, (0, common_1.Body)('message')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all inquiries logged by the user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Support history retrieved.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContactController.prototype, "findAll", null);
exports.ContactController = ContactController = __decorate([
    (0, swagger_1.ApiTags)('Contact Us & Support'),
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [contact_service_1.ContactService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map
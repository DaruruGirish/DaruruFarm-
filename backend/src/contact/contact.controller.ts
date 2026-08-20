import { Controller, Get, Post, Body, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { User } from '../auth/user.entity';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@ApiTags('Contact Us & Support')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('enquiry')
  @ApiOperation({ summary: 'Submit a public enquiry (login page, no auth required)' })
  @ApiResponse({ status: 201, description: 'Enquiry logged successfully.' })
  createPublicEnquiry(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedSubject = (subject || '').trim();
    const trimmedMessage = (message || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      throw new BadRequestException('All fields (name, email, subject, message) are required');
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      throw new BadRequestException('Enter a valid email address');
    }

    return this.contactService.create(trimmedName, trimmedEmail, trimmedSubject, trimmedMessage, null);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a support inquiry or message' })
  @ApiResponse({ status: 201, description: 'Inquiry logged successfully.' })
  @ApiResponse({ status: 400, description: 'Missing required parameters.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
    @Request() req: any,
  ) {
    if (!name || !email || !subject || !message) {
      throw new BadRequestException('All fields (name, email, subject, message) are required');
    }
    const user = { id: req.user.id } as User;
    return this.contactService.create(name, email, subject, message, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all inquiries logged by the user' })
  @ApiResponse({ status: 200, description: 'Support history retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.contactService.findAll(user);
  }
}

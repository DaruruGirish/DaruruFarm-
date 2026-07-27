import { Controller, Get, Post, Body, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { User } from '../auth/user.entity';

@ApiTags('Contact Us & Support')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
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
  @ApiOperation({ summary: 'Get all inquiries logged by the user' })
  @ApiResponse({ status: 200, description: 'Support history retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.contactService.findAll(user);
  }
}

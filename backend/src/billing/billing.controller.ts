import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('auth/billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('order')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Razorpay order for Daruru Premium (₹3000 / year)' })
  createOrder(@Request() req: any) {
    return this.billingService.createOrder(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment and activate Premium' })
  verify(
    @Request() req: any,
    @Body()
    body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  ) {
    return this.billingService.verifyPayment(req.user.id, body);
  }
}

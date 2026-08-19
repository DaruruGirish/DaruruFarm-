import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { isComplimentaryPremiumEmail, PREMIUM_AMOUNT_PAISE, PREMIUM_PRICE_INR } from '../auth/plan';
import { PremiumPayment } from './premium-payment.entity';

@Injectable()
export class BillingService {
  private razorpay: Razorpay | null = null;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    @InjectRepository(PremiumPayment)
    private payments: Repository<PremiumPayment>,
  ) {
    const keyId = this.keyId();
    const keySecret = this.keySecret();
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  private keyId(): string {
    return (this.configService.get<string>('RAZORPAY_KEY_ID') || '').trim();
  }

  private keySecret(): string {
    return (this.configService.get<string>('RAZORPAY_KEY_SECRET') || '').trim();
  }

  private client(): Razorpay {
    if (!this.razorpay) {
      throw new ServiceUnavailableException(
        'Card, UPI, and netbanking checkout is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.',
      );
    }
    return this.razorpay;
  }

  async createOrder(userId: number) {
    const profile = await this.authService.getProfile(userId);
    if (isComplimentaryPremiumEmail(profile.email)) {
      throw new BadRequestException('This account already includes Premium.');
    }

    const order = await this.client().orders.create({
      amount: PREMIUM_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `premium_${userId}_${Date.now()}`.slice(0, 40),
      notes: {
        userId: String(userId),
        plan: 'premium',
        period: 'year',
      },
    });

    await this.payments.save(
      this.payments.create({
        userId,
        razorpayOrderId: String(order.id),
        razorpayPaymentId: null,
        status: 'created',
        amountPaise: PREMIUM_AMOUNT_PAISE,
      }),
    );

    return {
      keyId: this.keyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      priceInr: PREMIUM_PRICE_INR,
      name: 'Daruru Farms',
      description: `Daruru Premium · ₹${PREMIUM_PRICE_INR.toLocaleString('en-IN')} / year`,
      prefill: { name: profile.name, email: profile.email },
    };
  }

  async verifyPayment(
    userId: number,
    body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  ) {
    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('Payment details are incomplete.');
    }

    const expected = crypto
      .createHmac('sha256', this.keySecret())
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (expected !== signature) {
      throw new BadRequestException('Payment signature did not match. Premium was not activated.');
    }

    const record = await this.payments.findOne({ where: { razorpayOrderId: orderId, userId } });
    if (!record) {
      throw new UnauthorizedException('This payment does not belong to your account.');
    }

    if (record.status === 'paid') {
      return this.authService.getProfile(userId);
    }

    const payment = await this.client().payments.fetch(paymentId);
    const paidAmount = Number(payment.amount);
    if (paidAmount !== PREMIUM_AMOUNT_PAISE) {
      throw new BadRequestException('Paid amount does not match Premium.');
    }
    if (String(payment.order_id) !== orderId) {
      throw new BadRequestException('Payment does not match this order.');
    }
    const status = String(payment.status || '');
    if (status !== 'captured' && status !== 'authorized') {
      throw new BadRequestException(`Payment is ${status || 'incomplete'}. Premium was not activated.`);
    }

    record.razorpayPaymentId = paymentId;
    record.status = 'paid';
    await this.payments.save(record);

    return this.authService.subscribePremium(userId);
  }
}

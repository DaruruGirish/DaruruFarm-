import { ForbiddenException } from '@nestjs/common';
import { User } from './user.entity';
import { PREMIUM_PRICE_INR, userHasPremium } from './plan';

export function assertPremiumAccess(user: User | null | undefined, featureLabel: string): void {
  if (!userHasPremium(user)) {
    throw new ForbiddenException(
      `${featureLabel} requires Premium (₹${PREMIUM_PRICE_INR.toLocaleString('en-IN')}/year).`,
    );
  }
}

import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { PREMIUM_PRICE_INR, isComplimentaryPremiumEmail, premiumUntilFrom, premiumUntilFromNow, userHasPremium } from './plan';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // Sign up a new user and save details in MySQL
  async register(name: string, email: string, password: string): Promise<User> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    if (!name) {
      throw new BadRequestException('Name is required');
    }
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash the password before saving it to DB
    const hashedPassword = await bcrypt.hash(password, 10);

    const complimentary = isComplimentaryPremiumEmail(email);
    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      plan: complimentary ? 'premium' : 'free',
      premiumUntil: complimentary ? premiumUntilFromNow() : null,
    });

    const savedUser = await this.userRepository.save(user);
    // Don't return password in production, but we return it here for user visibility if needed
    return savedUser;
  }

  // Validate user and generate a JWT token
  async login(email: string, password: string): Promise<{ accessToken: string }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // Retrieve user details from database by ID
  async getProfile(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.ensureComplimentaryPremium(
      await this.userRepository.findOne({ where: { id: userId } }),
    );
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }
    const { password: _password, ...safe } = user;
    return safe;
  }

  async subscribePremium(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }
    const now = new Date();
    const currentEnd = user.premiumUntil ? new Date(user.premiumUntil) : now;
    const start = currentEnd.getTime() > now.getTime() ? currentEnd : now;
    user.plan = 'premium';
    user.premiumUntil = premiumUntilFrom(start);
    await this.userRepository.save(user);
    const { password: _password, ...safe } = user;
    return {
      ...safe,
      priceInr: PREMIUM_PRICE_INR,
      period: 'year',
    };
  }

  hasPremium(user: { email?: string | null; plan?: string | null; premiumUntil?: Date | string | null } | null) {
    return userHasPremium(user);
  }

  private async ensureComplimentaryPremium(user: User | null): Promise<User | null> {
    if (!user || !isComplimentaryPremiumEmail(user.email)) return user;
    if (userHasPremium(user) && user.plan === 'premium') return user;
    user.plan = 'premium';
    user.premiumUntil = premiumUntilFromNow();
    return this.userRepository.save(user);
  }
}

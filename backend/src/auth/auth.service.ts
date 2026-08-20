import { Injectable, ConflictException, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { FarmViewer } from './farm-viewer.entity';
import { PREMIUM_PRICE_INR, isComplimentaryPremiumEmail, premiumUntilFrom, premiumUntilFromNow, freeTrialUntilFromNow, userHasPremium, FREE_TRIAL_DAYS } from './plan';
import { assertPremiumAccess } from './premium-access';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

const VIEWER_USERNAME = /^[a-z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VIEWERS = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function slugifyViewerUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 32);
}

function assertValidEmail(email: string) {
  if (!EMAIL_PATTERN.test(email)) {
    throw new BadRequestException('Enter a valid email address');
  }
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FarmViewer)
    private viewerRepository: Repository<FarmViewer>,
    private jwtService: JwtService,
  ) {}

  // Sign up a new user and save details in MySQL
  async register(
    name: string,
    email: string,
    password: string,
    options?: { startTrial?: boolean; returnToken?: boolean },
  ): Promise<
    | User
    | {
        accessToken: string;
        premiumUntil: Date | null;
        trialDays: number;
        message: string;
      }
  > {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    if (!name) {
      throw new BadRequestException('Name is required');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const normalizedEmail = normalizeEmail(email);
    assertValidEmail(normalizedEmail);

    const existingUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const complimentary = isComplimentaryPremiumEmail(normalizedEmail);
    const startTrial = options?.startTrial !== false && !complimentary;
    const user = this.userRepository.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      plan: complimentary || startTrial ? 'premium' : 'free',
      premiumUntil: complimentary ? premiumUntilFromNow() : startTrial ? freeTrialUntilFromNow() : null,
      trialUsed: Boolean(startTrial || complimentary),
      authProvider: 'local',
      googleId: null,
    });

    const savedUser = await this.userRepository.save(user);

    if (options?.returnToken) {
      return {
        accessToken: this.jwtService.sign({
          sub: savedUser.id,
          email: savedUser.email,
          role: 'owner',
        }),
        premiumUntil: savedUser.premiumUntil,
        trialDays: startTrial ? FREE_TRIAL_DAYS : 0,
        message: startTrial
          ? `Account created. Premium trial is active for ${FREE_TRIAL_DAYS} days.`
          : 'Account created successfully.',
      };
    }

    return savedUser;
  }

  // Farm owner (email) or inspector (username / display name)
  async login(identifier: string, password: string): Promise<{ accessToken: string }> {
    if (!identifier?.trim()) {
      throw new BadRequestException('Email, username, or name is required');
    }
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const loginId = identifier.trim();
    if (EMAIL_PATTERN.test(normalizeEmail(loginId))) {
      return this.ownerLogin(normalizeEmail(loginId), password);
    }

    return this.inspectorLogin(loginId, password);
  }

  private async ownerLogin(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account uses Google sign-in. Continue with Google.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: 'owner',
      }),
    };
  }

  async loginWithGoogle(input: {
    idToken?: string;
    accessToken?: string;
  }): Promise<{ accessToken: string }> {
    const idToken = input.idToken?.trim() || '';
    const accessToken = input.accessToken?.trim() || '';
    if (!idToken && !accessToken) {
      throw new BadRequestException('Google sign-in token is required');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured on the server');
    }

    let googleId = '';
    let email = '';
    let emailVerified = false;
    let name = '';

    if (idToken) {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(clientId);
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: clientId,
        });
        const payload = ticket.getPayload() as
          | {
              sub?: string;
              email?: string;
              email_verified?: boolean | string;
              name?: string;
            }
          | undefined;
        googleId = payload?.sub?.trim() || '';
        email = payload?.email ? normalizeEmail(payload.email) : '';
        emailVerified = payload?.email_verified === true || payload?.email_verified === 'true';
        name = (payload?.name || '').trim();
      } catch {
        throw new UnauthorizedException('Google sign-in failed. Try again.');
      }
    } else {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          throw new UnauthorizedException('Google sign-in failed. Try again.');
        }
        const profile = (await res.json()) as {
          sub?: string;
          email?: string;
          email_verified?: boolean;
          name?: string;
        };
        googleId = profile.sub?.trim() || '';
        email = profile.email ? normalizeEmail(profile.email) : '';
        emailVerified = profile.email_verified === true;
        name = (profile.name || '').trim();
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        throw new UnauthorizedException('Google sign-in failed. Try again.');
      }
    }

    name = name || email.split('@')[0] || 'Farm owner';

    if (!googleId || !email || !emailVerified) {
      throw new UnauthorizedException('Google account email could not be verified');
    }

    assertValidEmail(email);

    let user =
      (await this.userRepository.findOne({ where: { googleId } })) ||
      (await this.userRepository.findOne({ where: { email } }));

    if (!user) {
      const complimentary = isComplimentaryPremiumEmail(email);
      const startTrial = !complimentary;
      user = this.userRepository.create({
        name,
        email,
        password: null,
        googleId,
        authProvider: 'google',
        plan: complimentary || startTrial ? 'premium' : 'free',
        premiumUntil: complimentary ? premiumUntilFromNow() : startTrial ? freeTrialUntilFromNow() : null,
        trialUsed: Boolean(startTrial || complimentary),
      });
      user = await this.userRepository.save(user);
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (user.authProvider !== 'google' && !user.password) {
        user.authProvider = 'google';
        changed = true;
      }
      if (name && user.name !== name && (!user.password || user.authProvider === 'google')) {
        user.name = name;
        changed = true;
      }
      if (changed) {
        user = await this.userRepository.save(user);
      }
    }

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: 'owner',
      }),
    };
  }

  private async findViewerByLogin(loginId: string): Promise<FarmViewer | null> {
    const trimmed = loginId.trim();
    if (!trimmed) return null;

    const asUsername = trimmed.toLowerCase();
    if (VIEWER_USERNAME.test(asUsername)) {
      const byUsername = await this.viewerRepository.findOne({
        where: { username: asUsername },
        relations: { owner: true },
      });
      if (byUsername) return byUsername;
    }

    const byName = await this.viewerRepository
      .createQueryBuilder('viewer')
      .leftJoinAndSelect('viewer.owner', 'owner')
      .where('LOWER(viewer.name) = LOWER(:name)', { name: trimmed })
      .getMany();

    if (byName.length === 1) return byName[0];
    if (byName.length > 1) {
      throw new BadRequestException('Multiple inspectors share that name. Sign in with your username instead.');
    }

    return null;
  }

  // Inspector view-only logins use username or display name (not email)
  async inspectorLogin(loginId: string, password: string): Promise<{ accessToken: string }> {
    if (!loginId?.trim()) {
      throw new BadRequestException('Username or name is required');
    }
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const viewer = await this.findViewerByLogin(loginId);
    if (!viewer?.owner) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const viewerMatch = await bcrypt.compare(password, viewer.password);
    if (!viewerMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      accessToken: this.jwtService.sign({
        sub: viewer.owner.id,
        email: viewer.owner.email,
        role: 'viewer',
        viewerId: viewer.id,
        username: viewer.username,
        viewerName: viewer.name,
      }),
    };
  }

  // Retrieve user details from database by ID
  async getProfile(userId: number, requestUser?: { role?: string; viewerId?: number; username?: string; viewerName?: string }): Promise<any> {
    const user = await this.ensureComplimentaryPremium(
      await this.userRepository.findOne({ where: { id: userId } }),
    );
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }
    const { password: _password, ...safe } = user;
    if (requestUser?.role === 'viewer') {
      return {
        ...safe,
        role: 'viewer',
        name: requestUser.viewerName || 'Inspector',
        username: requestUser.username,
        ownerName: user.name,
        ownerEmail: user.email,
        readOnly: true,
      };
    }
    return { ...safe, role: 'owner', readOnly: false };
  }

  assertOwner(requestUser?: { role?: string }) {
    if (requestUser?.role === 'viewer') {
      throw new ForbiddenException('Inspector logins cannot manage viewers.');
    }
  }

  async listViewers(ownerId: number) {
    const rows = await this.viewerRepository.find({
      where: { owner: { id: ownerId } },
      order: { id: 'DESC' },
    });
    return rows.map(({ password: _password, ...safe }) => safe);
  }

  async createViewer(ownerId: number, name: string, username: string, password: string) {
    const owner = await this.ensureComplimentaryPremium(
      await this.userRepository.findOne({ where: { id: ownerId } }),
    );
    if (!owner) throw new UnauthorizedException('User profile not found');
    assertPremiumAccess(owner, 'Inspector logins');

    const displayName = (name || '').trim();
    let login = (username || '').trim().toLowerCase();
    if (!displayName) throw new BadRequestException('Inspector name is required');
    if (!login) {
      login = slugifyViewerUsername(displayName);
    }
    if (!VIEWER_USERNAME.test(login)) {
      throw new BadRequestException('Username must be 3–32 characters: letters, numbers, dot, underscore, or hyphen. Do not use an email.');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }

    const count = await this.viewerRepository.count({ where: { owner: { id: ownerId } } });
    if (count >= MAX_VIEWERS) {
      throw new BadRequestException(`You can create up to ${MAX_VIEWERS} inspector logins.`);
    }

    const emailTaken = await this.userRepository.findOne({ where: { email: login } });
    if (emailTaken) {
      throw new ConflictException('That username is already in use.');
    }
    const existing = await this.viewerRepository.findOne({ where: { username: login } });
    if (existing) {
      throw new ConflictException('That username is already in use.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const saved = await this.viewerRepository.save(
      this.viewerRepository.create({
        name: displayName,
        username: login,
        password: hashedPassword,
        owner,
      }),
    );
    const { password: _pw, ...safe } = saved;
    return safe;
  }

  async removeViewer(ownerId: number, viewerId: number) {
    const viewer = await this.viewerRepository.findOne({
      where: { id: viewerId, owner: { id: ownerId } },
    });
    if (!viewer) {
      throw new NotFoundException('Inspector login not found');
    }
    await this.viewerRepository.remove(viewer);
  }

  /** Create an owner account or verify an existing one for pre-login Premium checkout. */
  async resolveBuyerForPremium(name: string, email: string, password: string): Promise<User> {
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const normalizedEmail = normalizeEmail(email || '');
    assertValidEmail(normalizedEmail);

    const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      if (!existing.password) {
        throw new UnauthorizedException(
          'This account uses Google sign-in. Sign in with Google first, then buy Premium from the dashboard.',
        );
      }
      const isMatch = await bcrypt.compare(password, existing.password);
      if (!isMatch) {
        throw new UnauthorizedException('Incorrect password for this email. Sign in first, or use the correct password to buy Premium.');
      }
      const user = await this.ensureComplimentaryPremium(existing);
      if (!user) {
        throw new UnauthorizedException('User profile not found');
      }
      return user;
    }

    if (!name?.trim()) {
      throw new BadRequestException('Full name is required to create your Premium account');
    }
    const created = await this.register(name.trim(), normalizedEmail, password, {
      startTrial: false,
      returnToken: false,
    });
    return created as User;
  }

  issueOwnerToken(user: { id: number; email: string }): { accessToken: string } {
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: 'owner',
      }),
    };
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

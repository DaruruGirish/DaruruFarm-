"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const farm_viewer_entity_1 = require("./farm-viewer.entity");
const plan_1 = require("./plan");
const premium_access_1 = require("./premium-access");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const VIEWER_USERNAME = /^[a-z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VIEWERS = 8;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function slugifyViewerUsername(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9._-]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 32);
}
function assertValidEmail(email) {
    if (!EMAIL_PATTERN.test(email)) {
        throw new common_1.BadRequestException('Enter a valid email address');
    }
}
let AuthService = class AuthService {
    userRepository;
    viewerRepository;
    jwtService;
    constructor(userRepository, viewerRepository, jwtService) {
        this.userRepository = userRepository;
        this.viewerRepository = viewerRepository;
        this.jwtService = jwtService;
    }
    async register(name, email, password, options) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        if (!name) {
            throw new common_1.BadRequestException('Name is required');
        }
        if (!password || password.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters');
        }
        const normalizedEmail = normalizeEmail(email);
        assertValidEmail(normalizedEmail);
        const existingUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const complimentary = (0, plan_1.isComplimentaryPremiumEmail)(normalizedEmail);
        const startTrial = options?.startTrial !== false && !complimentary;
        const user = this.userRepository.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            plan: complimentary || startTrial ? 'premium' : 'free',
            premiumUntil: complimentary ? (0, plan_1.premiumUntilFromNow)() : startTrial ? (0, plan_1.freeTrialUntilFromNow)() : null,
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
                trialDays: startTrial ? plan_1.FREE_TRIAL_DAYS : 0,
                message: startTrial
                    ? `Account created. Premium trial is active for ${plan_1.FREE_TRIAL_DAYS} days.`
                    : 'Account created successfully.',
            };
        }
        return savedUser;
    }
    async login(identifier, password) {
        if (!identifier?.trim()) {
            throw new common_1.BadRequestException('Email, username, or name is required');
        }
        if (!password) {
            throw new common_1.BadRequestException('Password is required');
        }
        const loginId = identifier.trim();
        if (EMAIL_PATTERN.test(normalizeEmail(loginId))) {
            return this.ownerLogin(normalizeEmail(loginId), password);
        }
        return this.inspectorLogin(loginId, password);
    }
    async ownerLogin(email, password) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('This account uses Google sign-in. Continue with Google.');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return {
            accessToken: this.jwtService.sign({
                sub: user.id,
                email: user.email,
                role: 'owner',
            }),
        };
    }
    async loginWithGoogle(input) {
        const idToken = input.idToken?.trim() || '';
        const accessToken = input.accessToken?.trim() || '';
        if (!idToken && !accessToken) {
            throw new common_1.BadRequestException('Google sign-in token is required');
        }
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        if (!clientId) {
            throw new common_1.BadRequestException('Google sign-in is not configured on the server');
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
                const payload = ticket.getPayload();
                googleId = payload?.sub?.trim() || '';
                email = payload?.email ? normalizeEmail(payload.email) : '';
                emailVerified = payload?.email_verified === true || payload?.email_verified === 'true';
                name = (payload?.name || '').trim();
            }
            catch {
                throw new common_1.UnauthorizedException('Google sign-in failed. Try again.');
            }
        }
        else {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!res.ok) {
                    throw new common_1.UnauthorizedException('Google sign-in failed. Try again.');
                }
                const profile = (await res.json());
                googleId = profile.sub?.trim() || '';
                email = profile.email ? normalizeEmail(profile.email) : '';
                emailVerified = profile.email_verified === true;
                name = (profile.name || '').trim();
            }
            catch (err) {
                if (err instanceof common_1.UnauthorizedException)
                    throw err;
                throw new common_1.UnauthorizedException('Google sign-in failed. Try again.');
            }
        }
        name = name || email.split('@')[0] || 'Farm owner';
        if (!googleId || !email || !emailVerified) {
            throw new common_1.UnauthorizedException('Google account email could not be verified');
        }
        assertValidEmail(email);
        let user = (await this.userRepository.findOne({ where: { googleId } })) ||
            (await this.userRepository.findOne({ where: { email } }));
        if (!user) {
            const complimentary = (0, plan_1.isComplimentaryPremiumEmail)(email);
            const startTrial = !complimentary;
            user = this.userRepository.create({
                name,
                email,
                password: null,
                googleId,
                authProvider: 'google',
                plan: complimentary || startTrial ? 'premium' : 'free',
                premiumUntil: complimentary ? (0, plan_1.premiumUntilFromNow)() : startTrial ? (0, plan_1.freeTrialUntilFromNow)() : null,
                trialUsed: Boolean(startTrial || complimentary),
            });
            user = await this.userRepository.save(user);
        }
        else {
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
    async findViewerByLogin(loginId) {
        const trimmed = loginId.trim();
        if (!trimmed)
            return null;
        const asUsername = trimmed.toLowerCase();
        if (VIEWER_USERNAME.test(asUsername)) {
            const byUsername = await this.viewerRepository.findOne({
                where: { username: asUsername },
                relations: { owner: true },
            });
            if (byUsername)
                return byUsername;
        }
        const byName = await this.viewerRepository
            .createQueryBuilder('viewer')
            .leftJoinAndSelect('viewer.owner', 'owner')
            .where('LOWER(viewer.name) = LOWER(:name)', { name: trimmed })
            .getMany();
        if (byName.length === 1)
            return byName[0];
        if (byName.length > 1) {
            throw new common_1.BadRequestException('Multiple inspectors share that name. Sign in with your username instead.');
        }
        return null;
    }
    async inspectorLogin(loginId, password) {
        if (!loginId?.trim()) {
            throw new common_1.BadRequestException('Username or name is required');
        }
        if (!password) {
            throw new common_1.BadRequestException('Password is required');
        }
        const viewer = await this.findViewerByLogin(loginId);
        if (!viewer?.owner) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        const viewerMatch = await bcrypt.compare(password, viewer.password);
        if (!viewerMatch) {
            throw new common_1.UnauthorizedException('Invalid username or password');
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
    async getProfile(userId, requestUser) {
        const user = await this.ensureComplimentaryPremium(await this.userRepository.findOne({ where: { id: userId } }));
        if (!user) {
            throw new common_1.UnauthorizedException('User profile not found');
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
    assertOwner(requestUser) {
        if (requestUser?.role === 'viewer') {
            throw new common_1.ForbiddenException('Inspector logins cannot manage viewers.');
        }
    }
    async listViewers(ownerId) {
        const rows = await this.viewerRepository.find({
            where: { owner: { id: ownerId } },
            order: { id: 'DESC' },
        });
        return rows.map(({ password: _password, ...safe }) => safe);
    }
    async createViewer(ownerId, name, username, password) {
        const owner = await this.ensureComplimentaryPremium(await this.userRepository.findOne({ where: { id: ownerId } }));
        if (!owner)
            throw new common_1.UnauthorizedException('User profile not found');
        (0, premium_access_1.assertPremiumAccess)(owner, 'Inspector logins');
        const displayName = (name || '').trim();
        let login = (username || '').trim().toLowerCase();
        if (!displayName)
            throw new common_1.BadRequestException('Inspector name is required');
        if (!login) {
            login = slugifyViewerUsername(displayName);
        }
        if (!VIEWER_USERNAME.test(login)) {
            throw new common_1.BadRequestException('Username must be 3–32 characters: letters, numbers, dot, underscore, or hyphen. Do not use an email.');
        }
        if (!password || password.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters.');
        }
        const count = await this.viewerRepository.count({ where: { owner: { id: ownerId } } });
        if (count >= MAX_VIEWERS) {
            throw new common_1.BadRequestException(`You can create up to ${MAX_VIEWERS} inspector logins.`);
        }
        const emailTaken = await this.userRepository.findOne({ where: { email: login } });
        if (emailTaken) {
            throw new common_1.ConflictException('That username is already in use.');
        }
        const existing = await this.viewerRepository.findOne({ where: { username: login } });
        if (existing) {
            throw new common_1.ConflictException('That username is already in use.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const saved = await this.viewerRepository.save(this.viewerRepository.create({
            name: displayName,
            username: login,
            password: hashedPassword,
            owner,
        }));
        const { password: _pw, ...safe } = saved;
        return safe;
    }
    async removeViewer(ownerId, viewerId) {
        const viewer = await this.viewerRepository.findOne({
            where: { id: viewerId, owner: { id: ownerId } },
        });
        if (!viewer) {
            throw new common_1.NotFoundException('Inspector login not found');
        }
        await this.viewerRepository.remove(viewer);
    }
    async resolveBuyerForPremium(name, email, password) {
        if (!password || password.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters');
        }
        const normalizedEmail = normalizeEmail(email || '');
        assertValidEmail(normalizedEmail);
        const existing = await this.userRepository.findOne({ where: { email: normalizedEmail } });
        if (existing) {
            if (!existing.password) {
                throw new common_1.UnauthorizedException('This account uses Google sign-in. Sign in with Google first, then buy Premium from the dashboard.');
            }
            const isMatch = await bcrypt.compare(password, existing.password);
            if (!isMatch) {
                throw new common_1.UnauthorizedException('Incorrect password for this email. Sign in first, or use the correct password to buy Premium.');
            }
            const user = await this.ensureComplimentaryPremium(existing);
            if (!user) {
                throw new common_1.UnauthorizedException('User profile not found');
            }
            return user;
        }
        if (!name?.trim()) {
            throw new common_1.BadRequestException('Full name is required to create your Premium account');
        }
        const created = await this.register(name.trim(), normalizedEmail, password, {
            startTrial: false,
            returnToken: false,
        });
        return created;
    }
    issueOwnerToken(user) {
        return {
            accessToken: this.jwtService.sign({
                sub: user.id,
                email: user.email,
                role: 'owner',
            }),
        };
    }
    async subscribePremium(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User profile not found');
        }
        const now = new Date();
        const currentEnd = user.premiumUntil ? new Date(user.premiumUntil) : now;
        const start = currentEnd.getTime() > now.getTime() ? currentEnd : now;
        user.plan = 'premium';
        user.premiumUntil = (0, plan_1.premiumUntilFrom)(start);
        await this.userRepository.save(user);
        const { password: _password, ...safe } = user;
        return {
            ...safe,
            priceInr: plan_1.PREMIUM_PRICE_INR,
            period: 'year',
        };
    }
    hasPremium(user) {
        return (0, plan_1.userHasPremium)(user);
    }
    async ensureComplimentaryPremium(user) {
        if (!user || !(0, plan_1.isComplimentaryPremiumEmail)(user.email))
            return user;
        if ((0, plan_1.userHasPremium)(user) && user.plan === 'premium')
            return user;
        user.plan = 'premium';
        user.premiumUntil = (0, plan_1.premiumUntilFromNow)();
        return this.userRepository.save(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(farm_viewer_entity_1.FarmViewer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
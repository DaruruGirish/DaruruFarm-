import { Repository } from 'typeorm';
import { User } from './user.entity';
import { FarmViewer } from './farm-viewer.entity';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private userRepository;
    private viewerRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, viewerRepository: Repository<FarmViewer>, jwtService: JwtService);
    register(name: string, email: string, password: string, options?: {
        startTrial?: boolean;
        returnToken?: boolean;
    }): Promise<User | {
        accessToken: string;
        premiumUntil: Date | null;
        trialDays: number;
        message: string;
    }>;
    login(identifier: string, password: string): Promise<{
        accessToken: string;
    }>;
    private ownerLogin;
    loginWithGoogle(input: {
        idToken?: string;
        accessToken?: string;
    }): Promise<{
        accessToken: string;
    }>;
    private findViewerByLogin;
    inspectorLogin(loginId: string, password: string): Promise<{
        accessToken: string;
    }>;
    getProfile(userId: number, requestUser?: {
        role?: string;
        viewerId?: number;
        username?: string;
        viewerName?: string;
    }): Promise<any>;
    assertOwner(requestUser?: {
        role?: string;
    }): void;
    listViewers(ownerId: number): Promise<{
        id: number;
        username: string;
        name: string;
        owner: User;
        createdAt: Date;
    }[]>;
    createViewer(ownerId: number, name: string, username: string, password: string): Promise<{
        id: number;
        username: string;
        name: string;
        owner: User;
        createdAt: Date;
    }>;
    removeViewer(ownerId: number, viewerId: number): Promise<void>;
    resolveBuyerForPremium(name: string, email: string, password: string): Promise<User>;
    issueOwnerToken(user: {
        id: number;
        email: string;
    }): {
        accessToken: string;
    };
    subscribePremium(userId: number): Promise<{
        priceInr: number;
        period: string;
        id: number;
        name: string;
        email: string;
        googleId: string | null;
        authProvider: string;
        plan: string;
        premiumUntil: Date | null;
        trialUsed: boolean;
    }>;
    hasPremium(user: {
        email?: string | null;
        plan?: string | null;
        premiumUntil?: Date | string | null;
    } | null): boolean;
    private ensureComplimentaryPremium;
}

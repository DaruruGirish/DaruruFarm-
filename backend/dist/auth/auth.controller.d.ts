import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto & {
        startTrial?: boolean;
    }): Promise<import("./user.entity").User | {
        accessToken: string;
        premiumUntil: Date | null;
        trialDays: number;
        message: string;
    }>;
    startFreeTrial(body: {
        name: string;
        email: string;
        password: string;
    }): Promise<import("./user.entity").User | {
        accessToken: string;
        premiumUntil: Date | null;
        trialDays: number;
        message: string;
    }>;
    login(loginDto: LoginDto & {
        username?: string;
    }): Promise<{
        accessToken: string;
    }>;
    googleLogin(body: {
        credential?: string;
        idToken?: string;
        accessToken?: string;
    }): Promise<{
        accessToken: string;
    }>;
    inspectorLogin(body: {
        username?: string;
        email?: string;
        password: string;
    }): Promise<{
        accessToken: string;
    }>;
    getProfile(req: any): Promise<any>;
    listViewers(req: any): Promise<{
        id: number;
        username: string;
        name: string;
        owner: import("./user.entity").User;
        createdAt: Date;
    }[]>;
    createViewer(body: {
        name: string;
        username: string;
        password: string;
    }, req: any): Promise<{
        id: number;
        username: string;
        name: string;
        owner: import("./user.entity").User;
        createdAt: Date;
    }>;
    removeViewer(id: string, req: any): Promise<void>;
}

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<import("./user.entity").User>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
    }>;
    getProfile(req: any): Promise<import("./user.entity").User>;
}

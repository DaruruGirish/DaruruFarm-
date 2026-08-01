import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(name: string, email: string, password: string): Promise<User>;
    login(email: string, password: string): Promise<{
        accessToken: string;
    }>;
    getProfile(userId: number): Promise<User>;
}

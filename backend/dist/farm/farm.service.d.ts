import { Repository } from 'typeorm';
import { Farm } from './farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { User } from '../auth/user.entity';
export declare class FarmService {
    private farmRepository;
    private userRepository;
    constructor(farmRepository: Repository<Farm>, userRepository: Repository<User>);
    create(createFarmDto: CreateFarmDto, user: User): Promise<Farm>;
    findAll(user: User): Promise<Farm[]>;
    findOne(id: number, user: User): Promise<Farm>;
    update(id: number, updateFarmDto: UpdateFarmDto, user: User): Promise<Farm>;
    remove(id: number, user: User): Promise<void>;
}

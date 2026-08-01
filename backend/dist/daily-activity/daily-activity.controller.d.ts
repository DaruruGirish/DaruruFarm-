import { DailyActivityService } from './daily-activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
export declare class DailyActivityController {
    private readonly dailyActivityService;
    constructor(dailyActivityService: DailyActivityService);
    create(createActivityDto: CreateActivityDto, req: any): Promise<import("./daily-activity.entity").DailyActivity>;
    findAll(req: any): Promise<import("./daily-activity.entity").DailyActivity[]>;
    findOne(id: string, req: any): Promise<import("./daily-activity.entity").DailyActivity>;
    update(id: string, updateActivityDto: UpdateActivityDto, req: any): Promise<import("./daily-activity.entity").DailyActivity>;
    remove(id: string, req: any): Promise<void>;
}

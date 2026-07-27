import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DailyActivityService } from './daily-activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { User } from '../auth/user.entity';

@ApiTags('Daily Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('daily-activities')
export class DailyActivityController {
  constructor(private readonly dailyActivityService: DailyActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new daily activity' })
  @ApiResponse({ status: 201, description: 'Activity logged successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createActivityDto: CreateActivityDto, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.dailyActivityService.create(createActivityDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all logged activities for the user' })
  @ApiResponse({ status: 200, description: 'List of activity logs retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.dailyActivityService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific activity log' })
  @ApiResponse({ status: 200, description: 'Activity log details retrieved.' })
  @ApiResponse({ status: 404, description: 'Activity log not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.dailyActivityService.findOne(+id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing activity log' })
  @ApiResponse({ status: 200, description: 'Activity log updated.' })
  @ApiResponse({ status: 404, description: 'Activity log not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.dailyActivityService.update(+id, updateActivityDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity log' })
  @ApiResponse({ status: 200, description: 'Activity log deleted.' })
  @ApiResponse({ status: 404, description: 'Activity log not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.dailyActivityService.remove(+id, user);
  }
}

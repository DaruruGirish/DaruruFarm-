import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FarmService } from './farm.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { User } from '../auth/user.entity';

@ApiTags('Farms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('farms')
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new farm' })
  @ApiResponse({ status: 201, description: 'Farm created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createFarmDto: CreateFarmDto, @Request() req: any) {
    // req.user has { id, email } which can be passed directly as User to service
    const user = { id: req.user.id } as User;
    return this.farmService.create(createFarmDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all farms for the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of farms retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.farmService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific farm' })
  @ApiResponse({ status: 200, description: 'Farm details retrieved.' })
  @ApiResponse({ status: 404, description: 'Farm not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.farmService.findOne(+id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing farm' })
  @ApiResponse({ status: 200, description: 'Farm updated successfully.' })
  @ApiResponse({ status: 404, description: 'Farm not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@Param('id') id: string, @Body() updateFarmDto: UpdateFarmDto, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.farmService.update(+id, updateFarmDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a farm' })
  @ApiResponse({ status: 200, description: 'Farm deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Farm not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.farmService.remove(+id, user);
  }
}

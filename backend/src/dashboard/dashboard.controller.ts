import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics, alerts, and trend charts' })
  @ApiResponse({ status: 200, description: 'Dashboard dataset retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getDashboardData(@Request() req: any, @Query('farmId') farmId?: string) {
    const parsed = farmId ? Number(farmId) : undefined;
    return this.dashboardService.getDashboardData(req.user.id, Number.isFinite(parsed) ? parsed : undefined, req.user.role);
  }
}

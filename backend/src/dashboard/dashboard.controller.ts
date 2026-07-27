import { Controller, Get, Request, UseGuards } from '@nestjs/common';
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
  getDashboardData(@Request() req: any) {
    return this.dashboardService.getDashboardData(req.user.id);
  }
}

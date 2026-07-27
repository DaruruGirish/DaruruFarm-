import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: '2026-07-27' })
  date?: Date;

  @ApiPropertyOptional({ example: 'Irrigation' })
  activityType?: string;

  @ApiPropertyOptional({ example: 'Watered north-west orange sector for 30 minutes' })
  notes?: string;

  @ApiPropertyOptional({ example: 1 })
  farmId?: number;

  @ApiPropertyOptional({ example: 'Glyphosate' })
  pesticideName?: string;

  @ApiPropertyOptional({ example: '10 Liters' })
  pesticideQuantity?: string;

  @ApiPropertyOptional({ example: '08:30 AM' })
  pesticideTime?: string;
}

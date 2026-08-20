import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ example: '2026-07-27', description: 'Date of the activity (YYYY-MM-DD)' })
  date: Date;

  @ApiProperty({ example: 'Irrigation', description: 'Type of activity (e.g. Irrigation, Fertilization, Harvesting)' })
  activityType: string;

  @ApiProperty({ example: 'Watered north-west orange sector for 30 minutes', description: 'Activity details / notes' })
  notes: string;

  @ApiProperty({ example: 1, description: 'ID of the associated farm' })
  farmId: number;

  @ApiProperty({ example: 'Glyphosate', required: false })
  pesticideName?: string;

  @ApiProperty({ example: '10 Liters', required: false })
  pesticideQuantity?: string;

  @ApiProperty({ example: '08:30 AM', required: false })
  pesticideTime?: string;

  @ApiProperty({ example: 4.5, required: false, description: 'Hours of water supplied (Water Supply logs)' })
  waterHours?: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class CreateFarmDto {
  @ApiProperty({ example: 'Sunshine Orchards', description: 'Name of the farm' })
  name: string;

  @ApiProperty({ example: '123 Valley Road, California', description: 'Address of the farm' })
  address: string;

  @ApiProperty({ example: 45.5, description: 'Total acres of the farm' })
  totalAcres: number;

  @ApiProperty({ example: 1200, description: 'Number of trees on the farm' })
  numberOfTrees: number;

  @ApiProperty({ example: 'Honeycrisp Apples', description: 'Crop variety' })
  cropVariety: string;

  @ApiProperty({ example: '2026-08-01T08:00:00.000Z', description: 'Crop season start time' })
  cropSeasonStartTime: Date;
}

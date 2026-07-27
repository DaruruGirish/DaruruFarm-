import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFarmDto {
  @ApiPropertyOptional({ example: 'Sunshine Orchards' })
  name?: string;

  @ApiPropertyOptional({ example: '123 Valley Road, California' })
  address?: string;

  @ApiPropertyOptional({ example: 45.5 })
  totalAcres?: number;

  @ApiPropertyOptional({ example: 1200 })
  numberOfTrees?: number;

  @ApiPropertyOptional({ example: 'Honeycrisp Apples' })
  cropVariety?: string;

  @ApiPropertyOptional({ example: '2026-08-01T08:00:00.000Z' })
  cropSeasonStartTime?: Date;
}

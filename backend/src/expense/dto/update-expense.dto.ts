import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '../expense.entity';

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 250.5 })
  amount?: number;

  @ApiPropertyOptional({ enum: ExpenseCategory, example: ExpenseCategory.FERTILIZER })
  category?: ExpenseCategory;

  @ApiPropertyOptional({ example: 'Purchased 2 bags of organic compost' })
  notes?: string;

  @ApiPropertyOptional({ example: '2026-07-27' })
  date?: Date;
}

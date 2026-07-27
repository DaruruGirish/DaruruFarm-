import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '../expense.entity';

export class CreateExpenseDto {
  @ApiProperty({ example: 250.5, description: 'Amount of the expense' })
  amount: number;

  @ApiProperty({ 
    enum: ExpenseCategory, 
    example: ExpenseCategory.FERTILIZER, 
    description: 'Category of the expense' 
  })
  category: ExpenseCategory;

  @ApiProperty({ example: 'Purchased 2 bags of organic compost', description: 'Additional notes' })
  notes: string;

  @ApiProperty({ example: '2026-07-27', description: 'Date of the expense (YYYY-MM-DD)' })
  date: Date;
}

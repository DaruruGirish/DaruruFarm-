import { ExpenseCategory } from '../expense.entity';
export declare class UpdateExpenseDto {
    amount?: number;
    category?: ExpenseCategory;
    notes?: string;
    date?: Date;
}

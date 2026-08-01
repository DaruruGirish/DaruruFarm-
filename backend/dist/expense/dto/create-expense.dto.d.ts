import { ExpenseCategory } from '../expense.entity';
export declare class CreateExpenseDto {
    amount: number;
    category: ExpenseCategory;
    notes: string;
    date: Date;
}

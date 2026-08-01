import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpenseController {
    private readonly expenseService;
    constructor(expenseService: ExpenseService);
    create(createExpenseDto: CreateExpenseDto, req: any): Promise<import("./expense.entity").Expense>;
    findAll(req: any): Promise<import("./expense.entity").Expense[]>;
    findOne(id: string, req: any): Promise<import("./expense.entity").Expense>;
    update(id: string, updateExpenseDto: UpdateExpenseDto, req: any): Promise<import("./expense.entity").Expense>;
    remove(id: string, req: any): Promise<void>;
}

import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../auth/user.entity';
export declare class ExpenseService {
    private expenseRepository;
    constructor(expenseRepository: Repository<Expense>);
    create(createExpenseDto: CreateExpenseDto, user: User): Promise<Expense>;
    findAll(user: User): Promise<Expense[]>;
    findOne(id: number, user: User): Promise<Expense>;
    update(id: number, updateExpenseDto: UpdateExpenseDto, user: User): Promise<Expense>;
    remove(id: number, user: User): Promise<void>;
}

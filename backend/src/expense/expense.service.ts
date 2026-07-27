import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../auth/user.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  // Create an expense
  async create(createExpenseDto: CreateExpenseDto, user: User): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      user,
    });
    return this.expenseRepository.save(expense);
  }

  // Find all expenses for the user
  async findAll(user: User): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: { user: { id: user.id } },
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  // Find one expense
  async findOne(id: number, user: User): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  // Update an expense
  async update(id: number, updateExpenseDto: UpdateExpenseDto, user: User): Promise<Expense> {
    const expense = await this.findOne(id, user);
    const updatedExpense = this.expenseRepository.merge(expense, updateExpenseDto);
    return this.expenseRepository.save(updatedExpense);
  }

  // Remove an expense
  async remove(id: number, user: User): Promise<void> {
    const expense = await this.findOne(id, user);
    await this.expenseRepository.remove(expense);
  }
}

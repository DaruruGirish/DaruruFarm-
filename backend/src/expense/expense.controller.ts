import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../auth/user.entity';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new expense' })
  @ApiResponse({ status: 201, description: 'Expense logged successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createExpenseDto: CreateExpenseDto, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.expenseService.create(createExpenseDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses for the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of expenses retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.expenseService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific expense' })
  @ApiResponse({ status: 200, description: 'Expense details retrieved.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.expenseService.findOne(+id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.expenseService.update(+id, updateExpenseDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.expenseService.remove(+id, user);
  }
}

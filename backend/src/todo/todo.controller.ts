import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { User } from '../auth/user.entity';

@ApiTags('To-do')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiOperation({ summary: 'Add upcoming farm work' })
  create(
    @Body() body: { title: string; notes?: string; dueDate?: string; farmId?: number },
    @Request() req: any,
  ) {
    return this.todoService.create(body, { id: req.user.id } as User);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.todoService.findAll({ id: req.user.id } as User);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; notes?: string; dueDate?: string | null; done?: boolean; farmId?: number | null },
    @Request() req: any,
  ) {
    return this.todoService.update(+id, body, { id: req.user.id } as User);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.todoService.remove(+id, { id: req.user.id } as User);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmTodo } from './farm-todo.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(FarmTodo)
    private todoRepository: Repository<FarmTodo>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
  ) {}

  async create(body: { title: string; notes?: string; dueDate?: string; farmId?: number }, user: User) {
    const title = (body.title || '').trim();
    if (!title) {
      throw new BadRequestException('Write what needs to be done.');
    }
    let farm: Farm | null = null;
    if (body.farmId) {
      farm = await this.farmRepository.findOne({ where: { id: body.farmId, user: { id: user.id } } });
    }
    const todo = this.todoRepository.create({
      title,
      notes: body.notes?.trim() || null,
      dueDate: body.dueDate || null,
      done: false,
      farm,
      user,
    });
    return this.todoRepository.save(todo);
  }

  findAll(user: User) {
    return this.todoRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { done: 'ASC', dueDate: 'ASC', id: 'DESC' },
    });
  }

  async findOne(id: number, user: User) {
    const todo = await this.todoRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { farm: true },
    });
    if (!todo) {
      throw new NotFoundException('To-do not found');
    }
    return todo;
  }

  async update(
    id: number,
    body: { title?: string; notes?: string; dueDate?: string | null; done?: boolean; farmId?: number | null },
    user: User,
  ) {
    const todo = await this.findOne(id, user);
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) throw new BadRequestException('Write what needs to be done.');
      todo.title = title;
    }
    if (body.notes !== undefined) todo.notes = body.notes;
    if (body.dueDate !== undefined) todo.dueDate = body.dueDate;
    if (body.done !== undefined) todo.done = body.done;
    if (body.farmId !== undefined) {
      todo.farm = body.farmId
        ? await this.farmRepository.findOne({ where: { id: body.farmId, user: { id: user.id } } })
        : null;
    }
    return this.todoRepository.save(todo);
  }

  async remove(id: number, user: User) {
    const todo = await this.findOne(id, user);
    await this.todoRepository.remove(todo);
  }
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../auth/user.entity';

export enum ExpenseCategory {
  FERTILIZER = 'Fertilizer',
  PESTICIDES = 'Pesticides',
  ELECTRICITY = 'Electricity',
  DIESEL = 'Diesel',
  WATER = 'Water',
  WORKERS = 'Workers',
  EQUIPMENT = 'Equipment',
  TRANSPORTATION = 'Transportation',
  MISCELLANEOUS = 'Miscellaneous',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.MISCELLANEOUS,
  })
  category: ExpenseCategory;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

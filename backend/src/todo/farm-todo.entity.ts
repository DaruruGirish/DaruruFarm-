import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';

@Entity('farm_todos')
export class FarmTodo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  notes: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ default: false })
  done: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Farm, { onDelete: 'SET NULL', nullable: true })
  farm: Farm | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';

@Entity('lab_reports')
export class LabReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column()
  filename: string;

  @Column({ nullable: true })
  originalName: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  uploadedAt: Date;

  @ManyToOne(() => Farm, { onDelete: 'SET NULL', nullable: true })
  farm: Farm | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

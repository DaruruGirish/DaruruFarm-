import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';

@Entity('disease_events')
export class DiseaseEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  diseaseName: string;

  @Column('decimal', { precision: 5, scale: 2 })
  temp: number;

  @Column('int')
  humidity: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  rainfall: number;

  @Column()
  filename: string;

  @CreateDateColumn({ type: 'timestamp' })
  detectedAt: Date;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  farm: Farm;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

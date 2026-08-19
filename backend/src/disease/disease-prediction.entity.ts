import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';

@Entity('disease_predictions')
export class DiseasePrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imageUrl: string;

  @Column()
  predictedDisease: string;

  @Column('decimal', { precision: 6, scale: 2 })
  confidence: number;

  @Column()
  plantPart: string;

  @Column({ default: false })
  uncertain: boolean;

  @Column('simple-json', { nullable: true })
  topPredictions: { disease: string; confidence: number }[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Farm, { onDelete: 'SET NULL', nullable: true })
  farm: Farm | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

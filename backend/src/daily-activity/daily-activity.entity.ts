import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';

@Entity('daily_activities')
export class DailyActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  activityType: string;

  @Column('text')
  notes: string;

  @Column({ nullable: true })
  pesticideName: string;

  @Column({ nullable: true })
  pesticideQuantity: string;

  @Column({ nullable: true })
  pesticideTime: string;

  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  farm: Farm;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

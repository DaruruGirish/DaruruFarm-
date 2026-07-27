import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAcres: number;

  @Column('int')
  numberOfTrees: number;

  @Column()
  cropVariety: string;

  @Column({ type: 'datetime' })
  cropSeasonStartTime: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

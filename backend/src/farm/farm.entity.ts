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

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationLabel: string | null;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column('decimal', { precision: 11, scale: 7, nullable: true })
  longitude: number | null;

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

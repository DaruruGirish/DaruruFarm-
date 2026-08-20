import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('weather_snapshots')
@Index(['farmId', 'snapshotDate', 'slot'], { unique: true })
export class WeatherSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  farmId: number;

  @Column({ type: 'date' })
  snapshotDate: string;

  @Column({ type: 'varchar', length: 16 })
  slot: string;

  @Column({ type: 'datetime' })
  fetchedAt: Date;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  temperature: number | null;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  humidity: number | null;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  rainfall: number | null;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  windSpeed: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  condition: string | null;

  @Column({ type: 'longtext', nullable: true })
  payload: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

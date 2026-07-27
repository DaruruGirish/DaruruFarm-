import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Farm } from '../farm/farm.entity';

@Entity('gallery_images')
export class GalleryImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column('text', { nullable: true })
  caption: string;

  @CreateDateColumn({ type: 'timestamp' })
  uploadedAt: Date;

  @ManyToOne(() => Farm, { onDelete: 'SET NULL', nullable: true })
  farm: Farm;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}

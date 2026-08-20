import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('contact_inquiries')
export class ContactInquiry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @CreateDateColumn({ type: 'timestamp' })
  submittedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  user: User | null;
}

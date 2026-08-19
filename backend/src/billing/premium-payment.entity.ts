import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('premium_payments')
export class PremiumPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  razorpayOrderId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'created' })
  status: string;

  @Column()
  amountPaise: number;

  @CreateDateColumn()
  createdAt: Date;
}

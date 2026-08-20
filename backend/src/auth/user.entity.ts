import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  /** Null for Google-only accounts. */
  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'local' })
  authProvider: string;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: string;

  @Column({ type: 'datetime', nullable: true })
  premiumUntil: Date | null;

  /** True once the account has received the one-time 2-day Premium trial. */
  @Column({ type: 'boolean', default: false })
  trialUsed: boolean;
}

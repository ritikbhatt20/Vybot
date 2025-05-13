import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class TokenPriceAlert {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number; // Telegram user ID

    @Column()
    mintAddress: string; // Token mint address

    @Column('decimal', { precision: 16, scale: 8, transformer: {
        to: (value: number): number => value,
        from: (value: string | number): number => typeof value === 'string' ? parseFloat(value) : value
    }})
    targetPrice: number; // Target price for the alert

    @Column({ default: true })
    isActive: boolean; // Alert status (active/inactive)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
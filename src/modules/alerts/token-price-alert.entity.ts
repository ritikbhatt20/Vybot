import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AlertType {
    ABSOLUTE_PRICE = 'absolute_price',
    PERCENTAGE_CHANGE = 'percentage_change',
}

export enum PercentageDirection {
    INCREASE = 'increase',
    DECREASE = 'decrease',
    BOTH = 'both',
}

@Entity()
export class TokenPriceAlert {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number; // Telegram user ID

    @Column()
    mintAddress: string; // Token mint address
    
    @Column({
        type: 'enum',
        enum: AlertType,
        default: AlertType.ABSOLUTE_PRICE
    })
    alertType: AlertType; // Type of alert (absolute price or percentage change)

    @Column('decimal', { precision: 16, scale: 8, nullable: true, transformer: {
        to: (value: number): number => value,
        from: (value: string | number): number => typeof value === 'string' ? parseFloat(value) : value
    }})
    targetPrice: number; // Target price for the alert (used for absolute price alerts)

    @Column('decimal', { precision: 10, scale: 2, nullable: true, transformer: {
        to: (value: number): number => value,
        from: (value: string | number): number => typeof value === 'string' ? parseFloat(value) : value
    }})
    percentageChange: number; // Percentage change for the alert (used for percentage change alerts)

    @Column({
        type: 'enum',
        enum: PercentageDirection,
        default: PercentageDirection.BOTH,
        nullable: true
    })
    percentageDirection: PercentageDirection; // Direction of percentage change (increase, decrease, or both)

    @Column('decimal', { precision: 16, scale: 8, nullable: true, transformer: {
        to: (value: number): number => value,
        from: (value: string | number): number => typeof value === 'string' ? parseFloat(value) : value
    }})
    basePrice: number; // Base price for percentage calculations

    @Column({ default: true })
    isActive: boolean; // Alert status (active/inactive)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
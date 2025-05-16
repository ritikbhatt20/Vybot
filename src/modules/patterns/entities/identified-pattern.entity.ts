import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { PatternType } from './pattern-alert.entity';

@Entity()
export class IdentifiedPattern {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    mintAddress: string;

    @Column({
        type: 'enum',
        enum: PatternType
    })
    patternType: PatternType;

    @Column('decimal', { precision: 5, scale: 2 })
    confidenceScore: number;

    @Column('jsonb')
    patternData: {
        startPrice: number;
        endPrice: number;
        startTimestamp: number;
        endTimestamp: number;
        keyLevels: number[];
        direction: 'bullish' | 'bearish' | 'neutral';
    };

    @Column('decimal', { precision: 16, scale: 8 })
    priceAtIdentification: number;

    @Column()
    timeframe: string;

    @CreateDateColumn()
    identifiedAt: Date;
} 
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PatternType {
    HEAD_AND_SHOULDERS = 'HEAD_AND_SHOULDERS',
    DOUBLE_TOP = 'DOUBLE_TOP',
    DOUBLE_BOTTOM = 'DOUBLE_BOTTOM',
    ASCENDING_TRIANGLE = 'ASCENDING_TRIANGLE',
    DESCENDING_TRIANGLE = 'DESCENDING_TRIANGLE',
    SYMMETRIC_TRIANGLE = 'SYMMETRIC_TRIANGLE',
    BULLISH_FLAG = 'BULLISH_FLAG',
    BEARISH_FLAG = 'BEARISH_FLAG',
    BULLISH_PENNANT = 'BULLISH_PENNANT',
    BEARISH_PENNANT = 'BEARISH_PENNANT',
}

@Entity('pattern_alerts')
export class PatternAlert {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: number;

    @Column()
    tokenAddress: string;

    @Column('enum', { enum: PatternType, array: true })
    patterns: PatternType[];

    @Column()
    timeframe: string;

    @Column()
    confidence: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('identified_patterns')
export class IdentifiedPattern {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tokenAddress: string;

    @Column('enum', { enum: PatternType })
    pattern: PatternType;

    @Column()
    timeframe: string;

    @Column('float')
    confidence: number;

    @Column('jsonb')
    data: any;

    @CreateDateColumn()
    identifiedAt: Date;

    @Column({ nullable: true })
    completedAt: Date;

    @Column({ default: false })
    isCompleted: boolean;
} 
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { PatternType } from '../modules/patterns/entities/pattern-alert.entity';

export class AddPatternRecognitionTables1684218200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'pattern_alerts',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                    },
                    {
                        name: 'token_address',
                        type: 'varchar',
                    },
                    {
                        name: 'patterns',
                        type: 'enum',
                        enum: Object.values(PatternType),
                        isArray: true,
                    },
                    {
                        name: 'timeframe',
                        type: 'varchar',
                    },
                    {
                        name: 'confidence',
                        type: 'integer',
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'identified_patterns',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'token_address',
                        type: 'varchar',
                    },
                    {
                        name: 'pattern',
                        type: 'enum',
                        enum: Object.values(PatternType),
                    },
                    {
                        name: 'timeframe',
                        type: 'varchar',
                    },
                    {
                        name: 'confidence',
                        type: 'float',
                    },
                    {
                        name: 'data',
                        type: 'jsonb',
                    },
                    {
                        name: 'identified_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'completed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'is_completed',
                        type: 'boolean',
                        default: false,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('identified_patterns');
        await queryRunner.dropTable('pattern_alerts');
    }
} 
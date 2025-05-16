import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatternAlertsTable1684218202000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First drop the table if it exists
        await queryRunner.query(`DROP TABLE IF EXISTS "pattern_alerts"`);

        // Create the pattern_type enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE pattern_type AS ENUM (
                    'HEAD_AND_SHOULDERS',
                    'DOUBLE_TOP',
                    'DOUBLE_BOTTOM',
                    'ASCENDING_TRIANGLE',
                    'DESCENDING_TRIANGLE',
                    'SYMMETRIC_TRIANGLE',
                    'BULLISH_FLAG',
                    'BEARISH_FLAG',
                    'BULLISH_PENNANT',
                    'BEARISH_PENNANT'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create the pattern_alerts table
        await queryRunner.query(`
            CREATE TABLE "pattern_alerts" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "userId" integer NOT NULL,
                "tokenAddress" character varying NOT NULL,
                "patterns" pattern_type[] NOT NULL,
                "timeframe" character varying NOT NULL,
                "confidence" integer NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "pattern_alerts"`);
        await queryRunner.query(`DROP TYPE IF EXISTS pattern_type`);
    }
} 
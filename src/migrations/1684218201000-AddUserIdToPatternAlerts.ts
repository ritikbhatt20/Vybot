import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToPatternAlerts1684218201000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pattern_alerts" 
            ADD COLUMN IF NOT EXISTS "userId" integer NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pattern_alerts" 
            DROP COLUMN IF EXISTS "userId"
        `);
    }
} 
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBasePriceColumn1684218000 implements MigrationInterface {
    name = 'UpdateBasePriceColumn1684218000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, drop the existing column
        await queryRunner.query(`ALTER TABLE "token_price_alert" DROP COLUMN "basePrice"`);
        
        // Then recreate it with the correct type
        await queryRunner.query(`ALTER TABLE "token_price_alert" ADD "basePrice" decimal(16,8)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // First, drop the decimal column
        await queryRunner.query(`ALTER TABLE "token_price_alert" DROP COLUMN "basePrice"`);
        
        // Then recreate it as an integer
        await queryRunner.query(`ALTER TABLE "token_price_alert" ADD "basePrice" integer`);
    }
} 
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTargetPriceNullable1684218100000 implements MigrationInterface {
    name = 'MakeTargetPriceNullable1684218100000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make targetPrice column nullable
        await queryRunner.query(`ALTER TABLE "token_price_alert" ALTER COLUMN "targetPrice" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make targetPrice column NOT NULL again
        await queryRunner.query(`ALTER TABLE "token_price_alert" ALTER COLUMN "targetPrice" SET NOT NULL`);
    }
} 
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { PricesService } from '../prices/prices.service';
import { TokenPriceAlert } from './token-price-alert.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { escapeMarkdownV2 } from 'src/utils';

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor(
        @InjectRepository(TokenPriceAlert)
        private readonly alertRepository: Repository<TokenPriceAlert>,
        private readonly pricesService: PricesService,
        @InjectBot() private readonly bot: Telegraf,
    ) { }

    async createAlert(userId: number, mintAddress: string, targetPrice: number): Promise<TokenPriceAlert> {
        this.logger.debug(`Creating alert for user ${userId}, mint ${mintAddress}, target ${targetPrice}`);
        const alert = this.alertRepository.create({
            userId,
            mintAddress,
            targetPrice,
            isActive: true,
        });
        return this.alertRepository.save(alert);
    }

    async getUserAlerts(userId: number): Promise<TokenPriceAlert[]> {
        this.logger.debug(`Fetching alerts for user ${userId}`);
        try {
            // Add a timeout of 5 seconds to prevent long-running queries
            const timeoutPromise = new Promise<TokenPriceAlert[]>((_, reject) => {
                setTimeout(() => reject(new Error('Database timeout')), 5000);
            });
            
            const queryPromise = this.alertRepository.find({ where: { userId } });
            
            // Race between the query and the timeout
            return await Promise.race([queryPromise, timeoutPromise]);
        } catch (error) {
            this.logger.error(`Error fetching alerts for user ${userId}: ${error.message}`);
            return [];
        }
    }

    async updateAlert(id: number, userId: number, targetPrice: number): Promise<TokenPriceAlert> {
        this.logger.debug(`Updating alert ${id} for user ${userId} to target ${targetPrice}`);
        const alert = await this.alertRepository.findOne({ where: { id, userId } });
        if (!alert) {
            throw new Error('Alert not found');
        }
        alert.targetPrice = targetPrice;
        return this.alertRepository.save(alert);
    }

    async toggleAlertStatus(id: number, userId: number, isActive: boolean): Promise<TokenPriceAlert> {
        this.logger.debug(`Toggling alert ${id} for user ${userId} to ${isActive ? 'active' : 'inactive'}`);
        const alert = await this.alertRepository.findOne({ where: { id, userId } });
        if (!alert) {
            throw new Error('Alert not found');
        }
        alert.isActive = isActive;
        return this.alertRepository.save(alert);
    }

    async deleteAlert(id: number, userId: number): Promise<void> {
        this.logger.debug(`Deleting alert ${id} for user ${userId}`);
        const result = await this.alertRepository.delete({ id, userId });
        if (result.affected === 0) {
            throw new Error('Alert not found');
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkPriceAlerts() {
        this.logger.debug('Checking active price alerts');
        const activeAlerts = await this.alertRepository.find({ where: { isActive: true } });
        if (!activeAlerts.length) {
            this.logger.debug('No active alerts to check');
            return;
        }

        // Group alerts by mint address to minimize API calls
        const alertsByMint = activeAlerts.reduce((acc, alert) => {
            if (!acc[alert.mintAddress]) {
                acc[alert.mintAddress] = [];
            }
            acc[alert.mintAddress].push(alert);
            return acc;
        }, {} as { [key: string]: TokenPriceAlert[] });

        for (const [mintAddress, alerts] of Object.entries(alertsByMint)) {
            try {
                const priceData = await this.pricesService.getTokenPrice(mintAddress);
                if (!priceData) {
                    this.logger.warn(`No price data for mint ${mintAddress}`);
                    continue;
                }

                const { currentPrice, name, symbol } = priceData;
                this.logger.debug(`Current price for ${mintAddress}: ${currentPrice}`);

                // Process all alerts for this mint address
                for (const alert of alerts) {
                    try {
                        // Ensure targetPrice is a number
                        const targetPrice = typeof alert.targetPrice === 'number' 
                            ? alert.targetPrice 
                            : parseFloat(String(alert.targetPrice));
                            
                        if (isNaN(targetPrice)) {
                            this.logger.warn(`Invalid target price for alert ${alert.id}: ${alert.targetPrice}`);
                            continue;
                        }
                        
                        // Calculate how close the current price is to the target
                        const priceThreshold = Math.abs(currentPrice - targetPrice) / targetPrice;
                        this.logger.debug(`Alert ${alert.id}: Current: ${currentPrice}, Target: ${targetPrice}, Threshold: ${priceThreshold.toFixed(4)}`);

                        // Increase the threshold from 1% to 2% to catch more alerts
                        if (priceThreshold <= 0.02) {
                            this.logger.debug(
                                `Alert triggered for user ${alert.userId}, ` +
                                `mint ${alert.mintAddress}, ` +
                                `current price ${currentPrice}, ` +
                                `target ${targetPrice}`
                            );

                            // Add price direction indicator
                            const priceDirection = currentPrice >= targetPrice ? '📈' : '📉';

                            // Format prices with fixed decimal places
                            const formattedCurrentPrice = currentPrice.toFixed(8);
                            const formattedTargetPrice = targetPrice.toFixed(8);

                            await this.bot.telegram.sendMessage(
                                alert.userId,
                                `🔔 <b>Price Alert Triggered!</b>\n\n` +
                                `<b>Token:</b> ${name || 'Unknown'} (${symbol || 'N/A'})\n` +
                                `<b>Mint:</b> <code>${alert.mintAddress}</code>\n` +
                                `<b>Current Price:</b> $${formattedCurrentPrice} ${priceDirection}\n` +
                                `<b>Target Price:</b> $${formattedTargetPrice}\n\n` +
                                `This alert has been deactivated. You can reactivate or update it in the Alerts menu.\n\n` +
                                `Use /alerts to manage your price alerts.`,
                                { parse_mode: 'HTML' }
                            );

                            // Deactivate alert after triggering
                            await this.toggleAlertStatus(alert.id, alert.userId, false);

                            // Add delay between notifications to prevent rate limiting
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    } catch (error) {
                        this.logger.error(
                            `Error processing alert ${alert.id} for user ${alert.userId}: ${error.message}`
                        );
                    }
                }

                // Add delay between different mint addresses to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                this.logger.error(`Error checking price for mint ${mintAddress}: ${error.message}`);
            }
        }
    }
}
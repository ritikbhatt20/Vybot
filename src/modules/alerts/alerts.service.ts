import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { PricesService } from '../prices/prices.service';
import { TokenPriceAlert, AlertType, PercentageDirection } from './token-price-alert.entity';
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

    async createAlert(
        userId: number, 
        mintAddress: string, 
        targetPrice: number, 
        alertType: AlertType = AlertType.ABSOLUTE_PRICE,
        percentageChange?: number,
        percentageDirection?: PercentageDirection,
    ): Promise<TokenPriceAlert> {
        this.logger.debug(`Creating ${alertType} alert for user ${userId}, mint ${mintAddress}`);
        
        let basePrice: number | null = null;
        
        // For percentage alerts, get current price as base
        if (alertType === AlertType.PERCENTAGE_CHANGE) {
            try {
                const priceData = await this.pricesService.getTokenPrice(mintAddress);
                if (priceData) {
                    basePrice = priceData.currentPrice;
                    this.logger.debug(`Set base price for percentage alert: ${basePrice}`);
                } else {
                    this.logger.warn(`Could not get base price for token ${mintAddress}`);
                }
            } catch (error) {
                this.logger.error(`Error getting base price: ${error.message}`);
            }
        }
        
        const alert = this.alertRepository.create({
            userId,
            mintAddress,
            alertType,
            targetPrice: alertType === AlertType.ABSOLUTE_PRICE ? targetPrice : null,
            percentageChange: alertType === AlertType.PERCENTAGE_CHANGE ? percentageChange : null,
            percentageDirection: alertType === AlertType.PERCENTAGE_CHANGE ? percentageDirection : null,
            basePrice,
            isActive: true,
        } as DeepPartial<TokenPriceAlert>);
        
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

    async updateAlert(
        id: number, 
        userId: number, 
        targetPrice?: number,
        percentageChange?: number,
        percentageDirection?: PercentageDirection,
    ): Promise<TokenPriceAlert> {
        this.logger.debug(`Updating alert ${id} for user ${userId}`);
        const alert = await this.alertRepository.findOne({ where: { id, userId } });
        if (!alert) {
            throw new Error('Alert not found');
        }
        
        // Update based on alert type
        if (alert.alertType === AlertType.ABSOLUTE_PRICE && targetPrice !== undefined) {
            alert.targetPrice = targetPrice;
        } else if (alert.alertType === AlertType.PERCENTAGE_CHANGE) {
            if (percentageChange !== undefined) {
                alert.percentageChange = percentageChange;
            }
            
            if (percentageDirection !== undefined) {
                alert.percentageDirection = percentageDirection;
            }
            
            // Update base price to current price
            try {
                const priceData = await this.pricesService.getTokenPrice(alert.mintAddress);
                if (priceData) {
                    alert.basePrice = priceData.currentPrice;
                    this.logger.debug(`Updated base price for alert ${id}: ${alert.basePrice}`);
                }
            } catch (error) {
                this.logger.error(`Error updating base price for alert ${id}: ${error.message}`);
            }
        }
        
        return this.alertRepository.save(alert);
    }

    async toggleAlertStatus(id: number, userId: number, isActive: boolean): Promise<TokenPriceAlert> {
        this.logger.debug(`Toggling alert ${id} for user ${userId} to ${isActive ? 'active' : 'inactive'}`);
        const alert = await this.alertRepository.findOne({ where: { id, userId } });
        if (!alert) {
            throw new Error('Alert not found');
        }
        alert.isActive = isActive;
        
        // If activating a percentage alert, update the base price
        if (isActive && alert.alertType === AlertType.PERCENTAGE_CHANGE) {
            try {
                const priceData = await this.pricesService.getTokenPrice(alert.mintAddress);
                if (priceData) {
                    alert.basePrice = priceData.currentPrice;
                    this.logger.debug(`Updated base price for reactivated alert ${id}: ${alert.basePrice}`);
                }
            } catch (error) {
                this.logger.error(`Error updating base price for alert ${id}: ${error.message}`);
            }
        }
        
        return this.alertRepository.save(alert);
    }

    async deleteAlert(id: number, userId: number): Promise<void> {
        this.logger.debug(`Deleting alert ${id} for user ${userId}`);
        const result = await this.alertRepository.delete({ id, userId });
        if (result.affected === 0) {
            throw new Error('Alert not found');
        }
    }

    @Cron(CronExpression.EVERY_12_HOURS)
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
                        // Process alerts based on type
                        if (alert.alertType === AlertType.ABSOLUTE_PRICE || !alert.alertType) { // Support legacy alerts
                            await this.checkAbsolutePriceAlert(alert, currentPrice, name, symbol);
                        } else if (alert.alertType === AlertType.PERCENTAGE_CHANGE) {
                            await this.checkPercentageChangeAlert(alert, currentPrice, name, symbol);
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
    
    private async checkAbsolutePriceAlert(
        alert: TokenPriceAlert,
        currentPrice: number,
        tokenName: string,
        tokenSymbol: string
    ): Promise<void> {
        // Ensure targetPrice is a number
        const targetPrice = typeof alert.targetPrice === 'number' 
            ? alert.targetPrice 
            : parseFloat(String(alert.targetPrice));
            
        if (isNaN(targetPrice)) {
            this.logger.warn(`Invalid target price for alert ${alert.id}: ${alert.targetPrice}`);
            return;
        }
        
        // Calculate how close the current price is to the target
        const priceThreshold = Math.abs(currentPrice - targetPrice) / targetPrice;
        this.logger.debug(`Alert ${alert.id}: Current: ${currentPrice}, Target: ${targetPrice}, Threshold: ${priceThreshold.toFixed(4)}`);

        // Threshold of 2% to catch approaching alerts
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
                `<b>Token:</b> ${tokenName || 'Unknown'} (${tokenSymbol || 'N/A'})\n` +
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
    }
    
    private async checkPercentageChangeAlert(
        alert: TokenPriceAlert,
        currentPrice: number,
        tokenName: string,
        tokenSymbol: string
    ): Promise<void> {
        // Skip if no base price is set
        if (!alert.basePrice) {
            this.logger.warn(`No base price for percentage alert ${alert.id}, updating base price`);
            alert.basePrice = currentPrice;
            await this.alertRepository.save(alert);
            return;
        }
        
        // Calculate percentage change from base price
        const percentChange = ((currentPrice - alert.basePrice) / alert.basePrice) * 100;
        const absolutePercentChange = Math.abs(percentChange);
        const direction = percentChange >= 0 ? PercentageDirection.INCREASE : PercentageDirection.DECREASE;
        
        this.logger.debug(
            `Percentage alert ${alert.id}: Base: $${alert.basePrice.toFixed(4)}, ` +
            `Current: $${currentPrice.toFixed(4)}, Change: ${percentChange.toFixed(2)}%, ` +
            `Target: ${alert.percentageChange}%, Direction: ${direction}`
        );
        
        // Check if alert should trigger based on direction
        let shouldTrigger = false;
        if (alert.percentageDirection === PercentageDirection.BOTH) {
            shouldTrigger = absolutePercentChange >= alert.percentageChange;
        } else if (alert.percentageDirection === PercentageDirection.INCREASE && percentChange >= alert.percentageChange) {
            shouldTrigger = true;
        } else if (alert.percentageDirection === PercentageDirection.DECREASE && percentChange <= -alert.percentageChange) {
            shouldTrigger = true;
        }
        
        if (shouldTrigger) {
            this.logger.debug(
                `Percentage alert triggered for user ${alert.userId}, ` +
                `mint ${alert.mintAddress}, ` +
                `base price $${alert.basePrice}, ` +
                `current price $${currentPrice}, ` +
                `change ${percentChange.toFixed(2)}%, ` +
                `target ${alert.percentageChange}%`
            );

            // Add price direction indicator
            const priceDirection = percentChange >= 0 ? '📈' : '📉';

            await this.bot.telegram.sendMessage(
                alert.userId,
                `🔔 <b>Percentage Change Alert Triggered!</b>\n\n` +
                `<b>Token:</b> ${tokenName || 'Unknown'} (${tokenSymbol || 'N/A'})\n` +
                `<b>Mint:</b> <code>${alert.mintAddress}</code>\n` +
                `<b>Alert Type:</b> Percentage Change (${alert.percentageDirection === PercentageDirection.BOTH ? 'Any' : 
                   alert.percentageDirection === PercentageDirection.INCREASE ? 'Increase' : 'Decrease'})\n` +
                `<b>Base Price:</b> $${alert.basePrice.toFixed(8)}\n` +
                `<b>Current Price:</b> $${currentPrice.toFixed(8)} ${priceDirection}\n` +
                `<b>Change:</b> ${percentChange.toFixed(2)}%\n` +
                `<b>Target Change:</b> ${alert.percentageChange}%\n\n` +
                `This alert has been deactivated. You can reactivate or update it in the Alerts menu.\n\n` +
                `Use /alerts to manage your price alerts.`,
                { parse_mode: 'HTML' }
            );

            // Deactivate alert after triggering
            await this.toggleAlertStatus(alert.id, alert.userId, false);

            // Add delay between notifications to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatternAlert, PatternType, IdentifiedPattern } from '../entities/pattern-alert.entity';

interface OHLCV {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

@Injectable()
export class PatternRecognitionService {
    private readonly logger = new Logger(PatternRecognitionService.name);

    constructor(
        @InjectRepository(PatternAlert)
        private readonly patternAlertRepository: Repository<PatternAlert>,
        @InjectRepository(IdentifiedPattern)
        private readonly identifiedPatternRepository: Repository<IdentifiedPattern>,
    ) {}

    async createPatternAlert(
        userId: number,
        tokenAddress: string,
        patterns: PatternType[],
        timeframe: string,
        confidence: number,
    ): Promise<PatternAlert> {
        try {
            const alert = new PatternAlert();
            alert.userId = userId;
            alert.tokenAddress = tokenAddress;
            alert.patterns = patterns;
            alert.timeframe = timeframe;
            alert.confidence = confidence;
            alert.isActive = true;

            return await this.patternAlertRepository.save(alert);
        } catch (error) {
            this.logger.error(`Error creating pattern alert: ${error.message}`);
            throw error;
        }
    }

    async getUserPatternAlerts(userId: number): Promise<PatternAlert[]> {
        try {
            return await this.patternAlertRepository.find({
                where: { userId, isActive: true },
                order: { createdAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Error fetching user pattern alerts: ${error.message}`);
            throw error;
        }
    }

    async getPatternAlert(alertId: string): Promise<PatternAlert | null> {
        try {
            return await this.patternAlertRepository.findOne({
                where: { id: alertId }
            });
        } catch (error) {
            this.logger.error(`Error fetching pattern alert: ${error.message}`);
            throw error;
        }
    }

    async togglePatternAlert(alertId: string, isActive: boolean): Promise<PatternAlert> {
        try {
            const alert = await this.patternAlertRepository.findOne({ where: { id: alertId } });
            if (!alert) {
                throw new Error('Pattern alert not found');
            }

            alert.isActive = isActive;
            return await this.patternAlertRepository.save(alert);
        } catch (error) {
            this.logger.error(`Error toggling pattern alert: ${error.message}`);
            throw error;
        }
    }

    async deletePatternAlert(alertId: string): Promise<void> {
        try {
            await this.patternAlertRepository.delete(alertId);
        } catch (error) {
            this.logger.error(`Error deleting pattern alert: ${error.message}`);
            throw error;
        }
    }

    async getIdentifiedPatterns(tokenAddress: string, timeframe: string): Promise<IdentifiedPattern[]> {
        try {
            return await this.identifiedPatternRepository.find({
                where: { tokenAddress, timeframe },
                order: { identifiedAt: 'DESC' },
            });
        } catch (error) {
            this.logger.error(`Error fetching identified patterns: ${error.message}`);
            throw error;
        }
    }

    async recordIdentifiedPattern(
        tokenAddress: string,
        pattern: PatternType,
        timeframe: string,
        confidence: number,
        data: Record<string, any>,
    ): Promise<IdentifiedPattern> {
        try {
            const identifiedPattern = new IdentifiedPattern();
            identifiedPattern.tokenAddress = tokenAddress;
            identifiedPattern.pattern = pattern;
            identifiedPattern.timeframe = timeframe;
            identifiedPattern.confidence = confidence;
            identifiedPattern.data = data;
            identifiedPattern.isCompleted = false;

            return await this.identifiedPatternRepository.save(identifiedPattern);
        } catch (error) {
            this.logger.error(`Error recording identified pattern: ${error.message}`);
            throw error;
        }
    }

    async markPatternAsCompleted(patternId: string): Promise<IdentifiedPattern> {
        try {
            const pattern = await this.identifiedPatternRepository.findOne({ where: { id: patternId } });
            if (!pattern) {
                throw new Error('Pattern not found');
            }

            pattern.isCompleted = true;
            pattern.completedAt = new Date();
            return await this.identifiedPatternRepository.save(pattern);
        } catch (error) {
            this.logger.error(`Error marking pattern as completed: ${error.message}`);
            throw error;
        }
    }

    async analyzePatterns(tokenAddress: string, timeframe: string, candleData: OHLCV[]): Promise<IdentifiedPattern[]> {
        const patterns: IdentifiedPattern[] = [];
        
        // Analyze each pattern type
        for (const patternType of Object.values(PatternType)) {
            const identified = await this.detectPattern(patternType, candleData);
            if (identified) {
                const pattern = this.identifiedPatternRepository.create({
                    tokenAddress: tokenAddress,
                    pattern: patternType,
                    timeframe,
                    ...identified,
                });
                patterns.push(await this.identifiedPatternRepository.save(pattern));
            }
        }

        return patterns;
    }

    private async detectPattern(patternType: PatternType, candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        try {
            switch (patternType) {
                case PatternType.HEAD_AND_SHOULDERS:
                    return this.detectHeadAndShoulders(candleData);
                case PatternType.DOUBLE_TOP:
                    return this.detectDoubleTop(candleData);
                case PatternType.DOUBLE_BOTTOM:
                    return this.detectDoubleBottom(candleData);
                case PatternType.ASCENDING_TRIANGLE:
                    return this.detectAscendingTriangle(candleData);
                case PatternType.DESCENDING_TRIANGLE:
                    return this.detectDescendingTriangle(candleData);
                case PatternType.SYMMETRIC_TRIANGLE:
                    return this.detectSymmetricTriangle(candleData);
                case PatternType.BULLISH_FLAG:
                    return this.detectBullishFlag(candleData);
                case PatternType.BEARISH_FLAG:
                    return this.detectBearishFlag(candleData);
                case PatternType.BULLISH_PENNANT:
                    return this.detectBullishPennant(candleData);
                case PatternType.BEARISH_PENNANT:
                    return this.detectBearishPennant(candleData);
                default:
                    return null;
            }
        } catch (error) {
            this.logger.error(`Error detecting pattern ${patternType}: ${error.message}`);
            return null;
        }
    }

    private detectHeadAndShoulders(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        // Implementation of Head and Shoulders pattern detection
        // This is a simplified example - real implementation would be more complex
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            // Need at least 20 candles for H&S pattern
            if (prices.length < 20) {
                resolve(null);
                return;
            }

            // Find local maxima
            const peaks = this.findPeaks(prices);
            if (peaks.length < 3) {
                resolve(null);
                return;
            }

            // Look for three peaks with middle one higher
            for (let i = 0; i < peaks.length - 2; i++) {
                const leftShoulder = peaks[i];
                const head = peaks[i + 1];
                const rightShoulder = peaks[i + 2];

                if (
                    prices[head] > prices[leftShoulder] &&
                    prices[head] > prices[rightShoulder] &&
                    Math.abs(prices[leftShoulder] - prices[rightShoulder]) / prices[head] < 0.1
                ) {
                    resolve({
                        confidenceScore: 80, // Simplified confidence calculation
                        patternData: {
                            startPrice: prices[leftShoulder],
                            endPrice: prices[rightShoulder],
                            startTimestamp: timestamps[leftShoulder],
                            endTimestamp: timestamps[rightShoulder],
                            keyLevels: [prices[leftShoulder], prices[head], prices[rightShoulder]],
                            direction: 'bearish'
                        },
                        priceAtIdentification: prices[prices.length - 1]
                    });
                    return;
                }
            }

            resolve(null);
        });
    }

    private detectDoubleTop(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        // Implementation of Double Top pattern detection
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            // Need at least 15 candles for double top
            if (prices.length < 15) {
                resolve(null);
                return;
            }

            const peaks = this.findPeaks(prices);
            if (peaks.length < 2) {
                resolve(null);
                return;
            }

            // Look for two similar peaks
            for (let i = 0; i < peaks.length - 1; i++) {
                const firstPeak = peaks[i];
                const secondPeak = peaks[i + 1];

                if (Math.abs(prices[firstPeak] - prices[secondPeak]) / prices[firstPeak] < 0.02) {
                    resolve({
                        confidenceScore: 75,
                        patternData: {
                            startPrice: prices[firstPeak],
                            endPrice: prices[secondPeak],
                            startTimestamp: timestamps[firstPeak],
                            endTimestamp: timestamps[secondPeak],
                            keyLevels: [prices[firstPeak], prices[secondPeak]],
                            direction: 'bearish'
                        },
                        priceAtIdentification: prices[prices.length - 1]
                    });
                    return;
                }
            }

            resolve(null);
        });
    }

    private detectDoubleBottom(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        // Implementation of Double Bottom pattern detection
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 15) {
                resolve(null);
                return;
            }

            const troughs = this.findTroughs(prices);
            if (troughs.length < 2) {
                resolve(null);
                return;
            }

            // Look for two similar troughs
            for (let i = 0; i < troughs.length - 1; i++) {
                const firstTrough = troughs[i];
                const secondTrough = troughs[i + 1];

                if (Math.abs(prices[firstTrough] - prices[secondTrough]) / prices[firstTrough] < 0.02) {
                    resolve({
                        confidenceScore: 75,
                        patternData: {
                            startPrice: prices[firstTrough],
                            endPrice: prices[secondTrough],
                            startTimestamp: timestamps[firstTrough],
                            endTimestamp: timestamps[secondTrough],
                            keyLevels: [prices[firstTrough], prices[secondTrough]],
                            direction: 'bullish'
                        },
                        priceAtIdentification: prices[prices.length - 1]
                    });
                    return;
                }
            }

            resolve(null);
        });
    }

    private findPeaks(prices: number[]): number[] {
        const peaks: number[] = [];
        for (let i = 1; i < prices.length - 1; i++) {
            if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
                peaks.push(i);
            }
        }
        return peaks;
    }

    private findTroughs(prices: number[]): number[] {
        const troughs: number[] = [];
        for (let i = 1; i < prices.length - 1; i++) {
            if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
                troughs.push(i);
            }
        }
        return troughs;
    }

    private detectAscendingTriangle(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 20) {
                resolve(null);
                return;
            }

            const highs = candleData.map(candle => candle.high);
            const lows = candleData.map(candle => candle.low);

            // Check for flat resistance and rising support
            const resistance = Math.max(...highs);
            const supportLine = this.calculateTrendline(lows, 'ascending');

            if (supportLine && Math.abs(highs[highs.length - 1] - resistance) / resistance < 0.02) {
                resolve({
                    confidenceScore: 85,
                    patternData: {
                        startPrice: prices[0],
                        endPrice: prices[prices.length - 1],
                        startTimestamp: timestamps[0],
                        endTimestamp: timestamps[timestamps.length - 1],
                        keyLevels: [supportLine.start, supportLine.end, resistance],
                        direction: 'bullish'
                    },
                    priceAtIdentification: prices[prices.length - 1]
                });
                return;
            }

            resolve(null);
        });
    }

    private detectDescendingTriangle(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 20) {
                resolve(null);
                return;
            }

            const highs = candleData.map(candle => candle.high);
            const lows = candleData.map(candle => candle.low);

            // Check for flat support and falling resistance
            const support = Math.min(...lows);
            const resistanceLine = this.calculateTrendline(highs, 'descending');

            if (resistanceLine && Math.abs(lows[lows.length - 1] - support) / support < 0.02) {
                resolve({
                    confidenceScore: 85,
                    patternData: {
                        startPrice: prices[0],
                        endPrice: prices[prices.length - 1],
                        startTimestamp: timestamps[0],
                        endTimestamp: timestamps[timestamps.length - 1],
                        keyLevels: [resistanceLine.start, resistanceLine.end, support],
                        direction: 'bearish'
                    },
                    priceAtIdentification: prices[prices.length - 1]
                });
                return;
            }

            resolve(null);
        });
    }

    private detectSymmetricTriangle(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 20) {
                resolve(null);
                return;
            }

            const highs = candleData.map(candle => candle.high);
            const lows = candleData.map(candle => candle.low);

            const resistanceLine = this.calculateTrendline(highs, 'descending');
            const supportLine = this.calculateTrendline(lows, 'ascending');

            if (resistanceLine && supportLine) {
                const convergencePoint = this.findConvergencePoint(resistanceLine, supportLine);
                if (convergencePoint) {
                    resolve({
                        confidenceScore: 80,
                        patternData: {
                            startPrice: prices[0],
                            endPrice: prices[prices.length - 1],
                            startTimestamp: timestamps[0],
                            endTimestamp: timestamps[timestamps.length - 1],
                            keyLevels: [resistanceLine.start, resistanceLine.end, supportLine.start, supportLine.end],
                            direction: 'neutral'
                        },
                        priceAtIdentification: prices[prices.length - 1]
                    });
                    return;
                }
            }

            resolve(null);
        });
    }

    private detectBullishFlag(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 15) {
                resolve(null);
                return;
            }

            // Check for strong uptrend followed by parallel downward channels
            const uptrend = this.detectUptrend(prices.slice(0, Math.floor(prices.length / 2)));
            const channel = this.detectParallelChannel(prices.slice(Math.floor(prices.length / 2)), 'descending');

            if (uptrend && channel) {
                resolve({
                    confidenceScore: 75,
                    patternData: {
                        startPrice: prices[0],
                        endPrice: prices[prices.length - 1],
                        startTimestamp: timestamps[0],
                        endTimestamp: timestamps[timestamps.length - 1],
                        keyLevels: [uptrend.start, uptrend.end, channel.upper, channel.lower],
                        direction: 'bullish'
                    },
                    priceAtIdentification: prices[prices.length - 1]
                });
                return;
            }

            resolve(null);
        });
    }

    private detectBearishFlag(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 15) {
                resolve(null);
                return;
            }

            // Check for strong downtrend followed by parallel upward channels
            const downtrend = this.detectDowntrend(prices.slice(0, Math.floor(prices.length / 2)));
            const channel = this.detectParallelChannel(prices.slice(Math.floor(prices.length / 2)), 'ascending');

            if (downtrend && channel) {
                resolve({
                    confidenceScore: 75,
                    patternData: {
                        startPrice: prices[0],
                        endPrice: prices[prices.length - 1],
                        startTimestamp: timestamps[0],
                        endTimestamp: timestamps[timestamps.length - 1],
                        keyLevels: [downtrend.start, downtrend.end, channel.upper, channel.lower],
                        direction: 'bearish'
                    },
                    priceAtIdentification: prices[prices.length - 1]
                });
                return;
            }

            resolve(null);
        });
    }

    private detectBullishPennant(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 15) {
                resolve(null);
                return;
            }

            // Check for strong uptrend followed by converging lines
            const uptrend = this.detectUptrend(prices.slice(0, Math.floor(prices.length / 2)));
            const convergence = this.detectConvergence(prices.slice(Math.floor(prices.length / 2)));

            if (uptrend && convergence) {
                resolve({
                    confidenceScore: 80,
                    patternData: {
                        startPrice: prices[0],
                        endPrice: prices[prices.length - 1],
                        startTimestamp: timestamps[0],
                        endTimestamp: timestamps[timestamps.length - 1],
                        keyLevels: [uptrend.start, uptrend.end, convergence.upper, convergence.lower],
                        direction: 'bullish'
                    },
                    priceAtIdentification: prices[prices.length - 1]
                });
                return;
            }

            resolve(null);
        });
    }

    private detectBearishPennant(candleData: OHLCV[]): Promise<{
        confidenceScore: number;
        patternData: any;
        priceAtIdentification: number;
    } | null> {
        return new Promise((resolve) => {
            const prices = candleData.map(candle => candle.close);
            const timestamps = candleData.map(candle => candle.timestamp);
            
            if (prices.length < 15) {
                resolve(null);
                return;
            }

            // Check for strong downtrend followed by converging lines
            const downtrend = this.detectDowntrend(prices.slice(0, Math.floor(prices.length / 2)));
            const convergence = this.detectConvergence(prices.slice(Math.floor(prices.length / 2)));

            if (downtrend && convergence) {
                resolve({
                    confidenceScore: 80,
                    patternData: {
                        startPrice: prices[0],
                        endPrice: prices[prices.length - 1],
                        startTimestamp: timestamps[0],
                        endTimestamp: timestamps[timestamps.length - 1],
                        keyLevels: [downtrend.start, downtrend.end, convergence.upper, convergence.lower],
                        direction: 'bearish'
                    },
                    priceAtIdentification: prices[prices.length - 1]
                });
                return;
            }

            resolve(null);
        });
    }

    // Helper methods for pattern detection
    private calculateTrendline(prices: number[], direction: 'ascending' | 'descending'): { start: number; end: number } | null {
        // Simple linear regression
        const n = prices.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
            sumXY += i * prices[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Check if slope matches expected direction
        if ((direction === 'ascending' && slope <= 0) || (direction === 'descending' && slope >= 0)) {
            return null;
        }

        return {
            start: intercept,
            end: slope * (n - 1) + intercept
        };
    }

    private findConvergencePoint(line1: { start: number; end: number }, line2: { start: number; end: number }): number | null {
        // Simple intersection point calculation
        const slope1 = (line1.end - line1.start) / (line1.end - line1.start);
        const slope2 = (line2.end - line2.start) / (line2.end - line2.start);
        
        if (slope1 === slope2) return null;

        const x = (line2.start - line1.start) / (slope1 - slope2);
        return x >= 0 && x <= line1.end ? x : null;
    }

    private detectUptrend(prices: number[]): { start: number; end: number } | null {
        return this.calculateTrendline(prices, 'ascending');
    }

    private detectDowntrend(prices: number[]): { start: number; end: number } | null {
        return this.calculateTrendline(prices, 'descending');
    }

    private detectParallelChannel(prices: number[], direction: 'ascending' | 'descending'): { upper: number; lower: number } | null {
        const highs: number[] = [];
        const lows: number[] = [];
        
        for (let i = 1; i < prices.length - 1; i++) {
            if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
                highs.push(prices[i]);
            }
            if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
                lows.push(prices[i]);
            }
        }

        const upperLine = this.calculateTrendline(highs, direction);
        const lowerLine = this.calculateTrendline(lows, direction);

        if (!upperLine || !lowerLine) return null;

        return {
            upper: upperLine.end,
            lower: lowerLine.end
        };
    }

    private detectConvergence(prices: number[]): { upper: number; lower: number } | null {
        const highs: number[] = [];
        const lows: number[] = [];
        
        for (let i = 1; i < prices.length - 1; i++) {
            if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
                highs.push(prices[i]);
            }
            if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
                lows.push(prices[i]);
            }
        }

        const upperLine = this.calculateTrendline(highs, 'descending');
        const lowerLine = this.calculateTrendline(lows, 'ascending');

        if (!upperLine || !lowerLine) return null;

        const convergencePoint = this.findConvergencePoint(upperLine, lowerLine);
        if (!convergencePoint) return null;

        return {
            upper: upperLine.end,
            lower: lowerLine.end
        };
    }
} 
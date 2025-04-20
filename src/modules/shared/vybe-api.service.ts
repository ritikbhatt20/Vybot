import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class VybeApiService {
    private readonly axiosInstance: AxiosInstance;
    private readonly logger = new Logger(VybeApiService.name);

    constructor(private readonly configService: ConfigService) {
        const baseURL = this.configService.get<string>('VYBE_API_URL');
        const apiKey = this.configService.get<string>('VYBE_API_KEY');

        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'X-API-KEY': apiKey,
                'Accept': 'application/json',
            },
            timeout: 10000, // 10 seconds timeout
        });

        // Add response interceptor for logging
        this.axiosInstance.interceptors.response.use(
            response => response,
            error => {
                this.logger.error(
                    `API Error: ${error.message} | ${error.config?.url}`,
                    error.response?.data
                );
                return Promise.reject(error);
            }
        );
    }

    async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.axiosInstance.get<T>(url, config);
            return response.data;
        } catch (error) {
            this.logger.error(`GET request failed: ${url}`, error.message);
            throw error;
        }
    }

    async post<T>(url: string, data: any, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.axiosInstance.post<T>(url, data, config);
            return response.data;
        } catch (error) {
            this.logger.error(`POST request failed: ${url}`, error.message);
            throw error;
        }
    }
}

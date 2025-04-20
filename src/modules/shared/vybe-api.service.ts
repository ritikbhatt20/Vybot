import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class VybeApiService {
    private readonly axiosInstance: AxiosInstance;

    constructor(private readonly configService: ConfigService) {
        const baseURL = this.configService.get<string>('VYBE_API_URL');
        const apiKey = this.configService.get<string>('VYBE_API_KEY');

        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                'X-API-KEY': apiKey,
                'Accept': 'application/json',
            },
        });
    }

    async get<T>(url: string, config = {}) {
        const response = await this.axiosInstance.get<T>(url, config);
        return response.data;
    }
}
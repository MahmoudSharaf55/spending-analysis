import axios from 'axios';
import type { FinancialReport } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000 // 60 seconds for large PDFs
});

export interface ApiResponse<T> {
  success: boolean;
  report?: T;
  error?: string;
}

export interface StatusResponse {
  status: string;
  openRouterConfigured: boolean;
}

export const statementApi = {
  /**
   * Upload and analyze a custom statement file (PDF or CSV).
   */
  async uploadStatement(file: File): Promise<FinancialReport> {
    const formData = new FormData();
    formData.append('statement', file);

    const response = await apiClient.post<ApiResponse<FinancialReport>>('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data.success || !response.data.report) {
      throw new Error(response.data.error || 'Failed to analyze bank statement.');
    }

    return response.data.report;
  },

  /**
   * Check backend server health and OpenRouter AI connection status.
   */
  async checkStatus(): Promise<StatusResponse> {
    const response = await apiClient.get<StatusResponse>('/status');
    return response.data;
  }
};

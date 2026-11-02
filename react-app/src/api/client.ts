import axios from 'axios';
import type { FinancialReport } from '../types';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
// Ensure the base URL ends with /api (where Express routes are mounted)
const API_BASE_URL =
  rawBaseUrl === '/api'
    ? '/api'
    : rawUrlHasApi(rawBaseUrl)
      ? rawBaseUrl.replace(/\/+$/, '')
      : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

function rawUrlHasApi(url: string): boolean {
  return url.endsWith('/api') || url.endsWith('/api/');
}

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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  answer?: string;
  error?: string;
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
   * Ask the AI Financial Copilot a question about the statement.
   */
  async askCopilot(
    question: string,
    report: FinancialReport,
    history: ChatMessage[] = [],
    lang: 'en' | 'ar' = 'en'
  ): Promise<string> {
    // Strip heavy raw debug strings (originalData, rawLine) to keep payload compact and fast
    const sanitizedTransactions = (report.transactions || []).map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      accountType: t.accountType,
      accountNumber: t.accountNumber,
      direction: t.direction,
      flowType: t.flowType,
      category: t.category
    }));

    const sanitizedReport = {
      ...report,
      transactions: sanitizedTransactions
    };

    const response = await apiClient.post<ChatResponse>('/chat', {
      question,
      report: sanitizedReport,
      history,
      lang
    });

    if (!response.data.success || !response.data.answer) {
      throw new Error(response.data.error || 'Failed to get answer from AI Copilot.');
    }

    return response.data.answer;
  },

  /**
   * Check backend server health and OpenRouter AI connection status.
   */
  async checkStatus(): Promise<StatusResponse> {
    const response = await apiClient.get<StatusResponse>('/status');
    return response.data;
  }
};


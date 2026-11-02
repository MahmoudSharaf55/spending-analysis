import { useState, useEffect } from 'react';
import type { FinancialReport } from '../types';
import { statementApi } from '../api/client';

export function useStatementAnalyzer() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openRouterStatus, setOpenRouterStatus] = useState<boolean>(false);

  // Check OpenRouter connection on mount
  useEffect(() => {
    let isMounted = true;
    statementApi
      .checkStatus()
      .then((data) => {
        if (isMounted) {
          setOpenRouterStatus(data.openRouterConfigured);
        }
      })
      .catch((err) => {
        console.warn('Backend status check failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const analyzeFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await statementApi.uploadStatement(file);
      setReport(data);
    } catch (err: any) {
      console.error('File analysis error:', err);
      setError(err.message || 'Failed to process bank statement.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(null);
    setError(null);
    setLoading(false);
  };

  const clearError = () => setError(null);

  return {
    report,
    loading,
    error,
    openRouterStatus,
    analyzeFile,
    reset,
    clearError
  };
}

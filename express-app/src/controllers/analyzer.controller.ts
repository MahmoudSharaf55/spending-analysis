import { Request, Response } from 'express';
import { removeTempFile } from '../middleware/upload.middleware.js';
import { StatementParserService } from '../services/statementParser.service.js';
import { TransactionNormalizerService } from '../services/transactionNormalizer.service.js';
import { TransactionCategorizerService } from '../services/transactionCategorizer.service.js';
import { FinancialAnalysisService } from '../services/financialAnalysis.service.js';
import { InsightsGeneratorService } from '../services/insightsGenerator.service.js';
import { OpenRouterService } from '../services/openRouter.service.js';

export class AnalyzerController {
  /**
   * Common pipeline to analyze a statement file.
   */
  private static async processStatement(filePath: string, originalName: string) {
    // 1. Parse statement
    const parseResult = await StatementParserService.parseFile(filePath, originalName);

    if (parseResult.rawTransactions.length === 0) {
      throw new Error('No transactions could be extracted from the provided document.');
    }

    // 2. Normalize transactions
    const normalized = TransactionNormalizerService.normalizeAll(parseResult.rawTransactions);

    // 3. Categorize with rules + OpenRouter LLM + fallback
    const { transactions: categorized, aiUsed } =
      await TransactionCategorizerService.categorizeTransactions(normalized);

    // 4. Generate initial financial report
    const initialReport = FinancialAnalysisService.generateReport(
      categorized,
      parseResult.accountsMeta,
      parseResult.statementPeriod,
      parseResult.currency,
      originalName,
      originalName.toLowerCase().endsWith('.csv') ? 'csv' : 'pdf',
      aiUsed,
      []
    );

    // 5. Generate bilingual insights (AI or deterministic rules)
    const bilingualInsights = await InsightsGeneratorService.generateBilingualInsights(
      initialReport.overallSummary,
      initialReport.spendingAnalysis,
      initialReport.incomeAnalysis,
      initialReport.accounts,
      initialReport.currency
    );

    initialReport.insights = bilingualInsights.en;
    initialReport.insightsAr = bilingualInsights.ar;

    return initialReport;
  }

  /**
   * POST /api/analyze - Upload and analyze bank statement.
   */
  static async analyze(req: Request, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No statement file uploaded.' });
    }

    try {
      const report = await AnalyzerController.processStatement(file.path, file.originalname);
      return res.json({ success: true, report });
    } catch (err: any) {
      console.error('[AnalyzerController] Error processing statement:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to process bank statement.'
      });
    } finally {
      removeTempFile(file.path);
    }
  }

  /**
   * GET /api/status - Health check and AI configuration status.
   */
  static getStatus(_req: Request, res: Response): Response {
    return res.json({
      status: 'healthy',
      openRouterConfigured: OpenRouterService.isConfigured()
    });
  }
}

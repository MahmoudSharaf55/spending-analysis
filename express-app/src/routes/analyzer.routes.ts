import { Router } from 'express';
import { AnalyzerController } from '../controllers/analyzer.controller.js';
import { statementUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Statement analysis endpoint with file upload middleware
router.post('/analyze', statementUpload.single('statement'), AnalyzerController.analyze);

// Interactive statement Q&A copilot
router.post('/chat', AnalyzerController.chat);

// Health & AI status check
router.get('/status', AnalyzerController.getStatus);

export default router;

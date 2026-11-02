import { Router } from 'express';
import { AnalyzerController } from '../controllers/analyzer.controller.js';
import { statementUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Statement analysis endpoint with file upload middleware
router.post('/analyze', statementUpload.single('statement'), AnalyzerController.analyze);

// Health & AI status check
router.get('/status', AnalyzerController.getStatus);

export default router;

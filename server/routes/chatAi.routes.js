import express from 'express';
import { chatAIHandler } from '../controllers/chatAi.controller.js';

const router = express.Router();

// POST /api/chat-ai
router.post('/', chatAIHandler);

export default router;

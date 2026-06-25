import express from 'express';
import { getGuardrailRules, updateGuardrailRule } from '../../controllers/guardrail.controller.js';

const router = express.Router();

router.get('/', getGuardrailRules);
router.put('/:id', updateGuardrailRule);

export default router;

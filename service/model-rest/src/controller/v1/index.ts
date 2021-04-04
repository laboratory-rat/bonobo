import dataset from './dataset';
import express from 'express';

const router = express.Router();
router.use('/dataset', dataset);

export default router;
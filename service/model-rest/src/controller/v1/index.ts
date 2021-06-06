import dataset from './dataset';
import model from './model';
import express from 'express';

const router = express.Router();
router.use('/dataset', dataset);
router.use('/model', model);

export default router;

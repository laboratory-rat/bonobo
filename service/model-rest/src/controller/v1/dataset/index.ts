import createGooglesheet from './create_googlesheets';
import { Router } from 'express';
import { json } from 'body-parser';
import approve_googlesheets from '@/controller/v1/dataset/approve_googlesheets';
import find from '@/controller/v1/dataset/find';
import get from '@/controller/v1/dataset/get';
import del from '@/controller/v1/dataset/del';
import read from '@/controller/v1/dataset/read';

const router = Router();

router.post('/create/google_sheet', json(), createGooglesheet);
router.post('/approve/table', json(), approve_googlesheets);
router.get('/:skip/:limit', json(), find);
router.get('/:id/:skip/:limit', read);
router.get('/:id', json(), get);
router.delete('/:id', json(), del);

export default router;

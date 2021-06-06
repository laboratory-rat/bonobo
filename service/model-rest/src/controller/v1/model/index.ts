import { Router } from 'express';
import { json } from 'body-parser';
import create from './create';
import find from './find';
import get from './get';
import del from './del';

const router = Router();

router.post('/create', json(), create);
router.get('/:skip/:limit', find);
router.get('/:id', get);
router.delete('/:id', del);

export default router;

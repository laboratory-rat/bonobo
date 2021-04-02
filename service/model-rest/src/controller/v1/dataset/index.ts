import createGooglesheet from './create_googlesheets';
import {Router} from 'express';

const router = Router();
router.post('/create/google_sheet', createGooglesheet);
router.get('/dummy', (req, res) => {
    res.send('Dummy!');
});

export default router;

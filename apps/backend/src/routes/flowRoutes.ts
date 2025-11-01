import { Router } from 'express';
import { FlowController } from '../controllers/flowController';

const router = Router();

router.post('/check-events', FlowController.checkEvents);
router.post('/start-listener', FlowController.startListener);
router.post('/stop-listener', FlowController.stopListener);

export default router;

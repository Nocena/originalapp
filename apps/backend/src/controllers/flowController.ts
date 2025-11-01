import { Request, Response } from 'express';
import { FlowService } from '../services/flowService';

export class FlowController {
  static async checkEvents(req: Request, res: Response): Promise<void> {
    try {
      await FlowService.checkEvents();
      res.json({ success: true, message: 'Manually checked for events' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check events' });
    }
  }

  static async startListener(req: Request, res: Response): Promise<void> {
    try {
      await FlowService.startListener();
      res.json({ success: true, message: 'Flow event listener started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start Flow event listener' });
    }
  }

  static async stopListener(req: Request, res: Response): Promise<void> {
    try {
      await FlowService.stopListener();
      res.json({ success: true, message: 'Flow event listener stopped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop Flow event listener' });
    }
  }
}

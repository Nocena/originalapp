import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ButtonState {
  enabled: boolean;
  lastWeeklyEvent?: string;
  weekId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buttonStateFile = path.join(process.cwd(), '../backend/src/data/button-state.json');
    
    // Check if button state file exists
    if (!fs.existsSync(buttonStateFile)) {
      return res.status(200).json({ enabled: false });
    }

    const buttonStateData = fs.readFileSync(buttonStateFile, 'utf8');
    const buttonState: ButtonState = JSON.parse(buttonStateData);

    return res.status(200).json(buttonState);
  } catch (error) {
    console.error('Error reading button state:', error);
    return res.status(200).json({ enabled: false });
  }
}

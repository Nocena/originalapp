import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { FlowEventListener } from './services/flowEventListener';
import flowRoutes from './routes/flowRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const flowListener = new FlowEventListener();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/flow', flowRoutes);

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/greet/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  res.json({
    source: 'Using @nocena/indexer package',
  });
});

app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  
  // Auto-start Flow event listener
  try {
    await flowListener.startListening();
  } catch (error) {
    console.error('Failed to start Flow event listener:', error);
  }
});


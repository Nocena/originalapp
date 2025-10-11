import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});


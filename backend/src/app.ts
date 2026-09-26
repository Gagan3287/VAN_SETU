import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import geoRoutes from './routes/geoRoutes';
import claimRoutes from './routes/claimRoutes';
import conflictRoutes from './routes/conflictRoutes';
import riskRoutes from './routes/riskRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';

export const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting to /api/* routes
app.use('/api', apiRateLimiter);

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'VanSetu Decision Support System API',
    message: 'Backend server is running properly. API routes are under /api/*',
    endpoints: {
      health: '/api/health',
      districts: '/api/geo/districts',
      tehsils: '/api/geo/tehsils',
      villages: '/api/geo/villages',
      auth: '/api/auth',
      claims: '/api/claims',
      conflicts: '/api/conflicts',
      risk: '/api/risk',
    },
    frontendUrl: env.CORS_ORIGIN,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'VanSetu Decision Support System',
    timestamp: new Date().toISOString(),
  });
});

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/risk', riskRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

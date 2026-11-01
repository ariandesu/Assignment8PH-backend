import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/event.routes.js';
import participantRoutes from './routes/participant.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { connectDB } from './config/db.js';

const app = express();

// CORS - restrict to deployed frontend origin
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kindora API is running' });
});

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/my-events', eventRoutes);
app.use('/api/events', participantRoutes);
app.use('/api/my-joined-events', participantRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

connectDB()
  .then((db) => {
    app.locals.db = db;
    app.listen(PORT, () => {
      console.log(`🚀 Kindora server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

export default app;

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Kindora API',
    version: '1.0.0',
    description: 'Social Impact Platform REST API',
    endpoints: {
      'GET /api/events': 'Public - Get upcoming events with pagination, search, filters',
      'GET /api/events/recent': 'Public - Get six recent upcoming events',
      'GET /api/events/:id': 'Public - Get event details',
      'POST /api/events': 'JWT - Create event',
      'GET /api/my-events': 'JWT - Get user\'s created events',
      'PATCH /api/events/:id': 'JWT + Owner - Update event',
      'DELETE /api/events/:id': 'JWT + Owner - Delete event',
      'POST /api/events/:id/join': 'JWT - Join event',
      'GET /api/my-joined-events': 'JWT - Get joined events sorted by date',
      'GET /api/users/me': 'JWT - Get current profile',
      'PATCH /api/users/me': 'JWT - Update profile',
      'GET /health': 'Public - Health check'
    }
  });
});

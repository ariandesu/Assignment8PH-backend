import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/event.routes.js';
import userRoutes from './routes/user.routes.js';
import { myEventsRouter, myJoinedEventsRouter } from './routes/me.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { connectDB } from './config/db.js';

const app = express();

// CORS - CLIENT_URL may hold one origin or a comma-separated list
const allowedOrigins = [
  ...(process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean),
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-side fetch) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Health check (no database needed)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Kindora API is running' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kindora API is running' });
});

// Ensure MongoDB connection before handling API requests
app.use('/api', async (req, res, next) => {
  try {
    req.app.locals.db = await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Kindora API',
    version: '1.1.0',
    endpoints: {
      'GET /api/events': 'Public - Upcoming events (search, category, location, pagination)',
      'GET /api/events/recent': 'Public - Six nearest upcoming events',
      'GET /api/events/:id': 'Public - Event details',
      'POST /api/events': 'JWT - Create event',
      'PATCH /api/events/:id': 'JWT + owner - Update event',
      'DELETE /api/events/:id': 'JWT + owner - Delete event',
      'POST /api/events/:id/join': 'JWT - Join event',
      'GET /api/events/:id/join-status': 'JWT - Whether the user joined this event',
      'GET /api/my-events': 'JWT - Events created by the user',
      'GET /api/my-joined-events': 'JWT - Events joined by the user, sorted by event date',
      'GET /api/users/me': 'JWT - Identity from the token',
    },
  });
});

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/my-events', myEventsRouter);
app.use('/api/my-joined-events', myJoinedEventsRouter);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

// Local development: start a server. On Vercel the default export is used instead.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Kindora API listening on http://localhost:${PORT}`));
}

export default app;

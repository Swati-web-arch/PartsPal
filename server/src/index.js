import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import issuesRoutes from './routes/issues.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Vercel, Render, and local development
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching origins
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow connection in competition deployment
    }
  },
  credentials: true
}));


app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', issuesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

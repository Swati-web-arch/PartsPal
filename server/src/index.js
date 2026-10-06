import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventory.js';
import issuesRoutes from './routes/issues.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());

// Routes
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

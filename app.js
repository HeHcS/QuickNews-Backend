import express from 'express';
import cors from 'cors';
import videoRoutes from './routes/videoRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get frontend URL from environment variable or use default
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS Configuration
const corsOptions = {
    origin: [FRONTEND_URL], // Use environment variable for frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    credentials: true, // Enable credentials (cookies, authorization headers)
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'] // Expose headers needed for video streaming
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/articles', articleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error('Error:', {
        status: statusCode,
        message: err.message,
        stack: err.stack
    });
    res.status(statusCode).json({ 
        message: err.message || 'Something went wrong!',
        status: statusCode
    });
});

export default app;
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './db.js';
import auth from './routes/authRoutes.js';
import complaint from './routes/complaintRoutes.js'; // New import
import otp from './routes/otpRoutes.js'; // New import for OTP routes
import user from './routes/userRoutes.js'; // New import for user routes
import media from './routes/mediaRoutes.js'; // Import media routes
import sponsor from './routes/sponsorRoutes.js'; // Import sponsor routes
import ad from './routes/adRoutes.js'; // Import ad routes
import notification from './routes/notificationRoutes.js'; // Import notification routes



const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Connect to database
connectDB();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'], // Allow browser to see Set-Cookie header
}));

// Handle URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Handle multipart/form-data (for avatar upload) - use specific middleware for specific routes
// app.use(upload.single('avatar')); // This line is problematic for other routes, comment out or remove if not needed globally

app.use('/api/v1', auth);
app.use('/api/v1', complaint); // Use complaint routes
app.use('/api/v1', otp); // Use OTP routes
app.use('/api/v1', user); // Use user routes
app.use('/api/v1', media); // Use media routes
app.use('/api/v1', sponsor); // Use sponsor routes with admin prefix
app.use('/api/v1', ad); // Use ad routes
app.use('/api/v1', notification); // Use notification routes

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Middleware to handle errors - This will be a basic one for now
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
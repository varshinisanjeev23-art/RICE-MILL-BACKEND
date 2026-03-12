const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
console.log('ENV loaded from', path.join(__dirname, '..', '.env'), 'cwd:', process.cwd());
console.log('Has MONGODB_URI?', !!process.env.MONGODB_URI);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const productRoutes = require('./routes/product.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const contactRoutes = require('./routes/contact.routes');
const reportRoutes = require('./routes/report.routes');
const reviewRoutes = require('./routes/review.routes');
const chatRoutes = require('./routes/chat.routes');
const careersRoutes = require('./routes/careers.routes');

const app = express();

// Allow localhost/127.0.0.1 on any dev port plus explicit env origins
const explicitOrigins = (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []).map(o => o.trim().replace(/\/$/, ''));
console.log('CORS Allowed Origins:', explicitOrigins);

const corsOrigin = (origin, cb) => {
  if (!origin) return cb(null, true); 
  const normalizedOrigin = origin.replace(/\/$/, '');
  if (explicitOrigins.includes(normalizedOrigin)) return cb(null, true);
  if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return cb(null, true);
  // Allow the specific Vercel and production domains
  if (normalizedOrigin === 'https://client-nrm-mill-frontend.vercel.app') return cb(null, true);
  if (normalizedOrigin === 'https://rice-mill-frontend.vercel.app') return cb(null, true);
  
  console.log('Blocked by CORS:', origin);
  return cb(new Error('Not allowed by CORS'));
};
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          .top-bar { background-color: #2d3e2d; height: 12px; width: 100%; }
          .container { padding: 20px; }
          h1 { font-size: 28px; font-weight: 400; color: #000; margin: 0; }
        </style>
      </head>
      <body>
        <div class="top-bar"></div>
        <div class="container">
          <h1>NRM Rice Mill Backend API is running 🚀</h1>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/careers', careersRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'nrm_rice_mill' })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./utils/db');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const locationRoutes = require('./routes/location');
const journeyRoutes = require('./routes/journey');
const incidentRoutes = require('./routes/incident');
const { checkOverdueJourneys } = require('./controllers/journeyController');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);

// Connect DB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/incidents', incidentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.IO for real-time location
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('location-update', (data) => {
    // Broadcast location to all contacts watching this user
    socket.to(data.userId).emit('location-update', data);
  });

  socket.on('sos-active', (data) => {
    socket.to(data.userId).emit('sos-active', data);
  });

  socket.on('sos-cancelled', (data) => {
    socket.to(data.userId).emit('sos-cancelled', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Surakshita server running on port ${PORT}`);

  // Check for overdue journeys every 5 minutes
  setInterval(checkOverdueJourneys, 5 * 60 * 1000);
  console.log('Journey overdue checker started (every 5 min)');
});

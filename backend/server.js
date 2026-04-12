require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { seedContests } = require('./scripts/seedContests');
const setupSockets = require('./socket/socketHandler');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // Allow all in dev; tighten for prod if needed
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/room'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contests', require('./routes/contest'));
app.use('/api/bonus', require('./routes/bonus'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/tournaments', require('./routes/tournament'));

// Test route
app.get("/", (_req, res) => res.send("Chess Tournament Server is running"));

// Keep-alive ping for Render free tier (prevents 15min sleep)
app.get("/ping", (_req, res) => res.json({ status: 'ok' }));

// MongoDB & Server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chessApp';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
  .then(async () => {
    console.log(`MongoDB Connected ✅ (${MONGO_URI.startsWith('mongodb+srv') ? 'Atlas' : 'Local'})`);
    await seedContests(); // Keep seed calls on startup
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, true);
    },
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});


// Attach socket handlers
setupSockets(io);
// Make io accessible in controllers
app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
    
    // Check for tournament starts every 60 seconds
    const { checkAndStartTournaments } = require('./controllers/tournamentController');
    setInterval(() => {
      checkAndStartTournaments(io);
    }, 60000);
});

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { seedContests } = require('./scripts/seedContests');
const setupSockets = require('./socket/socketHandler');

const app = express();
app.use(cors());
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

// Test route
app.get("/", (req, res) => res.send("Chess Tournament Server is running"));

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
const io = new Server(server, { cors: { origin: '*' } });

// Attach socket handlers
setupSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));

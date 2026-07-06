require('dotenv').config();
require('express-async-errors');

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'https://pm-squad-ui.onrender.com';

// --- App + HTTP server + Socket.io ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

// Make io reachable from controllers via req.app.get('io') and req.io.
app.set('io', io);

// --- Connect to MongoDB ---
connectDB();

// --- Global middleware ---
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to every request for convenience.
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Health check ---
app.get('/', (req, res) => {
  res.json({ success: true, message: 'PM Squad API is running' });
});

// --- Routes ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
// Comments are nested under a task; mergeParams exposes :taskId to the router.
app.use('/api/tasks/:taskId/comments', require('./routes/comment.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/reminders', require('./routes/reminder.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/export', require('./routes/export.routes'));

// --- Realtime + scheduled jobs ---
require('./sockets/taskSocket')(io);
require('./jobs/reminderJob')(io);

// --- Error handler (must be last) ---
app.use(errorHandler);

server.listen(PORT, () =>
  console.log(`PM Squad backend running on port ${PORT}`)
);

module.exports = { app, server, io };

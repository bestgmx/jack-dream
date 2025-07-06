const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
  origin: ['https://jack-dream.parspack.com', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// اتصال به دیتابیس (یا ساخت آن)
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/data.db' : './data.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    
    // ساخت جدول نمونه (در صورت نبود)
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Table creation error:', err.message);
      } else {
        console.log('Items table ready');
      }
    });
  }
});

// API: دریافت همه آیتم‌ها
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items', [], (err, rows) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      success: true, 
      data: rows, 
      count: rows.length 
    });
  });
});

// API: افزودن آیتم جدید
app.post('/api/items', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ 
      error: 'Name is required' 
    });
  }
  
  db.run('INSERT INTO items (name) VALUES (?)', [name.trim()], function(err) {
    if (err) {
      console.error('Database insert error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      success: true,
      id: this.lastID, 
      name: name.trim() 
    });
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Jack Dream Backend API', 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: ['/api/items', '/health']
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/api/items', '/health']
  });
});

const server = app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database path: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  });
});
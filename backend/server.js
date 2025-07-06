const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/data.db' : './data.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    
    // Create table
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

// Routes
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.json({ 
    message: 'Jack Dream Backend API', 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: ['/api/items', '/health']
  });
});

app.get('/health', (req, res) => {
  console.log('Health endpoint accessed');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/items', (req, res) => {
  console.log('API items endpoint accessed');
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

app.post('/api/items', (req, res) => {
  console.log('API items POST endpoint accessed');
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

// 404 handler
app.use((req, res) => {
  console.log('404 - Endpoint not found:', req.url);
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/api/items', '/health'],
    requestedPath: req.url
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
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
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/aprv3',
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-apr-v3';

// ----------------------------------------------------------------------------
// IN-MEMORY CONFIG CACHE
// ----------------------------------------------------------------------------
let configCache = {};
let penaltyCache = {};

async function loadConfigToCache() {
  try {
    const resConfig = await pool.query('SELECT key, value FROM CONFIG');
    resConfig.rows.forEach(row => {
      configCache[row.key] = isNaN(row.value) ? row.value : Number(row.value);
    });

    const resPenalty = await pool.query('SELECT jenis, default_val FROM PENALTY_CONFIG');
    resPenalty.rows.forEach(row => {
      penaltyCache[row.jenis] = Number(row.default_val);
    });
    console.log('✅ Configuration loaded to in-memory cache.');

    // Seed default users if they don't exist
    const adminCheck = await pool.query("SELECT * FROM USERS WHERE nrp = 'admin'");
    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash('admin', 10);
      await pool.query(
        "INSERT INTO USERS (nrp, pin_hash, nama, role) VALUES ($1, $2, $3, $4)",
        ['admin', adminHash, 'Super Admin', 'Admin']
      );
      
      const staffHash = await bcrypt.hash('staff', 10);
      await pool.query(
        "INSERT INTO USERS (nrp, pin_hash, nama, role) VALUES ($1, $2, $3, $4)",
        ['staff', staffHash, 'Staff User', 'Staff']
      );
      console.log('✅ Seeded default admin and staff users.');
    }
  } catch (error) {
    console.error('❌ Error loading config to cache:', error.message);
  }
}

// Initial load
loadConfigToCache();

// ----------------------------------------------------------------------------
// AUTH MIDDLEWARE
// ----------------------------------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function isAdminOrManager(req, res, next) {
  if (req.user.role === 'Admin' || req.user.role === 'Manager') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Requires Admin/Manager role.' });
  }
}

// ----------------------------------------------------------------------------
// ENDPOINTS: AUTHENTICATION
// ----------------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { nrp, pin } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM USERS WHERE nrp = $1', [nrp]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid NRP' });
    
    const user = rows[0];
    const validPin = await bcrypt.compare(pin, user.pin_hash);
    if (!validPin) return res.status(401).json({ error: 'Invalid PIN' });

    const token = jwt.sign({ id: user.id, nrp: user.nrp, role: user.role, name: user.nama }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { nrp: user.nrp, role: user.role, name: user.nama } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// ENDPOINTS: CONFIGURATION (Admin Panel)
// ----------------------------------------------------------------------------
app.get('/api/config', authenticateToken, (req, res) => {
  res.json({ config: configCache, penalty: penaltyCache });
});

app.post('/api/config', authenticateToken, isAdminOrManager, async (req, res) => {
  const { key, value } = req.body;
  try {
    await pool.query(
      'INSERT INTO CONFIG (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, value]
    );
    await loadConfigToCache(); // Refresh Cache Instan
    res.json({ message: 'Configuration updated and cache refreshed', configCache });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// ENDPOINTS: ANNOUNCEMENTS
// ----------------------------------------------------------------------------
app.post('/api/announcements', authenticateToken, isAdminOrManager, async (req, res) => {
  const { title, content, priority, target_role, attachment_url, is_pinned } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO ANNOUNCEMENTS (title, content, priority, target_role, attachment_url, is_pinned, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, content, priority, target_role, attachment_url, is_pinned, req.user.nrp]
    );
    // TODO: Trigger FCM Web Push & Notification Center Broadcast here
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ANNOUNCEMENTS ORDER BY is_pinned DESC, created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// ENDPOINTS: TASKS & SCORING ENGINE
// ----------------------------------------------------------------------------
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    // If Admin/Manager -> see all, if Staff -> see their tasks
    let query = 'SELECT * FROM TASKS';
    let params = [];
    if (req.user.role === 'Staff') {
      query += ' WHERE assignee_nrp = $1';
      params.push(req.user.nrp);
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authenticateToken, isAdminOrManager, async (req, res) => {
  const { title, jf, assignee_nrp, deadline, volume, need_plan } = req.body;
  try {
    const status = need_plan ? 'Planning' : 'In Progress';
    const { rows } = await pool.query(
      'INSERT INTO TASKS (title, jf, assignee_nrp, assigner_nrp, status, deadline, volume, need_plan) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, jf, assignee_nrp, req.user.nrp, status, deadline, volume, need_plan]
    );
    // TODO: Send FCM Notification
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper Function: Calculate Business Hours (SLA)
function calculateBusinessHours(startDate, endDate) {
  // Simple mock implementation
  // In real prod, exclude weekends and non-business hours (17:00 - 08:00) and lunch (12:00-13:00)
  const ms = new Date(endDate) - new Date(startDate);
  return ms / (1000 * 60 * 60); // Return hours
}

// ----------------------------------------------------------------------------
// START SERVER
// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

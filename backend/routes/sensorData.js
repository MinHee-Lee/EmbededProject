const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/add', (req, res) => {
  const { temperature, humidity, light } = req.body;
  const query = 'INSERT INTO sensor_data (temperature, humidity, light, timestamp) VALUES (?, ?, ?, NOW())';
  db.query(query, [temperature, humidity, light], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'Data added successfully' });
  });
});

router.get('/latest', (req, res) => {
  const query = 'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(result[0]);
  });
});

module.exports = router;

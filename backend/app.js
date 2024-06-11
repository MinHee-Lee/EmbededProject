const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');

const app = express();
const port = 3000;

// MySQL 연결 설정
const dbConfig = {
  host: '192.168.123.102',
  user: 'mergen',
  password: 'bumtan55',
  database: 'smart_flower_pot',
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('MySQL connection error: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database as id ' + connection.threadId);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MySQL에서 센서 데이터를 가져오는 함수
function getSensorDataFromMySQL(callback) {
  const query = 'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1';
  connection.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, results[0]);
  });
}

app.get('/', (req, res) => {
  getSensorDataFromMySQL((err, sensorData) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (sensorData) {
      res.json({
        Temperature: sensorData.temperature + '°C',
        Humidity: sensorData.humidity + '%',
        Light: sensorData.light + 'lux',
      });
    } else {
      res.json({
        Temperature: 'N/A',
        Humidity: 'N/A',
        Light: 'N/A',
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const sensorDataRoute = require('./routes/sensorData');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use('/api/sensorData', sensorDataRoute);
app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

#!/bin/bash

while true
do
  echo "Reading sensor data..."
  sensorData=$(./readSensors)
  echo "Sensor data: $sensorData"
  curl -X POST -H "Content-Type: application/json" -d "$sensorData" http://localhost:3000/api/sensorData/add -v
  sleep 5
done

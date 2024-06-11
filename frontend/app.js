document.addEventListener('DOMContentLoaded', () => {
  const temperatureElem = document.getElementById('temperature');
  const humidityElem = document.getElementById('humidity');
  const lightElem = document.getElementById('light');
  const ctx = document.getElementById('dataChart').getContext('2d');

  const fetchData = () => {
      fetch('http://localhost:3000/api/sensorData/latest')
          .then(response => response.json())
          .then(data => {
              console.log('Fetched data:', data);  // 디버깅 출력 추가
              temperatureElem.textContent = data.temperature;
              humidityElem.textContent = data.humidity;
              lightElem.textContent = data.light;

              // Update chart
              chart.data.labels.push(new Date().toLocaleTimeString());
              chart.data.datasets[0].data.push(data.temperature);
              chart.data.datasets[1].data.push(data.humidity);
              chart.data.datasets[2].data.push(data.light);
              chart.update();
          })
          .catch(error => console.error('Error fetching data:', error));
  };

  const chart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [
              {
                  label: 'Temperature (°C)',
                  borderColor: 'red',
                  data: [],
                  fill: false
              },
              {
                  label: 'Humidity (%)',
                  borderColor: 'blue',
                  data: [],
                  fill: false
              },
              {
                  label: 'Light (lux)',
                  borderColor: 'yellow',
                  data: [],
                  fill: false
              }
          ]
      },
      options: {
          responsive: true,
          scales: {
              x: {
                  type: 'time',
                  time: {
                      unit: 'second'
                  }
              }
          }
      }
  });

  fetchData();
  setInterval(fetchData, 5000); // Fetch new data every 5 seconds
});

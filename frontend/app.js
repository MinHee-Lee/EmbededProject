document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/sensorData/latest')
      .then(response => response.json())
      .then(data => {
        document.getElementById('temperature').textContent = data.temperature || '20';
        document.getElementById('humidity').textContent = data.humidity || '46';
        document.getElementById('light').textContent = data.light || '1365';
  
        const ctx = document.getElementById('dataChart').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Temperature', 'Humidity', 'Light'],
            datasets: [{
              label: 'Sensor Data',
              data: [data.temperature, data.humidity, data.light],
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false,
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      })
      .catch(error => console.error('Error fetching data:', error));
  });
  
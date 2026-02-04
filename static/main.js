// Attendance Chart
const attendanceCtx = document.getElementById('attendanceChart');
if (attendanceCtx && window.attendanceData) {
    new Chart(attendanceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [{
                data: [window.attendanceData.present, window.attendanceData.absent],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Results Chart
const resultsCtx = document.getElementById('resultsChart');
if (resultsCtx && window.resultsData) {
    new Chart(resultsCtx, {
        type: 'bar',
        data: {
            labels: window.resultsData.subjects,
            datasets: [{
                label: 'Scores',
                data: window.resultsData.scores,
                backgroundColor: '#007bff',
                borderColor: '#0056b3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

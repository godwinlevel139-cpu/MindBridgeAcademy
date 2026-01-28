// Data passed from Flask template
const courseData = JSON.parse(document.getElementById('revenueChart').dataset.course);
const paidUnpaidData = JSON.parse(document.getElementById('paymentChart').dataset.paidunpaid);

// Revenue by course chart
const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
new Chart(ctxRevenue, {
    type: 'bar',
    data: {
        labels: Object.keys(courseData),
        datasets: [{
            label: 'Revenue ($)',
            data: Object.values(courseData),
            backgroundColor: '#007bff'
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } }
    }
});

// Paid vs unpaid chart
const ctxPayment = document.getElementById('paymentChart').getContext('2d');
new Chart(ctxPayment, {
    type: 'doughnut',
    data: {
        labels: ['Paid', 'Unpaid'],
        datasets: [{
            data: [paidUnpaidData.paid, paidUnpaidData.unpaid],
            backgroundColor: ['#28a745', '#dc3545']
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
    }
});

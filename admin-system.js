// Admin System - Complete

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadAllData();
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(this.dataset.section + '-section').classList.add('active');
            loadSectionData(this.dataset.section);
        });
    });
}

function loadSectionData(section) {
    switch(section) {
        case 'students': loadStudents(); break;
        case 'tutors': loadTutors(); break;
        case 'complaints': loadComplaints(); break;
        case 'enquiries': loadEnquiries(); break;
        case 'payments': loadPayments(); break;
    }
}

function loadAllData() {
    loadOverview();
    loadStudents();
    loadTutors();
    loadComplaints();
    loadEnquiries();
    loadPayments();
}

function loadOverview() {
    const data = MindBridgeData.getData();
    document.getElementById('totalStudents').textContent = data.students.length;
    document.getElementById('totalTutors').textContent = Object.keys(data.tutors || {}).length;
    document.getElementById('pendingComplaints').textContent = (data.complaints || []).filter(c => c.status === 'pending').length;
    const revenue = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('totalRevenue').textContent = '$' + revenue.toLocaleString();
}

function loadStudents() {
    const students = MindBridgeData.students;
    const container = document.getElementById('studentsTable');
    container.innerHTML = `
        <table class="data-table">
            <thead><tr><th>Name</th><th>Student ID</th><th>Email</th><th>Program</th><th>Status</th></tr></thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td><strong>${s.name}</strong></td>
                        <td style="font-family: monospace;">${s.id}</td>
                        <td>${s.email}</td>
                        <td>${s.program || 'N/A'}</td>
                        <td><span class="grade-badge grade-A">Active</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadTutors() {
    const data = MindBridgeData.getData();
    const tutors = data.tutors ? Object.values(data.tutors) : [];
    const container = document.getElementById('tutorsTable');
    container.innerHTML = tutors.length > 0 ? `
        <table class="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Subjects</th><th>Status</th></tr></thead>
            <tbody>
                ${tutors.map(t => `
                    <tr>
                        <td><strong>${t.name}</strong></td>
                        <td>${t.email}</td>
                        <td>${t.subjects?.join(', ') || 'N/A'}</td>
                        <td><span class="grade-badge grade-${t.status === 'active' ? 'A' : 'D'}">${t.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<p class="empty-state">No tutors registered</p>';
}

function loadComplaints() {
    const complaints = MindBridgeData.getData().complaints || [];
    const container = document.getElementById('complaintsTable');
    container.innerHTML = complaints.length > 0 ? `
        <table class="data-table">
            <thead><tr><th>Student</th><th>Type</th><th>Subject</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
                ${complaints.map(c => `
                    <tr>
                        <td>${c.studentName}</td>
                        <td>${c.type}</td>
                        <td>${c.subject || 'N/A'}</td>
                        <td>${new Date(c.date).toLocaleDateString()}</td>
                        <td><span class="grade-badge grade-${c.status === 'resolved' ? 'A' : 'C'}">${c.status}</span></td>
                        <td><button class="btn btn-primary btn-small" onclick="respondComplaint('${c.id}')">Respond</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<p class="empty-state">No complaints</p>';
}

function loadEnquiries() {
    const enquiries = MindBridgeData.getData().enquiries || [];
    const container = document.getElementById('enquiriesTable');
    container.innerHTML = enquiries.length > 0 ? `
        <table class="data-table">
            <thead><tr><th>Student</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
                ${enquiries.map(e => `
                    <tr>
                        <td>${e.studentName}</td>
                        <td>${e.message.substring(0, 100)}...</td>
                        <td>${new Date(e.date).toLocaleDateString()}</td>
                        <td><span class="grade-badge grade-${e.status === 'resolved' ? 'A' : 'C'}">${e.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<p class="empty-state">No enquiries</p>';
}

function loadPayments() {
    const payments = MindBridgeData.getData().payments || [];
    const container = document.getElementById('paymentsTable');
    container.innerHTML = payments.length > 0 ? `
        <table class="data-table">
            <thead><tr><th>Date</th><th>Student</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead>
            <tbody>
                ${payments.map(p => {
                    const student = MindBridgeData.getStudentById(p.studentId);
                    return `
                        <tr>
                            <td>${new Date(p.date).toLocaleDateString()}</td>
                            <td>${student?.name || 'N/A'}</td>
                            <td><strong>$${p.amount}</strong></td>
                            <td style="font-family: monospace; font-size: 0.85rem;">${p.transactionId || p.reference}</td>
                            <td><span class="grade-badge grade-A">${p.status}</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    ` : '<p class="empty-state">No payments</p>';
}

function respondComplaint(id) {
    alert('Complaint response feature - will be implemented');
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'mindbridge-home.html';
}

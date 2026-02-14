// Student System - Complete Implementation

// Check authentication
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id') || sessionStorage.getItem('studentId');

if (!studentId) {
    window.location.href = 'mindbridge-index.html';
}

// Store in session
sessionStorage.setItem('studentId', studentId);

let currentStudent = null;
let currentAssessmentTab = 'pending';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
    setupNavigation();
    setupEventHandlers();
});

function loadStudentData() {
    currentStudent = MindBridgeData.getStudentById(studentId);
    
    if (!currentStudent) {
        alert('Student not found!');
        window.location.href = 'mindbridge-index.html';
        return;
    }
    
    // Update header
    document.getElementById('userName').textContent = currentStudent.name;
    document.getElementById('userGrade').textContent = currentStudent.gradeLevel || 'Year 7';
    
    // Load all sections
    loadOverview();
    loadClasses();
    loadSchedule();
    loadPerformance();
    loadAssessments();
    loadMaterials();
    loadComplaintHistory();
    loadSettings();
}

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
            const sectionId = this.dataset.section + '-section';
            document.getElementById(sectionId).classList.add('active');
            
            // Update page title
            const titles = {
                overview: { title: 'Student Dashboard', subtitle: 'Welcome back to your learning portal' },
                classes: { title: 'Live Classes', subtitle: 'Join your scheduled classes' },
                schedule: { title: 'Class Schedule', subtitle: 'Your weekly timetable' },
                performance: { title: 'Academic Performance', subtitle: 'Track your progress' },
                assessments: { title: 'Assessments', subtitle: 'Complete your assignments' },
                materials: { title: 'Course Materials', subtitle: 'Access learning resources' },
                support: { title: 'Support & Help', subtitle: 'Get assistance' },
                settings: { title: 'Account Settings', subtitle: 'Manage your profile' }
            };
            
            const info = titles[this.dataset.section];
            document.getElementById('pageTitle').textContent = info.title;
            document.getElementById('pageSubtitle').textContent = info.subtitle;
        });
    });
}

function setupEventHandlers() {
    // Complaint form
    document.getElementById('complaintForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitComplaint();
    });
    
    // Enquiry form
    document.getElementById('enquiryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitEnquiry();
    });
    
    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateSettings();
    });
}

function loadOverview() {
    const enrollment = MindBridgeData.getEnrollmentsByStudentId(studentId)[0];
    const tutorData = getTutorData();
    
    // Stats
    const courses = enrollment?.programDetails?.extraCourses || [];
    document.getElementById('enrolledCourses').textContent = courses.length + 1; // +1 for core
    
    // Calculate average grade
    const grades = tutorData?.grades?.filter(g => g.studentId === studentId) || [];
    if (grades.length > 0) {
        const avg = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
        document.getElementById('avgGrade').textContent = avg.toFixed(1) + '%';
    }
    
    document.getElementById('attendance').textContent = '95%';
    document.getElementById('completedAssessments').textContent = grades.length;
    
    // Upcoming classes
    loadUpcomingClasses();
    
    // Pending assessments
    loadPendingAssessmentsPreview();
    
    // Achievements
    loadAchievements();
}

function loadUpcomingClasses() {
    const tutorData = getTutorData();
    const schedule = tutorData?.schedule || [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayClasses = schedule.filter(s => s.day === today);
    const container = document.getElementById('upcomingClasses');
    
    if (todayClasses.length === 0) {
        container.innerHTML = '<p class="empty-state">No classes today</p>';
        return;
    }
    
    container.innerHTML = todayClasses.map(cls => `
        <div style="padding: 1rem; border-left: 3px solid var(--blue); background: var(--gray-50); border-radius: 8px; margin-bottom: 1rem;">
            <h4>${cls.subject}</h4>
            <p>🕐 ${cls.startTime} - ${cls.endTime}</p>
            <button class="btn btn-primary btn-small" onclick="joinClass('${cls.id}')">Join Now</button>
        </div>
    `).join('');
}

function loadPendingAssessmentsPreview() {
    const tutorData = getTutorData();
    const assessments = tutorData?.assessments || [];
    const grades = tutorData?.grades?.filter(g => g.studentId === studentId) || [];
    
    const pending = assessments.filter(a => {
        return !grades.find(g => g.assessmentId === a.id);
    }).slice(0, 3);
    
    const container = document.getElementById('pendingAssessments');
    
    if (pending.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending assessments</p>';
        return;
    }
    
    container.innerHTML = pending.map(a => `
        <div style="padding: 1rem; background: var(--gray-50); border-radius: 8px; margin-bottom: 1rem;">
            <h4>${a.title}</h4>
            <p>${a.subject} - ${a.type}</p>
            <p><small>Due: ${new Date(a.dueDate).toLocaleDateString()}</small></p>
        </div>
    `).join('');
}

function loadAchievements() {
    const container = document.getElementById('achievements');
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #FEF3C7, #FDE68A); border-radius: 12px;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏆</div>
                <h4>Perfect Attendance</h4>
                <p style="font-size: 0.875rem; color: var(--gray-700);">Current Week</p>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #DBEAFE, #BFDBFE); border-radius: 12px;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
                <h4>Top Performer</h4>
                <p style="font-size: 0.875rem; color: var(--gray-700);">Mathematics</p>
            </div>
        </div>
    `;
}

function loadClasses() {
    const tutorData = getTutorData();
    const schedule = tutorData?.schedule || [];
    const container = document.getElementById('liveClassesList');
    
    if (schedule.length === 0) {
        container.innerHTML = '<p class="empty-state">No classes scheduled</p>';
        return;
    }
    
    container.innerHTML = schedule.map(cls => `
        <div style="background: white; border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4>${cls.subject}</h4>
                    <p>📅 ${cls.day}</p>
                    <p>🕐 ${cls.startTime} - ${cls.endTime}</p>
                    <p>📚 ${cls.type}</p>
                </div>
                <button class="btn btn-primary" onclick="joinClass('${cls.id}')">
                    🎥 Join Class
                </button>
            </div>
        </div>
    `).join('');
}

function joinClass(classId) {
    const link = `https://meet.mindbridge.edu/class/${classId}`;
    alert(`Joining class...\n\nConference Link: ${link}\n\nIn production, this would open the video conference.\n\nIntegration options:\n• Zoom\n• Google Meet\n• Microsoft Teams\n• Jitsi`);
}

function loadSchedule() {
    const tutorData = getTutorData();
    const schedule = tutorData?.schedule || [];
    const container = document.getElementById('weeklySchedule');
    
    if (schedule.length === 0) {
        container.innerHTML = '<p class="empty-state">No schedule available</p>';
        return;
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Tutor</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${days.map(day => {
                    const dayClasses = schedule.filter(s => s.day === day);
                    if (dayClasses.length === 0) {
                        return `<tr><td>${day}</td><td colspan="5" style="color: var(--gray);">No classes</td></tr>`;
                    }
                    return dayClasses.map(cls => `
                        <tr>
                            <td><strong>${day}</strong></td>
                            <td>${cls.startTime} - ${cls.endTime}</td>
                            <td>${cls.subject}</td>
                            <td>${cls.type}</td>
                            <td>${tutorData?.name || 'Assigned Tutor'}</td>
                            <td><button class="btn btn-primary btn-small" onclick="joinClass('${cls.id}')">Join</button></td>
                        </tr>
                    `).join('');
                }).join('')}
            </tbody>
        </table>
    `;
}

function loadPerformance() {
    const tutorData = getTutorData();
    const assessments = tutorData?.assessments || [];
    const grades = tutorData?.grades?.filter(g => g.studentId === studentId) || [];
    
    const subjects = [...new Set(assessments.map(a => a.subject))];
    const tbody = document.getElementById('performanceBody');
    
    if (subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No performance data yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = subjects.map(subject => {
        const subjectAssessments = assessments.filter(a => a.subject === subject);
        const assignments = subjectAssessments.filter(a => a.type === 'assignment');
        const quizzes = subjectAssessments.filter(a => a.type === 'quiz');
        const tests = subjectAssessments.filter(a => a.type === 'test');
        const exams = subjectAssessments.filter(a => a.type === 'exam');
        
        const assignmentAvg = calcAverage(assignments, grades);
        const quizAvg = calcAverage(quizzes, grades);
        const testAvg = calcAverage(tests, grades);
        const examAvg = calcAverage(exams, grades);
        
        const overall = [assignmentAvg, quizAvg, testAvg, examAvg].filter(v => v > 0);
        const avg = overall.length > 0 ? overall.reduce((a, b) => a + b, 0) / overall.length : 0;
        
        const grade = getLetterGrade(avg);
        
        return `
            <tr>
                <td><strong>${subject}</strong></td>
                <td>${assignmentAvg > 0 ? assignmentAvg.toFixed(1) + '%' : '-'}</td>
                <td>${quizAvg > 0 ? quizAvg.toFixed(1) + '%' : '-'}</td>
                <td>${testAvg > 0 ? testAvg.toFixed(1) + '%' : '-'}</td>
                <td>${examAvg > 0 ? examAvg.toFixed(1) + '%' : '-'}</td>
                <td><strong>${avg > 0 ? avg.toFixed(1) + '%' : '-'}</strong></td>
                <td><span class="grade-badge grade-${grade.charAt(0)}">${grade}</span></td>
            </tr>
        `;
    }).join('');
    
    // Semester progress
    const allGrades = grades.map(g => {
        const assessment = assessments.find(a => a.id === g.assessmentId);
        return assessment ? (g.score / assessment.totalMarks * 100) : 0;
    });
    
    const semesterAvg = allGrades.length > 0 ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length : 0;
    const canAdvance = semesterAvg >= 50 && grades.length >= assessments.length / 2;
    
    document.getElementById('semesterProgress').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div>
                <p style="color: var(--gray); font-size: 0.875rem;">Overall Average</p>
                <p style="font-size: 2rem; font-weight: 700; color: var(--blue);">${semesterAvg.toFixed(1)}%</p>
            </div>
            <div>
                <p style="color: var(--gray); font-size: 0.875rem;">Completed</p>
                <p style="font-size: 2rem; font-weight: 700;">${grades.length}/${assessments.length}</p>
            </div>
            <div>
                <p style="color: var(--gray); font-size: 0.875rem;">Status</p>
                <p style="font-size: 1.25rem; font-weight: 700; color: ${canAdvance ? 'var(--success)' : 'var(--danger)'};">
                    ${canAdvance ? '✓ On Track' : '✗ Needs Improvement'}
                </p>
            </div>
        </div>
    `;
}

function calcAverage(assessments, grades) {
    const scores = assessments.map(a => {
        const grade = grades.find(g => g.assessmentId === a.id);
        return grade ? (grade.score / a.totalMarks * 100) : 0;
    }).filter(s => s > 0);
    
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

function getLetterGrade(avg) {
    if (avg >= 90) return 'A*';
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    if (avg >= 50) return 'D';
    return 'F';
}

function loadAssessments() {
    switchAssessmentTab('pending');
}

function switchAssessmentTab(tab) {
    currentAssessmentTab = tab;
    document.getElementById('pendingTab').className = tab === 'pending' ? 'btn btn-primary' : 'btn btn-secondary';
    document.getElementById('completedTab').className = tab === 'completed' ? 'btn btn-primary' : 'btn btn-secondary';
    
    const tutorData = getTutorData();
    const assessments = tutorData?.assessments || [];
    const grades = tutorData?.grades?.filter(g => g.studentId === studentId) || [];
    
    let filtered;
    if (tab === 'pending') {
        filtered = assessments.filter(a => !grades.find(g => g.assessmentId === a.id));
    } else {
        filtered = assessments.filter(a => grades.find(g => g.assessmentId === a.id));
    }
    
    const container = document.getElementById('assessmentsContent');
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-state">No ${tab} assessments</p>`;
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Due Date</th>
                    <th>Total Marks</th>
                    ${tab === 'completed' ? '<th>Score</th><th>Grade</th>' : '<th>Status</th>'}
                </tr>
            </thead>
            <tbody>
                ${filtered.map(a => {
                    const grade = grades.find(g => g.assessmentId === a.id);
                    const score = grade ? (grade.score / a.totalMarks * 100) : 0;
                    const letterGrade = getLetterGrade(score);
                    
                    return `
                        <tr>
                            <td><strong>${a.title}</strong></td>
                            <td>${a.subject}</td>
                            <td>${a.type}</td>
                            <td>${new Date(a.dueDate).toLocaleDateString()}</td>
                            <td>${a.totalMarks}</td>
                            ${tab === 'completed' 
                                ? `<td><strong>${grade.score}/${a.totalMarks}</strong></td>
                                   <td><span class="grade-badge grade-${letterGrade.charAt(0)}">${letterGrade}</span></td>`
                                : '<td><span class="grade-badge" style="background: #FEF3C7; color: #92400E;">Pending</span></td>'}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function loadMaterials() {
    const tutorData = getTutorData();
    const materials = tutorData?.materials || [];
    const container = document.getElementById('materialsGrid');
    
    if (materials.length === 0) {
        container.innerHTML = '<p class="empty-state">No materials available yet</p>';
        return;
    }
    
    container.innerHTML = materials.map(m => `
        <div class="card" style="padding: 1.5rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">${m.type === 'notes' ? '📄' : '🎥'}</div>
            <h4>${m.title}</h4>
            <p style="color: var(--gray); margin: 0.5rem 0;">${m.subject}</p>
            <p style="color: var(--gray); font-size: 0.875rem; margin-bottom: 1rem;">${m.topic}</p>
            <a href="${m.url}" target="_blank" class="btn btn-primary btn-small" style="width: 100%;">
                ${m.type === 'notes' ? '📥 Download' : '▶️ Watch'}
            </a>
        </div>
    `).join('');
}

function submitComplaint() {
    const complaint = {
        id: generateId('COMP'),
        studentId: studentId,
        studentName: currentStudent.name,
        type: document.getElementById('complaintType').value,
        subject: document.getElementById('complaintSubject').value,
        description: document.getElementById('complaintDesc').value,
        status: 'pending',
        confidential: true,
        date: new Date().toISOString()
    };
    
    const data = MindBridgeData.getData();
    if (!data.complaints) data.complaints = [];
    data.complaints.push(complaint);
    MindBridgeData.saveData(data);
    
    alert('✅ Complaint submitted successfully!\n\nYour complaint has been sent directly to admin.\nIt is completely confidential - tutors will NOT see it.\n\nReference: ' + complaint.id);
    
    document.getElementById('complaintForm').reset();
    loadComplaintHistory();
}

function submitEnquiry() {
    const enquiry = {
        id: generateId('ENQ'),
        studentId: studentId,
        studentName: currentStudent.name,
        message: document.getElementById('enquiryText').value,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    const data = MindBridgeData.getData();
    if (!data.enquiries) data.enquiries = [];
    data.enquiries.push(enquiry);
    MindBridgeData.saveData(data);
    
    alert('✅ Enquiry sent to customer service!\n\nWe will respond within 24 hours.\n\nReference: ' + enquiry.id);
    
    document.getElementById('enquiryForm').reset();
}

function loadComplaintHistory() {
    const data = MindBridgeData.getData();
    const complaints = (data.complaints || []).filter(c => c.studentId === studentId);
    const enquiries = (data.enquiries || []).filter(e => e.studentId === studentId);
    
    const all = [...complaints, ...enquiries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('complaintHistory');
    
    if (all.length === 0) {
        container.innerHTML = '<p class="empty-state">No complaints or enquiries yet</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Subject/Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Response</th>
                </tr>
            </thead>
            <tbody>
                ${all.map(item => `
                    <tr>
                        <td>${item.type ? '📢 Complaint' : '💬 Enquiry'}</td>
                        <td>${item.subject || item.message?.substring(0, 50) + '...'}</td>
                        <td>${new Date(item.date).toLocaleDateString()}</td>
                        <td><span class="grade-badge ${item.status === 'resolved' ? 'grade-A' : 'grade-C'}">${item.status}</span></td>
                        <td>${item.response || 'Pending'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadSettings() {
    document.getElementById('settingName').value = currentStudent.name;
    document.getElementById('settingId').value = studentId;
    document.getElementById('settingEmail').value = currentStudent.email;
    document.getElementById('settingGrade').value = currentStudent.gradeLevel || 'Year 7';
}

function updateSettings() {
    const newPassword = document.getElementById('settingPassword').value;
    
    if (newPassword && newPassword.length >= 6) {
        currentStudent.password = newPassword;
        
        const data = MindBridgeData.getData();
        const index = data.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            data.students[index] = currentStudent;
            MindBridgeData.saveData(data);
        }
        
        alert('✅ Password updated successfully!');
        document.getElementById('settingPassword').value = '';
    } else if (newPassword) {
        alert('Password must be at least 6 characters');
    }
}

function showComplaintModal() {
    document.getElementById('complaintModal').style.display = 'flex';
}

function closeComplaintModal() {
    document.getElementById('complaintModal').style.display = 'none';
}

function getTutorData() {
    const data = MindBridgeData.getData();
    if (!data.tutors) return null;
    
    // Get first available tutor (in real system, would be assigned tutor)
    const tutorIds = Object.keys(data.tutors);
    return tutorIds.length > 0 ? data.tutors[tutorIds[0]] : null;
}

function generateId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'mindbridge-home.html';
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('complaintModal');
    if (event.target === modal) {
        closeComplaintModal();
    }
}

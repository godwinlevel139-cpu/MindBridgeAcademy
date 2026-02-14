// Tutor System - Complete Implementation

// Check if user is logged in as tutor
if (!sessionStorage.getItem('userType') || sessionStorage.getItem('userType') !== 'tutor') {
    window.location.href = 'mindbridge-index.html';
}

const tutorId = sessionStorage.getItem('userId');
const tutorName = sessionStorage.getItem('userName');
const tutorSubjects = JSON.parse(sessionStorage.getItem('tutorSubjects') || '[]');

// European and Asian High School Grade Levels
const gradeLevels = {
    european: [
        'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', // Lower Secondary
        'Year 12', 'Year 13' // Upper Secondary
    ],
    asian: [
        'Grade 7', 'Grade 8', 'Grade 9', // Junior High
        'Grade 10', 'Grade 11', 'Grade 12' // Senior High
    ]
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadOverview();
    setupNavigation();
    populateSubjectSelects();
    loadAllSections();
});

function loadUserInfo() {
    document.getElementById('userName').textContent = tutorName;
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            document.getElementById(this.dataset.section + '-section').classList.add('active');
        });
    });
}

function populateSubjectSelects() {
    const selects = ['scheduleSubject', 'assessmentSubject', 'notesSubject', 'videosSubject', 'gradingSubject'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            tutorSubjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                select.appendChild(option);
            });
        }
    });
}

function loadOverview() {
    const tutor = getTutorData();
    const students = tutor.students || [];
    const schedule = tutor.schedule || [];
    const assessments = tutor.assessments || [];
    
    document.getElementById('totalStudents').textContent = students.length;
    
    // Count upcoming classes (today and future)
    const today = new Date().toISOString().split('T')[0];
    const upcoming = schedule.filter(s => s.date >= today).length;
    document.getElementById('upcomingClasses').textContent = upcoming;
    
    // Count pending grading
    const pending = assessments.filter(a => a.status === 'pending-grading').length;
    document.getElementById('pendingGrading').textContent = pending;
    
    // Average rating
    document.getElementById('avgRating').textContent = tutor.rating || '5.0';
    
    // Load today's schedule
    loadTodaySchedule();
}

function loadTodaySchedule() {
    const tutor = getTutorData();
    const schedule = tutor.schedule || [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayClasses = schedule.filter(s => s.day === today);
    const container = document.getElementById('todaySchedule');
    
    if (todayClasses.length === 0) {
        container.innerHTML = '<p class="empty-state">No classes scheduled for today</p>';
        return;
    }
    
    container.innerHTML = todayClasses.map(cls => `
        <div style="padding: 1rem; border-left: 3px solid var(--primary); background: var(--light); border-radius: 8px; margin-bottom: 1rem;">
            <h4>${cls.subject}</h4>
            <p>🕐 ${cls.startTime} - ${cls.endTime}</p>
            <p>📚 ${cls.type}</p>
            <button class="btn btn-primary btn-small" onclick="joinClass('${cls.id}')">Join Class</button>
        </div>
    `).join('');
}

function loadAllSections() {
    loadSchedule();
    loadStudents();
    loadUpcomingClasses();
    loadAssessments();
    loadGradingSheet();
    loadMaterials();
    loadSettings();
}

// Schedule Management
document.getElementById('scheduleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const day = document.getElementById('scheduleDay').value;
    const startTime = document.getElementById('scheduleStart').value;
    const duration = parseInt(document.getElementById('scheduleDuration').value);
    const subject = document.getElementById('scheduleSubject').value;
    const type = document.getElementById('classType').value;
    
    // Calculate end time
    const [hours, minutes] = startTime.split(':');
    const endHour = parseInt(hours) + Math.floor(duration / 60);
    const endMinute = parseInt(minutes) + (duration % 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Validate morning session
    if (endHour > 12) {
        alert('Classes must end by 12:00 PM (Morning sessions only)');
        return;
    }
    
    const schedule = {
        id: generateId('SCH'),
        day: day,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        subject: subject,
        type: type,
        tutorId: tutorId,
        active: true,
        conferenceLink: '',
        date: new Date().toISOString()
    };
    
    const tutor = getTutorData();
    if (!tutor.schedule) tutor.schedule = [];
    tutor.schedule.push(schedule);
    saveTutorData(tutor);
    
    alert('Schedule added successfully!');
    this.reset();
    loadSchedule();
    loadOverview();
});

function loadSchedule() {
    const tutor = getTutorData();
    const schedule = tutor.schedule || [];
    const container = document.getElementById('scheduleList');
    
    if (schedule.length === 0) {
        container.innerHTML = '<p class="empty-state">No schedule set. Add your availability above.</p>';
        return;
    }
    
    // Group by day
    const grouped = {};
    schedule.forEach(s => {
        if (!grouped[s.day]) grouped[s.day] = [];
        grouped[s.day].push(s);
    });
    
    container.innerHTML = Object.keys(grouped).map(day => `
        <div style="margin-bottom: 2rem;">
            <h4 style="color: var(--primary); margin-bottom: 1rem;">${day}</h4>
            ${grouped[day].map(s => `
                <div style="background: var(--light); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border-left: 4px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h5 style="margin-bottom: 0.5rem;">${s.subject}</h5>
                            <p style="color: var(--gray); margin-bottom: 0.25rem;">🕐 ${s.startTime} - ${s.endTime} (${s.duration} mins)</p>
                            <p style="color: var(--gray);">📚 ${s.type}</p>
                        </div>
                        <button class="btn btn-danger btn-small" onclick="deleteSchedule('${s.id}')">Delete</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function deleteSchedule(id) {
    if (!confirm('Delete this schedule?')) return;
    
    const tutor = getTutorData();
    tutor.schedule = tutor.schedule.filter(s => s.id !== id);
    saveTutorData(tutor);
    loadSchedule();
    alert('Schedule deleted!');
}

// Students Management
function loadStudents() {
    const tutor = getTutorData();
    const students = tutor.students || [];
    const container = document.getElementById('studentsList');
    
    if (students.length === 0) {
        container.innerHTML = '<p class="empty-state">No students assigned yet. Admin will assign students to you.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Grade Level</th>
                    <th>Program</th>
                    <th>Performance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td><strong>${s.name}</strong></td>
                        <td style="font-family: monospace;">${s.studentId}</td>
                        <td>${s.gradeLevel || 'Not Set'}</td>
                        <td>${s.program || 'N/A'}</td>
                        <td>${s.avgScore || 'N/A'}%</td>
                        <td>
                            <button class="btn btn-secondary btn-small" onclick="viewStudentDetails('${s.studentId}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function viewStudentDetails(studentId) {
    alert(`Student details for ${studentId}\n\nFull student profile will be displayed here.`);
}

// Live Classes
function loadUpcomingClasses() {
    const tutor = getTutorData();
    const schedule = tutor.schedule || [];
    const container = document.getElementById('upcomingClassesList');
    
    if (schedule.length === 0) {
        container.innerHTML = '<p class="empty-state">No scheduled classes</p>';
        return;
    }
    
    container.innerHTML = schedule.map(cls => `
        <div style="background: var(--light); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
            <h4>${cls.subject} - ${cls.type}</h4>
            <p>📅 ${cls.day}</p>
            <p>🕐 ${cls.startTime} - ${cls.endTime}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-primary btn-small" onclick="startConference('${cls.id}')">🎥 Start Conference</button>
                <button class="btn btn-secondary btn-small" onclick="copyClassLink('${cls.id}')">📋 Copy Link</button>
            </div>
        </div>
    `).join('');
}

function startConference(classId) {
    // This would integrate with Zoom, Google Meet, etc.
    const conferenceLink = `https://meet.mindbridge.edu/class/${classId}`;
    alert(`Conference Link Generated:\n\n${conferenceLink}\n\nThis link will be shared with students automatically.\n\nIn production, this would integrate with:\n• Zoom API\n• Google Meet\n• Microsoft Teams\n• Jitsi`);
    
    // Save conference link
    const tutor = getTutorData();
    const schedule = tutor.schedule.find(s => s.id === classId);
    if (schedule) {
        schedule.conferenceLink = conferenceLink;
        saveTutorData(tutor);
    }
}

function copyClassLink(classId) {
    const link = `https://meet.mindbridge.edu/class/${classId}`;
    navigator.clipboard.writeText(link);
    alert('Class link copied to clipboard!');
}

function joinClass(classId) {
    startConference(classId);
}

// Assessments
document.getElementById('assessmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const assessment = {
        id: generateId('ASS'),
        title: document.getElementById('assessmentTitle').value,
        subject: document.getElementById('assessmentSubject').value,
        type: document.getElementById('assessmentType').value,
        totalMarks: parseInt(document.getElementById('assessmentMarks').value),
        dueDate: document.getElementById('assessmentDue').value,
        instructions: document.getElementById('assessmentInstructions').value,
        tutorId: tutorId,
        status: 'active',
        createdDate: new Date().toISOString()
    };
    
    const tutor = getTutorData();
    if (!tutor.assessments) tutor.assessments = [];
    tutor.assessments.push(assessment);
    saveTutorData(tutor);
    
    alert('Assessment created successfully!');
    this.reset();
    loadAssessments();
});

function loadAssessments() {
    const tutor = getTutorData();
    const assessments = tutor.assessments || [];
    const container = document.getElementById('assessmentsList');
    
    if (assessments.length === 0) {
        container.innerHTML = '<p class="empty-state">No assessments created yet</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Total Marks</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${assessments.map(a => `
                    <tr>
                        <td><strong>${a.title}</strong></td>
                        <td>${a.subject}</td>
                        <td>${a.type}</td>
                        <td>${a.totalMarks}</td>
                        <td>${new Date(a.dueDate).toLocaleDateString()}</td>
                        <td><span class="grade-badge grade-A">${a.status}</span></td>
                        <td>
                            <button class="btn btn-secondary btn-small" onclick="viewAssessment('${a.id}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Populate grading dropdown
    const gradingSelect = document.getElementById('gradingAssessment');
    gradingSelect.innerHTML = '<option value="">All Assessments</option>' + 
        assessments.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
}

function viewAssessment(id) {
    const tutor = getTutorData();
    const assessment = tutor.assessments.find(a => a.id === id);
    if (assessment) {
        alert(`Assessment: ${assessment.title}\n\nSubject: ${assessment.subject}\nType: ${assessment.type}\nMarks: ${assessment.totalMarks}\n\nInstructions:\n${assessment.instructions}`);
    }
}

// Grading Spreadsheet
function loadGradingSheet() {
    const tutor = getTutorData();
    const students = tutor.students || [];
    const assessments = tutor.assessments || [];
    
    if (students.length === 0 || assessments.length === 0) {
        document.getElementById('gradingSpreadsheet').innerHTML = 
            '<p class="empty-state">No students or assessments available for grading</p>';
        return;
    }
    
    const container = document.getElementById('gradingSpreadsheet');
    
    container.innerHTML = `
        <table class="data-table" style="min-width: 800px;">
            <thead>
                <tr>
                    <th style="position: sticky; left: 0; background: white; z-index: 10;">Student Name</th>
                    <th>Student ID</th>
                    ${assessments.map(a => `<th>${a.title}<br><small>(${a.totalMarks})</small></th>`).join('')}
                    <th>Average</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(student => {
                    const grades = assessments.map(assessment => {
                        const grade = getStudentGrade(student.studentId, assessment.id);
                        return {
                            score: grade?.score || 0,
                            total: assessment.totalMarks
                        };
                    });
                    
                    const avg = grades.length > 0 
                        ? (grades.reduce((sum, g) => sum + (g.score / g.total * 100), 0) / grades.length).toFixed(1)
                        : 0;
                    
                    return `
                        <tr>
                            <td style="position: sticky; left: 0; background: white;"><strong>${student.name}</strong></td>
                            <td style="font-family: monospace;">${student.studentId}</td>
                            ${assessments.map(a => `
                                <td>
                                    <input type="number" 
                                           min="0" 
                                           max="${a.totalMarks}" 
                                           value="${getStudentGrade(student.studentId, a.id)?.score || ''}"
                                           data-student="${student.studentId}"
                                           data-assessment="${a.id}"
                                           style="width: 80px; padding: 0.5rem; border: 2px solid var(--border); border-radius: 6px;"
                                           placeholder="0">
                                </td>
                            `).join('')}
                            <td><strong>${avg}%</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getStudentGrade(studentId, assessmentId) {
    const tutor = getTutorData();
    if (!tutor.grades) tutor.grades = [];
    return tutor.grades.find(g => g.studentId === studentId && g.assessmentId === assessmentId);
}

function saveGrades() {
    const tutor = getTutorData();
    if (!tutor.grades) tutor.grades = [];
    
    const inputs = document.querySelectorAll('#gradingSpreadsheet input[data-student]');
    let saved = 0;
    
    inputs.forEach(input => {
        const studentId = input.dataset.student;
        const assessmentId = input.dataset.assessment;
        const score = parseFloat(input.value) || 0;
        
        if (score > 0) {
            const existingIndex = tutor.grades.findIndex(g => 
                g.studentId === studentId && g.assessmentId === assessmentId
            );
            
            const grade = {
                studentId: studentId,
                assessmentId: assessmentId,
                score: score,
                tutorId: tutorId,
                date: new Date().toISOString()
            };
            
            if (existingIndex >= 0) {
                tutor.grades[existingIndex] = grade;
            } else {
                tutor.grades.push(grade);
            }
            saved++;
        }
    });
    
    saveTutorData(tutor);
    alert(`${saved} grades saved successfully!`);
    loadGradingSheet();
}

// Generate Semester Results
function generateSemesterResults() {
    const tutor = getTutorData();
    const students = tutor.students || [];
    const assessments = tutor.assessments || [];
    
    if (!tutor.grades || tutor.grades.length === 0) {
        alert('No grades available to generate results!');
        return;
    }
    
    const results = students.map(student => {
        const studentGrades = tutor.grades.filter(g => g.studentId === student.studentId);
        
        const scores = studentGrades.map(grade => {
            const assessment = assessments.find(a => a.id === grade.assessmentId);
            return assessment ? (grade.score / assessment.totalMarks * 100) : 0;
        });
        
        const average = scores.length > 0 
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
            : 0;
        
        // European/Asian grading
        let letterGrade, remark;
        if (average >= 90) { letterGrade = 'A*'; remark = 'Outstanding'; }
        else if (average >= 80) { letterGrade = 'A'; remark = 'Excellent'; }
        else if (average >= 70) { letterGrade = 'B'; remark = 'Very Good'; }
        else if (average >= 60) { letterGrade = 'C'; remark = 'Good'; }
        else if (average >= 50) { letterGrade = 'D'; remark = 'Satisfactory'; }
        else { letterGrade = 'F'; remark = 'Needs Improvement'; }
        
        // Determine if student advances
        const canAdvance = average >= 50 && studentGrades.length >= assessments.length / 2;
        
        return {
            studentId: student.studentId,
            studentName: student.name,
            average: average.toFixed(2),
            letterGrade: letterGrade,
            remark: remark,
            totalAssessments: assessments.length,
            completedAssessments: studentGrades.length,
            canAdvance: canAdvance
        };
    });
    
    // Save semester results
    if (!tutor.semesterResults) tutor.semesterResults = [];
    tutor.semesterResults.push({
        id: generateId('RES'),
        semester: getCurrentSemester(),
        date: new Date().toISOString(),
        results: results
    });
    
    saveTutorData(tutor);
    
    // Display results
    displaySemesterResults(results);
}

function displaySemesterResults(results) {
    const html = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem;">
            <div style="background: white; border-radius: 20px; padding: 3rem; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 2rem;">📊 Semester Results Generated</h2>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Average</th>
                            <th>Grade</th>
                            <th>Remark</th>
                            <th>Assessments</th>
                            <th>Advancement</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(r => `
                            <tr>
                                <td><strong>${r.studentName}</strong></td>
                                <td>${r.average}%</td>
                                <td><span class="grade-badge grade-${r.letterGrade[0]}">${r.letterGrade}</span></td>
                                <td>${r.remark}</td>
                                <td>${r.completedAssessments}/${r.totalAssessments}</td>
                                <td>
                                    ${r.canAdvance 
                                        ? '<span style="color: var(--success);">✓ Advance</span>' 
                                        : '<span style="color: var(--danger);">✗ Repeat</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 2rem; padding: 1rem; background: #dbeafe; border-radius: 12px;">
                    <p><strong>Note:</strong> Students need 50%+ average and completion of at least half the assessments to advance.</p>
                    <p style="margin-top: 0.5rem;">After 2 successful semesters, students advance to the next grade level.</p>
                </div>
                <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-primary" style="width: 100%; margin-top: 2rem;">Close</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// Course Materials
document.getElementById('uploadNotesForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const note = {
        id: generateId('NOTE'),
        subject: document.getElementById('notesSubject').value,
        title: document.getElementById('notesTitle').value,
        topic: document.getElementById('notesTopic').value,
        url: document.getElementById('notesUrl').value,
        tutorId: tutorId,
        type: 'notes',
        date: new Date().toISOString()
    };
    
    const tutor = getTutorData();
    if (!tutor.materials) tutor.materials = [];
    tutor.materials.push(note);
    saveTutorData(tutor);
    
    alert('Notes uploaded successfully!');
    this.reset();
    loadMaterials();
});

document.getElementById('uploadVideosForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const video = {
        id: generateId('VID'),
        subject: document.getElementById('videosSubject').value,
        title: document.getElementById('videosTitle').value,
        topic: document.getElementById('videosTopic').value,
        url: document.getElementById('videosUrl').value,
        tutorId: tutorId,
        type: 'video',
        date: new Date().toISOString()
    };
    
    const tutor = getTutorData();
    if (!tutor.materials) tutor.materials = [];
    tutor.materials.push(video);
    saveTutorData(tutor);
    
    alert('Video uploaded successfully!');
    this.reset();
    loadMaterials();
});

function loadMaterials() {
    const tutor = getTutorData();
    const materials = tutor.materials || [];
    const container = document.getElementById('materialsList');
    
    if (materials.length === 0) {
        container.innerHTML = '<p class="empty-state">No materials uploaded yet</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Title</th>
                    <th>Topic</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${materials.map(m => `
                    <tr>
                        <td>${m.type === 'notes' ? '📄' : '🎥'} ${m.type}</td>
                        <td>${m.subject}</td>
                        <td><strong>${m.title}</strong></td>
                        <td>${m.topic}</td>
                        <td>${new Date(m.date).toLocaleDateString()}</td>
                        <td>
                            <a href="${m.url}" target="_blank" class="btn btn-secondary btn-small">View</a>
                            <button class="btn btn-danger btn-small" onclick="deleteMaterial('${m.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteMaterial(id) {
    if (!confirm('Delete this material?')) return;
    
    const tutor = getTutorData();
    tutor.materials = tutor.materials.filter(m => m.id !== id);
    saveTutorData(tutor);
    loadMaterials();
    alert('Material deleted!');
}

// Settings
function loadSettings() {
    const tutor = getTutorData();
    
    document.getElementById('settingName').value = tutor.name;
    document.getElementById('settingEmail').value = tutor.email;
    document.getElementById('settingSubjects').value = tutorSubjects.join(', ');
    document.getElementById('settingBio').value = tutor.bio || '';
    document.getElementById('settingQualification').value = tutor.qualification || '';
    document.getElementById('settingExperience').value = tutor.experience || '';
}

document.getElementById('tutorSettingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const tutor = getTutorData();
    tutor.bio = document.getElementById('settingBio').value;
    tutor.qualification = document.getElementById('settingQualification').value;
    tutor.experience = document.getElementById('settingExperience').value;
    
    saveTutorData(tutor);
    alert('Profile updated successfully!');
});

// Helper Functions
function getTutorData() {
    const data = MindBridgeData.getData();
    if (!data.tutors) data.tutors = {};
    if (!data.tutors[tutorId]) {
        data.tutors[tutorId] = {
            id: tutorId,
            name: tutorName,
            email: sessionStorage.getItem('tutorEmail'),
            subjects: tutorSubjects,
            schedule: [],
            students: [],
            assessments: [],
            grades: [],
            materials: [],
            semesterResults: [],
            rating: 5.0,
            status: 'active'
        };
    }
    return data.tutors[tutorId];
}

function saveTutorData(tutorData) {
    const data = MindBridgeData.getData();
    if (!data.tutors) data.tutors = {};
    data.tutors[tutorId] = tutorData;
    MindBridgeData.saveData(data);
}

function generateId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

function getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month <= 6 ? `Spring ${year}` : `Fall ${year}`;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'mindbridge-index.html';
    }
}


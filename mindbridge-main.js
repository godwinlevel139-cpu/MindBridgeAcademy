// Mindbridge Main JavaScript

// Modal functions
function showRegistrationModal() {
    document.getElementById('registrationModal').classList.add('active');
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    hideAlert();
    hideLoginAlert();
}

// Alert functions
function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert ${type} active`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
    const alertBox = document.getElementById('alertBox');
    alertBox.classList.remove('active');
}

function showLoginAlert(message, type) {
    const alertBox = document.getElementById('loginAlertBox');
    alertBox.textContent = message;
    alertBox.className = `alert ${type} active`;
}

function hideLoginAlert() {
    const alertBox = document.getElementById('loginAlertBox');
    alertBox.classList.remove('active');
}

// Update program options based on selection
function updateProgramOptions() {
    const programType = document.getElementById('programType').value;
    
    // Hide all conditional sections
    document.getElementById('specialEdSection').style.display = 'none';
    document.getElementById('singleExtraSection').style.display = 'none';
    document.getElementById('extraCoursesSection').style.display = 'none';
    document.getElementById('feeSummary').style.display = 'none';
    
    // Clear selections
    document.getElementById('specialEdType').value = '';
    document.getElementById('singleExtraCourse').value = '';
    document.querySelectorAll('input[name="extraCourse"]').forEach(cb => cb.checked = false);
    
    // Show relevant sections
    if (programType === 'special-only') {
        document.getElementById('specialEdSection').style.display = 'block';
        document.getElementById('specialEdSection').querySelector('select').required = true;
        updateFeeSummary(100, 'Special Education', 0);
    } else if (programType === 'core-only') {
        updateFeeSummary(150, 'High School Core', 0);
    } else if (programType === 'single-extra') {
        document.getElementById('singleExtraSection').style.display = 'block';
        document.getElementById('singleExtraCourse').required = true;
        updateFeeSummary(150, 'Single Extra Course', 0);
    } else if (programType === 'core-plus') {
        document.getElementById('extraCoursesSection').style.display = 'block';
        updateFeeSummary(150, 'High School Core', 0);
    }
}

// Calculate and update fees
function calculateFees() {
    const programType = document.getElementById('programType').value;
    
    if (programType === 'core-plus') {
        const checkedBoxes = document.querySelectorAll('input[name="extraCourse"]:checked');
        
        if (checkedBoxes.length > 2) {
            checkedBoxes[checkedBoxes.length - 1].checked = false;
            showAlert('You can only select up to 2 extra courses', 'error');
            setTimeout(hideAlert, 3000);
            return;
        }
        
        let baseFee = 150;
        let extraFee = 0;
        
        if (checkedBoxes.length === 1) {
            baseFee = 200;
            extraFee = 50;
        } else if (checkedBoxes.length === 2) {
            baseFee = 235;
            extraFee = 85;
        }
        
        updateFeeSummary(baseFee, 'High School Core', extraFee);
    }
}

// Update fee summary display
function updateFeeSummary(total, programName, extraFee) {
    const feeSummary = document.getElementById('feeSummary');
    feeSummary.style.display = 'block';
    
    const programFeeEl = document.getElementById('programFee');
    const extraFeeRow = document.getElementById('extraFeeRow');
    const extraFeeEl = document.getElementById('extraFee');
    const totalFeeEl = document.getElementById('totalFee');
    
    if (extraFee > 0) {
        programFeeEl.textContent = '$150';
        extraFeeRow.style.display = 'flex';
        extraFeeEl.textContent = '$' + extraFee;
        totalFeeEl.textContent = '$' + total;
    } else {
        programFeeEl.textContent = '$' + total;
        extraFeeRow.style.display = 'none';
        totalFeeEl.textContent = '$' + total;
    }
}

// Enrollment Form Submission
document.getElementById('enrollmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const studentName = document.getElementById('studentName').value;
    const studentEmail = document.getElementById('studentEmail').value;
    const studentPhone = document.getElementById('studentPhone').value;
    const studentDOB = document.getElementById('studentDOB').value;
    const programType = document.getElementById('programType').value;
    const parentName = document.getElementById('parentName').value;
    const parentEmail = document.getElementById('parentEmail').value;
    const parentPhone = document.getElementById('parentPhone').value;
    
    // Validate program-specific fields
    if (!programType) {
        showAlert('Please select a program', 'error');
        return;
    }
    
    let programDetails = {};
    let totalFee = 0;
    
    if (programType === 'special-only') {
        const specialEdType = document.getElementById('specialEdType').value;
        if (!specialEdType) {
            showAlert('Please select a Special Education category', 'error');
            return;
        }
        programDetails = {
            type: 'special-only',
            category: specialEdType
        };
        totalFee = 100;
    } else if (programType === 'core-only') {
        programDetails = {
            type: 'core-only'
        };
        totalFee = 150;
    } else if (programType === 'single-extra') {
        const singleExtra = document.getElementById('singleExtraCourse').value;
        if (!singleExtra) {
            showAlert('Please select an extra course', 'error');
            return;
        }
        programDetails = {
            type: 'single-extra',
            course: singleExtra
        };
        totalFee = 150;
    } else if (programType === 'core-plus') {
        const extraCourses = Array.from(document.querySelectorAll('input[name="extraCourse"]:checked'))
            .map(cb => cb.value);
        
        if (extraCourses.length === 0) {
            showAlert('Please select at least 1 extra course', 'error');
            return;
        }
        
        programDetails = {
            type: 'core-plus',
            extraCourses: extraCourses
        };
        
        totalFee = extraCourses.length === 1 ? 200 : 235;
    }
    
    // Check if email already exists
    const existingStudent = MindBridgeData.getStudentByEmail(studentEmail);
    if (existingStudent) {
        showAlert('A student with this email is already enrolled. Please use a different email or login.', 'error');
        return;
    }
    
    // Generate student ID
    const studentId = MindBridgeData.generateId('MB');
    
    // Create student record
    const newStudent = {
        id: studentId,
        name: studentName,
        email: studentEmail,
        phone: studentPhone,
        dateOfBirth: studentDOB,
        parentName: parentName,
        parentEmail: parentEmail,
        parentPhone: parentPhone,
        enrollmentDate: new Date().toISOString(),
        status: 'active'
    };
    
    // Create enrollment record
    const enrollment = {
        id: MindBridgeData.generateId('ENR'),
        studentId: studentId,
        programType: programDetails.type,
        programDetails: programDetails,
        totalFee: totalFee,
        semester: MindBridgeData.settings.currentSemester,
        startDate: new Date().toISOString(),
        status: 'pending-payment'
    };
    
    // Save to database
    MindBridgeData.addStudent(newStudent);
    MindBridgeData.addEnrollment(enrollment);
    
    // Show payment page
    showPaymentPage(newStudent, enrollment);
});

// Show payment page
function showPaymentPage(student, enrollment) {
    const modalContent = document.querySelector('#registrationModal .modal-content');
    
    modalContent.innerHTML = `
        <button class="close-modal" onclick="closeModal('registrationModal')">&times;</button>
        
        <div class="modal-header">
            <h2>💳 Payment Information</h2>
            <p style="color: var(--gray);">Complete your enrollment</p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1)); padding: 2rem; border-radius: 15px; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">Enrollment Summary</h3>
            <p><strong>Student:</strong> ${student.name}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Student ID:</strong> ${student.id}</p>
            <p><strong>Program:</strong> ${getProgramName(enrollment.programDetails)}</p>
            <p><strong>Semester:</strong> ${enrollment.semester}</p>
            <p style="font-size: 2rem; color: var(--primary); margin-top: 1rem;"><strong>Total: $${enrollment.totalFee}</strong></p>
        </div>
        
        <div style="background: #fef3c7; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 2px solid #f59e0b;">
            <h4 style="margin-bottom: 0.5rem;">💡 Payment Instructions</h4>
            <p style="font-size: 0.95rem; color: #92400e;">
                This is a demo system. In production, you would integrate a payment gateway like Stripe or PayPal here.
                For now, clicking "Complete Payment" will simulate a successful payment.
            </p>
        </div>
        
        <div style="border: 2px solid var(--border); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem;">Payment Details</h4>
            <p style="margin-bottom: 0.5rem;"><strong>Amount Due:</strong> $${enrollment.totalFee}</p>
            <p style="margin-bottom: 0.5rem;"><strong>Payment Method:</strong> Credit/Debit Card, PayPal, Bank Transfer</p>
            <p style="margin-bottom: 0.5rem;"><strong>Secure:</strong> All payments are encrypted and secure</p>
        </div>
        
        <button onclick="processPayment('${student.id}', '${enrollment.id}', ${enrollment.totalFee})" class="btn btn-primary" style="width: 100%; padding: 1.25rem; font-size: 1.125rem;">
            Complete Payment - $${enrollment.totalFee}
        </button>
        
        <p style="text-align: center; margin-top: 1rem; color: var(--gray); font-size: 0.9rem;">
            Your enrollment will be confirmed immediately after payment
        </p>
    `;
}

// Get program name for display
function getProgramName(programDetails) {
    switch(programDetails.type) {
        case 'special-only':
            return `Special Education (${programDetails.category})`;
        case 'core-only':
            return 'High School Core Subjects';
        case 'single-extra':
            return `${programDetails.course.replace('-', ' ')} (Single Course)`;
        case 'core-plus':
            return `High School Core + ${programDetails.extraCourses.length} Extra Course(s)`;
        default:
            return 'Unknown Program';
    }
}

// Process payment
function processPayment(studentId, enrollmentId, amount) {
    // Simulate payment processing
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Processing Payment...';
    
    setTimeout(() => {
        // Create payment record
        const payment = {
            id: MindBridgeData.generateId('PAY'),
            studentId: studentId,
            enrollmentId: enrollmentId,
            amount: amount,
            paymentMethod: 'Demo Payment',
            status: 'completed',
            transactionId: 'TXN-' + Date.now(),
            date: new Date().toISOString()
        };
        
        MindBridgeData.addPayment(payment);
        
        // Update enrollment status
        const data = MindBridgeData.getData();
        const enrollment = data.enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
            enrollment.status = 'active';
            enrollment.paymentId = payment.id;
            MindBridgeData.saveData(data);
        }
        
        // Show success message
        showSuccessPage(studentId);
    }, 2000);
}

// Show success page
function showSuccessPage(studentId) {
    const student = MindBridgeData.getStudentById(studentId);
    const enrollment = MindBridgeData.getEnrollmentsByStudentId(studentId)[0];
    
    const modalContent = document.querySelector('#registrationModal .modal-content');
    
    modalContent.innerHTML = `
        <button class="close-modal" onclick="closeModal('registrationModal'); location.reload();">&times;</button>
        
        <div style="text-align: center; padding: 2rem 0;">
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, var(--success), #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; font-size: 3rem;">
                ✓
            </div>
            
            <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 1rem; color: var(--success);">
                Enrollment Successful!
            </h2>
            
            <p style="font-size: 1.125rem; color: var(--gray); margin-bottom: 2rem;">
                Welcome to Mindbridge Online School
            </p>
        </div>
        
        <div style="background: var(--light); padding: 2rem; border-radius: 15px; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1.5rem; text-align: center;">Your Enrollment Details</h3>
            
            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <strong>Student Name:</strong>
                    <span>${student.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <strong>Student ID:</strong>
                    <span style="font-family: monospace; background: white; padding: 0.25rem 0.75rem; border-radius: 6px;">${student.id}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <strong>Email:</strong>
                    <span>${student.email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <strong>Program:</strong>
                    <span>${getProgramName(enrollment.programDetails)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                    <strong>Amount Paid:</strong>
                    <span style="color: var(--success); font-size: 1.25rem; font-weight: 700;">$${enrollment.totalFee}</span>
                </div>
            </div>
        </div>
        
        <div style="background: #dbeafe; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 2px solid #3b82f6;">
            <h4 style="margin-bottom: 1rem; color: #1e40af;">📧 Important: Check Your Email</h4>
            <p style="color: #1e3a8a; font-size: 0.95rem;">
                We've sent a confirmation email to <strong>${student.email}</strong> with:
            </p>
            <ul style="margin-top: 0.75rem; margin-left: 1.5rem; color: #1e3a8a;">
                <li>Your login credentials</li>
                <li>Course access instructions</li>
                <li>Payment receipt</li>
                <li>Getting started guide</li>
            </ul>
        </div>
        
        <div style="display: grid; gap: 1rem;">
            <button onclick="window.location.href='student-dashboard.html?id=${student.id}'" class="btn btn-primary" style="width: 100%; padding: 1.25rem;">
                Access Student Dashboard
            </button>
            <button onclick="closeModal('registrationModal'); location.reload();" class="btn btn-outline" style="width: 100%; padding: 1.25rem;">
                Close
            </button>
        </div>
        
        <p style="text-align: center; margin-top: 1.5rem; color: var(--gray); font-size: 0.9rem;">
            Questions? Contact us at info@mindbridge.edu
        </p>
    `;
}

// Login Form Submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const studentId = document.getElementById('loginStudentId').value;
    
    const student = MindBridgeData.students.find(s => 
        s.email.toLowerCase() === email.toLowerCase() && 
        s.id === studentId
    );
    
    if (student) {
        window.location.href = `student-dashboard.html?id=${student.id}`;
    } else {
        showLoginAlert('Invalid email or Student ID. Please check your credentials.', 'error');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}


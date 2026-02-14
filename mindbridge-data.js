// Mindbridge Online School Data Management

const MindBridgeData = {
    init() {
        if (!localStorage.getItem('mindbridgeData')) {
            const defaultData = {
                students: [],
                enrollments: [],
                payments: [],
                courses: [
                    {
                        id: 'high-school',
                        name: 'High School Subjects',
                        description: 'Complete high school curriculum',
                        price: 150,
                        duration: '3 months',
                        subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'History', 'Geography', 'Literature']
                    },
                    {
                        id: 'ai',
                        name: 'Artificial Intelligence',
                        description: 'Learn AI fundamentals and applications',
                        price: 150,
                        duration: '3 months',
                        isExtra: true
                    },
                    {
                        id: 'digital-marketing',
                        name: 'Digital Marketing',
                        description: 'Master modern marketing strategies',
                        price: 150,
                        duration: '3 months',
                        isExtra: true
                    },
                    {
                        id: 'educational-coaching',
                        name: 'Educational Coaching',
                        description: 'Develop effective learning strategies',
                        price: 150,
                        duration: '3 months',
                        isExtra: true
                    },
                    {
                        id: 'special-education',
                        name: 'Special Education',
                        description: 'Specialized learning programs',
                        price: 100,
                        duration: '3 months',
                        categories: [
                            'Learning Disabilities Support',
                            'Autism Spectrum Disorder Programs',
                            'ADHD/ADD Management',
                            'Emotional & Behavioral Support'
                        ]
                    }
                ],
                settings: {
                    schoolName: 'Mindbridge Online School',
                    email: 'info@mindbridge.edu',
                    phone: '+1 (555) 123-4567',
                    currentSemester: 'Spring 2026',
                    semesterDuration: '3 months'
                }
            };
            
            localStorage.setItem('mindbridgeData', JSON.stringify(defaultData));
        }
    },
    
    getData() {
        return JSON.parse(localStorage.getItem('mindbridgeData'));
    },
    
    saveData(data) {
        localStorage.setItem('mindbridgeData', JSON.stringify(data));
    },
    
    get students() {
        return this.getData().students;
    },
    
    get enrollments() {
        return this.getData().enrollments;
    },
    
    get payments() {
        return this.getData().payments;
    },
    
    get courses() {
        return this.getData().courses;
    },
    
    get settings() {
        return this.getData().settings;
    },
    
    addStudent(student) {
        const data = this.getData();
        data.students.push(student);
        this.saveData(data);
    },
    
    addEnrollment(enrollment) {
        const data = this.getData();
        data.enrollments.push(enrollment);
        this.saveData(data);
    },
    
    addPayment(payment) {
        const data = this.getData();
        data.payments.push(payment);
        this.saveData(data);
    },
    
    getStudentById(id) {
        return this.students.find(s => s.id === id);
    },
    
    getStudentByEmail(email) {
        return this.students.find(s => s.email.toLowerCase() === email.toLowerCase());
    },
    
    getEnrollmentsByStudentId(studentId) {
        return this.enrollments.filter(e => e.studentId === studentId);
    },
    
    getPaymentsByStudentId(studentId) {
        return this.payments.filter(p => p.studentId === studentId);
    },
    
    generateId(prefix) {
        return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
    },
    
    calculateFee(programType, extraCourses = []) {
        let baseFee = 0;
        let breakdown = [];
        
        switch(programType) {
            case 'special-only':
                baseFee = 100;
                breakdown.push({ item: 'Special Education', amount: 100 });
                break;
            case 'core-only':
                baseFee = 150;
                breakdown.push({ item: 'High School Core', amount: 150 });
                break;
            case 'single-extra':
                baseFee = 150;
                breakdown.push({ item: 'Single Extra Course', amount: 150 });
                break;
            case 'core-plus':
                baseFee = 150;
                breakdown.push({ item: 'High School Core', amount: 150 });
                
                if (extraCourses.length === 1) {
                    baseFee = 200;
                    breakdown.push({ item: '1 Extra Course', amount: 50 });
                } else if (extraCourses.length === 2) {
                    baseFee = 235;
                    breakdown.push({ item: '2 Extra Courses', amount: 85 });
                }
                break;
        }
        
        return { total: baseFee, breakdown };
    }
};

// Initialize on load
MindBridgeData.init();

import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ================= CONFIG =================
app = Flask(__name__)

# Use environment variable for secret key (secure for production)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_change_in_production")

# Database configuration - PostgreSQL for production, SQLite for development
if os.environ.get("DATABASE_URL"):
    # Render provides DATABASE_URL, but we need to handle postgres:// vs postgresql://
    database_url = os.environ.get("DATABASE_URL")
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///students.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

db = SQLAlchemy(app)

# ================= ADMIN CREDENTIALS =================
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@mindbridge.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Strongadmin123")

# ================= DATABASE MODELS =================
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    courses = db.Column(db.String(500))
    total_fee = db.Column(db.Float, default=0.0)
    paid = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    attendance_records = db.relationship('Attendance', backref='student', lazy=True, cascade="all, delete-orphan")
    results = db.relationship('Result', backref='student', lazy=True, cascade="all, delete-orphan")

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # Present/Absent

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=False)

# ================= CREATE DB =================
with app.app_context():
    db.create_all()

# ================= HOME =================
@app.route("/")
def home():
    students = Student.query.limit(4).all()
    courses = ["Mathematics", "Science", "Computer Science", "English", "Art"]
    
    # Sample images for demo
    about_image = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800"
    course_images = [
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400"
    ]
    
    return render_template("home.html", 
                         students=students, 
                         courses=courses,
                         about_image=about_image,
                         course_images=course_images,
                         zip=zip)

# ================= STUDENT REGISTRATION =================
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        courses = request.form.get("courses", "").strip()
        fee = request.form.get("fee", 0)
        
        # Check if student already exists
        existing = Student.query.filter_by(email=email).first()
        if existing:
            flash("Email already registered!")
            return redirect(url_for("register"))
        
        # Hash password
        hashed_pw = generate_password_hash(password)
        
        # Create new student
        new_student = Student(
            name=name,
            email=email,
            password=hashed_pw,
            courses=courses,
            total_fee=float(fee)
        )
        
        db.session.add(new_student)
        db.session.commit()
        
        flash("Registration successful! Please login.")
        return redirect(url_for("login"))
    
    return render_template("register.html")

# ================= STUDENT LOGIN =================
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        
        student = Student.query.filter_by(email=email).first()
        
        if student and check_password_hash(student.password, password):
            session["student_id"] = student.id
            session["student_name"] = student.name
            return redirect(url_for("student_dashboard"))
        
        flash("Invalid credentials!")
    
    return render_template("login.html")

# ================= STUDENT DASHBOARD =================
@app.route("/student/dashboard")
def student_dashboard():
    if "student_id" not in session:
        return redirect(url_for("login"))
    
    student = Student.query.get(session["student_id"])
    if not student:
        return redirect(url_for("login"))
    
    attendance = Attendance.query.filter_by(student_id=student.id).all()
    results = Result.query.filter_by(student_id=student.id).all()
    
    return render_template("student_dashboard.html", 
                         student=student,
                         attendance=attendance,
                         results=results)

# ================= STUDENT LOGOUT =================
@app.route("/logout")
def logout():
    session.pop("student_id", None)
    session.pop("student_name", None)
    return redirect(url_for("login"))

# ================= ADMIN LOGIN =================
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        
        if email.lower() == ADMIN_EMAIL.lower() and password == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        
        flash("Invalid login credentials")
    
    return render_template("admin_login.html")

# ================= ADMIN DASHBOARD =================
@app.route("/admin/dashboard")
def admin_dashboard():
    if "admin" not in session:
        return redirect(url_for("admin_login"))
    
    students = Student.query.all()
    paid_count = sum(1 for s in students if s.paid)
    unpaid_count = sum(1 for s in students if not s.paid)
    
    chart_data = {
        "labels": ["Paid", "Unpaid"],
        "values": [paid_count, unpaid_count]
    }
    
    return render_template("admin_dashboard.html",
                         students=students,
                         chart_data=chart_data)

# ================= ADMIN - ADD ATTENDANCE =================
@app.route("/admin/attendance", methods=["GET", "POST"])
def admin_attendance():
    if "admin" not in session:
        return redirect(url_for("admin_login"))
    
    if request.method == "POST":
        student_id = request.form.get("student_id")
        date = request.form.get("date")
        status = request.form.get("status")
        
        new_record = Attendance(student_id=student_id, date=date, status=status)
        db.session.add(new_record)
        db.session.commit()
        flash("Attendance added!")
    
    records = Attendance.query.all()
    return render_template("attendance.html", records=records)

# ================= ADMIN - ADD RESULTS =================
@app.route("/admin/results", methods=["GET", "POST"])
def admin_results():
    if "admin" not in session:
        return redirect(url_for("admin_login"))
    
    if request.method == "POST":
        student_id = request.form.get("student_id")
        subject = request.form.get("subject")
        score = request.form.get("score")
        
        new_result = Result(student_id=student_id, subject=subject, score=score)
        db.session.add(new_result)
        db.session.commit()
        flash("Result added!")
    
    results = Result.query.all()
    return render_template("results.html", results=results)

# ================= ADMIN LOGOUT =================
@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("admin_login"))

# ================= PAYMENT =================
@app.route("/payment/<int:student_id>")
def payment(student_id):
    if "student_id" not in session:
        return redirect(url_for("login"))
    
    student = Student.query.get_or_404(student_id)
    return render_template("payment.html", student=student, total=student.total_fee, email=student.email)

@app.route("/pay", methods=["POST"])
def pay():
    # This is a placeholder - integrate with real payment gateway
    email = request.form.get("email")
    student = Student.query.filter_by(email=email).first()
    
    if student:
        student.paid = True
        db.session.commit()
        flash("Payment successful!")
        return redirect(url_for("student_dashboard"))
    
    flash("Payment failed!")
    return redirect(url_for("home"))

# ================= HEALTH CHECK (for Render) =================
@app.route("/health")
def health():
    return {"status": "healthy"}, 200

# ================= RUN APP =================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)


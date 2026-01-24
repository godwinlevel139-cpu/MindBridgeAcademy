import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy

# ================= APP CONFIG =================
app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

DATABASE_URL = os.environ.get("DATABASE_URL")

# Fix Render postgres URL issue
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL or "sqlite:///local.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ================= ADMIN CONFIG =================
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

# ================= COURSE PRICES =================
COURSE_PRICES = {
    "AI": 120,
    "Digital Marketing": 80,
    "Mathematics": 50,
    "English": 40,
    "Physics": 70,
    "Chemistry": 70,
    "Biology": 70,
    "Special Education": 100,
    "Academic Counselling": 30
}

# ================= DATABASE MODELS =================
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(150))
    courses = db.Column(db.Text)
    total_fee = db.Column(db.Float)

# ================= CREATE DATABASE =================
with app.app_context():
    db.create_all()

# ================= ROUTES =================

@app.route("/")
def home():
    return render_template("home.html")

# -------- STUDENT REGISTRATION --------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        courses = request.form.getlist("courses")

        total_fee = sum(COURSE_PRICES.get(course, 0) for course in courses)

        student = Student(
            name=name,
            email=email,
            courses=", ".join(courses),
            total_fee=total_fee
        )
        db.session.add(student)
        db.session.commit()

        return render_template(
            "payment.html",
            email=email,
            total=total_fee
        )

    return render_template("register.html", prices=COURSE_PRICES)

# -------- ADMIN LOGIN --------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        else:
            flash("Invalid admin credentials")

    return render_template("login.html")

# -------- ADMIN LOGOUT --------
@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("home"))

# -------- ADMIN DASHBOARD --------
@app.route("/admin/dashboard")
def admin_dashboard():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()
    total_revenue = sum(s.total_fee for s in students)

    return render_template(
        "admin_dashboard.html",
        students=students,
        revenue=total_revenue
    )

# -------- VIEW STUDENTS --------
@app.route("/admin/students")
def view_students():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()
    return render_template("students.html", students=students)

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)

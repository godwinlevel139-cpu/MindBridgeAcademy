import os
import requests
from flask import Flask, render_template, request, redirect, url_for, session, flash
from models import db, Student, Payment

app = Flask(__name__)

# ================= CONFIG =================

app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev_key")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://mindbridge_user:spYEcZ5r0e9kxBqBhCUt18eOn9Gx8kmT@dpg-d5q6j4e3jp1c7399utg0-a/mindbridge_yn6t"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()

# ================= ADMIN =================

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@mindbridgeacademy.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET", "")

# ================= COURSES =================

COURSE_PRICES = {
    "AI": 120,
    "Digital Marketing": 80,
    "Mathematics": 50,
    "English": 40,
    "Chemistry": 70,
    "Biology": 70,
    "Physics": 70,
    "Special Education": 100,
    "Academic Counselling": 30
}

# ================= HOME =================

@app.route("/")
def home():
    return render_template("home.html")

# ================= REGISTER =================

@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]
        courses = request.form.getlist("courses")

        total_fee = sum(COURSE_PRICES[c] for c in courses)

        student = Student(
            name=name,
            email=email,
            password=password,
            courses=", ".join(courses),
            total_fee=total_fee
        )

        db.session.add(student)
        db.session.commit()

        return redirect(url_for("pay", student_id=student.id))

    return render_template("register.html", prices=COURSE_PRICES)

# ================= PAYSTACK =================

@app.route("/pay/<int:student_id>")
def pay(student_id):
    student = Student.query.get(student_id)

    amount = int(student.total_fee * 100)

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET}",
        "Content-Type": "application/json"
    }

    data = {
        "email": student.email,
        "amount": amount
    }

    response = requests.post(
        "https://api.paystack.co/transaction/initialize",
        headers=headers,
        json=data
    ).json()

    return redirect(response["data"]["authorization_url"])

# ================= STUDENT LOGIN =================

@app.route("/student/login", methods=["GET","POST"])
def student_login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        student = Student.query.filter_by(email=email, password=password).first()

        if student:
            session["student_id"] = student.id
            return redirect(url_for("student_portal"))

        flash("Invalid login")

    return render_template("student_login.html")

@app.route("/student/portal")
def student_portal():
    if not session.get("student_id"):
        return redirect(url_for("student_login"))

    student = Student.query.get(session["student_id"])

    return render_template("student_portal.html", student=student)

# ================= ADMIN LOGIN =================

@app.route("/admin/login", methods=["GET","POST"])
def admin_login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))

        flash("Wrong credentials")

    return render_template("login.html")

@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("home"))

# ================= ADMIN DASHBOARD =================

@app.route("/admin/dashboard")
def admin_dashboard():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()

    revenue = sum(s.total_fee for s in students)

    return render_template(
        "admin_dashboard.html",
        student_count=len(students),
        revenue=revenue,
        students=students
    )

# ================= VIEW STUDENTS =================

@app.route("/admin/students")
def view_students():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()

    return render_template("students.html", students=students)

# ================= RUN =================

if __name__ == "__main__":
    app.run(debug=True)

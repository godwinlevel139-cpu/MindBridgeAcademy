import os
import csv
from io import StringIO
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, Response
)
from flask_sqlalchemy import SQLAlchemy

# ================= APP SETUP =================
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

# ================= DATABASE =================
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///school.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ================= MODELS =================
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    email = db.Column(db.String(120))
    courses = db.Column(db.Text)
    total_fee = db.Column(db.Float)

# ================= CONFIG =================
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@mindbridgeacademy.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

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

# ================= ROUTES =================

@app.route("/")
def home():
    return render_template("home.html")

# ---------- STUDENT REGISTRATION ----------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        courses = request.form.getlist("courses")

        total = sum(COURSE_PRICES.get(c, 0) for c in courses)

        student = Student(
            name=name,
            email=email,
            courses=", ".join(courses),
            total_fee=total
        )

        db.session.add(student)
        db.session.commit()

        return render_template(
            "payment.html",
            email=email,
            total=total
        )

    return render_template("register.html", prices=COURSE_PRICES)

# ---------- ADMIN LOGIN ----------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        if (
            request.form["email"] == ADMIN_EMAIL and
            request.form["password"] == ADMIN_PASSWORD
        ):
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        else:
            flash("Invalid login details")

    return render_template("login.html")

@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("home"))

# ---------- ADMIN DASHBOARD ----------
@app.route("/admin/dashboard")
def admin_dashboard():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()
    total_revenue = sum(s.total_fee for s in students)

    return render_template(
        "admin_dashboard.html",
        student_count=len(students),
        revenue=total_revenue
    )

# ---------- VIEW STUDENTS ----------
@app.route("/admin/students")
def view_students():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()
    return render_template("students.html", students=students)

# ---------- EXPORT CSV ----------
@app.route("/admin/export")
def export_students():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = Student.query.all()

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["Name", "Email", "Courses", "Total Fee"])
    for s in students:
        writer.writerow([s.name, s.email, s.courses, s.total_fee])

    response = Response(
        output.getvalue(),
        mimetype="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=students.csv"

    return response

# ================= CREATE DB =================
with app.app_context():
    db.create_all()

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)


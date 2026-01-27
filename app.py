import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import requests

app = Flask(__name__)
app.secret_key = "super_secret_key"

# DATABASE (PostgreSQL or SQLite fallback)
DATABASE_URL = os.environ.get("DATABASE_URL","sqlite:///school.db")

app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ================= MODELS =================

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))
    courses = db.Column(db.String(200))
    total_fee = db.Column(db.Float)
    paid = db.Column(db.Boolean, default=False)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer)
    date = db.Column(db.String(50))
    status = db.Column(db.String(20))

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer)
    subject = db.Column(db.String(50))
    score = db.Column(db.Float)

with app.app_context():
    db.create_all()

# ================= HOME =================

@app.route("/")
def home():
    return render_template("home.html")

# ================= STUDENT REGISTER =================

@app.route("/register", methods=["POST"])
def register():
    name = request.form["name"]
    email = request.form["email"]
    password = generate_password_hash(request.form["password"])
    courses = request.form["courses"]
    total_fee = float(request.form["fee"])

    student = Student(
        name=name,
        email=email,
        password=password,
        courses=courses,
        total_fee=total_fee
    )

    db.session.add(student)
    db.session.commit()

    flash("Registration successful")
    return redirect("/login")

# ================= LOGIN =================

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method=="POST":
        email = request.form["email"]
        password = request.form["password"]

        student = Student.query.filter_by(email=email).first()

        if student and check_password_hash(student.password,password):
            session["student_id"]=student.id
            return redirect("/student/dashboard")

        flash("Invalid login")

    return render_template("login.html")

# ================= STUDENT DASHBOARD =================

@app.route("/student/dashboard")
def student_dashboard():
    if "student_id" not in session:
        return redirect("/login")

    student = Student.query.get(session["student_id"])

    attendance = Attendance.query.filter_by(student_id=student.id).all()
    results = Result.query.filter_by(student_id=student.id).all()

    return render_template(
        "student_dashboard.html",
        student=student,
        attendance=attendance,
        results=results
    )

# ================= PAYSTACK PAYMENT =================

PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET","")

@app.route("/pay")
def pay():
    student = Student.query.get(session["student_id"])

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET}",
        "Content-Type": "application/json"
    }

    data = {
        "email": student.email,
        "amount": int(student.total_fee*100)
    }

    res = requests.post(
        "https://api.paystack.co/transaction/initialize",
        json=data,
        headers=headers
    ).json()

    return redirect(res["data"]["authorization_url"])

@app.route("/payment-success")
def payment_success():
    student = Student.query.get(session["student_id"])
    student.paid=True
    db.session.commit()
    return redirect("/student/dashboard")

# ================= ADMIN =================

@app.route("/admin/dashboard")
def admin_dashboard():
    students = Student.query.all()
    revenue = sum(s.total_fee for s in students if s.paid)

    paid = len([s for s in students if s.paid])
    unpaid = len(students) - paid

    return render_template(
        "admin_dashboard.html",
        students=students,
        revenue=revenue,
        paid=paid,
        unpaid=unpaid
    )

@app.route("/chart-data")
def chart_data():
    students = Student.query.all()
    paid = len([s for s in students if s.paid])
    unpaid = len(students)-paid

    return jsonify({"paid":paid,"unpaid":unpaid})

# ================= ATTENDANCE =================

@app.route("/attendance", methods=["GET","POST"])
def attendance():
    if request.method=="POST":
        student_id = request.form["student_id"]
        date = request.form["date"]
        status = request.form["status"]

        a = Attendance(
            student_id=student_id,
            date=date,
            status=status
        )
        db.session.add(a)
        db.session.commit()

    records = Attendance.query.all()
    return render_template("attendance.html", records=records)

# ================= RESULTS =================

@app.route("/results", methods=["GET","POST"])
def results():
    if request.method=="POST":
        student_id = request.form["student_id"]
        subject = request.form["subject"]
        score = request.form["score"]

        r = Result(
            student_id=student_id,
            subject=subject,
            score=score
        )
        db.session.add(r)
        db.session.commit()

    results = Result.query.all()
    return render_template("results.html", results=results)

# ================= LOGOUT =================

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

# ================= RUN =================

if __name__=="__main__":
    app.run(debug=True)

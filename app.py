import os
import csv
import requests
from flask import Flask, render_template, request, redirect, session, url_for, flash

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

# ================= CONFIG =================
STUDENT_FILE = "students.csv"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@mindbridgeacademy.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")

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


# -------- STUDENT REGISTRATION --------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        courses = request.form.getlist("courses")

        total = sum(COURSE_PRICES.get(c, 0) for c in courses)

        file_exists = os.path.exists(STUDENT_FILE)
        with open(STUDENT_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["Name", "Email", "Courses", "Total Fee"])
            writer.writerow([name, email, ", ".join(courses), total])

        return render_template("payment.html", email=email, total=total)

    return render_template("register.html", prices=COURSE_PRICES)


# -------- PAYSTACK PAYMENT --------
@app.route("/pay", methods=["POST"])
def pay():
    email = request.form["email"]
    amount = int(float(request.form["amount"]) * 100)  # dollars → cents

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "email": email,
        "amount": amount,
        "currency": "USD"
    }

    response = requests.post(
        "https://api.paystack.co/transaction/initialize",
        headers=headers,
        json=data
    ).json()

    if response.get("status"):
        return redirect(response["data"]["authorization_url"])

    return "Payment initialization failed"


# -------- ADMIN LOGIN --------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        if (
            request.form["email"] == ADMIN_EMAIL and
            request.form["password"] == ADMIN_PASSWORD
        ):
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))

        flash("Invalid admin credentials", "error")

    return render_template("login.html")


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("home"))


# -------- ADMIN DASHBOARD --------
@app.route("/admin/dashboard")
def admin_dashboard():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = []
    total_revenue = 0

    if os.path.exists(STUDENT_FILE):
        with open(STUDENT_FILE, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                students.append(row)
                total_revenue += float(row["Total Fee"])

    return render_template(
        "admin_dashboard.html",
        student_count=len(students),
        revenue=total_revenue
    )


# -------- VIEW STUDENTS (ADMIN ONLY) --------
@app.route("/admin/students")
def view_students():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = []
    if os.path.exists(STUDENT_FILE):
        with open(STUDENT_FILE, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            students = list(reader)

    return render_template("students.html", students=students)


# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)

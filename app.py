

from flask import Flask, render_template, request, redirect, url_for, session, flash
import csv
import os

app = Flask(__name__)
# Use environment variable for secret key
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "fallback_secret_key")

STUDENT_FILE = "students.csv"

# Admin credentials
ADMIN_EMAIL = "admin@mindbridgeacademy.com"
ADMIN_PASSWORD = "admin123"

# ---------------- HOME ----------------
@app.route("/")
def home():
    return render_template("home.html")

# ---------------- ADMIN LOGIN ----------------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        else:
            flash("Invalid login details")

    return render_template("login.html")

# ---------------- ADMIN LOGOUT ----------------
@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("home"))

# ---------------- ADMIN DASHBOARD ----------------
@app.route("/admin/dashboard")
def admin_dashboard():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))
    return render_template("admin_dashboard.html")

# ---------------- VIEW STUDENTS ----------------
@app.route("/admin/students")
def view_students():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    students = []
    if os.path.exists(STUDENT_FILE):
        with open(STUDENT_FILE, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            students = list(reader)

    return render_template("students.html", students=students)

# ---------------- REGISTER STUDENT ----------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        courses = request.form.getlist("courses")

        if not name or not email or not courses:
            flash("Please fill all fields")
            return redirect(url_for("home"))

        # Store as comma-separated if multiple courses
        courses_str = ", ".join(courses)

        with open(STUDENT_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([name, email, courses_str])

        flash("Registration successful!")
        return redirect(url_for("home"))

    return render_template("home.html")

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)

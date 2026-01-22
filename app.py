from flask import Flask, render_template, request, redirect, url_for, session, flash
import csv
import os

app = Flask(__name__)
app.secret_key = "super_secret_key_change_this"

STUDENT_FILE = "students.csv"

ADMIN_EMAIL = "admin@mindbridgeacademy.com"
ADMIN_PASSWORD = "admin123"  # change later

@app.route("/")
def home():
    return render_template("home.html")

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

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("home"))

@app.route("/admin/dashboard")
def admin_dashboard():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))
    return render_template("admin_dashboard.html")

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

@app.route("/register", methods=["POST"])
def register():
    data = [
        request.form["name"],
        request.form["email"],
        ", ".join(request.form.getlist("courses"))
    ]

    with open(STUDENT_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(data)

    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)

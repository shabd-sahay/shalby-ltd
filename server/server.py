from flask import Flask, request, jsonify, session, g
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, extract
from sqlalchemy.orm import backref
from flask_cors import CORS
from werkzeug.security import check_password_hash
from flask_session import Session
from datetime import timedelta
from functools import wraps
from dotenv import load_dotenv


import os

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Shabd%402003@localhost/hospital_analytics'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # Load from environment variable
app.config['SESSION_TYPE'] = 'filesystem'  # Store session data in a file system (can be modified to Redis, etc.)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=12)  # Session lifetime

db = SQLAlchemy(app)
CORS(app)
Session(app)




def authenticate_user(email, password):
    user = Logins.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return user
    return None

def login_user(user):
    session['email'] = user.email
    session['role'] = user.role
    session.permanent = True  # Use permanent session with lifetime defined in `PERMANENT_SESSION_LIFETIME`

def logout_user():
    session.pop('email', None)
    session.pop('role', None)

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'email' not in session or 'role' not in session:
            return jsonify({'message': 'User not logged in!'}), 403

        # Set the user data in the context (g)
        g.user = {'email': session['email'], 'role': session['role']}
        return f(*args, **kwargs)
    
    return decorated_function

##models

class Admin(db.Model):
    __tablename__ = 'admins'
    
    email = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255))


class HospitalDirector(db.Model):
    __tablename__ = 'hospital_directors'
    
    email = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255))


class Hospital(db.Model):
    __tablename__ = 'hospitals'
    
    id = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255))
    location = db.Column(db.String(255))
    adminId = db.Column(db.String(255), db.ForeignKey('admins.email'))

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    hospitalId = db.Column(db.String(255), db.ForeignKey('hospitals.id'), nullable=False)
    headId = db.Column(db.String(255), nullable=False)  # ID of the department head (e.g., a doctor)
    headName = db.Column(db.String(255), nullable=False)  # Name of the department head
  

class Doctor(db.Model):
    __tablename__ = 'doctors'

    email = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    departmentId = db.Column(db.String(255), db.ForeignKey('departments.id'))
    progressReport = db.Column(db.Text)

    # Relationship to the Department (no need to explicitly define department here)


class HospitalDirectorHospital(db.Model):
    __tablename__ = 'hospital_directors_hospitals'
    
    directorEmail = db.Column(db.String(255), db.ForeignKey('hospital_directors.email'), primary_key=True)
    hospitalId = db.Column(db.String(255), db.ForeignKey('hospitals.id'), primary_key=True)



class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.String(255), primary_key=True)
    date = db.Column(db.TIMESTAMP)
    hospitalId = db.Column(db.String(255), db.ForeignKey('hospitals.id'))
    doctorId = db.Column(db.String(255), db.ForeignKey('doctors.email'))
    departmentId = db.Column(db.String(255), db.ForeignKey('departments.id'))
    patientName = db.Column(db.String(255))

class Logins(db.Model):
    __tablename__ = 'logins'
    email = db.Column(db.String(255), primary_key=True)
    role = db.Column(db.String(50))
    password = db.Column(db.String(255))



## Routes
# Login route
@app.route('/api/login', methods=['POST'])
def login():
    print("entry into the login")
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = authenticate_user(email, password)

    if user:
        login_user(user)
        print("login successful, login to the role:", user.role)
        return jsonify({"role": user.role}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401



# Admin dashboard route
@app.route('/api/admin-dashboard', methods=['GET'])
@token_required
def admin_dashboard():
    if g.user['role'] != 'admin':
        return jsonify({"message": "Access denied"}), 403

    hospital_id = request.args.get('hospital_id')  # Get hospital_id from request params

    # Base query for Yearly Appointments
    yearly_query = db.session.query(
        extract('year', Appointment.date).label('year'),
        func.count(Appointment.id).label('appointment_count')
    )

    # Base query for Monthly Appointments
    monthly_query = db.session.query(
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    )

    # Base query for Daily Appointments
    daily_query = db.session.query(
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        extract('day', Appointment.date).label('day'),
        func.count(Appointment.id).label('appointment_count')
    )

    # Apply hospital filter if hospital_id is provided
    if hospital_id:
        yearly_query = yearly_query.filter(Appointment.hospitalId == hospital_id)
        monthly_query = monthly_query.filter(Appointment.hospitalId == hospital_id)
        daily_query = daily_query.filter(Appointment.hospitalId == hospital_id)

    # Grouping and executing queries
    yearly_appointments = yearly_query.group_by('year').all()
    monthly_appointments = monthly_query.group_by('year', 'month').all()
    daily_appointments = daily_query.group_by('year', 'month', 'day').all()

    # Appointments by Hospital (no change needed here since it's already grouped by hospital)
    hospital_appointments = db.session.query(
        Hospital.name.label('hospital_name'),
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Hospital, Hospital.id == Appointment.hospitalId).group_by(
        'hospital_name', 'year', 'month'
    ).all()

    # Appointments by Director (no change needed here as well)
    director_appointments = db.session.query(
        HospitalDirector.name.label('director_name'),
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    ).join(HospitalDirectorHospital, HospitalDirector.email == HospitalDirectorHospital.directorEmail
    ).join(Hospital, Hospital.id == HospitalDirectorHospital.hospitalId
    ).join(Appointment, Appointment.hospitalId == Hospital.id
    ).group_by('director_name', 'year', 'month').all()

    return jsonify({
        "yearly_appointments": [
            {"year": year, "appointment_count": count}
            for year, count in yearly_appointments
        ],
        "monthly_appointments": [
            {"year": year, "month": month, "appointment_count": count}
            for year, month, count in monthly_appointments
        ],
        "daily_appointments": [
            {"year": year, "month": month, "day": day, "appointment_count": count}
            for year, month, day, count in daily_appointments
        ],
        "hospital_appointments": [
            {"hospital_name": hospital, "year": year, "month": month, "appointment_count": count}
            for hospital, year, month, count in hospital_appointments
        ],
        "director_appointments": [
            {"director_name": director, "year": year, "month": month, "appointment_count": count}
            for director, year, month, count in director_appointments
        ]
    }), 200

@app.route('/api/hospital-details/<hospital_id>', methods=['GET'])
def get_hospital_details(hospital_id):
    hospital = Hospital.query.filter_by(id=hospital_id).first()
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404

    director = HospitalDirector.query.join(HospitalDirectorHospital).filter_by(hospitalId=hospital.id).first()
    departments = Department.query.filter_by(hospitalId=hospital.id).all()

    response_data = {
        "name": hospital.name,
        "director_name": director.name if director else "No Director Assigned",
        "departments": [
            {"id": dept.id, "email": dept.headId, "name": dept.name, "head_name": dept.headName}  # Adjust based on your model
            for dept in departments
        ]
    }

    return jsonify(response_data), 200


@app.route('/api/admin-dashboard/bar-chart', methods=['GET'])
def admin_dashboard_bar_chart():
    hospital_id = request.args.get('hospital_id')  # Optional filter by hospital
    year = request.args.get('year')  # Optional filter by year

    # Base query to fetch monthly appointment data
    query = db.session.query(
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    )

    # Apply filters based on provided hospital_id and year
    if hospital_id:
        query = query.filter(Appointment.hospitalId == hospital_id)
    if year:
        query = query.filter(extract('year', Appointment.date) == year)

    # Group by month and execute the query
    monthly_appointments = query.group_by('month').all()

    # Prepare the response data
    response_data = [
        {"month": month, "appointment_count": count}
        for month, count in monthly_appointments
    ]

    return jsonify({"monthly_appointments": response_data}), 200

@app.route('/api/admin-dashboard/line-chart', methods=['GET'])
def get_line_chart_data():
    year = request.args.get('year')
    hospital_id = request.args.get('hospital_id')

    query = db.session.query(
        extract('month', Appointment.date).label('month'),
        Department.name.label('department_name'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Department, Appointment.departmentId == Department.id)

    if year:
        query = query.filter(extract('year', Appointment.date) == int(year))
    
    if hospital_id:
        query = query.filter(Appointment.hospitalId == hospital_id)

    query = query.group_by('month', 'department_name').order_by('month', 'department_name')
    result = query.all()

    # Structure the data with months as keys and departments as nested keys
    data = {}
    for row in result:
        month = int(row.month)
        if month not in data:
            data[month] = {'month': month}
        data[month][row.department_name] = row.appointment_count

    # Convert to list format for frontend
    final_data = list(data.values())

    return jsonify({'monthly_appointments': final_data})


@app.route('/api/years', methods=['GET'])
def get_years():
    years = db.session.query(
        extract('year', Appointment.date).label('year')
    ).distinct().all()
    
    response_data = [year for (year,) in years]
    
    return jsonify(response_data), 200


@app.route('/api/admin-dashboard/pie-chart', methods=['GET'])
def admin_dashboard_pie_chart():
    year = request.args.get('year')  # Optional filter by year

    # Base query to count appointments per hospital
    query = db.session.query(
        Hospital.name.label('hospital_name'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Appointment, Appointment.hospitalId == Hospital.id)

    # Apply filter based on provided year
    if year:
        query = query.filter(extract('year', Appointment.date) == year)

    # Group by hospital name and execute the query
    hospital_appointments = query.group_by(Hospital.name).all()

    # Prepare the response data
    response_data = [
        {"hospital_name": hospital_name, "appointment_count": count}
        for hospital_name, count in hospital_appointments
    ]

    return jsonify({"hospital_appointments": response_data}), 200


@app.route('/api/hospitals', methods=['GET'])
def get_hospitals():
    hospitals = Hospital.query.all()
    result = [{"id": hospital.id, "name": hospital.name} for hospital in hospitals]
    return jsonify(result), 200

@app.route('/api/department/<string:id>', methods=['GET'])
def get_department(id):
    department = Department.query.filter_by(id=id).first()
    if department:
        return jsonify({
            'name': department.name,
            'head_name': department.headName,
            'description': department.description  # Add more fields as necessary
        })
    else:
        return jsonify({'error': 'Department not found'}), 404

# Director Dashboard Route
@app.route('/api/director-page', methods=['GET'])
@token_required
def director_page():
    # Get the director's email directly from the session
    director_email = session.get('email')

    if not director_email or session.get('role') != 'hospital_director':
        return jsonify({"message": "Access denied"}), 403

    # Rest of your logic
    hospital_id = request.args.get('hospital_id')  # Get hospital_id from request params if any

    # Query to get the hospitals managed by the director
    hospitals_managed = db.session.query(HospitalDirectorHospital.hospitalId).filter(
        HospitalDirectorHospital.directorEmail == director_email
    ).subquery()

    # Base query for Yearly Appointments
    yearly_query = db.session.query(
        extract('year', Appointment.date).label('year'),
        func.count(Appointment.id).label('appointment_count')
    ).filter(Appointment.hospitalId.in_(hospitals_managed))

    # Base query for Monthly Appointments
    monthly_query = db.session.query(
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    ).filter(Appointment.hospitalId.in_(hospitals_managed))

    # Base query for Daily Appointments
    daily_query = db.session.query(
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        extract('day', Appointment.date).label('day'),
        func.count(Appointment.id).label('appointment_count')
    ).filter(Appointment.hospitalId.in_(hospitals_managed))

    # Apply hospital filter if hospital_id is provided
    if hospital_id:
        yearly_query = yearly_query.filter(Appointment.hospitalId == hospital_id)
        monthly_query = monthly_query.filter(Appointment.hospitalId == hospital_id)
        daily_query = daily_query.filter(Appointment.hospitalId == hospital_id)

    # Grouping and executing queries
    yearly_appointments = yearly_query.group_by('year').all()
    monthly_appointments = monthly_query.group_by('year', 'month').all()
    daily_appointments = daily_query.group_by('year', 'month', 'day').all()

    # Appointments by Hospital under this director
    hospital_appointments = db.session.query(
        Hospital.name.label('hospital_name'),
        extract('year', Appointment.date).label('year'),
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Hospital, Hospital.id == Appointment.hospitalId
    ).filter(Hospital.id.in_(hospitals_managed)
    ).group_by('hospital_name', 'year', 'month').all()

    return jsonify({
        "yearly_appointments": [
            {"year": year, "appointment_count": count}
            for year, count in yearly_appointments
        ],
        "monthly_appointments": [
            {"year": year, "month": month, "appointment_count": count}
            for year, month, count in monthly_appointments
        ],
        "daily_appointments": [
            {"year": year, "month": month, "day": day, "appointment_count": count}
            for year, month, day, count in daily_appointments
        ],
        "hospital_appointments": [
            {"hospital_name": hospital, "year": year, "month": month, "appointment_count": count}
            for hospital, year, month, count in hospital_appointments
        ]
    }), 200

@app.route('/api/director-hospitals', methods=['GET'])
@token_required
def get_director_hospitals():
    if g.user['role'] != 'hospital_director':
        return jsonify({"message": "Access denied"}), 403

    # Get the director's email from the session
    director_email = g.user['email']

    # Query to get the hospitals assigned to the director
    hospitals_assigned = db.session.query(Hospital).join(
        HospitalDirectorHospital,
        Hospital.id == HospitalDirectorHospital.hospitalId
    ).filter(
        HospitalDirectorHospital.directorEmail == director_email
    ).all()

    # Format the results
    result = [{"id": hospital.id, "name": hospital.name} for hospital in hospitals_assigned]

    return jsonify(result), 200

@app.route('/api/director-dashboard/bar-chart', methods=['GET'])
@token_required
def director_dashboard_bar_chart():
    if g.user['role'] != 'hospital_director':
        return jsonify({"message": "Access denied"}), 403

    director_email = g.user['email']
    hospital_ids = db.session.query(Hospital.id).join(
        HospitalDirectorHospital,
        Hospital.id == HospitalDirectorHospital.hospitalId
    ).filter(
        HospitalDirectorHospital.directorEmail == director_email
    ).all()

    hospital_ids = [id for (id,) in hospital_ids]

    year = request.args.get('year')  # Optional filter by year

    # Base query to fetch monthly appointment data
    query = db.session.query(
        extract('month', Appointment.date).label('month'),
        func.count(Appointment.id).label('appointment_count')
    ).filter(
        Appointment.hospitalId.in_(hospital_ids)
    )

    if year:
        query = query.filter(extract('year', Appointment.date) == year)

    # Group by month and execute the query
    monthly_appointments = query.group_by('month').all()

    # Prepare the response data
    response_data = [
        {"month": month, "appointment_count": count}
        for month, count in monthly_appointments
    ]

    return jsonify({"monthly_appointments": response_data}), 200

@app.route('/api/director-dashboard/line-chart', methods=['GET'])
@token_required
def director_dashboard_line_chart():
    if g.user['role'] != 'hospital_director':
        return jsonify({"message": "Access denied"}), 403

    director_email = g.user['email']
    hospital_ids = db.session.query(Hospital.id).join(
        HospitalDirectorHospital,
        Hospital.id == HospitalDirectorHospital.hospitalId
    ).filter(
        HospitalDirectorHospital.directorEmail == director_email
    ).all()

    hospital_ids = [id for (id,) in hospital_ids]

    year = request.args.get('year')

    query = db.session.query(
        extract('month', Appointment.date).label('month'),
        Department.name.label('department_name'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Department, Appointment.departmentId == Department.id).filter(
        Appointment.hospitalId.in_(hospital_ids)
    )

    if year:
        query = query.filter(extract('year', Appointment.date) == int(year))
    
    query = query.group_by('month', 'department_name').order_by('month', 'department_name')
    result = query.all()

    # Structure the data with months as keys and departments as nested keys
    data = {}
    for row in result:
        month = int(row.month)
        if month not in data:
            data[month] = {'month': month}
        data[month][row.department_name] = row.appointment_count

    # Convert to list format for frontend
    final_data = list(data.values())

    return jsonify({'monthly_appointments': final_data})
@app.route('/api/director-dashboard/pie-chart', methods=['GET'])
@token_required
def director_dashboard_pie_chart():
    if g.user['role'] != 'hospital_director':
        return jsonify({"message": "Access denied"}), 403

    director_email = g.user['email']  # Director's email
    year = request.args.get('year')  # Optional filter by year

    # Base query to count appointments per hospital for the specified director
    query = db.session.query(
        Hospital.name.label('hospital_name'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Appointment, Appointment.hospitalId == Hospital.id) \
     .join(HospitalDirectorHospital, Hospital.id == HospitalDirectorHospital.hospitalId) \
     .filter(HospitalDirectorHospital.directorEmail == director_email)

    # Apply filter based on provided year
    if year:
        query = query.filter(extract('year', Appointment.date) == year)

    # Group by hospital name and execute the query
    hospital_appointments = query.group_by(Hospital.name).all()

    # Prepare the response data
    response_data = [
        {"hospital_name": hospital_name, "appointment_count": count}
        for hospital_name, count in hospital_appointments
    ]

    return jsonify({"hospital_appointments": response_data}), 200

#department

@app.route('/api/department/progress', methods=['GET'])
@token_required
def department_progress():
    user_email = g.user['email']
    department_identifier = request.args.get('department_id')
    department_id = None

    # Resolve department_id from email
    if department_identifier and '@' in department_identifier:
        department = db.session.query(Department.id).filter(Department.headId == department_identifier).first()
        if department:
            department_id = department.id
        else:
            return jsonify({"error": "Department not found"}), 404
    else:
        department_id = department_identifier

    if not department_id:
        department = db.session.query(Department.id).filter(Department.headId == user_email).first()
        if department:
            department_id = department.id
        else:
            return jsonify({"error": "Department not found"}), 404

    year = request.args.get('year')

    query = db.session.query(
        func.extract('year', Appointment.date).label('year'),
        func.count(Appointment.id).label('appointment_count')
    ).filter(Appointment.departmentId == department_id)

    if year:
        query = query.filter(func.extract('year', Appointment.date) == year) \
                     .group_by(func.extract('month', Appointment.date))
    else:
        query = query.group_by(func.extract('year', Appointment.date))

    progress_data = query.all()

    # DEBUG: Print the fetched data
    print("Progress Data:", progress_data)

    response_data = [{"period": int(period), "appointment_count": count} for period, count in progress_data]

    return jsonify({"progress": response_data}), 200


@app.route('/api/department/doctors-appointments', methods=['GET'])
@token_required
def department_doctors_appointments():
    user_email = g.user['email']
    department_identifier = request.args.get('department_id')
    department_id = None

    # Resolve department_id from email
    if department_identifier and '@' in department_identifier:
        department = db.session.query(Department.id).filter(Department.headId == department_identifier).first()
        if department:
            department_id = department.id
        else:
            return jsonify({"error": "Department not found"}), 404
    else:
        department_id = department_identifier

    if not department_id:
        department = db.session.query(Department.id).filter(Department.headId == user_email).first()
        if department:
            department_id = department.id
        else:
            return jsonify({"error": "Department not found"}), 404
    
    year = request.args.get('year')


    query = db.session.query(
        Doctor.name.label('doctor_name'),
        Doctor.email.label('doctor_email'),
        func.count(Appointment.id).label('appointment_count')
    ).join(Appointment, Appointment.doctorId == Doctor.email) \
     .filter(Doctor.departmentId == department_id)
    
    # Apply year filter if provided
    if year:
        query = query.filter(func.extract('year', Appointment.date) == year)
    
    query = query.group_by(Doctor.email)
    
    doctor_appointments = query.all()
    
    response_data = [{"doctor_name": doctor_name, "doctor_email": doctor_email, "appointment_count": count} for doctor_name, doctor_email, count in doctor_appointments]
    
    return jsonify({"doctor_appointments": response_data}), 200

#doctorPage

@app.route('/api/doctor/appointments/graph', methods=['GET'])
def get_appointments_graph():
    doctor_email = request.args.get('doctor_email')
    year = request.args.get('year')
    month = request.args.get('month')

    query = db.session.query(
        func.year(Appointment.date).label('year'),
        func.month(Appointment.date).label('month'),
        func.day(Appointment.date).label('day'),
        func.count(Appointment.id).label('appointment_count')
    ).filter_by(doctorId=doctor_email)

    if year:
        query = query.filter(func.year(Appointment.date) == year)
    if month:
        query = query.filter(func.month(Appointment.date) == month)

    if month:
        query = query.group_by('day').order_by('day')
    elif year:
        query = query.group_by('month').order_by('month')
    else:
        query = query.group_by('year').order_by('year')

    data = query.all()
    response = [
        {"year": d.year, "month": d.month, "day": d.day, "appointment_count": d.appointment_count}
        for d in data
    ]
    return jsonify(response)

@app.route('/api/doctor/appointments/details', methods=['GET'])
def get_appointment_details():
    doctor_email = request.args.get('doctor_email')
    year = request.args.get('year')
    month = request.args.get('month')

    query = Appointment.query.filter_by(doctorId=doctor_email)

    if year:
        query = query.filter(func.year(Appointment.date) == year)
    if month:
        query = query.filter(func.month(Appointment.date) == month)

    query = query.order_by(Appointment.date.desc())

    data = [
        {
            "date": appt.date.strftime('%Y-%m-%d'),
            "patient_name": appt.patientName,
            "appointment_count": 1  # Each entry represents a single appointment
        }
        for appt in query.all()
    ]
    return jsonify({"appointments": data})


if __name__ == "__main__":
    app.run(debug=True, port=8080)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LabelList } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import './DepartmentHeadPage.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CC8', '#FF4560', '#1E90FF'];

const DepartmentHeadPage = ({ details }) => {
  const [progressData, setProgressData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [year, setYear] = useState('');
  const [years, setYears] = useState([]);
  const { id: departmentId } = useParams();
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await axios.get('/api/years');
        setYears(response.data);
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    var fetchProgressData = async () => {
      try {
        console.log(year);
        const response = await axios.get('/api/department/progress', {
          params: { department_id: departmentId || details, year },
        });
        setProgressData(response.data.progress);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      }
    };

    const fetchDoctorData = async () => {
      try {
        const response = await axios.get('/api/department/doctors-appointments', {
          params: { department_id: departmentId || details, year },
        });
        setDoctorData(response.data.doctor_appointments);
      } catch (error) {
        console.error('Error fetching doctor data:', error);
      }
    };

    fetchProgressData();
    fetchDoctorData();
    fetchYears();
  }, [year]);

  const handleDoctorClick = (doctor) => {
    if (doctor.doctor_email) {
      navigate(`/doctor/${doctor.doctor_email}`, { state: { email: doctor.doctor_email } });
    } else {
      console.error('Department details or email is missing.');
    }
  };

  return (
    <div className='deptnamecont'>
      <h1>Department Head Dashboard</h1>
      
      <div>
        <label htmlFor="year">Select Year: </label>
        <select
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="chart-container">
        <h2>Department Progress Over Time</h2>
        <LineChart width={800} height={400} data={progressData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="period" tickMargin={10} /> {/* Adjust the tickMargin value as needed */}
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="appointment_count" stroke="#8884d8">
    <LabelList dataKey="appointment_count" position="bottom" />
  </Line>
</LineChart>

      </div>

      <div className="chart-container">
        <h2>Doctor Comparison (Appointments)</h2>
        <PieChart width={800} height={400}>
          <Pie
            data={doctorData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="appointment_count"
            nameKey="doctor_name"
            label
          >
            {doctorData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
        <ul>
          {doctorData.map((doctor) => (
            <li key={doctor.doctor_email}>
              <a onClick={() => handleDoctorClick(doctor)}>{doctor.doctor_name}</a> ({doctor.appointment_count} appointments)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DepartmentHeadPage;


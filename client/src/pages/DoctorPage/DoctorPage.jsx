import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import './DoctorPage.css';

const DoctorPage = ({ details }) => {
  const { doctor_email } = useParams();
  const [graphData, setGraphData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
  ]);

  const monthNames = {
    1: 'Jan',
    2: 'Feb',
    3: 'Mar',
    4: 'Apr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Aug',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dec',
  };

  const doctorEmail = details || doctor_email;

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await axios.get('/api/years');
        setYears(response.data);
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    const fetchGraphData = async () => {
      try {
        const response = await axios.get('/api/doctor/appointments/graph', {
          params: { doctor_email: doctorEmail, year, month },
        });
        const formattedData = response.data.map((item) => ({
          ...item,
          month: monthNames[item.month],
        }));
        setGraphData(formattedData);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };

    const fetchAppointmentDetails = async () => {
      try {
        const response = await axios.get('/api/doctor/appointments/details', {
          params: { doctor_email: doctorEmail, year, month },
        });
        setAppointments(response.data.appointments);
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      }
    };

    if (doctorEmail) {
      fetchYears();
      fetchGraphData();
      fetchAppointmentDetails();
    }
  }, [year, month, doctorEmail]);

  const handleYearChange = (e) => {
    setYear(e.target.value);
    setMonth(''); // Reset month when year changes
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
  };

  const getXAxisDataKey = () => {
    if (month) return "day"; // Display days if month is selected
    if (year) return "month"; // Display months if year is selected
    return "year"; // Default case if no year or month is selected
  };

  return (
    <div className='main'>
      <h1>Doctor's Appointment Dashboard</h1>

      <div className="selector-container">
        <div className="selector">
          <label htmlFor="year">Select Year: </label>
          <select id="year" value={year} onChange={handleYearChange}>
            <option value="">All Years</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="selector">
          <label htmlFor="month">Select Month: </label>
          <select
            id="month"
            value={month}
            onChange={handleMonthChange}
            disabled={!year}
          >
            <option value="">All Months</option>
            {months.map((mon) => (
              <option key={mon.value} value={mon.value}>
                {mon.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-appointment-container">
        <div className="chart-container-doc">
          <h2>Appointments Overview</h2>
          <LineChart width={500} height={335} data={graphData} >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={getXAxisDataKey()} />
            
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="appointment_count" stroke="#8884d8">
              <LabelList dataKey="appointment_count" position="bottom" />
            </Line>          
            </LineChart>
        </div>

        <div className="appointment-list">
          <h2>Appointments Details </h2>
          <p>Total Appointments: {appointments.length}</p>
          <ul>
            {appointments.map((appt, index) => (
              <li key={index}>
                <strong>Date:</strong> {appt.date} | <strong>Patient:</strong> {appt.patient_name} | <strong>Appointments:</strong> {appt.appointment_count}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;

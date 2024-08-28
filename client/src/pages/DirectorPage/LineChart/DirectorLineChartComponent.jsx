import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DirectorLineChartComponent = () => {
  const [data, setData] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await axios.get('/api/director-hospitals');
        setHospitals(response.data);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      }
    };

    fetchHospitals();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/director-page', {
          params: { hospital_id: selectedHospitalId }
        });
        // Sort data by year before setting it to state
        const sortedData = response.data.yearly_appointments.sort((a, b) => a.year - b.year);
        setData(sortedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const fetchHospitalDetails = async () => {
      if (selectedHospitalId) {
        try {
          const response = await axios.get(`/api/hospital-details/${selectedHospitalId}`);
          setHospitalDetails(response.data);
        } catch (error) {
          console.error('Error fetching hospital details:', error);
        }
      } else {
        setHospitalDetails(null);
      }
    };

    fetchData();
    fetchHospitalDetails();
  }, [selectedHospitalId]);

  const handleDepartmentClick = (department) => {
    if (hospitalDetails && department.email) {
      navigate(`/department/${department.id}`, { state: { email: department.email } });
    } else {
      console.error('Department details or email is missing.');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '25%', padding: '20px' }}>
        <div>
          <label htmlFor="hospital-dropdown">Select Hospital:</label>
          <select
            id="hospital-dropdown"
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
          >
            <option value="">All Hospitals</option>
            {hospitals.map(hospital => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </div>

        {hospitalDetails && (
          <div style={{ marginTop: '20px' }}>
            <h2>{hospitalDetails.name}</h2>
            <p><strong>Director Name:</strong> {hospitalDetails.director_name}</p>
            <h3>Departments:</h3>
            <ul>
              {hospitalDetails.departments.map(department => (
                <li key={department.id}>
                  <button onClick={() => handleDepartmentClick(department)}>
                    {department.name}
                  </button>
                  {' - '}{department.head_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ width: '75%' }}>
        <h2>Yearly Appointments</h2>
        <ResponsiveContainer width="100%" height={500}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            type="category" // Use category for non-numeric axis
            tickMargin={10} // Add space between x-axis and labels
            padding={{ top: 10 }} // Add padding to the top of the x-axis
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="appointment_count" stroke="#8884d8">
            <LabelList dataKey="appointment_count" position="bottom" />
          </Line>
        </LineChart>
      </ResponsiveContainer>

      </div>
    </div>
  );
};

export default DirectorLineChartComponent;

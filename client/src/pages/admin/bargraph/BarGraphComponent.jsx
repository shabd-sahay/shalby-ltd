import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList } from 'recharts';
import { LineChart, Line } from 'recharts';

const BarChartComponent = () => {
  const [barChartData, setBarChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [year, setYear] = useState('');
  const [years, setYears] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await axios.get('/api/years');
        let yearsData = response.data;
    
        // Sort yearsData in descending order
        yearsData = yearsData.sort((a, b) => b - a);
        
        // Set the sorted years in state
        setYears(yearsData);
    
        // Set the most recent year as the default selected year
        if (yearsData.length > 0) {
          setYear(yearsData[0]);  // Most recent year is the first in the sorted array
        }
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };
    

    const fetchHospitals = async () => {
      try {
        const response = await axios.get('/api/hospitals');
        setHospitals(response.data);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      }
    };

    fetchYears();
    fetchHospitals();
  }, []);

  useEffect(() => {
    const fetchBarChartData = async () => {
      try {
        const response = await axios.get('/api/admin-dashboard/bar-chart', {
          params: { year, hospital_id: selectedHospital }
        });

        const sortedData = response.data.monthly_appointments.sort((a, b) => a.month - b.month);
        setBarChartData(sortedData);
      } catch (error) {
        console.error('Error fetching bar chart data:', error);
      }
    };

    const fetchLineChartData = async () => {
      try {
        const response = await axios.get('/api/admin-dashboard/line-chart', {
          params: { year, hospital_id: selectedHospital }
        });

        if (response.data && response.data.monthly_appointments) {
          const sortedData = response.data.monthly_appointments.sort((a, b) => a.month - b.month);
          setLineChartData(sortedData);
        } else {
          console.error('No data received for line chart');
        }
      } catch (error) {
        console.error('Error fetching line chart data:', error);
      }
    };

    fetchBarChartData();
    fetchLineChartData();
  }, [year, selectedHospital]);

  return (
    <div>
      <div>
        <label htmlFor="year">Select Year: </label>
        <select
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="hospital">Select Hospital: </label>
        <select
          id="hospital"
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
        >
          <option value="">All Hospitals</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {barChartData.length > 0 && (
            <BarChart
              width={600}
              height={400}
              data={barChartData}
              margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(month) => monthNames[month - 1]} 
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="appointment_count" fill="#8884d8" >
              <LabelList dataKey="appointment_count" position="top" />
              </Bar>
            </BarChart>
          )}
        </div>

        <div>
          <LineChart
            width={600}
            height={400}
            data={lineChartData}
            margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(month) => monthNames[month - 1]} 
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {lineChartData.length > 0 && Object.keys(lineChartData[0])
              .filter(key => key !== 'month')
              .map(department => (
                <Line
                  key={department}
                  type="monotone"
                  dataKey={department}
                  stroke={getRandomColor()}
                />
              ))}
          </LineChart>
        </div>
      </div>
    </div>
  );
};

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default BarChartComponent;

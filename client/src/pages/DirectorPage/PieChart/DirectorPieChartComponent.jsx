import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import './DirectorPieChartComponent.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CC8', '#FF4560', '#1E90FF'];

const PieChartComponent = () => {
  const [data, setData] = useState([]);
  const [year, setYear] = useState('');
  const [years, setYears] = useState([]);

  useEffect(() => {
    // Fetch years for the dropdown menu
    const fetchYears = async () => {
      try {
        const response = await axios.get('/api/years');
        setYears(response.data);
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    // Fetch data based on the selected year or combined data if no year selected
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/director-dashboard/pie-chart', {
          params: { year }
        });
        setData(response.data.hospital_appointments);
      } catch (error) {
        console.error('Error fetching pie chart data:', error);
      }
    };

    fetchData();
  }, [year]);

  const renderCustomLabel = ({ name, value }) => {
    return value > 5 ? `${name} (${value})` : '';
  };
  

  return (
    <div>
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

      {data.length > 0 && (
        <PieChart width={1300} height={400}>
          <Pie
            data={data}
            cx="450"
            cy="50%"
            outerRadius={120}
            innerRadius={60}  // Create the ring effect
            fill="#8884d8"
            dataKey="appointment_count"
            nameKey="hospital_name"
            label = {renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend 
          layout="vertical"
          align="right"
          verticalAlign="middle"
        />
        </PieChart>
      )}
    </div>
  );
};

export default PieChartComponent;

// AdminPage.jsx
import React from 'react';
import './AdminPage.css';
import LineChartComponent from './LineChart/LineChartComponent';
import BarChartComponent from './bargraph/BarGraphComponent';
import PieChartComponent from './piechart/PieChartComponent';

const AdminPage = () => {
  return (
    <div className="admin-page-container">
      <h1>Admin Dashboard</h1>
      <div className="chart-container">
        <LineChartComponent />
        
      </div>
      <div className="chart-container">
        <BarChartComponent />
      </div>
      <div className="chart-container">
        <PieChartComponent />
      </div>
    </div>
  );
};

export default AdminPage;

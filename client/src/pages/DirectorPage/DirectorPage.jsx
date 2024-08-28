import React from 'react';
import './DirectorPage.css';
import DirectorLineChartComponent from './LineChart/DirectorLineChartComponent';
import MiddleChartComponent from './MiddleCharts/MiddleChartComponent';
import DirectorPieChartComponent from './PieChart/DirectorPieChartComponent';

function DirectorPage() {
  return (
    <div className="director-page-container">
      <h1>Director Dashboard</h1>
      <div className="chart-container">
        <DirectorLineChartComponent />
      </div>
      <div className="chart-container">
        <MiddleChartComponent />
      </div>
      <div className="chart-container">
        <DirectorPieChartComponent />
      </div>
    </div>
  );
}

export default DirectorPage;

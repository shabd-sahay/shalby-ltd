import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminPage from './pages/admin/AdminPage';
import DirectorPage from './pages/DirectorPage/DirectorPage';
import DepartmentHeadPage from './pages/Department/DepartmentHeadPage';
import DoctorPage from './pages/DoctorPage/DoctorPage';


function App() {
  const [user, setUser] = useState(null); // Manage user state in App

  return (
    
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} /> {/* Pass setUser to Login */}
        {user ? (
          <>
            {console.log(user)}
            {user.role === 'admin' && <Route path="/admin" element={<AdminPage details = {user.email}/>} />}
            {user.role === 'hospital_director' && <Route path="/director" element={<DirectorPage details = {user.email}/>} />}
            {user.role === 'department_head' && <Route path="/department-head" element={<DepartmentHeadPage details = {user.email}/>} />}
            {user.role === 'doctor' && <Route path="/doctor" element={<DoctorPage details = {user.email}/>} />}
            <Route path="/department/:id" element={<DepartmentHeadPage />} />
            <Route path ="/doctor/:doctor_email" element={<DoctorPage />} />
            

            <Route path="*" element={<Navigate to={`/${user.role}`} />} />
            
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    
  );
}

export default App;

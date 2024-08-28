import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpeg'; // Assuming you have the Shalby logo in your assets folder
import './LoginPage.css'; // Custom CSS file

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user) {
        setUser(user); // Pass the authenticated user to the parent component
        switch (user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'hospital_director':
            navigate('/director');
            break;
          case 'department_head':
            navigate('/department-head');
            break;
          case 'doctor':
            navigate('/doctor');
            break;
          default:
            navigate('/login');
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
    <div className="login-box">
      <img src={logo} alt="Shalby Hospital" className="logo" />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  </div>
  );
}

export default Login;

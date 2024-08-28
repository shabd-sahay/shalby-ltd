import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:8080/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      console.log("in AuthContext",data)
      setUser({ email, role: data.role });
      return { email, role: data.role }; // Return the user object for use in the login component
    } else {
      throw new Error(data.error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setUser({ email: null, role }); // Email might not be in localStorage, so you can set it to null
    }
  }, []);
  

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext more easily
export const useAuth = () => {
  console.log(useContext(AuthContext));
  return useContext(AuthContext);
};

import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      const loggedInUser = { email, role: data.role };
      setUser(loggedInUser); // Update user state
      return loggedInUser; // Return the user object
    } else {
      throw new Error(data.error);
    }
  };

  useEffect(() => {
    // Check for a logged-in user on component mount
    const fetchUser = async () => {
      // Fetch current user (if applicable) and set user state
    };
    fetchUser();
  }, []);

  return { user, login };
}

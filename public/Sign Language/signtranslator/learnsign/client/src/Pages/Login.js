import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [changePwData, setChangePwData] = useState({
    current_password: '',
    new_password: ''
  });
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState('');
  const [changePwSuccess, setChangePwSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await axios.post('http://localhost:5000/api/login', formData);
      setCurrentUser(response.data);
      setSuccess(true);
      setFormData({ username: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSuccess(false);
  };

  const handleRemoveUser = async (userId) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      fetchUsers();
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(null);
        setSuccess(false);
      }
    } catch (err) {
      console.error('Error removing user:', err);
    }
    setLoading(false);
  };

  const handleChangePwInput = (e) => {
    setChangePwData({
      ...changePwData,
      [e.target.name]: e.target.value
    });
    setChangePwError('');
    setChangePwSuccess('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwLoading(true);
    setChangePwError('');
    setChangePwSuccess('');
    try {
      const response = await axios.post('http://localhost:5000/api/change-password', {
        user_id: currentUser.id,
        current_password: changePwData.current_password,
        new_password: changePwData.new_password
      });
      setChangePwSuccess(response.data.message);
      setChangePwData({ current_password: '', new_password: '' });
    } catch (err) {
      setChangePwError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to change password'
      );
    }
    setChangePwLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {!currentUser ? (
          <div className="login-form">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Login successful!</p>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <button type="submit" disabled={loading} className="login-btn">
                {loading ? <span className="spinner"></span> : 'Login'}
              </button>
            </form>
          </div>
        ) : (
          <div className="user-info">
            <h2>Welcome, {currentUser.username}!</h2>
            {success && <p className="success">You are logged in!</p>}
            <button onClick={handleLogout}>Logout</button>
            <div className="change-password-section">
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group password-group">
                  <input
                    type="password"
                    name="current_password"
                    placeholder="Current Password"
                    value={changePwData.current_password}
                    onChange={handleChangePwInput}
                    required
                  />
                </div>
                <div className="form-group password-group">
                  <input
                    type="password"
                    name="new_password"
                    placeholder="New Password"
                    value={changePwData.new_password}
                    onChange={handleChangePwInput}
                    required
                  />
                </div>
                <button type="submit" className="login-btn" disabled={changePwLoading}>
                  {changePwLoading ? <span className="spinner"></span> : 'Change Password'}
                </button>
              </form>
              {changePwError && <p className="error">{changePwError}</p>}
              {changePwSuccess && <p className="success">{changePwSuccess}</p>}
            </div>
          </div>
        )}

        <div className="users-list">
          <h3>Registered Users</h3>
          {loading ? (
            <div className="spinner users-spinner"></div>
          ) : (
            <ul>
              {users.map(user => (
                <li
                  key={user.id}
                  className={currentUser && currentUser.id === user.id ? 'current-user' : ''}
                >
                  {user.username}
                  {currentUser && currentUser.id === user.id && ' (You)'}
                  {currentUser && (
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="remove-btn"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 
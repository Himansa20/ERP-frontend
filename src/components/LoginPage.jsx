import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Lock, User, ShieldAlert, CheckCircle, Factory } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation and API errors
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setApiError('');

    // Frontend Form Validation
    if (!username.trim()) {
      setValidationError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setValidationError('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      // API call to the Spring Boot backend
      const response = await axios.post('/api/auth/login', {
        username: username.trim(),
        password: password
      });

      const { token, tokenType, username: responseUser, role } = response.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('tokenType', tokenType || 'Bearer');
      localStorage.setItem('username', responseUser);
      localStorage.setItem('role', role);

      // Trigger redirect/state change in App
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data) {
        // Display backend error message if available
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          setApiError(errorData);
        } else if (errorData.message) {
          setApiError(errorData.message);
        } else {
          setApiError('Authentication failed. Invalid username or password.');
        }
      } else {
        setApiError('Unable to connect to the authentication server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans">
      {/* Login Card */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-150 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Pane - ERP Branding */}
        <div className="w-full md:w-1/2 bg-blue-600 p-8 md:p-12 flex flex-col justify-between text-white relative">
          {/* Subtle background pattern decoration */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          
          {/* Top Logo and Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg backdrop-blur-sm flex items-center justify-center h-12 w-12 overflow-hidden">
              <img src={logoImg} alt="BlueWhale Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider uppercase">BlueWhale</span>
              <span className="text-blue-200 text-sm block -mt-1">Manufacturing</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="my-12 md:my-auto relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Manufacturing ERP System
            </h1>
            <p className="mt-4 text-blue-100 text-sm md:text-base font-light">
              Secure Enterprise Resource Planning Platform for modern production, inventory, and analytics operations.
            </p>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 text-xs text-blue-200/80 mt-4">
            &copy; 2026 BlueWhale Manufacturing. All rights reserved.
          </div>
        </div>

        {/* Right Pane - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">Please enter your enterprise credentials to continue</p>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="mb-6 flex items-center gap-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-md text-amber-800 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-md text-red-800 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Lock, User, ShieldAlert, CheckCircle, Factory, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation and API errors
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');

  // Load remembered username if exists
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

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
      // Save or remove remembered username based on checkbox status
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username.trim());
      } else {
        localStorage.removeItem('rememberedUsername');
      }

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-blue-100 p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Decorative blurred background shapes */}
      <div className="absolute w-96 h-96 rounded-full bg-blue-400/20 blur-3xl -top-20 -left-20 pointer-events-none"></div>
      <div className="absolute w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl -bottom-20 -right-20 pointer-events-none"></div>
      
      {/* Main Login Card with Glassmorphism */}
      <div className="w-full max-w-5xl bg-white/50 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 overflow-hidden flex flex-col md:flex-row min-h-[600px] transition-all duration-300">
        
        {/* Left Pane - Branding & Manufacturing Hero Illustration */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Grid pattern decoration */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          
          {/* Top Logo and Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md flex items-center justify-center h-10 w-10 border border-white/20">
              <Factory className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider uppercase text-white">Company</span>
              <span className="text-blue-300 text-xs block -mt-1 font-semibold">Manufacturing</span>
            </div>
          </div>

          {/* Core Branding Info & Illustration */}
          <div className="my-auto relative z-10 space-y-6">
            <div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30 uppercase tracking-widest">
                Enterprise Resource Planning
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white mt-4">
                Company Manufacturing ERP
              </h1>
              <p className="mt-2 text-blue-200/90 text-sm font-medium">
                Integrated Manufacturing Resource Planning Platform
              </p>
            </div>

            {/* Premium Interactive Inline SVG Illustration representing production, inventory, logistics */}
            <div className="w-full relative py-2">
              <svg viewBox="0 0 400 280" className="w-full h-auto max-h-[250px] md:max-h-[280px] my-2 animate-float-slow select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Blueprint style Grid */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="400" height="280" fill="url(#grid)" rx="12" />
                
                {/* Supply Chain Logistics Flows (Animated dotted lines) */}
                {/* Factory to Warehouse */}
                <path d="M 80 200 C 140 200, 140 100, 200 100" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 80 200 C 140 200, 140 100, 200 100" stroke="#38bdf8" strokeWidth="2" className="animate-flow-dash" />
                
                {/* Warehouse to Distribution */}
                <path d="M 200 100 C 260 100, 260 180, 320 180" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 200 100 C 260 100, 260 180, 320 180" stroke="#60a5fa" strokeWidth="2" className="animate-flow-dash" />

                {/* Factory to Distribution Direct Route */}
                <path d="M 80 200 C 180 250, 260 230, 320 180" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Smart Factory Silhouette (Left) */}
                <g transform="translate(40, 150)">
                  {/* Factory building structure */}
                  <path d="M 10 50 L 10 20 L 25 30 L 25 15 L 40 25 L 40 10 L 55 20 L 70 10 L 70 50 Z" fill="rgba(15, 23, 42, 0.6)" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1="20" y1="50" x2="20" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1="32" y1="50" x2="32" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1="45" y1="50" x2="45" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1="58" y1="50" x2="58" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Smokestack and animated production pulse */}
                  <circle cx="70" cy="5" r="3" fill="#38bdf8" className="animate-pulse" />
                </g>

                {/* Animated Gears (Production / Automation) */}
                {/* Gear 1 (Big) */}
                <g transform="translate(80, 200)" className="animate-spin-gear">
                  <circle cx="0" cy="0" r="16" fill="rgba(30, 41, 59, 0.8)" stroke="#38bdf8" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  {/* Gear teeth */}
                  <path d="M -2 -18 L 2 -18 L 3 -15 L -3 -15 Z" fill="#38bdf8" />
                  <path d="M -2 18 L 2 18 L 3 15 L -3 15 Z" fill="#38bdf8" />
                  <path d="M -18 -2 L -18 2 L -15 3 L -15 -3 Z" fill="#38bdf8" />
                  <path d="M 18 -2 L 18 2 L 15 3 L 15 -3 Z" fill="#38bdf8" />
                  <path d="M -13 -13 L -10 -10 L -12 -8 L -15 -11 Z" fill="#38bdf8" />
                  <path d="M 13 13 L 10 10 L 12 8 L 15 11 Z" fill="#38bdf8" />
                  <path d="M -13 13 L -10 10 L -12 8 L -15 11 Z" fill="#38bdf8" />
                  <path d="M 13 -13 L 10 -10 L 12 -8 L 15 -11 Z" fill="#38bdf8" />
                </g>
                
                {/* Gear 2 (Small) */}
                <g transform="translate(112, 218)" class="animate-spin-gear-reverse">
                  <circle cx="0" cy="0" r="10" fill="rgba(30, 41, 59, 0.8)" stroke="#60a5fa" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
                  {/* Gear teeth */}
                  <path d="M -1.5 -11 L 1.5 -11 L 2 -9 L -2 -9 Z" fill="#60a5fa" />
                  <path d="M -1.5 11 L 1.5 11 L 2 9 L -2 9 Z" fill="#60a5fa" />
                  <path d="M -11 -1.5 L -11 1.5 L -9 2 L -9 -1.5 Z" fill="#60a5fa" />
                  <path d="M 11 -1.5 L 11 1.5 L 9 2 L 9 -1.5 Z" fill="#60a5fa" />
                </g>

                {/* Warehouse & Smart Inventory Rack (Center Node) */}
                <g transform="translate(170, 70)">
                  {/* Main base */}
                  <rect x="10" y="10" width="40" height="40" rx="4" fill="rgba(15, 23, 42, 0.7)" stroke="#60a5fa" strokeWidth="1.5" />
                  {/* Storage cells grid */}
                  <line x1="10" y1="23" x2="50" y2="23" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1" />
                  <line x1="10" y1="36" x2="50" y2="36" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1" />
                  <line x1="23" y1="10" x2="23" y2="50" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1" />
                  <line x1="36" y1="10" x2="36" y2="50" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1" />
                  {/* Glowing inventory items */}
                  <circle cx="16" cy="16" r="3" fill="#38bdf8" />
                  <circle cx="29" cy="16" r="3" fill="#22c55e" />
                  <circle cx="43" cy="29" r="3" fill="#38bdf8" />
                  <circle cx="16" cy="43" r="3" fill="#eab308" class="animate-pulse" />
                  <circle cx="29" cy="43" r="3" fill="#38bdf8" />
                </g>
                <text x="190" y="62" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="0.5">INVENTORY</text>

                {/* Supply Chain Logistics Node (Right Hub) */}
                <g transform="translate(300, 140)">
                  {/* Warehouse building outline */}
                  <path d="M 10 50 L 10 30 L 30 15 L 50 30 L 50 50 Z" fill="rgba(15, 23, 42, 0.6)" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Door */}
                  <rect x="24" y="38" width="12" height="12" fill="rgba(30, 41, 59, 0.8)" stroke="#38bdf8" strokeWidth="1" />
                  {/* Radar ring emitting signal */}
                  <circle cx="30" cy="15" r="6" stroke="#38bdf8" strokeWidth="1" fill="none" class="animate-ping" style={{ transformOrigin: '30px 15px' }} />
                  <circle cx="30" cy="15" r="3" fill="#38bdf8" />
                </g>
                <text x="330" y="132" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="0.5">DISTRIBUTION</text>

                {/* Data Analytics & Dashboard Overlay (Top Left) */}
                <g transform="translate(40, 30)">
                  {/* Small Dashboard window */}
                  <rect width="100" height="50" rx="6" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                  <path d="M 10 40 L 30 20 L 50 35 L 75 15 L 90 25" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="75" cy="15" r="2.5" fill="#ffffff" />
                  {/* Small bars */}
                  <rect x="10" y="42" width="6" height="3" fill="#60a5fa" />
                  <rect x="20" y="42" width="6" height="5" fill="#60a5fa" />
                  <rect x="30" y="42" width="6" height="2" fill="#60a5fa" />
                  <rect x="40" y="42" width="6" height="8" fill="#38bdf8" />
                  <rect x="50" y="42" width="6" height="4" fill="#38bdf8" />
                  {/* Pulsing heartbeat indicator */}
                  <circle cx="90" cy="8" r="2" fill="#22c55e" class="animate-pulse-node" />
                  <text x="10" y="12" fill="#94a3b8" fontSize="7" fontWeight="600">LIVE TELEMETRY</text>
                </g>

                {/* Sensor Nodes */}
                <g transform="translate(140, 130)">
                  <circle cx="0" cy="0" r="4" fill="rgba(30, 41, 59, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                </g>
                <g transform="translate(250, 180)">
                  <circle cx="0" cy="0" r="4" fill="rgba(30, 41, 59, 0.9)" stroke="#22c55e" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="1.5" fill="#22c55e" class="animate-pulse" />
                </g>
              </svg>
            </div>
            
            {/* Welcome Message Card */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-4 flex items-start gap-3 shadow-inner">
              <CheckCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-100 text-sm font-normal leading-relaxed">
                Streamline Production, Inventory, Procurement, and Sales Operations
              </p>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 text-xs text-blue-300/60 mt-4 flex justify-between items-center border-t border-white/10 pt-4">
            <span>Secure Enterprise Edition</span>
            <span>v4.2.1-EE</span>
          </div>
        </div>

        {/* Right Pane - Modern Authentication Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white/80 backdrop-blur-md">
          <div className="my-auto space-y-6">
            
            {/* Header / Brand */}
            <div>
              <div className="flex md:hidden items-center gap-2 mb-6">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <Factory className="h-5 w-5" />
                </div>
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-sm">Company Manufacturing ERP</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-850 tracking-tight">Sign In</h2>
              <p className="text-sm text-slate-500 mt-1">Please enter your credentials to access your portal</p>
            </div>

            {/* Validation Alert */}
            {validationError && (
              <div className="flex items-center gap-3 bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-amber-900 text-sm shadow-sm animate-fade-in">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
                <span className="font-medium">{validationError}</span>
              </div>
            )}

            {/* API Error Alert */}
            {apiError && (
              <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-red-900 text-sm shadow-sm animate-fade-in">
                <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
                <span className="font-medium">{apiError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={isLoading}
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex="-1"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/35 cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                    Remember Me
                  </span>
                </label>
                <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                  Contact IT Support
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
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
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Footer Info */}
          <div className="text-center text-xs text-slate-400 mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between">
            <span>&copy; 2026 Company Manufacturing ERP</span>
            <span className="font-medium text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Secure Terminal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { validateTestCredentials } from '../utils/testCredentials';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      // Validate against test credentials
      const result = validateTestCredentials(email, password);

      if (result.valid) {
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        localStorage.setItem('isLoggedIn', 'true');

        // Call onLogin callback
        onLogin(result.user);
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Billing Software</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Test Credentials Toggle */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
          >
            {showCredentials ? 'Hide' : 'Show'} Test Credentials
          </button>

          {showCredentials && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-3">
              <div className="border-b pb-2">
                <p className="font-semibold text-gray-700">Admin Account:</p>
                <p className="text-gray-600">Email: vaibhavwaghalkar2@gmail.com</p>
                <p className="text-gray-600">Password: admin123</p>
              </div>
              <div className="border-b pb-2">
                <p className="font-semibold text-gray-700">Test Account:</p>
                <p className="text-gray-600">Email: test@yuktitechsolution.com</p>
                <p className="text-gray-600">Password: test123</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Demo Account:</p>
                <p className="text-gray-600">Email: demo@demo.com</p>
                <p className="text-gray-600">Password: demo123</p>
              </div>
              <p className="text-xs text-gray-500 italic mt-3">
                All test accounts have unlimited access with no license expiration
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2024 Yukti Tech Solution</p>
          <p className="mt-1">For testing purposes only</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

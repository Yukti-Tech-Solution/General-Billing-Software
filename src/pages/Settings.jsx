import React, { useEffect, useState } from 'react';
import { getCompany, saveCompany } from '../database/db';
import { toast } from 'react-toastify';
import {
  signIn,
  signUp,
  signOutUser,
  getCurrentUser,
  onAuthStateChange,
  enableAutoSync,
  disableAutoSync,
  syncAll,
  getSyncStatus,
  getPendingChanges,
  getLastSyncTime,
  checkOnlineStatus
} from '../database/syncManager';
import { format } from 'date-fns';

const Settings = () => {
  const [company, setCompany] = useState({
    name: '',
    phone: '',
    address: '',
    gstin: '',
    logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '' });
  
  // Sync state
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline');
  const [pendingChanges, setPendingChanges] = useState({ total: 0 });
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState(true);

  useEffect(() => {
    loadCompany();
    checkAuthState();
    loadSyncSettings();
    checkOnlineStatus();
    showBillsFolderPath();
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadSyncSettings();
      }
    });

    // Check online status periodically
    const onlineInterval = setInterval(() => {
      const isOnline = checkOnlineStatus();
      setOnlineStatus(isOnline);
      setSyncStatus(getSyncStatus());
    }, 5000);

    // Update sync status periodically
    const syncInterval = setInterval(() => {
      updateSyncStatus();
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(onlineInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const checkAuthState = async () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  const loadSyncSettings = async () => {
    const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
    setAutoSync(autoSyncEnabled);
    await updateSyncStatus();
  };

  const updateSyncStatus = async () => {
    try {
      setSyncStatus(getSyncStatus());
      const pending = await getPendingChanges();
      setPendingChanges(pending);
      
      // Get last sync time for each collection
      const companyTime = await getLastSyncTime('company');
      const productsTime = await getLastSyncTime('products');
      const customersTime = await getLastSyncTime('customers');
      const invoicesTime = await getLastSyncTime('invoices');
      
      // Get the most recent sync time
      const times = [companyTime, productsTime, customersTime, invoicesTime].filter(Boolean);
      if (times.length > 0) {
        const mostRecent = new Date(Math.max(...times.map(t => new Date(t).getTime())));
        setLastSyncTime(mostRecent);
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  };

  const checkOnlineStatus = () => {
    const isOnline = navigator.onLine;
    setOnlineStatus(isOnline);
    return isOnline;
  };

  const showBillsFolderPath = async () => {
    try {
      if (window.electronAPI && window.electronAPI.getBillsFolderPath) {
        const result = await window.electronAPI.getBillsFolderPath();
        if (result.success && result.path) {
          const pathInput = document.getElementById('bills-folder-path');
          if (pathInput) {
            pathInput.value = result.path;
          }
        }
      }
    } catch (error) {
      console.error('Error loading bills folder path:', error);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      
      // Try file-based storage first (new method)
      if (window.electronAPI && window.electronAPI.loadCompanySettings) {
        const result = await window.electronAPI.loadCompanySettings();
        if (result.success && result.settings) {
          setCompany({
            name: result.settings.name || result.settings.companyName || '',
            phone: result.settings.phone || '',
            address: result.settings.address || '',
            gstin: result.settings.gstin || '',
            logo: result.settings.logo || ''
          });
          return;
        }
      }
      
      // Fallback to database
      const companyData = await getCompany();
      if (companyData) {
        setCompany(companyData);
      }
    } catch (error) {
      toast.error('Failed to load company details');
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCompany(prev => ({ ...prev, logo: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!company.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      setSaving(true);
      
      // Try file-based storage first (new method)
      if (window.electronAPI && window.electronAPI.saveCompanySettings) {
        const settings = {
          name: company.name,
          companyName: company.name, // Alias for compatibility
          phone: company.phone,
          address: company.address,
          gstin: company.gstin,
          logo: company.logo
        };
        
        const result = await window.electronAPI.saveCompanySettings(settings);
        
        if (result.success) {
          toast.success('Company details saved successfully');
          // Also save to database for backward compatibility
          try {
            await saveCompany(company);
          } catch (dbError) {
            console.warn('Failed to save to database (non-critical):', dbError);
          }
          await updateSyncStatus();
          return;
        } else {
          throw new Error(result.error || 'Failed to save settings');
        }
      }
      
      // Fallback to database only
      await saveCompany(company);
      toast.success('Company details saved successfully');
      await updateSyncStatus();
    } catch (error) {
      toast.error('Failed to save company details: ' + (error.message || 'Unknown error'));
      console.error('Error saving company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    if (!authForm.email || !authForm.password) {
      toast.error('Email and password are required');
      return;
    }

    if (isSignUp && authForm.password !== authForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (authForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setAuthLoading(true);
      let result;
      
      if (isSignUp) {
        result = await signUp(authForm.email, authForm.password);
      } else {
        result = await signIn(authForm.email, authForm.password);
      }

      if (result.success) {
        toast.success(isSignUp ? 'Account created successfully' : 'Signed in successfully');
        setShowAuthForm(false);
        setAuthForm({ email: '', password: '', confirmPassword: '' });
        await updateSyncStatus();
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      toast.error('Authentication error: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const result = await signOutUser();
      if (result.success) {
        toast.success('Signed out successfully');
        setUser(null);
        setAutoSync(false);
      }
    } catch (error) {
      toast.error('Sign out error: ' + error.message);
    }
  };

  const handleToggleAutoSync = async () => {
    if (!user) {
      toast.error('Please sign in to enable auto sync');
      return;
    }

    const newValue = !autoSync;
    setAutoSync(newValue);

    if (newValue) {
      enableAutoSync();
      toast.success('Auto sync enabled');
    } else {
      disableAutoSync();
      toast.success('Auto sync disabled');
    }
  };

  const handleSyncNow = async () => {
    if (!user) {
      toast.error('Please sign in to sync');
      return;
    }

    if (!onlineStatus) {
      toast.error('Device is offline. Please check your internet connection.');
      return;
    }

    try {
      setSyncing(true);
      setSyncError(null);
      const result = await syncAll();
      
      if (result.success) {
        toast.success('Sync completed successfully');
        await updateSyncStatus();
      } else {
        const errorMsg = result.error || 'Sync failed';
        setSyncError(errorMsg);
        toast.error('Sync failed: ' + errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || 'Sync error';
      setSyncError(errorMsg);
      toast.error('Sync error: ' + errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      
      {/* Authentication Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication</h2>
        
        {!user ? (
          <div>
            {!showAuthForm ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Sign in to enable cloud sync and access your data across devices.
                </p>
                <button
                  onClick={() => setShowAuthForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In / Sign Up
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthForm({ email: '', password: '', confirmPassword: '' });
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthForm(false);
                        setAuthForm({ email: '', password: '', confirmPassword: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Signed in as</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Settings Section */}
      {user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sync Settings</h2>
          
          {/* Sync Status */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Connection Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${onlineStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">{onlineStatus ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Sync Status</span>
              <div className="flex items-center space-x-2">
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">Syncing...</span>
                  </>
                ) : (
                  <>
                    <div className={`w-3 h-3 rounded-full ${
                      syncStatus === 'synced' ? 'bg-green-500' : 
                      syncStatus === 'syncing' ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">{syncStatus}</span>
                  </>
                )}
              </div>
            </div>
            
            {lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Last Synced</span>
                <span className="text-sm text-gray-600">
                  {format(new Date(lastSyncTime), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            )}
            
            {pendingChanges.total > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Pending Changes</span>
                <span className="text-sm text-orange-600 font-medium">
                  {pendingChanges.total} item{pendingChanges.total !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Sync Error */}
          {syncError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{syncError}</p>
            </div>
          )}

          {/* Auto Sync Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Auto Sync</label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically sync data when changes are made
                </p>
              </div>
              <button
                onClick={handleToggleAutoSync}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSync ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSync ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Manual Sync Button */}
          <button
            onClick={handleSyncNow}
            disabled={syncing || !onlineStatus}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Syncing...</span>
              </>
            ) : (
              <span>Sync Now</span>
            )}
          </button>
        </div>
      )}

      {/* Company Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Company Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                {company.logo ? (
                  <img src={company.logo} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl text-blue-600">M</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={company.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={company.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={company.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company address"
            />
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              value={company.gstin}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter GSTIN"
              maxLength={15}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Bills Storage Location Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bills Storage Location</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Path
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="bills-folder-path"
                readOnly
                value="Loading..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    const result = await window.electronAPI.openBillsFolder();
                    if (result.success) {
                      toast.success('Bills folder opened');
                    } else {
                      toast.error('Failed to open folder: ' + result.error);
                    }
                  } catch (error) {
                    toast.error('Failed to open folder: ' + error.message);
                  }
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                📁 Open Bills Folder
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Invoices are automatically saved in organized folders by year and month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

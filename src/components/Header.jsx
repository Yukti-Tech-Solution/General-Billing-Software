import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getCompany } from '../database/db';
import { getSyncStatus, checkOnlineStatus, getCurrentUser } from '../database/syncManager';

const Header = () => {
  const [company, setCompany] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState('offline');
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await getCompany();
        setCompany(companyData);
      } catch (error) {
        console.error('Error loading company:', error);
      }
    };

    const updateSyncStatus = () => {
      const isOnline = checkOnlineStatus();
      setOnlineStatus(isOnline);
      setSyncStatus(getSyncStatus());
      setUser(getCurrentUser());
    };

    loadCompany();
    updateSyncStatus();
    
    // Update date every minute
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    // Update sync status every 5 seconds
    const syncInterval = setInterval(() => {
      updateSyncStatus();
    }, 5000);
    
    return () => {
      clearInterval(dateInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const getSyncIcon = () => {
    if (!user) {
      return (
        <div className="flex items-center space-x-1 text-gray-400" title="Not signed in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-4.243a3 3 0 101.414 1.414m6.728 0a9 9 0 01-2.167 9.238" />
          </svg>
        </div>
      );
    }

    if (!onlineStatus) {
      return (
        <div className="flex items-center space-x-1 text-red-500" title="Offline">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-4.243a3 3 0 101.414 1.414m6.728 0a9 9 0 01-2.167 9.238" />
          </svg>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div className="flex items-center space-x-1 text-blue-500" title="Syncing...">
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    }

    if (syncStatus === 'synced') {
      return (
        <div className="flex items-center space-x-1 text-green-500" title="Synced">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-1 text-gray-400" title="Sync pending">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {company?.name || 'Billing Software'}
          </h2>
        </div>
        <div className="flex items-center space-x-6">
          {/* Sync Status Indicator */}
          {getSyncIcon()}
          
          {/* Date and Time */}
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {format(currentDate, 'EEEE, MMMM dd, yyyy')}
            </p>
            <p className="text-sm text-gray-500">
              {format(currentDate, 'hh:mm:ss a')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


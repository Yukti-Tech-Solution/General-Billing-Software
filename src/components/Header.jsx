import React from 'react';

const Header = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome to Billing Software
          </h2>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{currentUser.email}</p>
              {currentUser.unlimitedAccess && (
                <p className="text-xs text-green-600 font-semibold">Unlimited Access</p>
              )}
              {!currentUser.unlimitedAccess && (
                <p className="text-xs text-gray-500">{currentUser.role || 'User'}</p>
              )}
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;


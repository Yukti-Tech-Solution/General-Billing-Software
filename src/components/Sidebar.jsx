import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/create-invoice', label: 'Create Invoice', icon: '➕' },
    { path: '/invoices', label: 'Invoice History', icon: '📄' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-bold">Billing Software</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-blue-800 text-sm text-blue-200">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;


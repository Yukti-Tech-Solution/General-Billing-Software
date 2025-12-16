// Test/Demo credentials for development and testing
// These credentials bypass license checking

export const TEST_CREDENTIALS = {
  admin: {
    email: 'vaibhavwaghalkar2@gmail.com',
    password: 'admin123',
    role: 'admin',
    unlimitedAccess: true
  },
  test: {
    email: 'test@yuktitechsolution.com',
    password: 'test123',
    role: 'user',
    unlimitedAccess: true
  },
  demo: {
    email: 'demo@demo.com',
    password: 'demo123',
    role: 'demo',
    unlimitedAccess: true
  }
};

// Validate test credentials
export const validateTestCredentials = (email, password) => {
  const credential = Object.values(TEST_CREDENTIALS).find(
    (cred) => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
  );

  if (credential) {
    return {
      valid: true,
      user: {
        email: credential.email,
        role: credential.role,
        unlimitedAccess: credential.unlimitedAccess
      }
    };
  }

  return { valid: false };
};

// Check if user has unlimited access
export const hasUnlimitedAccess = () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return user.unlimitedAccess === true;
};

// Auto-generate unlimited license for test users
export const createUnlimitedLicense = (email, name) => {
  return {
    customer_email: email,
    customer_name: name,
    activation_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100 years
    is_active: 1,
    license_key: 'UNLIMITED-ACCESS-KEY',
    notes: 'Unlimited test access - no expiration'
  };
};

// Simple license key generator
export const generateLicenseKey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 20; i++) {
    if (i > 0 && i % 5 === 0) key += '-';
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

export default generateLicenseKey;


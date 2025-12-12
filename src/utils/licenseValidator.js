import { activateLicense, getLicenseStatus, validateLicenseKey } from '../database/db';

export const validateLicense = async (email, licenseKey) => {
  const result = await validateLicenseKey(email, licenseKey);
  return result;
};

export const checkLicenseStatus = async () => {
  return await getLicenseStatus();
};

export const activateExistingLicense = async (email, licenseKey) => {
  return await activateLicense(email, licenseKey);
};

export default {
  validateLicense,
  checkLicenseStatus,
  activateExistingLicense,
};


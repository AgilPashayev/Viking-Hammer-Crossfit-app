// QR Code utility service for user check-ins
import QRCode from 'qrcode';

export interface QRCodeData {
  userId: string;
  email: string;
  membershipType: string;
  timestamp: string;
  expiresAt: string;
  checkInId: string;
}

// Generate unique QR code ID for user
export const generateQRCodeId = (userId: string, email: string): string => {
  const prefix = 'VH'; // Viking Hammer prefix
  const userPrefix = email.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `${prefix}-${userPrefix}-${timestamp}-${random}`;
};

// Generate QR code data object
export const generateQRCodeData = (
  userId: string,
  email: string,
  membershipType: string,
): QRCodeData => {
  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Expires in 24 hours
  const checkInId = generateQRCodeId(userId, email);

  return {
    userId,
    email,
    membershipType,
    timestamp,
    expiresAt,
    checkInId,
  };
};

// Generate QR code image as data URL
export const generateQRCodeImage = async (qrData: QRCodeData): Promise<string> => {
  try {
    const qrString = JSON.stringify(qrData);

    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0b5eff', // Blue QR code
        light: '#ffffff', // White background
      },
      errorCorrectionLevel: 'M',
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Validate QR code (for scanning/verification)
export const validateQRCode = (qrData: QRCodeData): { isValid: boolean; reason?: string } => {
  const now = new Date();
  const expiresAt = new Date(qrData.expiresAt);

  if (now > expiresAt) {
    return { isValid: false, reason: 'QR code has expired' };
  }

  if (!qrData.userId || !qrData.email || !qrData.checkInId) {
    return { isValid: false, reason: 'Invalid QR code data' };
  }

  return { isValid: true };
};

// Store QR code in localStorage for demo mode
export const storeQRCode = (userId: string, qrData: QRCodeData): void => {
  try {
    const storedQRs = getStoredQRCodes();
    storedQRs[userId] = qrData;
    localStorage.setItem('viking_qr_codes', JSON.stringify(storedQRs));
  } catch (error) {
    console.warn('Failed to store QR code:', error);
  }
};

// Get stored QR codes from localStorage
export const getStoredQRCodes = (): { [userId: string]: QRCodeData } => {
  try {
    const stored = localStorage.getItem('viking_qr_codes');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Get user's current QR code
export const getUserQRCode = (userId: string): QRCodeData | null => {
  const storedQRs = getStoredQRCodes();
  const userQR = storedQRs[userId];

  if (!userQR) {
    return null;
  }

  // Check if QR code is still valid
  const validation = validateQRCode(userQR);
  if (!validation.isValid) {
    // Remove expired QR code
    delete storedQRs[userId];
    localStorage.setItem('viking_qr_codes', JSON.stringify(storedQRs));
    return null;
  }

  return userQR;
};

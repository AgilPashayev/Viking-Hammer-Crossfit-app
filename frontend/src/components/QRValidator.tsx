import React, { useState } from 'react';
import { validateQRCode, QRCodeData } from '../services/qrCodeService';

interface QRValidatorProps {
  onValidation?: (result: { isValid: boolean; userData?: any; reason?: string }) => void;
}

const QRValidator: React.FC<QRValidatorProps> = ({ onValidation }) => {
  const [scannedData, setScannedData] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    userData?: QRCodeData;
    reason?: string;
  } | null>(null);

  const handleValidateQR = () => {
    try {
      if (!scannedData.trim()) {
        const result = { isValid: false, reason: 'Please enter QR code data' };
        setValidationResult(result);
        onValidation?.(result);
        return;
      }

      // Parse QR code data
      const qrData: QRCodeData = JSON.parse(scannedData);

      // Validate QR code
      const validation = validateQRCode(qrData);

      const result = {
        isValid: validation.isValid,
        userData: validation.isValid ? qrData : undefined,
        reason: validation.reason,
      };

      setValidationResult(result);
      onValidation?.(result);
    } catch (error) {
      const result = { isValid: false, reason: 'Invalid QR code format' };
      setValidationResult(result);
      onValidation?.(result);
    }
  };

  const containerStyle = {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '5px',
    marginBottom: '15px',
    boxSizing: 'border-box' as const,
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0b5eff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  const resultStyle = {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '5px',
    backgroundColor: validationResult?.isValid ? '#d4edda' : '#f8d7da',
    border: `1px solid ${validationResult?.isValid ? '#c3e6cb' : '#f5c6cb'}`,
    color: validationResult?.isValid ? '#155724' : '#721c24',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#0b5eff', marginBottom: '20px' }}>
        🎫 QR Code Validator
      </h2>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Paste QR Code Data:
        </label>
        <textarea
          value={scannedData}
          onChange={(e) => setScannedData(e.target.value)}
          placeholder="Paste the scanned QR code JSON data here..."
          rows={6}
          style={{
            ...inputStyle,
            resize: 'vertical' as const,
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
      </div>

      <button onClick={handleValidateQR} style={buttonStyle}>
        Validate QR Code
      </button>

      {validationResult && (
        <div style={resultStyle}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {validationResult.isValid ? '✅ Valid Check-In' : '❌ Invalid QR Code'}
          </h3>

          {validationResult.isValid && validationResult.userData ? (
            <div>
              <p>
                <strong>User Email:</strong> {validationResult.userData.email}
              </p>
              <p>
                <strong>Membership:</strong> {validationResult.userData.membershipType}
              </p>
              <p>
                <strong>Check-In ID:</strong> {validationResult.userData.checkInId}
              </p>
              <p>
                <strong>Generated:</strong>{' '}
                {new Date(validationResult.userData.timestamp).toLocaleString()}
              </p>
              <p>
                <strong>Expires:</strong>{' '}
                {new Date(validationResult.userData.expiresAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p>
              <strong>Reason:</strong> {validationResult.reason}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Scan the member's QR code using a QR scanner app</li>
          <li>Copy the scanned JSON data and paste it above</li>
          <li>Click "Validate QR Code" to check validity</li>
          <li>Valid codes will show member information</li>
        </ul>
      </div>
    </div>
  );
};

export default QRValidator;

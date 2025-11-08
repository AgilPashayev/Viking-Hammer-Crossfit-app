import React, { useState, useRef, useEffect } from 'react';
import { validateQRCode } from '../services/qrCodeService';
import './QRScanner.css';

interface QRScannerProps {
  onBack: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onBack }) => {
  const [scannedData, setScannedData] = useState<string>('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        isValid: false,
        error: 'Camera access denied. Please allow camera permissions.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureQRCode = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Simulate QR code detection (in real app, use jsQR library)
        const simulatedQRData =
          'VH-MEMBER-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        processScan(simulatedQRData);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualScan = () => {
    if (scannedData.trim()) {
      processScan(scannedData);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would use a QR code library to decode the image
      // For demo purposes, we'll simulate a scan
      setScannedData('VH-DEMO-1697551800000-ABC123');
      processScan('VH-DEMO-1697551800000-ABC123');
    }
  };

  const processScan = async (qrData: string) => {
    setIsScanning(true);
    try {
      // Parse QR data string to object
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as legacy format
        parsedData = {
          userId: qrData.split('-')[2] || 'unknown',
          email: 'demo@example.com',
          membershipType: 'Basic',
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          checkInId: qrData,
        };
      }

      const result = await validateQRCode(parsedData);
      setScanResult(result);

      // Simulate check-in process
      if (result.isValid) {
        await recordCheckIn(parsedData);
      }
    } catch (error) {
      setScanResult({
        isValid: false,
        error: 'Failed to validate QR code',
      });
    }
    setIsScanning(false);
  };

  const recordCheckIn = async (qrData: any) => {
    // In a real app, this would save to database
    const checkIn = {
      userId: qrData.userId,
      userName: qrData.email.split('@')[0],
      timestamp: new Date().toISOString(),
      location: 'Main Entrance',
      membershipStatus: qrData.membershipType,
    };

    console.log('Check-in recorded:', checkIn);
  };

  const resetScanner = () => {
    setScannedData('');
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="qr-scanner">
      <div className="page-header">
        <div className="page-title">
          <h2>QR Code Scanner</h2>
          <p>Scan member QR codes for quick check-in</p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="scanner-container">
        <div className="scanner-methods">
          <div className="method-card">
            <div className="method-icon">�</div>
            <h3>Camera Scanner</h3>
            <p>Use camera to scan QR codes</p>
            {!cameraActive ? (
              <button className="btn btn-primary" onClick={startCamera}>
                Start Camera
              </button>
            ) : (
              <div className="camera-section">
                <video ref={videoRef} autoPlay playsInline className="camera-video" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button className="btn btn-success" onClick={captureQRCode}>
                    Capture QR Code
                  </button>
                  <button className="btn btn-secondary" onClick={stopCamera}>
                    Stop Camera
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="method-card">
            <div className="method-icon">�📷</div>
            <h3>Upload QR Image</h3>
            <p>Select a QR code image from your device</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="file-input"
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              Choose Image
            </button>
          </div>

          <div className="method-card">
            <div className="method-icon">⌨️</div>
            <h3>Manual Entry</h3>
            <p>Enter QR code data manually</p>
            <input
              type="text"
              placeholder="Enter QR code data..."
              value={scannedData}
              onChange={(e) => setScannedData(e.target.value)}
              className="manual-input"
            />
            <button
              className="btn btn-primary"
              onClick={handleManualScan}
              disabled={!scannedData.trim()}
            >
              Process Code
            </button>
          </div>

          <div className="method-card">
            <div className="method-icon">🔍</div>
            <h3>Quick Demo</h3>
            <p>Try with demo QR code</p>
            <button
              className="btn btn-outline"
              onClick={() => {
                setScannedData('VH-DEMO-1697551800000-ABC123');
                processScan('VH-DEMO-1697551800000-ABC123');
              }}
            >
              Use Demo Code
            </button>
          </div>
        </div>

        {isScanning && (
          <div className="scanning-indicator">
            <div className="spinner"></div>
            <p>Processing QR code...</p>
          </div>
        )}

        {scanResult && (
          <div className={`scan-result ${scanResult.isValid ? 'success' : 'error'}`}>
            <div className="result-header">
              <div className={`result-icon ${scanResult.isValid ? 'success' : 'error'}`}>
                {scanResult.isValid ? '✅' : '❌'}
              </div>
              <h3>{scanResult.isValid ? 'Check-in Successful!' : 'Check-in Failed'}</h3>
            </div>

            {scanResult.isValid ? (
              <div className="member-info">
                <div className="member-avatar">{scanResult.user?.name?.charAt(0) || 'M'}</div>
                <div className="member-details">
                  <h4>{scanResult.user?.name || 'Demo Member'}</h4>
                  <p>Membership: {scanResult.user?.membershipType || 'Viking Warrior Basic'}</p>
                  <p>
                    Status: <span className="status active">Active</span>
                  </p>
                  <p>Check-in time: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            ) : (
              <div className="error-info">
                <p>{scanResult.error || 'Invalid QR code'}</p>
                <p>Please check the QR code and try again.</p>
              </div>
            )}

            <div className="result-actions">
              <button className="btn btn-primary" onClick={resetScanner}>
                Scan Another Code
              </button>
              {scanResult.isValid && (
                <button className="btn btn-secondary">View Member Profile</button>
              )}
            </div>
          </div>
        )}

        <div className="recent-scans">
          <h3>Recent Check-ins</h3>
          <div className="scan-history">
            <div className="scan-item">
              <div className="scan-avatar">J</div>
              <div className="scan-details">
                <h4>John Viking</h4>
                <p>Checked in at 2:45 PM</p>
              </div>
              <div className="scan-status success">✅</div>
            </div>
            <div className="scan-item">
              <div className="scan-avatar">S</div>
              <div className="scan-details">
                <h4>Sarah Connor</h4>
                <p>Checked in at 2:30 PM</p>
              </div>
              <div className="scan-status success">✅</div>
            </div>
            <div className="scan-item">
              <div className="scan-avatar">M</div>
              <div className="scan-details">
                <h4>Mike Johnson</h4>
                <p>Failed check-in at 2:15 PM</p>
              </div>
              <div className="scan-status error">❌</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

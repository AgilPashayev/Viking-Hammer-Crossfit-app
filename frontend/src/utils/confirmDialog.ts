// Utility for custom confirmation dialogs
// frontend/src/utils/confirmDialog.ts

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
}

export function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const {
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      type = 'info'
    } = options;

    const iconMap = {
      warning: '⚠️',
      danger: '🗑️',
      info: 'ℹ️',
      success: '✅'
    };

    const colorMap = {
      warning: '#ff9800',
      danger: '#f44336',
      info: '#2196f3',
      success: '#4caf50'
    };

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      animation: slideUp 0.3s ease;
    `;

    dialog.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
      <div style="
        padding: 24px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <span style="font-size: 32px;">${iconMap[type]}</span>
        <h3 style="margin: 0; color: #333; font-size: 1.3rem;">${title}</h3>
      </div>
      <div style="
        padding: 24px;
        color: #555;
        line-height: 1.6;
        white-space: pre-wrap;
      ">${message}</div>
      <div style="
        padding: 16px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        border-top: 1px solid #e0e0e0;
      ">
        <button id="cancel-btn" style="
          padding: 10px 24px;
          border: 2px solid #ddd;
          background: white;
          color: #666;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">${cancelText}</button>
        <button id="confirm-btn" style="
          padding: 10px 24px;
          border: none;
          background: ${colorMap[type]};
          color: white;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement;
    const confirmBtn = dialog.querySelector('#confirm-btn') as HTMLButtonElement;

    // Add hover effects
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#f5f5f5';
      cancelBtn.style.borderColor = '#aaa';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'white';
      cancelBtn.style.borderColor = '#ddd';
    });

    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.transform = 'translateY(-2px)';
      confirmBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.transform = 'translateY(0)';
      confirmBtn.style.boxShadow = 'none';
    });

    const cleanup = () => {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => document.body.removeChild(overlay), 200);
    };

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    confirmBtn.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });
  });
}

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
      type = 'info',
    } = options;

    const iconMap = {
      warning: '⚠️',
      danger: '🗑️',
      info: 'ℹ️',
      success: '✅',
    };

    const colorMap = {
      warning: '#ff9800',
      danger: '#f44336',
      info: '#2196f3',
      success: '#4caf50',
    };

    // Format message to make certain patterns bold
    const formatMessage = (msg: string): string => {
      // Make plan/member names bold (capitalize first letter patterns)
      msg = msg.replace(/Plan: ([^\n]+)/g, '<strong>Plan:</strong> $1');
      msg = msg.replace(/Price: ([^\n]+)/g, '<strong>Price:</strong> $1');
      msg = msg.replace(/Type: ([^\n]+)/g, '<strong>Type:</strong> $1');
      msg = msg.replace(/Member: ([^\n]+)/g, '<strong>Member:</strong> $1');
      msg = msg.replace(/Email: ([^\n]+)/g, '<strong>Email:</strong> $1');
      msg = msg.replace(/Status: ([^\n]+)/g, '<strong>Status:</strong> $1');
      msg = msg.replace(/⚠️ WARNING:/g, '<strong style="color: #ff9800;">⚠️ WARNING:</strong>');
      msg = msg.replace(/❌ ERROR:/g, '<strong style="color: #f44336;">❌ ERROR:</strong>');
      msg = msg.replace(/✅ SUCCESS:/g, '<strong style="color: #4caf50;">✅ SUCCESS:</strong>');
      return msg;
    };

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
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
      border-radius: 20px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
      max-width: 520px;
      width: 92%;
      animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    `;

    dialog.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      </style>
      <div style="
        padding: 28px;
        background: linear-gradient(135deg, ${colorMap[type]}15, ${colorMap[type]}05);
        border-bottom: 2px solid ${colorMap[type]}25;
        display: flex;
        align-items: center;
        gap: 14px;
      ">
        <span style="font-size: 36px; line-height: 1;">${iconMap[type]}</span>
        <h3 style="margin: 0; color: #222; font-size: 1.4rem; font-weight: 700;">${title}</h3>
      </div>
      <div style="
        padding: 28px;
        color: #444;
        line-height: 1.7;
        white-space: pre-wrap;
        font-size: 1rem;
      ">${formatMessage(message)}</div>
      <div style="
        padding: 18px 28px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background: #f9f9f9;
        border-top: 1px solid #e8e8e8;
      ">
        ${
          cancelText
            ? `<button id="cancel-btn" style="
          padding: 12px 28px;
          border: 2px solid #d0d0d0;
          background: white;
          color: #555;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        ">${cancelText}</button>`
            : ''
        }
        <button id="confirm-btn" style="
          padding: 12px 28px;
          border: none;
          background: ${colorMap[type]};
          color: white;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px ${colorMap[type]}40;
        ">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement | null;
    const confirmBtn = dialog.querySelector('#confirm-btn') as HTMLButtonElement;

    // Add hover effects
    if (cancelBtn) {
      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = '#f5f5f5';
        cancelBtn.style.borderColor = '#a0a0a0';
        cancelBtn.style.transform = 'translateY(-1px)';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'white';
        cancelBtn.style.borderColor = '#d0d0d0';
        cancelBtn.style.transform = 'translateY(0)';
      });
    }

    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.transform = 'translateY(-2px)';
      confirmBtn.style.boxShadow = `0 6px 20px ${colorMap[type]}50`;
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.transform = 'translateY(0)';
      confirmBtn.style.boxShadow = `0 4px 12px ${colorMap[type]}40`;
    });

    const cleanup = () => {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }, 200);
    };

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
    }

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

    // ESC key support
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

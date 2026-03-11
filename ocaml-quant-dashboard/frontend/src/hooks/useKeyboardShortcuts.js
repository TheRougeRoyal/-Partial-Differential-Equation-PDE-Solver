import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = (customShortcuts = {}) => {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((event) => {
    // Ignore if typing in input/textarea
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    // Navigation shortcuts (g + key)
    if (key === 'g' && !ctrl && !shift) {
      event.preventDefault();
      window.__waitingForNav = true;
      setTimeout(() => { window.__waitingForNav = false; }, 1000);
      return;
    }

    if (window.__waitingForNav) {
      event.preventDefault();
      window.__waitingForNav = false;
      
      const navMap = {
        'd': '/',
        'p': '/portfolio',
        'o': '/options',
        'r': '/pricing',
        's': '/signals',
        'x': '/orders',
        'b': '/backtest',
        'l': '/live',
      };

      if (navMap[key]) {
        navigate(navMap[key]);
      }
      return;
    }

    // Theme toggle
    if (key === 't' && !ctrl && !shift) {
      if (customShortcuts.toggleTheme) {
        event.preventDefault();
        customShortcuts.toggleTheme();
      }
      return;
    }

    // Quick actions
    if (key === 'n' && ctrl) {
      event.preventDefault();
      if (customShortcuts.newOrder) {
        customShortcuts.newOrder();
      }
      return;
    }

    // Export shortcuts
    if (key === 'e' && ctrl && shift) {
      event.preventDefault();
      if (customShortcuts.exportJSON) {
        customShortcuts.exportJSON();
      }
      return;
    }

    if (key === 'e' && ctrl && !shift) {
      event.preventDefault();
      if (customShortcuts.exportCSV) {
        customShortcuts.exportCSV();
      }
      return;
    }

    // Escape to close modals
    if (key === 'escape') {
      if (customShortcuts.closeModal) {
        customShortcuts.closeModal();
      }
    }

    // Custom shortcuts
    if (customShortcuts[key]) {
      event.preventDefault();
      customShortcuts[key]();
    }
  }, [navigate, customShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const KEYBOARD_SHORTCUTS = [
  { keys: 'g → d', description: 'Go to Dashboard' },
  { keys: 'g → p', description: 'Go to Portfolio' },
  { keys: 'g → o', description: 'Go to Options' },
  { keys: 'g → r', description: 'Go to Pricing' },
  { keys: 'g → s', description: 'Go to Signals' },
  { keys: 'g → x', description: 'Go to Orders' },
  { keys: 'g → b', description: 'Go to Backtest' },
  { keys: 'g → l', description: 'Go to Live' },
  { keys: 't', description: 'Toggle Theme' },
  { keys: 'Ctrl+N', description: 'New Order' },
  { keys: 'Ctrl+E', description: 'Export CSV' },
  { keys: 'Ctrl+Shift+E', description: 'Export JSON' },
  { keys: 'Esc', description: 'Close Modal' },
];

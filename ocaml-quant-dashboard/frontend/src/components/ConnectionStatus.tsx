// Connection Status indicator

import React from 'react';
import clsx from 'clsx';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
  error?: string | null;
  onReconnect?: () => void;
}

export function ConnectionStatus({ connected, error, onReconnect }: ConnectionStatusProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      )}
    >
      {connected ? (
        <>
          <Wifi size={16} />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>{error || 'Disconnected'}</span>
          {onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-1 p-1 rounded-full hover:bg-red-200 transition-colors"
              title="Reconnect"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

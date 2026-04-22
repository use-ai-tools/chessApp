import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
let globalSocket = null;

export default function PingIndicator({ customSocket }) {
  const [ping, setPing] = useState(null);
  const [connected, setConnected] = useState(false);
  const pingStartRef = useRef(0);

  useEffect(() => {
    let socket = customSocket;
    let isInternalSocket = false;

    if (!socket) {
      if (!globalSocket) {
        globalSocket = io(SOCKET_URL, { reconnection: true, transports: ['websocket'], timeout: 60000 });
      }
      socket = globalSocket;
      isInternalSocket = true;
    }

    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setPing(null);
    };
    
    const onPong = () => {
      if (pingStartRef.current > 0) {
        setPing(Date.now() - pingStartRef.current);
        pingStartRef.current = 0;
      }
      if (!connected) setConnected(true); // Failsafe
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pong_check', onPong);

    const interval = setInterval(() => {
      if (socket.connected) {
        pingStartRef.current = Date.now();
        socket.emit('ping_check');
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pong_check', onPong);
      // We don't disconnect the globalSocket here so it can be reused across pages
    };
  }, [customSocket]);

  const getSignalLevel = () => {
    if (!connected || ping === null) return 0;
    if (ping < 80) return 4;
    if (ping < 150) return 3;
    if (ping < 300) return 2;
    return 1;
  };

  const signalLevel = getSignalLevel();

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-navy-900 border border-navy-700 shadow-sm transition-all text-xs">
      {!connected ? (
        <>
          <span className="text-red-500 font-bold ml-1">✕</span>
          <span className="text-red-400 font-medium whitespace-nowrap">Reconnecting...</span>
        </>
      ) : (
        <>
          <div className="flex items-end gap-[2px] h-3 ml-1" title={`${ping}ms`}>
            {/* 1st bar */}
            <div className={`w-1 transition-all duration-300 rounded-sm ${signalLevel >= 1 ? (signalLevel >= 3 ? 'bg-green-500' : signalLevel === 2 ? 'bg-yellow-400' : 'bg-red-500') : 'bg-navy-600'} h-[40%]`} />
            {/* 2nd bar */}
            <div className={`w-1 transition-all duration-300 rounded-sm ${signalLevel >= 2 ? (signalLevel >= 3 ? 'bg-green-500' : 'bg-yellow-400') : 'bg-navy-600'} h-[60%]`} />
            {/* 3rd bar */}
            <div className={`w-1 transition-all duration-300 rounded-sm ${signalLevel >= 3 ? 'bg-green-500' : 'bg-navy-600'} h-[80%]`} />
            {/* 4th bar */}
            <div className={`w-1 transition-all duration-300 rounded-sm ${signalLevel >= 4 ? 'bg-green-500' : 'bg-navy-600'} h-[100%]`} />
          </div>
          <span className={`font-medium ${signalLevel >= 3 ? 'text-green-400' : signalLevel === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
            {ping}ms
          </span>
        </>
      )}
    </div>
  );
}

import React, { createContext, useContext, useRef, useEffect, useState } from "react";

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    wsRef.current = new window.WebSocket("ws://34.176.212.36:3001");
    setSocket(wsRef.current);

    wsRef.current.onopen = () => {
      console.log("✅ WebSocket conectado (global)");
    };

    wsRef.current.onclose = () => {
      console.log("🔌 WebSocket desconectado (global)");
    };

    return () => {
      wsRef.current.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};
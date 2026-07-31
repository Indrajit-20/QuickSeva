import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../config/api";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  joinOrderRoom: () => {},
});

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Derive socket server URL from API_BASE_URL (remove trailing /api)
    let socketUrl = API_BASE_URL || "http://localhost:5000";
    if (socketUrl.endsWith("/api")) {
      socketUrl = socketUrl.slice(0, -4);
    }

    try {
      const socket = io(socketUrl, {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        if (user && user.id) {
          socket.emit("join_user", user.id);
        }
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.warn("Socket connection error (falling back smoothly):", err.message);
        setIsConnected(false);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      console.error("Socket initialization error:", err);
    }
  }, []);

  // Re-join user room whenever user logs in or changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && user && user.id) {
      socketRef.current.emit("join_user", user.id);
    }
  }, [user]);

  const joinOrderRoom = (orderId) => {
    if (socketRef.current && orderId) {
      socketRef.current.emit("join_order", orderId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinOrderRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

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
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Derive socket server URL from API_BASE_URL (remove trailing /api)
    let socketUrl = API_BASE_URL || "http://localhost:5000";
    if (socketUrl.endsWith("/api")) {
      socketUrl = socketUrl.slice(0, -4);
    }

    try {
      const socketInstance = io(socketUrl, {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        withCredentials: true,
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        setIsConnected(true);
        if (user && user.id) {
          socketInstance.emit("join_user", user.id);
        }
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      socketInstance.on("connect_error", (err) => {
        console.warn("Socket connection error (falling back smoothly):", err.message);
        setIsConnected(false);
      });

      // Handle Back-Forward Cache (bfcache) gracefully
      const handlePageHide = (e) => {
        if (e.persisted && socketInstance) {
          socketInstance.disconnect();
        }
      };
      const handlePageShow = (e) => {
        if (socketInstance) {
          socketInstance.connect();
        }
      };

      window.addEventListener("pagehide", handlePageHide);
      window.addEventListener("pageshow", handlePageShow);

      return () => {
        window.removeEventListener("pagehide", handlePageHide);
        window.removeEventListener("pageshow", handlePageShow);
        socketInstance.disconnect();
        setSocket(null);
      };
    } catch (err) {
      console.error("Socket initialization error:", err);
    }
  }, []);

  // Re-join user room whenever user logs in or changes
  useEffect(() => {
    if (socket && socket.connected && user && user.id) {
      socket.emit("join_user", user.id);
    }
  }, [user, socket]);

  const joinOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit("join_order", orderId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrderRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

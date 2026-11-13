import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeResumeJobs: Record<string, { status: string; progress: number; error?: string }>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeResumeJobs: {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeResumeJobs, setActiveResumeJobs] = useState<Record<string, any>>({});

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (user?._id) {
        socketInstance.emit('join_user', user._id);
        socketInstance.emit('join_role', user.role);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time resume processing progress
    socketInstance.on('resume_progress', (data: any) => {
      if (data?.resumeId) {
        setActiveResumeJobs((prev) => ({
          ...prev,
          [data.resumeId]: {
            status: data.status,
            progress: data.progress,
            error: data.error,
          },
        }));
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, activeResumeJobs }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);


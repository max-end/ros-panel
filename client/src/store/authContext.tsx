import React, { createContext, useContext, useState, useEffect } from 'react';
import { rosApi } from '../api/client.js';
import { SystemResource, DeviceConfig } from '../types/index.js';

interface AuthContextType {
  connected: boolean;
  loading: boolean;
  deviceInfo: SystemResource | null;
  config: DeviceConfig | null;
  error: string | null;
  login: (params: {
    host: string;
    port: number;
    useTls: boolean;
    username: string;
    password?: string;
    rejectUnauthorized?: boolean;
    isDemo?: boolean;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<SystemResource | null>(null);
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      setLoading(true);
      const res = await rosApi.getStatus();
      if (res.connected && res.deviceInfo) {
        setConnected(true);
        setDeviceInfo(res.deviceInfo);
        setConfig(res.config || null);
        setError(null);
      } else {
        setConnected(false);
        setDeviceInfo(null);
      }
    } catch {
      setConnected(false);
      setDeviceInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const login = async (params: {
    host: string;
    port: number;
    useTls: boolean;
    username: string;
    password?: string;
    rejectUnauthorized?: boolean;
    isDemo?: boolean;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const res = await rosApi.login(params);
      if (res.success) {
        localStorage.setItem('ros_session_id', res.sessionId);
        setConnected(true);
        setDeviceInfo(res.deviceInfo);
        setConfig(res.config);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '连接 RouterOS 失败';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await rosApi.logout();
    } finally {
      localStorage.removeItem('ros_session_id');
      setConnected(false);
      setDeviceInfo(null);
      setConfig(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        connected,
        loading,
        deviceInfo,
        config,
        error,
        login,
        logout,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

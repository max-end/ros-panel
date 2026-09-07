import React, { createContext, useContext, useState, useEffect } from 'react';
import { rosApi } from '../api/client.js';
import { SystemResource, DeviceConfig } from '../types/index.js';

export interface SavedDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  useTls: boolean;
  username: string;
  password?: string;
  rejectUnauthorized?: boolean;
  isDemo?: boolean;
  boardName?: string;
  lastConnected?: string;
}

interface AuthContextType {
  connected: boolean;
  initialLoading: boolean;
  loginLoading: boolean;
  loading: boolean;
  deviceInfo: SystemResource | null;
  config: DeviceConfig | null;
  error: string | null;
  savedDevices: SavedDevice[];
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
  switchDevice: (device: SavedDevice) => Promise<boolean>;
  removeSavedDevice: (id: string) => void;
  addSavedDevice: (device: Omit<SavedDevice, 'id'>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<SystemResource | null>(null);
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([]);

  // Load saved devices from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ros_saved_devices');
      if (raw) {
        setSavedDevices(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistSavedDevices = (list: SavedDevice[]) => {
    setSavedDevices(list);
    try {
      localStorage.setItem('ros_saved_devices', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const registerCurrentDevice = (cfg: DeviceConfig, devInfo?: SystemResource) => {
    if (!cfg.host || cfg.isDemo) return;
    setSavedDevices((prev) => {
      const existing = prev.find(
        (d) => d.host === cfg.host && Number(d.port) === Number(cfg.port)
      );
      const updatedItem: SavedDevice = {
        id: existing ? existing.id : `dev-${Date.now()}`,
        name: existing?.name || devInfo?.['board-name'] || `${cfg.host}:${cfg.port}`,
        host: cfg.host,
        port: Number(cfg.port),
        useTls: cfg.useTls,
        username: cfg.username,
        boardName: devInfo?.['board-name'],
        lastConnected: new Date().toLocaleString(),
      };
      const filtered = prev.filter((d) => d.id !== updatedItem.id);
      const newList = [updatedItem, ...filtered];
      try {
        localStorage.setItem('ros_saved_devices', JSON.stringify(newList));
      } catch {
        // ignore
      }
      return newList;
    });
  };

  const refreshStatus = async () => {
    try {
      setInitialLoading(true);
      const res = await rosApi.getStatus();
      if (res.connected && res.deviceInfo) {
        setConnected(true);
        setDeviceInfo(res.deviceInfo);
        setConfig(res.config || null);
        setError(null);
        if (res.config) {
          registerCurrentDevice(res.config, res.deviceInfo);
        }
      } else {
        setConnected(false);
        setDeviceInfo(null);
      }
    } catch {
      setConnected(false);
      setDeviceInfo(null);
    } finally {
      setInitialLoading(false);
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
      setLoginLoading(true);
      setError(null);
      const res = await rosApi.login(params);
      if (res.success) {
        localStorage.setItem('ros_session_id', res.sessionId);
        setConnected(true);
        setDeviceInfo(res.deviceInfo);
        setConfig(res.config);
        if (res.config && !res.config.isDemo) {
          registerCurrentDevice(res.config, res.deviceInfo);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '连接 RouterOS 失败';
      setError(msg);
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  const switchDevice = async (device: SavedDevice): Promise<boolean> => {
    return await login({
      host: device.host,
      port: device.port,
      useTls: device.useTls,
      username: device.username,
      password: device.password,
      rejectUnauthorized: device.rejectUnauthorized,
      isDemo: device.isDemo,
    });
  };

  const removeSavedDevice = (id: string) => {
    const updated = savedDevices.filter((d) => d.id !== id);
    persistSavedDevices(updated);
  };

  const addSavedDevice = async (device: Omit<SavedDevice, 'id'>): Promise<boolean> => {
    const ok = await login({
      host: device.host,
      port: device.port,
      useTls: device.useTls,
      username: device.username,
      password: device.password,
      rejectUnauthorized: device.rejectUnauthorized,
      isDemo: device.isDemo,
    });
    if (ok) {
      const newDev: SavedDevice = {
        ...device,
        id: `dev-${Date.now()}`,
        lastConnected: new Date().toLocaleString(),
      };
      persistSavedDevices([newDev, ...savedDevices.filter((d) => d.host !== device.host)]);
      return true;
    }
    return false;
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
        initialLoading,
        loginLoading,
        loading: loginLoading,
        deviceInfo,
        config,
        error,
        savedDevices,
        login,
        logout,
        refreshStatus,
        switchDevice,
        removeSavedDevice,
        addSavedDevice,
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

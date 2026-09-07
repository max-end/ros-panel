import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext.js';
import { I18nProvider } from './i18n/context.js';
import { Layout } from './components/Layout.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { WanSettings } from './pages/WanSettings.js';
import { Routes as RoutesPage } from './pages/Routes.js';
import { DnsSettings } from './pages/DnsSettings.js';
import { DdnsSettings } from './pages/DdnsSettings.js';
import { Interfaces } from './pages/Interfaces.js';
import { Wireless } from './pages/Wireless.js';
import { IPAddress } from './pages/IPAddress.js';
import { DHCPLeases } from './pages/DHCPLeases.js';
import { ArpTable } from './pages/ArpTable.js';
import { Firewall } from './pages/Firewall.js';
import { Wireguard } from './pages/Wireguard.js';
import { Queues } from './pages/Queues.js';
import { WakeOnLan } from './pages/WakeOnLan.js';
import { Users as UsersPage } from './pages/Users.js';
import { Backup } from './pages/Backup.js';
import { Logs } from './pages/Logs.js';
import { System } from './pages/System.js';
import { Upgrade } from './pages/Upgrade.js';

const AppRoutes: React.FC = () => {
  const { connected, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono">正在检测 RouterOS 连接状态...</p>
      </div>
    );
  }

  if (!connected) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="wan-settings" element={<WanSettings />} />
        <Route path="ddns" element={<DdnsSettings />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="dns" element={<DnsSettings />} />
        <Route path="interfaces" element={<Interfaces />} />
        <Route path="wireless" element={<Wireless />} />
        <Route path="ip-addresses" element={<IPAddress />} />
        <Route path="dhcp-leases" element={<DHCPLeases />} />
        <Route path="arp" element={<ArpTable />} />
        <Route path="firewall" element={<Firewall />} />
        <Route path="wireguard" element={<Wireguard />} />
        <Route path="queues" element={<Queues />} />
        <Route path="wol" element={<WakeOnLan />} />
        <Route path="system" element={<System />} />
        <Route path="upgrade" element={<Upgrade />} />
        <Route path="backup" element={<Backup />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="logs" element={<Logs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};

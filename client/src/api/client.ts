import axios from 'axios';
import {
  SystemResource,
  RosInterface,
  RosIpAddress,
  RosDhcpLease,
  RosArp,
  RosFirewallRule,
  RosWireguardInterface,
  RosWireguardPeer,
  RosSimpleQueue,
  RosLog,
  DeviceConfig,
  WolDevice,
  RosPppoeClient,
  RosDhcpClient,
  DashboardOverviewData,
  RosRoute,
  RosDnsConfig,
  RosDnsStatic,
  RosDhcpServer,
  RosDhcpNetwork,
  RosIpPool,
  RosUser,
  RosFile,
  TracerouteHop,
  RosCloud,
  CustomDdnsItem,
} from '../types/index.js';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

// Interceptor to attach sessionId from localStorage if available
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('ros_session_id');
  if (sessionId) {
    config.headers.Authorization = `Bearer ${sessionId}`;
  }
  return config;
});

export const rosApi = {
  // Auth
  login: async (params: {
    host: string;
    port: number;
    useTls: boolean;
    username: string;
    password?: string;
    rejectUnauthorized?: boolean;
    isDemo?: boolean;
  }) => {
    const res = await api.post<{
      success: boolean;
      sessionId: string;
      deviceInfo: SystemResource;
      config: DeviceConfig;
    }>('/auth/login', params);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getStatus: async () => {
    const res = await api.get<{
      connected: boolean;
      sessionId?: string;
      deviceInfo?: SystemResource;
      config?: DeviceConfig;
      error?: string;
    }>('/auth/status');
    return res.data;
  },

  // Dashboard
  getDashboardOverview: async () => {
    const res = await api.get<{
      success: boolean;
      data: DashboardOverviewData;
    }>('/dashboard/overview');
    return res.data.data;
  },

  getTrafficOnce: async (interfaceName: string) => {
    const res = await api.get<{
      success: boolean;
      data: {
        interface: string;
        rxBps: number;
        txBps: number;
        cpuLoad?: number;
        freeMemory?: number;
        totalMemory?: number;
        uptime?: string;
      };
    }>(`/telemetry/traffic-once?interface=${encodeURIComponent(interfaceName)}`);
    return res.data.data;
  },

  // Interfaces
  getInterfaces: async () => {
    const res = await api.get<{ success: boolean; data: RosInterface[] }>('/interfaces');
    return res.data.data;
  },

  toggleInterface: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/interfaces/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  updateInterface: async (id: string, data: { comment?: string; name?: string }) => {
    const res = await api.patch(`/interfaces/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  // IP & DHCP & ARP
  getIpAddresses: async () => {
    const res = await api.get<{ success: boolean; data: RosIpAddress[] }>('/ip/addresses');
    return res.data.data;
  },

  addIpAddress: async (data: { address: string; network?: string; interface: string; comment?: string }) => {
    const res = await api.post('/ip/addresses', data);
    return res.data;
  },

  removeIpAddress: async (id: string) => {
    const res = await api.delete(`/ip/addresses/${encodeURIComponent(id)}`);
    return res.data;
  },

  getDhcpLeases: async () => {
    const res = await api.get<{ success: boolean; data: RosDhcpLease[] }>('/ip/dhcp-leases');
    return res.data.data;
  },

  makeDhcpLeaseStatic: async (id: string) => {
    const res = await api.post(`/ip/dhcp-leases/${encodeURIComponent(id)}/make-static`);
    return res.data;
  },

  toggleDhcpLease: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/ip/dhcp-leases/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  removeDhcpLease: async (id: string) => {
    const res = await api.delete(`/ip/dhcp-leases/${encodeURIComponent(id)}`);
    return res.data;
  },

  getDhcpServers: async () => {
    const res = await api.get<{ success: boolean; data: RosDhcpServer[] }>('/ip/dhcp-servers');
    return res.data.data;
  },

  toggleDhcpServer: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/ip/dhcp-servers/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  getDhcpNetworks: async () => {
    const res = await api.get<{ success: boolean; data: RosDhcpNetwork[] }>('/ip/dhcp-networks');
    return res.data.data;
  },

  addDhcpNetwork: async (data: { address: string; gateway?: string; dnsServer?: string; comment?: string }) => {
    const res = await api.post('/ip/dhcp-networks', data);
    return res.data;
  },

  removeDhcpNetwork: async (id: string) => {
    const res = await api.delete(`/ip/dhcp-networks/${encodeURIComponent(id)}`);
    return res.data;
  },

  getIpPools: async () => {
    const res = await api.get<{ success: boolean; data: RosIpPool[] }>('/ip/pools');
    return res.data.data;
  },

  addIpPool: async (data: { name: string; ranges: string; comment?: string }) => {
    const res = await api.post('/ip/pools', data);
    return res.data;
  },

  removeIpPool: async (id: string) => {
    const res = await api.delete(`/ip/pools/${encodeURIComponent(id)}`);
    return res.data;
  },

  getArpTable: async () => {
    const res = await api.get<{ success: boolean; data: RosArp[] }>('/ip/arp');
    return res.data.data;
  },

  makeArpStatic: async (id: string) => {
    const res = await api.post(`/ip/arp/${encodeURIComponent(id)}/make-static`);
    return res.data;
  },

  // Firewall & NAT
  getFilterRules: async () => {
    const res = await api.get<{ success: boolean; data: RosFirewallRule[] }>('/firewall/filter');
    return res.data.data;
  },

  addFilterRule: async (data: {
    chain?: string;
    action?: string;
    protocol?: string;
    dstPort?: string;
    srcAddress?: string;
    dstAddress?: string;
    inInterface?: string;
    outInterface?: string;
    comment?: string;
  }) => {
    const res = await api.post('/firewall/filter', data);
    return res.data;
  },

  updateFilterRule: async (
    id: string,
    data: {
      chain?: string;
      action?: string;
      protocol?: string;
      dstPort?: string;
      srcAddress?: string;
      dstAddress?: string;
      inInterface?: string;
      outInterface?: string;
      comment?: string;
      disabled?: boolean;
    }
  ) => {
    const res = await api.patch(`/firewall/filter/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  toggleFilterRule: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/firewall/filter/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  removeFilterRule: async (id: string) => {
    const res = await api.delete(`/firewall/filter/${encodeURIComponent(id)}`);
    return res.data;
  },

  moveFilterRule: async (id: string, destinationId?: string) => {
    const res = await api.post('/firewall/filter/move', { id, destinationId });
    return res.data;
  },

  getNatRules: async () => {
    const res = await api.get<{ success: boolean; data: RosFirewallRule[] }>('/firewall/nat');
    return res.data.data;
  },

  addPortForwardRule: async (data: {
    name?: string;
    protocol: 'tcp' | 'udp';
    dstPort: string;
    toAddress: string;
    toPort: string;
    inInterface?: string;
    comment?: string;
  }) => {
    const res = await api.post('/firewall/nat/port-forward', data);
    return res.data;
  },

  updateNatRule: async (
    id: string,
    data: {
      chain?: string;
      action?: string;
      protocol?: string;
      dstPort?: string;
      toAddress?: string;
      toPort?: string;
      inInterface?: string;
      outInterface?: string;
      comment?: string;
      disabled?: boolean;
    }
  ) => {
    const res = await api.patch(`/firewall/nat/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  toggleNatRule: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/firewall/nat/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  removeNatRule: async (id: string) => {
    const res = await api.delete(`/firewall/nat/${encodeURIComponent(id)}`);
    return res.data;
  },

  moveNatRule: async (id: string, destinationId?: string) => {
    const res = await api.post('/firewall/nat/move', { id, destinationId });
    return res.data;
  },

  // WireGuard
  getWireguardInterfaces: async () => {
    const res = await api.get<{ success: boolean; data: RosWireguardInterface[] }>('/wireguard/interfaces');
    return res.data.data;
  },

  getWireguardPeers: async () => {
    const res = await api.get<{ success: boolean; data: RosWireguardPeer[] }>('/wireguard/peers');
    return res.data.data;
  },

  addWireguardPeer: async (data: {
    interface: string;
    publicKey: string;
    allowedAddress: string;
    endpointAddress?: string;
    endpointPort?: number;
    comment?: string;
  }) => {
    const res = await api.post('/wireguard/peers', data);
    return res.data;
  },

  toggleWireguardPeer: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/wireguard/peers/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  removeWireguardPeer: async (id: string) => {
    const res = await api.delete(`/wireguard/peers/${encodeURIComponent(id)}`);
    return res.data;
  },

  // Queues
  getSimpleQueues: async () => {
    const res = await api.get<{ success: boolean; data: RosSimpleQueue[] }>('/queues');
    return res.data.data;
  },

  addSimpleQueue: async (data: {
    name: string;
    target: string;
    maxLimit: string;
    comment?: string;
  }) => {
    const res = await api.post('/queues', data);
    return res.data;
  },

  toggleSimpleQueue: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/queues/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  removeSimpleQueue: async (id: string) => {
    const res = await api.delete(`/queues/${encodeURIComponent(id)}`);
    return res.data;
  },

  // System & Logs
  getLogs: async () => {
    const res = await api.get<{ success: boolean; data: RosLog[] }>('/system/logs');
    return res.data.data;
  },

  rebootSystem: async () => {
    const res = await api.post('/system/reboot');
    return res.data;
  },

  pingHost: async (address: string, count = 4) => {
    const res = await api.post<{
      success: boolean;
      data: { host: string; status: string; time?: string; received: number; sent: number };
    }>('/system/ping', { address, count });
    return res.data.data;
  },

  // Wake on LAN (WOL)
  wakeOnLan: async (mac: string, interfaceName: string) => {
    const res = await api.post<{ success: boolean; message: string }>('/wol/wake', {
      mac,
      interface: interfaceName,
    });
    return res.data;
  },

  getWolDevices: async () => {
    const res = await api.get<{ success: boolean; data: WolDevice[] }>('/wol/devices');
    return res.data.data;
  },

  addWolDevice: async (data: { name: string; mac: string; interface: string; ip?: string; description?: string }) => {
    const res = await api.post<{ success: boolean; data: WolDevice; message: string }>('/wol/devices', data);
    return res.data;
  },

  removeWolDevice: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/wol/devices/${encodeURIComponent(id)}`);
    return res.data;
  },

  wakeWolDevice: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string; lastWokenAt: string }>(
      `/wol/devices/${encodeURIComponent(id)}/wake`
    );
    return res.data;
  },

  checkDeviceStatus: async (ip: string) => {
    const res = await api.post<{
      success: boolean;
      data: { ip: string; isOnline: boolean; latency?: string };
    }>('/wol/check-status', { ip });
    return res.data.data;
  },

  // WAN / PPPoE / Dial-up
  getPppoeClients: async () => {
    const res = await api.get<{ success: boolean; data: RosPppoeClient[] }>('/wan/pppoe');
    return res.data.data;
  },

  addPppoeClient: async (data: {
    name: string;
    interface: string;
    user: string;
    password?: string;
    addDefaultRoute?: boolean;
    usePeerDns?: boolean;
    comment?: string;
  }) => {
    const res = await api.post('/wan/pppoe', data);
    return res.data;
  },

  updatePppoeClient: async (id: string, data: Partial<RosPppoeClient>) => {
    const res = await api.patch(`/wan/pppoe/${encodeURIComponent(id)}`, data);
    return res.data;
  },

  removePppoeClient: async (id: string) => {
    const res = await api.delete(`/wan/pppoe/${encodeURIComponent(id)}`);
    return res.data;
  },

  togglePppoeClient: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/wan/pppoe/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  reconnectPppoe: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(
      `/wan/pppoe/${encodeURIComponent(id)}/reconnect`
    );
    return res.data;
  },

  getDhcpClients: async () => {
    const res = await api.get<{ success: boolean; data: RosDhcpClient[] }>('/wan/dhcp-client');
    return res.data.data;
  },

  toggleDhcpClient: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/wan/dhcp-client/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  releaseDhcpClient: async (id: string) => {
    const res = await api.post(`/wan/dhcp-client/${encodeURIComponent(id)}/release`);
    return res.data;
  },

  renewDhcpClient: async (id: string) => {
    const res = await api.post(`/wan/dhcp-client/${encodeURIComponent(id)}/renew`);
    return res.data;
  },

  // Routes
  getRoutes: async () => {
    const res = await api.get<{ success: boolean; data: RosRoute[] }>('/routes');
    return res.data.data;
  },

  addRoute: async (data: { dstAddress: string; gateway: string; distance?: number; comment?: string }) => {
    const res = await api.post('/routes', data);
    return res.data;
  },

  removeRoute: async (id: string) => {
    const res = await api.delete(`/routes/${encodeURIComponent(id)}`);
    return res.data;
  },

  toggleRoute: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/routes/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  // DNS
  getDnsConfig: async () => {
    const res = await api.get<{ success: boolean; data: RosDnsConfig }>('/dns');
    return res.data.data;
  },

  updateDnsConfig: async (data: { servers?: string; allowRemoteRequests?: boolean; cacheSize?: number }) => {
    const res = await api.patch('/dns', data);
    return res.data;
  },

  flushDnsCache: async () => {
    const res = await api.post('/dns/flush');
    return res.data;
  },

  getDnsStatic: async () => {
    const res = await api.get<{ success: boolean; data: RosDnsStatic[] }>('/dns/static');
    return res.data.data;
  },

  addDnsStatic: async (data: { name: string; address: string; ttl?: string; comment?: string }) => {
    const res = await api.post('/dns/static', data);
    return res.data;
  },

  removeDnsStatic: async (id: string) => {
    const res = await api.delete(`/dns/static/${encodeURIComponent(id)}`);
    return res.data;
  },

  toggleDnsStatic: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/dns/static/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  // Users
  getUsers: async () => {
    const res = await api.get<{ success: boolean; data: RosUser[] }>('/users');
    return res.data.data;
  },

  addUser: async (data: { name: string; password?: string; group: string; comment?: string }) => {
    const res = await api.post('/users', data);
    return res.data;
  },

  removeUser: async (id: string) => {
    const res = await api.delete(`/users/${encodeURIComponent(id)}`);
    return res.data;
  },

  toggleUser: async (id: string, disabled: boolean) => {
    const res = await api.patch(`/users/${encodeURIComponent(id)}/toggle`, { disabled });
    return res.data;
  },

  updateUserPassword: async (id: string, password: string) => {
    const res = await api.patch(`/users/${encodeURIComponent(id)}/password`, { password });
    return res.data;
  },

  // Backups & Files
  getFiles: async () => {
    const res = await api.get<{ success: boolean; data: RosFile[] }>('/backup/files');
    return res.data.data;
  },

  createBackup: async (name?: string, password?: string) => {
    const res = await api.post('/backup/create', { name, password });
    return res.data;
  },

  removeFile: async (id: string) => {
    const res = await api.delete(`/backup/files/${encodeURIComponent(id)}`);
    return res.data;
  },

  exportConfig: async () => {
    const res = await api.get<{ success: boolean; data: string }>('/backup/export');
    return res.data.data;
  },

  // Advanced Diagnostic & Console
  tracerouteHost: async (address: string, count: number = 1) => {
    const res = await api.post<{ success: boolean; data: TracerouteHop[] }>('/system/traceroute', { address, count });
    return res.data.data;
  },

  executeCommand: async (command: string) => {
    const res = await api.post<{ success: boolean; data: string }>('/system/exec', { command });
    return res.data.data;
  },

  // DDNS (Cloud & Custom)
  getCloud: async () => {
    const res = await api.get<{ success: boolean; data: RosCloud }>('/ddns/cloud');
    return res.data.data;
  },

  updateCloud: async (data: { ddnsEnabled?: boolean; updateTime?: boolean }) => {
    const res = await api.patch('/ddns/cloud', data);
    return res.data;
  },

  forceUpdateCloud: async () => {
    const res = await api.post('/ddns/cloud/force-update');
    return res.data;
  },

  getCustomDdns: async () => {
    const res = await api.get<{ success: boolean; data: CustomDdnsItem[] }>('/ddns/custom');
    return res.data.data;
  },

  addCustomDdns: async (data: {
    name: string;
    provider: 'cloudflare' | 'aliyun' | 'dnspod' | 'duckdns' | 'webhook';
    domain: string;
    zoneId?: string;
    apiKey?: string;
    apiSecret?: string;
    webhookUrl?: string;
    checkInterval?: string;
  }) => {
    const res = await api.post<{ success: boolean; data: CustomDdnsItem }>('/ddns/custom', data);
    return res.data.data;
  },

  removeCustomDdns: async (id: string) => {
    const res = await api.delete(`/ddns/custom/${encodeURIComponent(id)}`);
    return res.data;
  },

  syncCustomDdns: async (id: string) => {
    const res = await api.post<{ success: boolean; data: { success: boolean; message: string; ip: string } }>(
      `/ddns/custom/${encodeURIComponent(id)}/sync`
    );
    return res.data.data;
  },
};

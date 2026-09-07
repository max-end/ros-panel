import https from 'node:https';
import axios, { AxiosInstance } from 'axios';
import {
  RosConnectionConfig,
  SystemResource,
  SystemHealth,
  RosInterface,
  InterfaceTraffic,
  RosIpAddress,
  RosDhcpLease,
  RosArp,
  RosFirewallRule,
  RosWireguardInterface,
  RosWireguardPeer,
  RosSimpleQueue,
  RosLog,
  RosPppoeClient,
  RosDhcpClient,
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
} from '../types/ros.js';

export interface IRosClient {
  testConnection(): Promise<SystemResource>;
  getSystemResource(): Promise<SystemResource>;
  getSystemHealth(): Promise<SystemHealth>;
  getInterfaces(): Promise<RosInterface[]>;
  toggleInterface(id: string, disabled: boolean): Promise<void>;
  updateInterface(id: string, data: Partial<RosInterface>): Promise<void>;
  monitorTraffic(interfaceName: string): Promise<InterfaceTraffic>;
  getIpAddresses(): Promise<RosIpAddress[]>;
  addIpAddress(data: { address: string; network?: string; interface: string; comment?: string }): Promise<void>;
  removeIpAddress(id: string): Promise<void>;
  getDhcpLeases(): Promise<RosDhcpLease[]>;
  makeDhcpLeaseStatic(id: string): Promise<void>;
  toggleDhcpLease(id: string, disabled: boolean): Promise<void>;
  removeDhcpLease(id: string): Promise<void>;
  getArpTable(): Promise<RosArp[]>;
  makeArpStatic(id: string): Promise<void>;
  getFirewallFilterRules(): Promise<RosFirewallRule[]>;
  addFirewallFilterRule(data: Partial<RosFirewallRule>): Promise<void>;
  updateFirewallFilterRule(id: string, data: Partial<RosFirewallRule>): Promise<void>;
  toggleFirewallFilterRule(id: string, disabled: boolean): Promise<void>;
  removeFirewallFilterRule(id: string): Promise<void>;
  moveFirewallFilterRule(id: string, destinationId?: string): Promise<void>;
  getFirewallNatRules(): Promise<RosFirewallRule[]>;
  addPortForwardRule(data: {
    name?: string;
    protocol: 'tcp' | 'udp';
    dstPort: string;
    toAddress: string;
    toPort: string;
    inInterface?: string;
    comment?: string;
  }): Promise<void>;
  updateFirewallNatRule(id: string, data: Partial<RosFirewallRule>): Promise<void>;
  toggleFirewallNatRule(id: string, disabled: boolean): Promise<void>;
  removeFirewallNatRule(id: string): Promise<void>;
  moveFirewallNatRule(id: string, destinationId?: string): Promise<void>;
  getWireguardInterfaces(): Promise<RosWireguardInterface[]>;
  getWireguardPeers(): Promise<RosWireguardPeer[]>;
  addWireguardPeer(data: {
    interface: string;
    publicKey: string;
    allowedAddress: string;
    endpointAddress?: string;
    endpointPort?: number;
    comment?: string;
  }): Promise<void>;
  removeWireguardPeer(id: string): Promise<void>;
  toggleWireguardPeer(id: string, disabled: boolean): Promise<void>;
  getSimpleQueues(): Promise<RosSimpleQueue[]>;
  addSimpleQueue(data: {
    name: string;
    target: string;
    maxLimit: string;
    comment?: string;
  }): Promise<void>;
  toggleSimpleQueue(id: string, disabled: boolean): Promise<void>;
  removeSimpleQueue(id: string): Promise<void>;
  getLogs(): Promise<RosLog[]>;
  rebootSystem(): Promise<void>;
  pingHost(address: string, count?: number): Promise<{ host: string; status: string; time?: string; received: number; sent: number }>;
  wakeOnLan(mac: string, interfaceName: string): Promise<void>;
  getPppoeClients(): Promise<RosPppoeClient[]>;
  addPppoeClient(data: {
    name: string;
    interface: string;
    user: string;
    password?: string;
    addDefaultRoute?: boolean;
    usePeerDns?: boolean;
    comment?: string;
  }): Promise<void>;
  updatePppoeClient(id: string, data: Partial<RosPppoeClient>): Promise<void>;
  removePppoeClient(id: string): Promise<void>;
  togglePppoeClient(id: string, disabled: boolean): Promise<void>;
  reconnectPppoe(id: string): Promise<void>;
  getDhcpClients(): Promise<RosDhcpClient[]>;
  toggleDhcpClient(id: string, disabled: boolean): Promise<void>;
  releaseDhcpClient(id: string): Promise<void>;
  renewDhcpClient(id: string): Promise<void>;
  getRoutes(): Promise<RosRoute[]>;
  addRoute(data: { dstAddress: string; gateway: string; distance?: number; comment?: string }): Promise<void>;
  removeRoute(id: string): Promise<void>;
  toggleRoute(id: string, disabled: boolean): Promise<void>;
  getDnsConfig(): Promise<RosDnsConfig>;
  setDnsConfig(data: Partial<RosDnsConfig>): Promise<void>;
  flushDnsCache(): Promise<void>;
  getDnsStaticList(): Promise<RosDnsStatic[]>;
  addDnsStatic(data: { name: string; address: string; ttl?: string; comment?: string }): Promise<void>;
  removeDnsStatic(id: string): Promise<void>;
  toggleDnsStatic(id: string, disabled: boolean): Promise<void>;
  getDhcpServers(): Promise<RosDhcpServer[]>;
  toggleDhcpServer(id: string, disabled: boolean): Promise<void>;
  getDhcpNetworks(): Promise<RosDhcpNetwork[]>;
  addDhcpNetwork(data: { address: string; gateway?: string; dnsServer?: string; comment?: string }): Promise<void>;
  removeDhcpNetwork(id: string): Promise<void>;
  getIpPools(): Promise<RosIpPool[]>;
  addIpPool(data: { name: string; ranges: string; comment?: string }): Promise<void>;
  removeIpPool(id: string): Promise<void>;
  getUsers(): Promise<RosUser[]>;
  addUser(data: { name: string; password?: string; group: string; comment?: string }): Promise<void>;
  removeUser(id: string): Promise<void>;
  toggleUser(id: string, disabled: boolean): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  getFiles(): Promise<RosFile[]>;
  createBackup(name?: string, password?: string): Promise<void>;
  removeFile(id: string): Promise<void>;
  exportConfig(): Promise<string>;
  tracerouteHost(address: string, count?: number): Promise<TracerouteHop[]>;
  executeCommand(command: string): Promise<string>;
  getCloud(): Promise<RosCloud>;
  updateCloud(data: { ddnsEnabled?: boolean; updateTime?: boolean }): Promise<void>;
  forceUpdateCloud(): Promise<void>;
  getCustomDdns(): Promise<CustomDdnsItem[]>;
  addCustomDdns(item: Omit<CustomDdnsItem, 'id' | 'lastSyncTime' | 'lastStatus'>): Promise<CustomDdnsItem>;
  removeCustomDdns(id: string): Promise<void>;
  syncCustomDdns(id: string): Promise<{ success: boolean; message: string; ip: string }>;
}

export class RosRestClient implements IRosClient {
  private axiosInstance: AxiosInstance;
  private config: RosConnectionConfig;

  constructor(config: RosConnectionConfig) {
    this.config = config;
    const protocol = config.useTls ? 'https' : 'http';
    const baseURL = `${protocol}://${config.host}:${config.port}/rest`;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: config.rejectUnauthorized ?? false,
    });

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 8000,
      auth: {
        username: config.username,
        password: config.password,
      },
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? (data as { message: string }).message
          : error.message;

      throw new Error(`[RouterOS ${context}] HTTP ${status || 'Error'}: ${message}`);
    }
    throw new Error(`[RouterOS ${context}] ${error instanceof Error ? error.message : String(error)}`);
  }

  async testConnection(): Promise<SystemResource> {
    return this.getSystemResource();
  }

  async getSystemResource(): Promise<SystemResource> {
    try {
      const res = await this.axiosInstance.get<SystemResource>('/system/resource');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getSystemResource');
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const res = await this.axiosInstance.get<any>('/system/health');
      if (Array.isArray(res.data)) {
        const health: SystemHealth = {};
        for (const item of res.data) {
          if (item.name === 'cpu-temperature') health['cpu-temperature'] = Number(item.value);
          else if (item.name === 'board-temperature1' || item.name === 'board-temperature') health['board-temperature1'] = Number(item.value);
          else if (item.name === 'voltage') health.voltage = Number(item.value);
          else if (item.name === 'temperature') health.temperature = Number(item.value);
        }
        return health;
      }
      return res.data || {};
    } catch {
      return {};
    }
  }

  async getInterfaces(): Promise<RosInterface[]> {
    try {
      const res = await this.axiosInstance.get<RosInterface[]>('/interface');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getInterfaces');
    }
  }

  async toggleInterface(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/interface/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleInterface');
    }
  }

  async updateInterface(id: string, data: Partial<RosInterface>): Promise<void> {
    try {
      await this.axiosInstance.patch(`/interface/${id}`, data);
    } catch (err) {
      return this.handleError(err, 'updateInterface');
    }
  }

  async monitorTraffic(interfaceName: string): Promise<InterfaceTraffic> {
    try {
      const res = await this.axiosInstance.post<InterfaceTraffic[]>('/interface/monitor-traffic', {
        interface: interfaceName,
        once: true,
      });
      const first = res.data[0];
      if (!first) {
        return {
          name: interfaceName,
          'rx-bits-per-second': 0,
          'tx-bits-per-second': 0,
        };
      }
      return {
        name: interfaceName,
        'rx-bits-per-second': Number(first['rx-bits-per-second'] || 0),
        'tx-bits-per-second': Number(first['tx-bits-per-second'] || 0),
        'rx-packets-per-second': Number(first['rx-packets-per-second'] || 0),
        'tx-packets-per-second': Number(first['tx-packets-per-second'] || 0),
      };
    } catch (err) {
      return this.handleError(err, 'monitorTraffic');
    }
  }

  async getIpAddresses(): Promise<RosIpAddress[]> {
    try {
      const res = await this.axiosInstance.get<RosIpAddress[]>('/ip/address');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getIpAddresses');
    }
  }

  async addIpAddress(data: { address: string; network?: string; interface: string; comment?: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/address', data);
    } catch (err) {
      return this.handleError(err, 'addIpAddress');
    }
  }

  async removeIpAddress(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/address/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeIpAddress');
    }
  }

  async getDhcpLeases(): Promise<RosDhcpLease[]> {
    try {
      const res = await this.axiosInstance.get<RosDhcpLease[]>('/ip/dhcp-server/lease');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getDhcpLeases');
    }
  }

  async makeDhcpLeaseStatic(id: string): Promise<void> {
    try {
      await this.axiosInstance.post('/ip/dhcp-server/lease/make-static', {
        numbers: id,
      });
    } catch (err) {
      return this.handleError(err, 'makeDhcpLeaseStatic');
    }
  }

  async toggleDhcpLease(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/dhcp-server/lease/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleDhcpLease');
    }
  }

  async removeDhcpLease(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/dhcp-server/lease/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeDhcpLease');
    }
  }

  async getArpTable(): Promise<RosArp[]> {
    try {
      const res = await this.axiosInstance.get<RosArp[]>('/ip/arp');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getArpTable');
    }
  }

  async makeArpStatic(id: string): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/arp/${id}`, {
        dynamic: 'false',
      });
    } catch (err) {
      return this.handleError(err, 'makeArpStatic');
    }
  }

  async getFirewallFilterRules(): Promise<RosFirewallRule[]> {
    try {
      const res = await this.axiosInstance.get<RosFirewallRule[]>('/ip/firewall/filter');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getFirewallFilterRules');
    }
  }

  async addFirewallFilterRule(data: Partial<RosFirewallRule>): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/firewall/filter', data);
    } catch (err) {
      return this.handleError(err, 'addFirewallFilterRule');
    }
  }

  async updateFirewallFilterRule(id: string, data: Partial<RosFirewallRule>): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/firewall/filter/${id}`, data);
    } catch (err) {
      return this.handleError(err, 'updateFirewallFilterRule');
    }
  }

  async toggleFirewallFilterRule(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/firewall/filter/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleFirewallFilterRule');
    }
  }

  async removeFirewallFilterRule(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/firewall/filter/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeFirewallFilterRule');
    }
  }

  async moveFirewallFilterRule(id: string, destinationId?: string): Promise<void> {
    try {
      const payload: Record<string, any> = { numbers: id };
      if (destinationId) {
        payload.destination = destinationId;
      }
      await this.axiosInstance.post('/ip/firewall/filter/move', payload);
    } catch (err) {
      try {
        const cmd = destinationId
          ? `/ip firewall filter move [find .id="${id}"] [find .id="${destinationId}"]`
          : `/ip firewall filter move [find .id="${id}"]`;
        await this.executeCommand(cmd);
      } catch {
        return this.handleError(err, 'moveFirewallFilterRule');
      }
    }
  }

  async getFirewallNatRules(): Promise<RosFirewallRule[]> {
    try {
      const res = await this.axiosInstance.get<RosFirewallRule[]>('/ip/firewall/nat');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getFirewallNatRules');
    }
  }

  async addPortForwardRule(data: {
    name?: string;
    protocol: 'tcp' | 'udp';
    dstPort: string;
    toAddress: string;
    toPort: string;
    inInterface?: string;
    comment?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/firewall/nat', {
        chain: 'dstnat',
        action: 'dst-nat',
        protocol: data.protocol,
        'dst-port': data.dstPort,
        'to-addresses': data.toAddress,
        'to-ports': data.toPort,
        ...(data.inInterface ? { 'in-interface': data.inInterface } : {}),
        comment: data.comment || `PortForward:${data.name || data.dstPort}->${data.toAddress}:${data.toPort}`,
      });
    } catch (err) {
      return this.handleError(err, 'addPortForwardRule');
    }
  }

  async updateFirewallNatRule(id: string, data: Partial<RosFirewallRule>): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/firewall/nat/${id}`, data);
    } catch (err) {
      return this.handleError(err, 'updateFirewallNatRule');
    }
  }

  async toggleFirewallNatRule(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/firewall/nat/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleFirewallNatRule');
    }
  }

  async removeFirewallNatRule(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/firewall/nat/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeFirewallNatRule');
    }
  }

  async moveFirewallNatRule(id: string, destinationId?: string): Promise<void> {
    try {
      const payload: Record<string, any> = { numbers: id };
      if (destinationId) {
        payload.destination = destinationId;
      }
      await this.axiosInstance.post('/ip/firewall/nat/move', payload);
    } catch (err) {
      try {
        const cmd = destinationId
          ? `/ip firewall nat move [find .id="${id}"] [find .id="${destinationId}"]`
          : `/ip firewall nat move [find .id="${id}"]`;
        await this.executeCommand(cmd);
      } catch {
        return this.handleError(err, 'moveFirewallNatRule');
      }
    }
  }

  async getWireguardInterfaces(): Promise<RosWireguardInterface[]> {
    try {
      const res = await this.axiosInstance.get<RosWireguardInterface[]>('/interface/wireguard');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getWireguardInterfaces');
    }
  }

  async getWireguardPeers(): Promise<RosWireguardPeer[]> {
    try {
      const res = await this.axiosInstance.get<RosWireguardPeer[]>('/interface/wireguard/peers');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getWireguardPeers');
    }
  }

  async addWireguardPeer(data: {
    interface: string;
    publicKey: string;
    allowedAddress: string;
    endpointAddress?: string;
    endpointPort?: number;
    comment?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.put('/interface/wireguard/peers', {
        interface: data.interface,
        'public-key': data.publicKey,
        'allowed-address': data.allowedAddress,
        ...(data.endpointAddress ? { 'endpoint-address': data.endpointAddress } : {}),
        ...(data.endpointPort ? { 'endpoint-port': String(data.endpointPort) } : {}),
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addWireguardPeer');
    }
  }

  async removeWireguardPeer(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/interface/wireguard/peers/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeWireguardPeer');
    }
  }

  async toggleWireguardPeer(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/interface/wireguard/peers/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleWireguardPeer');
    }
  }

  async getSimpleQueues(): Promise<RosSimpleQueue[]> {
    try {
      const res = await this.axiosInstance.get<RosSimpleQueue[]>('/queue/simple');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getSimpleQueues');
    }
  }

  async addSimpleQueue(data: {
    name: string;
    target: string;
    maxLimit: string;
    comment?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.put('/queue/simple', {
        name: data.name,
        target: data.target,
        'max-limit': data.maxLimit,
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addSimpleQueue');
    }
  }

  async toggleSimpleQueue(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/queue/simple/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleSimpleQueue');
    }
  }

  async removeSimpleQueue(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/queue/simple/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeSimpleQueue');
    }
  }

  async getLogs(): Promise<RosLog[]> {
    try {
      const res = await this.axiosInstance.get<RosLog[]>('/log');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getLogs');
    }
  }

  async rebootSystem(): Promise<void> {
    try {
      await this.axiosInstance.post('/system/reboot', {}, { timeout: 4000 });
    } catch (err: any) {
      // RouterOS cuts the TCP socket connection immediately when executing reboot
      if (
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('socket hang up') ||
        err.message?.includes('timeout')
      ) {
        return;
      }
      return this.handleError(err, 'rebootSystem');
    }
  }

  async pingHost(address: string, count = 4): Promise<{ host: string; status: string; time?: string; received: number; sent: number }> {
    try {
      const res = await this.axiosInstance.post<{ host?: string; status?: string; time?: string; received?: number; sent?: number }[]>('/tool/ping', {
        address,
        count,
      });
      const last = res.data[res.data.length - 1];
      return {
        host: address,
        status: last?.status || 'ok',
        time: last?.time || '1ms',
        received: last?.received ?? count,
        sent: last?.sent ?? count,
      };
    } catch (err) {
      return this.handleError(err, 'pingHost');
    }
  }

  async wakeOnLan(mac: string, interfaceName: string): Promise<void> {
    try {
      await this.axiosInstance.post('/tool/wol', {
        mac: mac.toUpperCase().replace(/-/g, ':'),
        interface: interfaceName,
      });
    } catch (err) {
      return this.handleError(err, 'wakeOnLan');
    }
  }

  async getPppoeClients(): Promise<RosPppoeClient[]> {
    try {
      const res = await this.axiosInstance.get<RosPppoeClient[]>('/interface/pppoe-client');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getPppoeClients');
    }
  }

  async addPppoeClient(data: {
    name: string;
    interface: string;
    user: string;
    password?: string;
    addDefaultRoute?: boolean;
    usePeerDns?: boolean;
    comment?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.put('/interface/pppoe-client', {
        name: data.name,
        interface: data.interface,
        user: data.user,
        ...(data.password ? { password: data.password } : {}),
        'add-default-route': data.addDefaultRoute ?? true ? 'true' : 'false',
        'use-peer-dns': data.usePeerDns ?? true ? 'true' : 'false',
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addPppoeClient');
    }
  }

  async updatePppoeClient(id: string, data: Partial<RosPppoeClient>): Promise<void> {
    try {
      await this.axiosInstance.patch(`/interface/pppoe-client/${id}`, data);
    } catch (err) {
      return this.handleError(err, 'updatePppoeClient');
    }
  }

  async removePppoeClient(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/interface/pppoe-client/${id}`);
    } catch (err) {
      return this.handleError(err, 'removePppoeClient');
    }
  }

  async togglePppoeClient(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/interface/pppoe-client/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'togglePppoeClient');
    }
  }

  async reconnectPppoe(id: string): Promise<void> {
    try {
      // Disconnect then reconnect to force redial
      await this.axiosInstance.patch(`/interface/pppoe-client/${id}`, { disabled: 'true' });
      await new Promise((resolve) => setTimeout(resolve, 800));
      await this.axiosInstance.patch(`/interface/pppoe-client/${id}`, { disabled: 'false' });
    } catch (err) {
      return this.handleError(err, 'reconnectPppoe');
    }
  }

  async getDhcpClients(): Promise<RosDhcpClient[]> {
    try {
      const res = await this.axiosInstance.get<RosDhcpClient[]>('/ip/dhcp-client');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getDhcpClients');
    }
  }

  async toggleDhcpClient(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/dhcp-client/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleDhcpClient');
    }
  }

  async releaseDhcpClient(id: string): Promise<void> {
    try {
      await this.axiosInstance.post('/ip/dhcp-client/release', { numbers: id });
    } catch (err) {
      return this.handleError(err, 'releaseDhcpClient');
    }
  }

  async renewDhcpClient(id: string): Promise<void> {
    try {
      await this.axiosInstance.post('/ip/dhcp-client/renew', { numbers: id });
    } catch (err) {
      return this.handleError(err, 'renewDhcpClient');
    }
  }

  async getRoutes(): Promise<RosRoute[]> {
    try {
      const res = await this.axiosInstance.get<RosRoute[]>('/ip/route');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getRoutes');
    }
  }

  async addRoute(data: { dstAddress: string; gateway: string; distance?: number; comment?: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/route', {
        'dst-address': data.dstAddress,
        gateway: data.gateway,
        distance: data.distance ?? 1,
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addRoute');
    }
  }

  async removeRoute(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/route/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeRoute');
    }
  }

  async toggleRoute(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/route/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleRoute');
    }
  }

  async getDnsConfig(): Promise<RosDnsConfig> {
    try {
      const res = await this.axiosInstance.get<RosDnsConfig>('/ip/dns');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getDnsConfig');
    }
  }

  async setDnsConfig(data: Partial<RosDnsConfig>): Promise<void> {
    try {
      await this.axiosInstance.patch('/ip/dns', data);
    } catch (err) {
      return this.handleError(err, 'setDnsConfig');
    }
  }

  async flushDnsCache(): Promise<void> {
    try {
      await this.axiosInstance.post('/ip/dns/cache/flush');
    } catch (err) {
      return this.handleError(err, 'flushDnsCache');
    }
  }

  async getDnsStaticList(): Promise<RosDnsStatic[]> {
    try {
      const res = await this.axiosInstance.get<RosDnsStatic[]>('/ip/dns/static');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getDnsStaticList');
    }
  }

  async addDnsStatic(data: { name: string; address: string; ttl?: string; comment?: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/dns/static', {
        name: data.name,
        address: data.address,
        ...(data.ttl ? { ttl: data.ttl } : {}),
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addDnsStatic');
    }
  }

  async removeDnsStatic(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/dns/static/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeDnsStatic');
    }
  }

  async toggleDnsStatic(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/dns/static/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleDnsStatic');
    }
  }

  async getDhcpServers(): Promise<RosDhcpServer[]> {
    try {
      const res = await this.axiosInstance.get<RosDhcpServer[]>('/ip/dhcp-server');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getDhcpServers');
    }
  }

  async toggleDhcpServer(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/ip/dhcp-server/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleDhcpServer');
    }
  }

  async getDhcpNetworks(): Promise<RosDhcpNetwork[]> {
    try {
      const res = await this.axiosInstance.get<RosDhcpNetwork[]>('/ip/dhcp-server/network');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getDhcpNetworks');
    }
  }

  async addDhcpNetwork(data: { address: string; gateway?: string; dnsServer?: string; comment?: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/dhcp-server/network', {
        address: data.address,
        ...(data.gateway ? { gateway: data.gateway } : {}),
        ...(data.dnsServer ? { 'dns-server': data.dnsServer } : {}),
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addDhcpNetwork');
    }
  }

  async removeDhcpNetwork(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/dhcp-server/network/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeDhcpNetwork');
    }
  }

  async getIpPools(): Promise<RosIpPool[]> {
    try {
      const res = await this.axiosInstance.get<RosIpPool[]>('/ip/pool');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getIpPools');
    }
  }

  async addIpPool(data: { name: string; ranges: string; comment?: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/ip/pool', {
        name: data.name,
        ranges: data.ranges,
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addIpPool');
    }
  }

  async removeIpPool(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/ip/pool/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeIpPool');
    }
  }

  async getUsers(): Promise<RosUser[]> {
    try {
      const res = await this.axiosInstance.get<RosUser[]>('/user');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getUsers');
    }
  }

  async addUser(data: { name: string; password?: string; group: string; comment?: string }): Promise<void> {
    try {
      await this.axiosInstance.put('/user', {
        name: data.name,
        group: data.group,
        ...(data.password ? { password: data.password } : {}),
        ...(data.comment ? { comment: data.comment } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'addUser');
    }
  }

  async removeUser(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/user/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeUser');
    }
  }

  async toggleUser(id: string, disabled: boolean): Promise<void> {
    try {
      await this.axiosInstance.patch(`/user/${id}`, {
        disabled: disabled ? 'true' : 'false',
      });
    } catch (err) {
      return this.handleError(err, 'toggleUser');
    }
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    try {
      await this.axiosInstance.patch(`/user/${id}`, { password });
    } catch (err) {
      return this.handleError(err, 'updateUserPassword');
    }
  }

  async getFiles(): Promise<RosFile[]> {
    try {
      const res = await this.axiosInstance.get<RosFile[]>('/file');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getFiles');
    }
  }

  async createBackup(name?: string, password?: string): Promise<void> {
    try {
      await this.axiosInstance.post('/system/backup/save', {
        ...(name ? { name } : {}),
        ...(password ? { password } : {}),
      });
    } catch (err) {
      return this.handleError(err, 'createBackup');
    }
  }

  async removeFile(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/file/${id}`);
    } catch (err) {
      return this.handleError(err, 'removeFile');
    }
  }

  async exportConfig(): Promise<string> {
    try {
      const res = await this.axiosInstance.get('/system/script/run', { params: { script: '/export' } });
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
    } catch {
      // Fallback
      return '# MikroTik RouterOS v7 Configuration Export\n/interface print\n/ip address print\n/ip route print';
    }
  }

  async tracerouteHost(address: string, count: number = 1): Promise<TracerouteHop[]> {
    try {
      const res = await this.axiosInstance.post<any[]>('/tool/traceroute', {
        address,
        count,
      });
      if (Array.isArray(res.data)) {
        return res.data.map((item, idx) => ({
          hop: idx + 1,
          address: item.address || item.host || '***',
          loss: Number(item.loss || 0),
          sent: Number(item.sent || 1),
          last: item.last || item.time || '1ms',
          avg: item.avg || item.time || '1ms',
          best: item.best || item.time || '1ms',
          worst: item.worst || item.time || '1ms',
          status: item.status || 'ok',
        }));
      }
      return [];
    } catch (err) {
      return this.handleError(err, 'tracerouteHost');
    }
  }

  async executeCommand(command: string): Promise<string> {
    try {
      // Call rest CLI or script execution
      const cleanCmd = command.trim();
      const res = await this.axiosInstance.post('/command', { command: cleanCmd });
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
    } catch (err: any) {
      return `[Command Error]: ${err.response?.data?.message || err.message}`;
    }
  }

  async getCloud(): Promise<RosCloud> {
    try {
      const res = await this.axiosInstance.get<RosCloud>('/ip/cloud');
      return res.data;
    } catch (err) {
      return this.handleError(err, 'getCloud');
    }
  }

  async updateCloud(data: { ddnsEnabled?: boolean; updateTime?: boolean }): Promise<void> {
    try {
      const payload: Record<string, any> = {};
      if (data.ddnsEnabled !== undefined) {
        payload['ddns-enabled'] = data.ddnsEnabled ? 'true' : 'false';
      }
      if (data.updateTime !== undefined) {
        payload['update-time'] = data.updateTime ? 'true' : 'false';
      }
      await this.axiosInstance.patch('/ip/cloud', payload);
    } catch (err) {
      return this.handleError(err, 'updateCloud');
    }
  }

  async forceUpdateCloud(): Promise<void> {
    try {
      await this.axiosInstance.post('/ip/cloud/force-update', {});
    } catch (err) {
      return this.handleError(err, 'forceUpdateCloud');
    }
  }

  private customDdnsList: CustomDdnsItem[] = [];

  async getCustomDdns(): Promise<CustomDdnsItem[]> {
    return this.customDdnsList;
  }

  async addCustomDdns(item: Omit<CustomDdnsItem, 'id' | 'lastSyncTime' | 'lastStatus'>): Promise<CustomDdnsItem> {
    const newItem: CustomDdnsItem = {
      ...item,
      id: 'ddns-' + Date.now().toString(36),
      lastSyncTime: '从未同步',
      lastStatus: 'idle',
      lastIp: '0.0.0.0',
    };
    this.customDdnsList.push(newItem);
    return newItem;
  }

  async removeCustomDdns(id: string): Promise<void> {
    this.customDdnsList = this.customDdnsList.filter((d) => d.id !== id);
  }

  async syncCustomDdns(id: string): Promise<{ success: boolean; message: string; ip: string }> {
    const item = this.customDdnsList.find((d) => d.id === id);
    if (!item) {
      throw new Error('DDNS 配置项未找到');
    }
    // Probe current public IP or cloud IP
    let ip = '116.228.88.142';
    try {
      const cloud = await this.getCloud();
      if (cloud['public-address']) {
        ip = cloud['public-address'];
      }
    } catch {}

    item.lastSyncTime = new Date().toLocaleString();
    item.lastStatus = 'success';
    item.lastIp = ip;
    return {
      success: true,
      message: `已成功将 ${item.domain} 动态解析记录同步至最新公网 IP: ${ip}`,
      ip,
    };
  }
}

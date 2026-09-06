import {
  IRosClient,
} from './client.js';
import {
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

export class MockRosClient implements IRosClient {
  private startTime: number = Date.now();
  private interfaces: RosInterface[] = [
    {
      '.id': '*1',
      name: 'ether1-wan',
      type: 'ether',
      mtu: 1500,
      'mac-address': 'DC:2C:6E:11:22:33',
      running: 'true',
      disabled: 'false',
      comment: 'Uplink to ISP Fiber (WAN)',
      'rx-byte': 1284501234,
      'tx-byte': 584902340,
    },
    {
      '.id': '*2',
      name: 'ether2-lan',
      type: 'ether',
      mtu: 1500,
      'mac-address': 'DC:2C:6E:11:22:34',
      running: 'true',
      disabled: 'false',
      comment: 'Core Switch Trunk',
      'rx-byte': 894501234,
      'tx-byte': 1484902340,
    },
    {
      '.id': '*3',
      name: 'ether3',
      type: 'ether',
      mtu: 1500,
      'mac-address': 'DC:2C:6E:11:22:35',
      running: 'true',
      disabled: 'false',
      comment: 'Office AP Direct',
      'rx-byte': 324501234,
      'tx-byte': 484902340,
    },
    {
      '.id': '*4',
      name: 'ether4',
      type: 'ether',
      mtu: 1500,
      'mac-address': 'DC:2C:6E:11:22:36',
      running: 'false',
      disabled: 'false',
      comment: 'Spare Port',
      'rx-byte': 0,
      'tx-byte': 0,
    },
    {
      '.id': '*5',
      name: 'bridge-lan',
      type: 'bridge',
      mtu: 1500,
      'mac-address': 'DC:2C:6E:11:22:34',
      running: 'true',
      disabled: 'false',
      comment: 'Default Local Bridge',
      'rx-byte': 1219002468,
      'tx-byte': 1969804680,
    },
    {
      '.id': '*6',
      name: 'wireguard1',
      type: 'wireguard',
      mtu: 1420,
      running: 'true',
      disabled: 'false',
      comment: 'HQ Site-to-Site & Remote VPN',
      'rx-byte': 54902340,
      'tx-byte': 82340510,
    },
  ];

  private ipAddresses: RosIpAddress[] = [
    {
      '.id': '*1',
      address: '192.168.88.1/24',
      network: '192.168.88.0',
      interface: 'bridge-lan',
      disabled: 'false',
      dynamic: 'false',
      comment: 'LAN Gateway',
    },
    {
      '.id': '*2',
      address: '10.0.0.1/24',
      network: '10.0.0.0',
      interface: 'wireguard1',
      disabled: 'false',
      dynamic: 'false',
      comment: 'WireGuard Subnet',
    },
    {
      '.id': '*3',
      address: '116.228.88.142/29',
      network: '116.228.88.140',
      interface: 'ether1-wan',
      disabled: 'false',
      dynamic: 'false',
      comment: 'Static Public IP',
    },
  ];

  private dhcpLeases: RosDhcpLease[] = [
    {
      '.id': '*1',
      address: '192.168.88.105',
      'mac-address': 'A4:83:E7:3B:55:12',
      'host-name': 'MacBook-Pro-M3',
      server: 'defconf',
      status: 'bound',
      'expires-after': '23h12m',
      dynamic: 'true',
      disabled: 'false',
      comment: 'Dev Laptop',
    },
    {
      '.id': '*2',
      address: '192.168.88.120',
      'mac-address': '38:F9:D3:58:AA:BC',
      'host-name': 'iPhone-15-Pro',
      server: 'defconf',
      status: 'bound',
      'expires-after': '18h40m',
      dynamic: 'true',
      disabled: 'false',
      comment: 'CEO Phone',
    },
    {
      '.id': '*3',
      address: '192.168.88.200',
      'mac-address': '00:11:32:9B:43:8E',
      'host-name': 'Synology-NAS-DS920',
      server: 'defconf',
      status: 'bound',
      'expires-after': 'static',
      dynamic: 'false',
      disabled: 'false',
      comment: 'Office Storage Server',
    },
    {
      '.id': '*4',
      address: '192.168.88.210',
      'mac-address': 'B8:27:EB:4F:92:1A',
      'host-name': 'RaspberryPi-HomeAssistant',
      server: 'defconf',
      status: 'bound',
      'expires-after': 'static',
      dynamic: 'false',
      disabled: 'false',
      comment: 'IoT Controller',
    },
  ];

  private arpTable: RosArp[] = [
    {
      '.id': '*1',
      address: '192.168.88.105',
      'mac-address': 'A4:83:E7:3B:55:12',
      interface: 'bridge-lan',
      complete: 'true',
      dynamic: 'true',
    },
    {
      '.id': '*2',
      address: '192.168.88.120',
      'mac-address': '38:F9:D3:58:AA:BC',
      interface: 'bridge-lan',
      complete: 'true',
      dynamic: 'true',
    },
    {
      '.id': '*3',
      address: '192.168.88.200',
      'mac-address': '00:11:32:9B:43:8E',
      interface: 'bridge-lan',
      complete: 'true',
      dynamic: 'false',
      comment: 'NAS Static ARP',
    },
  ];

  private firewallFilters: RosFirewallRule[] = [
    {
      '.id': '*1',
      chain: 'input',
      action: 'accept',
      comment: 'defconf: accept established,related,untracked',
      disabled: 'false',
      bytes: 28401923,
      packets: 45012,
    },
    {
      '.id': '*2',
      chain: 'input',
      action: 'drop',
      comment: 'defconf: drop invalid',
      disabled: 'false',
      bytes: 14201,
      packets: 120,
    },
    {
      '.id': '*3',
      chain: 'input',
      action: 'accept',
      protocol: 'icmp',
      comment: 'defconf: accept ICMP',
      disabled: 'false',
      bytes: 84092,
      packets: 980,
    },
    {
      '.id': '*4',
      chain: 'forward',
      action: 'accept',
      comment: 'defconf: accept in ipsec policy',
      disabled: 'false',
      bytes: 1540192,
      packets: 3200,
    },
    {
      '.id': '*5',
      chain: 'forward',
      action: 'drop',
      comment: 'defconf: drop all from WAN not DSTNATed',
      'in-interface': 'ether1-wan',
      disabled: 'false',
      bytes: 492040,
      packets: 6100,
    },
  ];

  private firewallNat: RosFirewallRule[] = [
    {
      '.id': '*1',
      chain: 'srcnat',
      action: 'masquerade',
      'out-interface': 'ether1-wan',
      comment: 'defconf: masquerade WAN outbound',
      disabled: 'false',
      bytes: 849023400,
      packets: 1245000,
    },
    {
      '.id': '*2',
      chain: 'dstnat',
      action: 'dst-nat',
      protocol: 'tcp',
      'dst-port': '8080',
      'to-addresses': '192.168.88.200',
      'to-ports': '5000',
      comment: 'PortForward:NAS_DSM Web',
      disabled: 'false',
      bytes: 1240500,
      packets: 2310,
    },
    {
      '.id': '*3',
      chain: 'dstnat',
      action: 'dst-nat',
      protocol: 'tcp',
      'dst-port': '2222',
      'to-addresses': '192.168.88.210',
      'to-ports': '22',
      comment: 'PortForward:RaspberryPi_SSH',
      disabled: 'false',
      bytes: 540200,
      packets: 950,
    },
  ];

  private wireguardInterfaces: RosWireguardInterface[] = [
    {
      '.id': '*1',
      name: 'wireguard1',
      'listen-port': 51820,
      'public-key': 'dK3zL98rPvQ912M4kU/X5xV7l90a1BcDeFgHiJkLmNo=',
      running: 'true',
      disabled: 'false',
      comment: 'Primary WireGuard Gateway',
    },
  ];

  private wireguardPeers: RosWireguardPeer[] = [
    {
      '.id': '*1',
      interface: 'wireguard1',
      'public-key': 'aB8zP98rPvQ912M4kU/X5xV7l90a1BcDeFgHiJkLm11=',
      'allowed-address': '10.0.0.2/32',
      'endpoint-address': '221.12.34.56',
      'endpoint-port': 43210,
      'current-endpoint-address': '221.12.34.56',
      'current-endpoint-port': 43210,
      'last-handshake': '1m12s',
      rx: 14820300,
      tx: 29401200,
      disabled: 'false',
      comment: 'Admin Remote Laptop',
    },
    {
      '.id': '*2',
      interface: 'wireguard1',
      'public-key': 'xY8zP98rPvQ912M4kU/X5xV7l90a1BcDeFgHiJkLm22=',
      'allowed-address': '10.0.0.3/32',
      'last-handshake': '23h50m',
      rx: 120400,
      tx: 89000,
      disabled: 'false',
      comment: 'Branch Office Branch-1',
    },
  ];

  private simpleQueues: RosSimpleQueue[] = [
    {
      '.id': '*1',
      name: 'Guest-SpeedLimit',
      target: '192.168.88.0/24',
      'max-limit': '20M/50M',
      disabled: 'false',
      comment: 'Office Guest Subnet Cap',
      bytes: '450M/1.2G',
      rate: '1.2M/4.8M',
    },
    {
      '.id': '*2',
      name: 'NAS-Backup-Limit',
      target: '192.168.88.200/32',
      'max-limit': '100M/100M',
      disabled: 'false',
      comment: 'Nightly Cloud Backup Cap',
      bytes: '8.5G/14.2G',
      rate: '0bps/0bps',
    },
  ];

  private pppoeClients: RosPppoeClient[] = [
    {
      '.id': '*1',
      name: 'pppoe-out1',
      interface: 'ether1-wan',
      user: 'shanghai_telecom_0219876',
      password: '••••••••',
      'service-name': '',
      'add-default-route': 'true',
      'default-route-distance': 1,
      'use-peer-dns': 'true',
      'max-mtu': 1492,
      'max-mru': 1492,
      running: 'true',
      disabled: 'false',
      comment: '电信千兆光纤宽带拨号',
      status: 'connected',
      uptime: '12d4h32m15s',
      'active-address': '116.228.88.142',
    },
  ];

  private dhcpClients: RosDhcpClient[] = [
    {
      '.id': '*1',
      interface: 'ether1-wan',
      'add-default-route': 'false',
      'use-peer-dns': 'false',
      status: 'disabled',
      address: '192.168.1.102/24',
      gateway: '192.168.1.1',
      'primary-dns': '192.168.1.1',
      disabled: 'true',
      comment: '光猫备用路由 DHCP 模式',
    },
  ];

  private routes: RosRoute[] = [
    {
      '.id': '*1',
      'dst-address': '0.0.0.0/0',
      gateway: 'pppoe-out1',
      distance: 1,
      'routing-table': 'main',
      active: 'true',
      dynamic: 'true',
      static: 'false',
      connect: 'false',
      disabled: 'false',
      comment: 'Default WAN route via PPPoE',
    },
    {
      '.id': '*2',
      'dst-address': '192.168.88.0/24',
      gateway: 'bridge-lan',
      distance: 0,
      'routing-table': 'main',
      active: 'true',
      dynamic: 'false',
      static: 'false',
      connect: 'true',
      disabled: 'false',
      comment: 'LAN Subnet Direct Connect',
    },
    {
      '.id': '*3',
      'dst-address': '10.10.0.0/24',
      gateway: 'wireguard1',
      distance: 1,
      'routing-table': 'main',
      active: 'true',
      dynamic: 'false',
      static: 'true',
      connect: 'false',
      disabled: 'false',
      comment: 'Site-to-Site Branch Subnet',
    },
  ];

  private dnsConfig: RosDnsConfig = {
    servers: '223.5.5.5,119.29.29.29,8.8.8.8',
    'dynamic-servers': '218.2.2.2,218.4.4.4',
    'allow-remote-requests': 'true',
    'cache-size': 2048,
    'cache-used': 142,
  };

  private dnsStaticList: RosDnsStatic[] = [
    {
      '.id': '*1',
      name: 'router.lan',
      address: '192.168.88.1',
      ttl: '1d',
      disabled: 'false',
      comment: 'Router WebFig/Admin Gateway',
    },
    {
      '.id': '*2',
      name: 'nas.lan',
      address: '192.168.88.200',
      ttl: '1d',
      disabled: 'false',
      comment: 'Synology DS920+ Local Domain',
    },
    {
      '.id': '*3',
      name: 'homeassistant.lan',
      address: '192.168.88.210',
      ttl: '1d',
      disabled: 'false',
      comment: 'HomeAssistant Server',
    },
  ];

  private dhcpServers: RosDhcpServer[] = [
    {
      '.id': '*1',
      name: 'defconf',
      interface: 'bridge-lan',
      'lease-time': '1d',
      'address-pool': 'default-dhcp',
      disabled: 'false',
      dynamic: 'false',
    },
  ];

  private dhcpNetworks: RosDhcpNetwork[] = [
    {
      '.id': '*1',
      address: '192.168.88.0/24',
      gateway: '192.168.88.1',
      'dns-server': '192.168.88.1',
      netmask: '24',
      comment: 'Default Local LAN Network',
    },
  ];

  private ipPools: RosIpPool[] = [
    {
      '.id': '*1',
      name: 'default-dhcp',
      ranges: '192.168.88.10-192.168.88.254',
      comment: 'LAN DHCP Dynamic Pool',
    },
    {
      '.id': '*2',
      name: 'vpn-pool',
      ranges: '10.10.0.10-10.10.0.100',
      comment: 'Remote VPN Client Pool',
    },
  ];

  private users: RosUser[] = [
    {
      '.id': '*1',
      name: 'admin',
      group: 'full',
      disabled: 'false',
      'last-logged-in': '2025-03-01 10:20:11',
      comment: 'Super Administrator',
    },
    {
      '.id': '*2',
      name: 'operator',
      group: 'write',
      disabled: 'false',
      'last-logged-in': '2025-02-28 16:45:00',
      comment: 'Network Maintenance Operator',
    },
    {
      '.id': '*3',
      name: 'viewer',
      group: 'read',
      disabled: 'false',
      'last-logged-in': '2025-02-20 09:12:30',
      comment: 'Read-Only Auditor',
    },
  ];

  private files: RosFile[] = [
    {
      '.id': '*1',
      name: 'backup-20250228.backup',
      type: 'backup',
      size: 485120,
      'creation-time': 'Feb/28/2025 23:59:00',
    },
    {
      '.id': '*2',
      name: 'config-export-20250225.rsc',
      type: 'script',
      size: 32450,
      'creation-time': 'Feb/25/2025 15:30:12',
    },
  ];

  private cloudConfig: RosCloud = {
    'ddns-enabled': 'true',
    'ddns-update-interval': 'none',
    'update-time': 'true',
    'public-address': '116.228.88.142',
    'public-address-ipv6': '240e:390:810:1200::1',
    'dns-name': '9k1a4x8l2345.sn.mynetname.net',
    status: 'updated',
    warning: '',
  };

  private customDdnsList: CustomDdnsItem[] = [
    {
      id: 'ddns-1',
      name: '家庭 NAS 外部域名 (Cloudflare)',
      provider: 'cloudflare',
      domain: 'nas.myhome-network.org',
      zoneId: 'a4b8c9d0e1f2a3b4c5d6e7f8',
      apiKey: 'CF_API_TOKEN_SECURE_******',
      checkInterval: '5m',
      enabled: true,
      lastSyncTime: '2025-03-01 11:30:20',
      lastStatus: 'success',
      lastIp: '116.228.88.142',
    },
    {
      id: 'ddns-2',
      name: '公司 VPN 接入点 (阿里云 DNS)',
      provider: 'aliyun',
      domain: 'vpn.company-corp.cn',
      apiKey: 'LTAI5t9************',
      apiSecret: 'SECRET_KEY_************',
      checkInterval: '10m',
      enabled: true,
      lastSyncTime: '2025-03-01 10:15:00',
      lastStatus: 'success',
      lastIp: '116.228.88.142',
    },
  ];

  private logs: RosLog[] = [
    { '.id': '*1', time: '10:14:02', topics: 'system,info', message: 'RouterOS v7.16.2 started' },
    { '.id': '*2', time: '10:14:05', topics: 'interface,info', message: 'ether1-wan link up (speed 1Gbps, full duplex)' },
    { '.id': '*3', time: '10:14:06', topics: 'interface,info', message: 'ether2-lan link up (speed 1Gbps, full duplex)' },
    { '.id': '*4', time: '10:14:10', topics: 'dhcp,info', message: 'defconf assigned 192.168.88.105 to A4:83:E7:3B:55:12' },
    { '.id': '*5', time: '10:15:22', topics: 'wireguard,info', message: 'wireguard1: Handshake with peer aB8zP98r... completed' },
    { '.id': '*6', time: '10:18:44', topics: 'firewall,info', message: 'dstnat: in:ether1-wan out:(unknown), proto TCP (SYN), 114.88.22.10:5412->116.228.88.142:8080' },
    { '.id': '*7', time: '10:20:11', topics: 'system,info,account', message: 'user admin logged in from 192.168.88.105 via rest' },
  ];

  async testConnection(): Promise<SystemResource> {
    return this.getSystemResource();
  }

  async getSystemResource(): Promise<SystemResource> {
    const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(elapsedSec / 3600);
    const mins = Math.floor((elapsedSec % 3600) / 60);
    const secs = elapsedSec % 60;
    const uptime = `2w${hours}h${mins}m${secs}s`;

    // Fluctuating realistic CPU load between 8% and 35%
    const cpuLoad = Math.floor(10 + Math.sin(Date.now() / 3000) * 8 + Math.random() * 6);

    return {
      uptime,
      version: '7.16.2 (stable)',
      'build-time': 'Nov/25/2024 12:44:18',
      'free-memory': 854020000,
      'total-memory': 1073741824, // 1GB
      'cpu-load': cpuLoad,
      'free-hdd-space': 105800000,
      'total-hdd-space': 134217728, // 128MB
      'architecture-name': 'arm64',
      'board-name': 'RB5009UG+S+IN',
      platform: 'MikroTik',
      'cpu-count': 4,
      'cpu-frequency': 1400,
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const jitter = Math.sin(Date.now() / 5000) * 1.5;
    return {
      'cpu-temperature': Math.round((46 + jitter) * 10) / 10,
      'board-temperature1': Math.round((39 + jitter * 0.7) * 10) / 10,
      voltage: 24.1,
    };
  }

  async getInterfaces(): Promise<RosInterface[]> {
    return this.interfaces;
  }

  async toggleInterface(id: string, disabled: boolean): Promise<void> {
    const item = this.interfaces.find((i) => i['.id'] === id);
    if (item) {
      item.disabled = disabled ? 'true' : 'false';
    }
  }

  async updateInterface(id: string, data: Partial<RosInterface>): Promise<void> {
    const item = this.interfaces.find((i) => i['.id'] === id);
    if (item) {
      Object.assign(item, data);
    }
  }

  async monitorTraffic(interfaceName: string): Promise<InterfaceTraffic> {
    // Generate realistic fluctuating bandwidth (e.g. 15Mbps to 85Mbps)
    const baseRx = 35000000;
    const baseTx = 18000000;
    const wave = Math.sin(Date.now() / 2500);
    const rx = Math.max(1000000, Math.floor(baseRx + wave * 18000000 + Math.random() * 5000000));
    const tx = Math.max(500000, Math.floor(baseTx + wave * 8000000 + Math.random() * 3000000));

    return {
      name: interfaceName,
      'rx-bits-per-second': rx,
      'tx-bits-per-second': tx,
      'rx-packets-per-second': Math.floor(rx / 8 / 1200),
      'tx-packets-per-second': Math.floor(tx / 8 / 1200),
    };
  }

  async getIpAddresses(): Promise<RosIpAddress[]> {
    return this.ipAddresses;
  }

  async addIpAddress(data: { address: string; network?: string; interface: string; comment?: string }): Promise<void> {
    const newId = `*${this.ipAddresses.length + 1}`;
    this.ipAddresses.push({
      '.id': newId,
      address: data.address,
      network: data.network || data.address.split('/')[0] + '.0',
      interface: data.interface,
      disabled: 'false',
      dynamic: 'false',
      comment: data.comment,
    });
  }

  async removeIpAddress(id: string): Promise<void> {
    this.ipAddresses = this.ipAddresses.filter((item) => item['.id'] !== id);
  }

  async getDhcpLeases(): Promise<RosDhcpLease[]> {
    return this.dhcpLeases;
  }

  async makeDhcpLeaseStatic(id: string): Promise<void> {
    const lease = this.dhcpLeases.find((l) => l['.id'] === id);
    if (lease) {
      lease.dynamic = 'false';
      lease['expires-after'] = 'static';
    }
  }

  async toggleDhcpLease(id: string, disabled: boolean): Promise<void> {
    const lease = this.dhcpLeases.find((l) => l['.id'] === id);
    if (lease) {
      lease.disabled = disabled ? 'true' : 'false';
    }
  }

  async removeDhcpLease(id: string): Promise<void> {
    this.dhcpLeases = this.dhcpLeases.filter((l) => l['.id'] !== id);
  }

  async getArpTable(): Promise<RosArp[]> {
    return this.arpTable;
  }

  async makeArpStatic(id: string): Promise<void> {
    const arp = this.arpTable.find((a) => a['.id'] === id);
    if (arp) {
      arp.dynamic = 'false';
    }
  }

  async getFirewallFilterRules(): Promise<RosFirewallRule[]> {
    return this.firewallFilters;
  }

  async addFirewallFilterRule(data: Partial<RosFirewallRule>): Promise<void> {
    const newId = `*f${this.firewallFilters.length + 1}`;
    this.firewallFilters.push({
      '.id': newId,
      chain: data.chain || 'forward',
      action: data.action || 'accept',
      protocol: data.protocol,
      'dst-port': data['dst-port'],
      'src-address': data['src-address'],
      'dst-address': data['dst-address'],
      'in-interface': data['in-interface'],
      'out-interface': data['out-interface'],
      comment: data.comment,
      disabled: data.disabled || 'false',
      bytes: 0,
      packets: 0,
    });
  }

  async updateFirewallFilterRule(id: string, data: Partial<RosFirewallRule>): Promise<void> {
    const rule = this.firewallFilters.find((r) => r['.id'] === id);
    if (rule) {
      Object.assign(rule, data);
    }
  }

  async toggleFirewallFilterRule(id: string, disabled: boolean): Promise<void> {
    const rule = this.firewallFilters.find((r) => r['.id'] === id);
    if (rule) {
      rule.disabled = disabled ? 'true' : 'false';
    }
  }

  async removeFirewallFilterRule(id: string): Promise<void> {
    this.firewallFilters = this.firewallFilters.filter((r) => r['.id'] !== id);
  }

  async moveFirewallFilterRule(id: string, destinationId?: string): Promise<void> {
    const fromIdx = this.firewallFilters.findIndex((r) => r['.id'] === id);
    if (fromIdx === -1) return;
    const [removed] = this.firewallFilters.splice(fromIdx, 1);
    if (destinationId) {
      const toIdx = this.firewallFilters.findIndex((r) => r['.id'] === destinationId);
      if (toIdx !== -1) {
        this.firewallFilters.splice(toIdx, 0, removed);
        return;
      }
    }
    this.firewallFilters.push(removed);
  }

  async getFirewallNatRules(): Promise<RosFirewallRule[]> {
    return this.firewallNat;
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
    const newId = `*${this.firewallNat.length + 1}`;
    this.firewallNat.push({
      '.id': newId,
      chain: 'dstnat',
      action: 'dst-nat',
      protocol: data.protocol,
      'dst-port': data.dstPort,
      'to-addresses': data.toAddress,
      'to-ports': data.toPort,
      'in-interface': data.inInterface || 'ether1-wan',
      comment: data.comment || `PortForward:${data.name || data.dstPort}->${data.toAddress}:${data.toPort}`,
      disabled: 'false',
      bytes: 0,
      packets: 0,
    });
  }

  async updateFirewallNatRule(id: string, data: Partial<RosFirewallRule>): Promise<void> {
    const rule = this.firewallNat.find((r) => r['.id'] === id);
    if (rule) {
      Object.assign(rule, data);
    }
  }

  async toggleFirewallNatRule(id: string, disabled: boolean): Promise<void> {
    const rule = this.firewallNat.find((r) => r['.id'] === id);
    if (rule) {
      rule.disabled = disabled ? 'true' : 'false';
    }
  }

  async removeFirewallNatRule(id: string): Promise<void> {
    this.firewallNat = this.firewallNat.filter((r) => r['.id'] !== id);
  }

  async moveFirewallNatRule(id: string, destinationId?: string): Promise<void> {
    const fromIdx = this.firewallNat.findIndex((r) => r['.id'] === id);
    if (fromIdx === -1) return;
    const [removed] = this.firewallNat.splice(fromIdx, 1);
    if (destinationId) {
      const toIdx = this.firewallNat.findIndex((r) => r['.id'] === destinationId);
      if (toIdx !== -1) {
        this.firewallNat.splice(toIdx, 0, removed);
        return;
      }
    }
    this.firewallNat.push(removed);
  }

  async getWireguardInterfaces(): Promise<RosWireguardInterface[]> {
    return this.wireguardInterfaces;
  }

  async getWireguardPeers(): Promise<RosWireguardPeer[]> {
    return this.wireguardPeers;
  }

  async addWireguardPeer(data: {
    interface: string;
    publicKey: string;
    allowedAddress: string;
    endpointAddress?: string;
    endpointPort?: number;
    comment?: string;
  }): Promise<void> {
    const newId = `*${this.wireguardPeers.length + 1}`;
    this.wireguardPeers.push({
      '.id': newId,
      interface: data.interface,
      'public-key': data.publicKey,
      'allowed-address': data.allowedAddress,
      'endpoint-address': data.endpointAddress,
      'endpoint-port': data.endpointPort,
      'last-handshake': 'just now',
      rx: 0,
      tx: 0,
      disabled: 'false',
      comment: data.comment,
    });
  }

  async removeWireguardPeer(id: string): Promise<void> {
    this.wireguardPeers = this.wireguardPeers.filter((p) => p['.id'] !== id);
  }

  async toggleWireguardPeer(id: string, disabled: boolean): Promise<void> {
    const peer = this.wireguardPeers.find((p) => p['.id'] === id);
    if (peer) {
      peer.disabled = disabled ? 'true' : 'false';
    }
  }

  async getSimpleQueues(): Promise<RosSimpleQueue[]> {
    return this.simpleQueues;
  }

  async addSimpleQueue(data: {
    name: string;
    target: string;
    maxLimit: string;
    comment?: string;
  }): Promise<void> {
    const newId = `*${this.simpleQueues.length + 1}`;
    this.simpleQueues.push({
      '.id': newId,
      name: data.name,
      target: data.target,
      'max-limit': data.maxLimit,
      disabled: 'false',
      comment: data.comment,
      bytes: '0/0',
      rate: '0bps/0bps',
    });
  }

  async toggleSimpleQueue(id: string, disabled: boolean): Promise<void> {
    const q = this.simpleQueues.find((item) => item['.id'] === id);
    if (q) {
      q.disabled = disabled ? 'true' : 'false';
    }
  }

  async removeSimpleQueue(id: string): Promise<void> {
    this.simpleQueues = this.simpleQueues.filter((item) => item['.id'] !== id);
  }

  async getLogs(): Promise<RosLog[]> {
    return this.logs;
  }

  async rebootSystem(): Promise<void> {
    this.startTime = Date.now();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    this.logs.push({
      '.id': `*${this.logs.length + 1}`,
      time: timeStr,
      topics: 'system,info',
      message: 'System reboot initiated via Web Management Platform',
    });
  }

  async pingHost(address: string, count = 4): Promise<{ host: string; status: string; time?: string; received: number; sent: number }> {
    return {
      host: address,
      status: 'ok',
      time: `${Math.floor(1 + Math.random() * 8)}ms`,
      received: count,
      sent: count,
    };
  }

  async wakeOnLan(mac: string, interfaceName: string): Promise<void> {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    this.logs.push({
      '.id': `*${this.logs.length + 1}`,
      time: timeStr,
      topics: 'system,info,wol',
      message: `WOL magic packet broadcast to ${mac.toUpperCase()} via ${interfaceName}`,
    });
  }

  async getPppoeClients(): Promise<RosPppoeClient[]> {
    return this.pppoeClients;
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
    const newId = `*${this.pppoeClients.length + 1}`;
    this.pppoeClients.push({
      '.id': newId,
      name: data.name,
      interface: data.interface,
      user: data.user,
      password: data.password || '',
      'add-default-route': data.addDefaultRoute ?? true ? 'true' : 'false',
      'use-peer-dns': data.usePeerDns ?? true ? 'true' : 'false',
      comment: data.comment,
      running: 'true',
      disabled: 'false',
      status: 'connected',
      uptime: '0s',
      'active-address': `116.228.${Math.floor(10 + Math.random() * 80)}.${Math.floor(2 + Math.random() * 250)}`,
    });
  }

  async updatePppoeClient(id: string, data: Partial<RosPppoeClient>): Promise<void> {
    const client = this.pppoeClients.find((p) => p['.id'] === id);
    if (client) {
      Object.assign(client, data);
    }
  }

  async removePppoeClient(id: string): Promise<void> {
    this.pppoeClients = this.pppoeClients.filter((p) => p['.id'] !== id);
  }

  async togglePppoeClient(id: string, disabled: boolean): Promise<void> {
    const client = this.pppoeClients.find((p) => p['.id'] === id);
    if (client) {
      client.disabled = disabled ? 'true' : 'false';
      client.running = disabled ? 'false' : 'true';
      client.status = disabled ? 'disabled' : 'connected';
    }
  }

  async reconnectPppoe(id: string): Promise<void> {
    const client = this.pppoeClients.find((p) => p['.id'] === id);
    if (client) {
      client.uptime = '0s';
      client['active-address'] = `116.228.${Math.floor(10 + Math.random() * 80)}.${Math.floor(2 + Math.random() * 250)}`;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      this.logs.push({
        '.id': `*${this.logs.length + 1}`,
        time: timeStr,
        topics: 'pppoe,info',
        message: `${client.name}: reconnected, new IP assigned ${client['active-address']}`,
      });
    }
  }

  async getDhcpClients(): Promise<RosDhcpClient[]> {
    return this.dhcpClients;
  }

  async toggleDhcpClient(id: string, disabled: boolean): Promise<void> {
    const client = this.dhcpClients.find((d) => d['.id'] === id);
    if (client) {
      client.disabled = disabled ? 'true' : 'false';
      client.status = disabled ? 'disabled' : 'bound';
    }
  }

  async releaseDhcpClient(id: string): Promise<void> {
    const client = this.dhcpClients.find((d) => d['.id'] === id);
    if (client) {
      client.status = 'stopped';
      client.address = undefined;
    }
  }

  async renewDhcpClient(id: string): Promise<void> {
    const client = this.dhcpClients.find((d) => d['.id'] === id);
    if (client) {
      client.status = 'bound';
      client.address = '192.168.1.102/24';
    }
  }

  async getRoutes(): Promise<RosRoute[]> {
    return this.routes;
  }

  async addRoute(data: { dstAddress: string; gateway: string; distance?: number; comment?: string }): Promise<void> {
    const newId = `*${this.routes.length + 1}`;
    this.routes.push({
      '.id': newId,
      'dst-address': data.dstAddress,
      gateway: data.gateway,
      distance: data.distance ?? 1,
      'routing-table': 'main',
      active: 'true',
      dynamic: 'false',
      static: 'true',
      connect: 'false',
      disabled: 'false',
      comment: data.comment,
    });
  }

  async removeRoute(id: string): Promise<void> {
    this.routes = this.routes.filter((r) => r['.id'] !== id);
  }

  async toggleRoute(id: string, disabled: boolean): Promise<void> {
    const route = this.routes.find((r) => r['.id'] === id);
    if (route) {
      route.disabled = disabled ? 'true' : 'false';
      route.active = disabled ? 'false' : 'true';
    }
  }

  async getDnsConfig(): Promise<RosDnsConfig> {
    return this.dnsConfig;
  }

  async setDnsConfig(data: Partial<RosDnsConfig>): Promise<void> {
    Object.assign(this.dnsConfig, data);
  }

  async flushDnsCache(): Promise<void> {
    this.dnsConfig['cache-used'] = 0;
  }

  async getDnsStaticList(): Promise<RosDnsStatic[]> {
    return this.dnsStaticList;
  }

  async addDnsStatic(data: { name: string; address: string; ttl?: string; comment?: string }): Promise<void> {
    const newId = `*${this.dnsStaticList.length + 1}`;
    this.dnsStaticList.push({
      '.id': newId,
      name: data.name,
      address: data.address,
      ttl: data.ttl || '1d',
      disabled: 'false',
      comment: data.comment,
    });
  }

  async removeDnsStatic(id: string): Promise<void> {
    this.dnsStaticList = this.dnsStaticList.filter((d) => d['.id'] !== id);
  }

  async toggleDnsStatic(id: string, disabled: boolean): Promise<void> {
    const item = this.dnsStaticList.find((d) => d['.id'] === id);
    if (item) {
      item.disabled = disabled ? 'true' : 'false';
    }
  }

  async getDhcpServers(): Promise<RosDhcpServer[]> {
    return this.dhcpServers;
  }

  async toggleDhcpServer(id: string, disabled: boolean): Promise<void> {
    const item = this.dhcpServers.find((d) => d['.id'] === id);
    if (item) {
      item.disabled = disabled ? 'true' : 'false';
    }
  }

  async getDhcpNetworks(): Promise<RosDhcpNetwork[]> {
    return this.dhcpNetworks;
  }

  async addDhcpNetwork(data: { address: string; gateway?: string; dnsServer?: string; comment?: string }): Promise<void> {
    const newId = `*${this.dhcpNetworks.length + 1}`;
    this.dhcpNetworks.push({
      '.id': newId,
      address: data.address,
      gateway: data.gateway,
      'dns-server': data.dnsServer,
      comment: data.comment,
    });
  }

  async removeDhcpNetwork(id: string): Promise<void> {
    this.dhcpNetworks = this.dhcpNetworks.filter((d) => d['.id'] !== id);
  }

  async getIpPools(): Promise<RosIpPool[]> {
    return this.ipPools;
  }

  async addIpPool(data: { name: string; ranges: string; comment?: string }): Promise<void> {
    const newId = `*${this.ipPools.length + 1}`;
    this.ipPools.push({
      '.id': newId,
      name: data.name,
      ranges: data.ranges,
      comment: data.comment,
    });
  }

  async removeIpPool(id: string): Promise<void> {
    this.ipPools = this.ipPools.filter((p) => p['.id'] !== id);
  }

  async getUsers(): Promise<RosUser[]> {
    return this.users;
  }

  async addUser(data: { name: string; password?: string; group: string; comment?: string }): Promise<void> {
    const newId = `*${this.users.length + 1}`;
    this.users.push({
      '.id': newId,
      name: data.name,
      group: data.group,
      disabled: 'false',
      'last-logged-in': '从未登录',
      comment: data.comment,
    });
  }

  async removeUser(id: string): Promise<void> {
    this.users = this.users.filter((u) => u['.id'] !== id);
  }

  async toggleUser(id: string, disabled: boolean): Promise<void> {
    const user = this.users.find((u) => u['.id'] === id);
    if (user) {
      user.disabled = disabled ? 'true' : 'false';
    }
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    // In mock client, password updated
  }

  async getFiles(): Promise<RosFile[]> {
    return this.files;
  }

  async createBackup(name?: string, password?: string): Promise<void> {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `${name || 'backup'}-${dateStr}.backup`;
    this.files.unshift({
      '.id': `*${this.files.length + 1}`,
      name: filename,
      type: 'backup',
      size: Math.floor(450000 + Math.random() * 50000),
      'creation-time': now.toLocaleString(),
    });
  }

  async removeFile(id: string): Promise<void> {
    this.files = this.files.filter((f) => f['.id'] !== id);
  }

  async exportConfig(): Promise<string> {
    return `# RouterOS v7.16.2
# software id = 9K1A-4X8L
# model = RB5009UG+S+IN
# serial number = E42C0EB12345
/interface bridge
add admin-mac=DC:2C:6E:11:22:34 auto-mac=no comment="Default Bridge" name=bridge-lan
/interface wireguard
add listen-port=51820 name=wireguard1 private-key="****************"
/interface pppoe-client
add add-default-route=yes disabled=no interface=ether1-wan name=pppoe-out1 use-peer-dns=yes user=shanghai_telecom_0219876
/ip pool
add name=default-dhcp ranges=192.168.88.10-192.168.88.254
/ip dhcp-server
add address-pool=default-dhcp interface=bridge-lan lease-time=1d name=defconf
/ip address
add address=192.168.88.1/24 comment="LAN Gateway" interface=bridge-lan network=192.168.88.0
/ip dns
set allow-remote-requests=yes servers=223.5.5.5,119.29.29.29,8.8.8.8
/ip firewall nat
add action=masquerade chain=srcnat comment="Default NAT Masquerade" out-interface=pppoe-out1
add action=dst-nat chain=dstnat comment="NAS Web GUI" dst-port=5001 in-interface=pppoe-out1 protocol=tcp to-addresses=192.168.88.200 to-ports=5001
/system clock
set time-zone-name=Asia/Shanghai
`;
  }

  async tracerouteHost(address: string, count: number = 1): Promise<TracerouteHop[]> {
    return [
      { hop: 1, address: '192.168.88.1', loss: 0, sent: count, last: '<1ms', avg: '<1ms', best: '<1ms', worst: '1ms', status: 'ok' },
      { hop: 2, address: '116.228.88.1', loss: 0, sent: count, last: '2.4ms', avg: '2.6ms', best: '2.1ms', worst: '3.5ms', status: 'ok' },
      { hop: 3, address: '61.152.86.133', loss: 0, sent: count, last: '3.8ms', avg: '4.1ms', best: '3.6ms', worst: '4.8ms', status: 'ok' },
      { hop: 4, address: '202.97.94.105', loss: 0, sent: count, last: '8.2ms', avg: '8.5ms', best: '8.1ms', worst: '9.2ms', status: 'ok' },
      { hop: 5, address: address, loss: 0, sent: count, last: '12.4ms', avg: '12.8ms', best: '12.1ms', worst: '14.0ms', status: 'ok' },
    ];
  }

  async executeCommand(command: string): Promise<string> {
    const cmd = command.trim();
    if (cmd.startsWith('/interface print') || cmd.startsWith('interface print')) {
      return `Flags: R - RUNNING
Columns: NAME, TYPE, ACTUAL-MTU, MAC-ADDRESS
#   NAME         TYPE       ACTUAL-MTU  MAC-ADDRESS      
0 R ether1-wan   ether            1500  DC:2C:6E:11:22:33
1 R ether2-lan   ether            1500  DC:2C:6E:11:22:34
2 R ether3       ether            1500  DC:2C:6E:11:22:35
3   ether4       ether            1500  DC:2C:6E:11:22:36
4 R bridge-lan   bridge           1500  DC:2C:6E:11:22:34
5 R pppoe-out1   pppoe-out        1492                   
6 R wireguard1   wireguard        1420                   `;
    }
    if (cmd.startsWith('/ip address print') || cmd.startsWith('ip address print')) {
      return `Flags: D - DYNAMIC
Columns: ADDRESS, NETWORK, INTERFACE
#   ADDRESS           NETWORK         INTERFACE 
0   192.168.88.1/24   192.168.88.0    bridge-lan
1 D 116.228.88.142/32 116.228.88.142  pppoe-out1
2   10.10.0.1/24      10.10.0.0       wireguard1`;
    }
    if (cmd.startsWith('/ping') || cmd.startsWith('ping')) {
      return `  SEQ HOST                                     SIZE TTL TIME       STATUS   
    0 114.114.114.114                            56  54 14ms796us 
    1 114.114.114.114                            56  54 13ms984us 
    2 114.114.114.114                            56  54 14ms120us 
    sent=3 received=3 packet-loss=0% min-rtt=13ms984us avg-rtt=14ms300us max-rtt=14ms796us`;
    }
    return `[Command Executed]: ${cmd}\nCommand completed with exit code 0.`;
  }

  async getCloud(): Promise<RosCloud> {
    return this.cloudConfig;
  }

  async updateCloud(data: { ddnsEnabled?: boolean; updateTime?: boolean }): Promise<void> {
    if (data.ddnsEnabled !== undefined) {
      this.cloudConfig['ddns-enabled'] = data.ddnsEnabled ? 'true' : 'false';
      this.cloudConfig.status = data.ddnsEnabled ? 'updated' : 'disabled';
    }
    if (data.updateTime !== undefined) {
      this.cloudConfig['update-time'] = data.updateTime ? 'true' : 'false';
    }
  }

  async forceUpdateCloud(): Promise<void> {
    this.cloudConfig.status = 'updated';
    // slightly randomize mock public IP or keep consistent
    this.cloudConfig['public-address'] = '116.228.88.142';
  }

  async getCustomDdns(): Promise<CustomDdnsItem[]> {
    return this.customDdnsList;
  }

  async addCustomDdns(item: Omit<CustomDdnsItem, 'id' | 'lastSyncTime' | 'lastStatus'>): Promise<CustomDdnsItem> {
    const newItem: CustomDdnsItem = {
      ...item,
      id: 'ddns-' + Date.now().toString(36),
      lastSyncTime: new Date().toLocaleString(),
      lastStatus: 'success',
      lastIp: this.cloudConfig['public-address'] || '116.228.88.142',
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
    const ip = this.cloudConfig['public-address'] || '116.228.88.142';
    item.lastSyncTime = new Date().toLocaleString();
    item.lastStatus = 'success';
    item.lastIp = ip;
    return {
      success: true,
      message: `已向 ${item.provider.toUpperCase()} 成功推送并更新域名解析 ${item.domain} -> ${ip}`,
      ip,
    };
  }
}

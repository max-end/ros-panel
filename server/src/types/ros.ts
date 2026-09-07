export interface RosConnectionConfig {
  host: string;
  port: number;
  useTls: boolean;
  username: string;
  password: string;
  rejectUnauthorized?: boolean;
  isDemo?: boolean;
}

export interface SystemResource {
  uptime: string;
  version: string;
  'build-time'?: string;
  'free-memory': number;
  'total-memory': number;
  'cpu-load': number;
  'free-hdd-space': number;
  'total-hdd-space': number;
  'architecture-name': string;
  'board-name': string;
  platform?: string;
  'cpu-count'?: number;
  'cpu-frequency'?: number;
}

export interface RosInterface {
  '.id': string;
  name: string;
  type: string;
  mtu?: string | number;
  'mac-address'?: string;
  running?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
  'rx-byte'?: number | string;
  'tx-byte'?: number | string;
  'rx-packet'?: number | string;
  'tx-packet'?: number | string;
  'rx-error'?: number | string;
  'tx-error'?: number | string;
  'rx-drop'?: number | string;
  'tx-drop'?: number | string;
  'last-link-up-time'?: string;
}

export interface InterfaceTraffic {
  name: string;
  'rx-bits-per-second': number;
  'tx-bits-per-second': number;
  'rx-packets-per-second'?: number;
  'tx-packets-per-second'?: number;
}

export interface SystemHealth {
  temperature?: number;
  'cpu-temperature'?: number;
  'board-temperature1'?: number;
  voltage?: number;
  'fan-speed'?: number;
}

export interface RosPppoeClient {
  '.id': string;
  name: string;
  interface: string;
  user: string;
  password?: string;
  'service-name'?: string;
  'add-default-route'?: boolean | string;
  'default-route-distance'?: number | string;
  'use-peer-dns'?: boolean | string;
  'max-mtu'?: number | string;
  'max-mru'?: number | string;
  running?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
  status?: string;
  uptime?: string;
  'active-address'?: string;
  address?: string;
  gateway?: string;
}

export interface RosDhcpClient {
  '.id': string;
  interface: string;
  'add-default-route'?: boolean | string;
  'use-peer-dns'?: boolean | string;
  status?: string;
  address?: string;
  gateway?: string;
  'primary-dns'?: string;
  disabled?: boolean | string;
  comment?: string;
}

export interface RosDhcpServer {
  '.id': string;
  name: string;
  interface: string;
  'lease-time'?: string;
  'address-pool'?: string;
  disabled?: boolean | string;
  dynamic?: boolean | string;
}

export interface RosDhcpNetwork {
  '.id': string;
  address: string;
  gateway?: string;
  'dns-server'?: string;
  netmask?: string;
  comment?: string;
}

export interface RosIpPool {
  '.id': string;
  name: string;
  ranges: string;
  comment?: string;
}

export interface RosIpAddress {
  '.id': string;
  address: string;
  network: string;
  interface: string;
  actualInterface?: string;
  'actual-interface'?: string;
  disabled?: boolean | string;
  dynamic?: boolean | string;
  comment?: string;
}

export interface RosDhcpLease {
  '.id': string;
  address: string;
  'mac-address': string;
  'client-id'?: string;
  server?: string;
  'active-address'?: string;
  'active-mac-address'?: string;
  'active-client-id'?: string;
  'active-server'?: string;
  'host-name'?: string;
  'expires-after'?: string;
  status?: string;
  dynamic?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
}

export interface RosArp {
  '.id': string;
  address: string;
  'mac-address': string;
  interface: string;
  complete?: boolean | string;
  dynamic?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
}

export interface RosFirewallRule {
  '.id': string;
  chain: string;
  action: string;
  protocol?: string;
  'src-address'?: string;
  'dst-address'?: string;
  'src-port'?: string;
  'dst-port'?: string;
  'in-interface'?: string;
  'out-interface'?: string;
  'to-addresses'?: string;
  'to-ports'?: string;
  disabled?: boolean | string;
  comment?: string;
  bytes?: number | string;
  packets?: number | string;
}

export interface RosWireguardInterface {
  '.id': string;
  name: string;
  'listen-port': number | string;
  'public-key': string;
  disabled?: boolean | string;
  running?: boolean | string;
  comment?: string;
}

export interface RosWireguardPeer {
  '.id': string;
  interface: string;
  'public-key': string;
  'endpoint-address'?: string;
  'endpoint-port'?: number | string;
  'current-endpoint-address'?: string;
  'current-endpoint-port'?: number | string;
  'allowed-address'?: string;
  'last-handshake'?: string;
  rx?: number | string;
  tx?: number | string;
  disabled?: boolean | string;
  comment?: string;
}

export interface RosSimpleQueue {
  '.id': string;
  name: string;
  target: string;
  'max-limit': string; // e.g. "10M/20M" (upload/download)
  disabled?: boolean | string;
  dynamic?: boolean | string;
  comment?: string;
  bytes?: string;
  'rate'?: string;
}

export interface RosLog {
  '.id': string;
  time: string;
  topics: string;
  message: string;
}

export interface WolDevice {
  id: string;
  name: string;
  mac: string;
  interface: string;
  ip?: string;
  description?: string;
  lastWokenAt?: string;
  createdAt: string;
}

export interface RosRoute {
  '.id': string;
  'dst-address': string;
  gateway: string;
  distance: number | string;
  'routing-table'?: string;
  active?: boolean | string;
  dynamic?: boolean | string;
  static?: boolean | string;
  connect?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
  immediateGw?: string;
}

export interface RosDnsConfig {
  servers: string;
  'dynamic-servers'?: string;
  'allow-remote-requests': boolean | string;
  'cache-size'?: number | string;
  'cache-used'?: number | string;
}

export interface RosDnsStatic {
  '.id': string;
  name: string;
  address: string;
  ttl?: string;
  disabled?: boolean | string;
  comment?: string;
}

export interface RosUser {
  '.id': string;
  name: string;
  group: string;
  disabled?: boolean | string;
  'last-logged-in'?: string;
  comment?: string;
}

export interface RosFile {
  '.id': string;
  name: string;
  type: string;
  size: number | string;
  'creation-time': string;
}

export interface TracerouteHop {
  hop: number;
  address: string;
  loss: number;
  sent: number;
  last: string;
  avg: string;
  best: string;
  worst: string;
  status: string;
}

export interface RosCloud {
  'ddns-enabled': boolean | string;
  'ddns-update-interval'?: string;
  'update-time': boolean | string;
  'public-address'?: string;
  'public-address-ipv6'?: string;
  'dns-name'?: string;
  status?: string;
  warning?: string;
}

export interface CustomDdnsItem {
  id: string;
  name: string;
  provider: 'cloudflare' | 'aliyun' | 'dnspod' | 'duckdns' | 'webhook';
  domain: string;
  zoneId?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  checkInterval: string;
  enabled: boolean;
  lastSyncTime?: string;
  lastStatus?: 'success' | 'failed' | 'idle';
  lastIp?: string;
}

export interface RosPackageUpdate {
  channel: string;
  'installed-version': string;
  'latest-version': string;
  status: string;
  'change-log'?: string;
}

export interface RosRouterboard {
  routerboard?: boolean | string;
  model?: string;
  'serial-number'?: string;
  'current-firmware'?: string;
  'upgrade-firmware'?: string;
  'firmware-type'?: string;
}

export interface RosWifiInterface {
  '.id': string;
  name: string;
  ssid?: string;
  band?: string;
  channel?: string;
  security?: string;
  passphrase?: string;
  running?: boolean | string;
  disabled?: boolean | string;
  comment?: string;
  frequency?: string;
  'tx-power'?: number | string;
  type?: 'wifi' | 'wireless';
}

export interface RosWifiClient {
  '.id': string;
  interface: string;
  'mac-address': string;
  hostname?: string;
  ssid?: string;
  signal: number | string;
  'tx-rate'?: string;
  'rx-rate'?: string;
  uptime?: string;
  bytes?: string;
}

export interface RosCapsmanConfig {
  enabled: boolean | string;
  certificate?: string;
  'ca-certificate'?: string;
  radiosCount?: number;
  provisioningCount?: number;
}

export interface RosIpService {
  '.id': string;
  name: string;
  port: number;
  disabled: boolean | string;
  address?: string;
  certificate?: string;
  'tls-version'?: string;
  invalid?: boolean | string;
}

export interface RosTorchFlow {
  id: string;
  srcAddress: string;
  srcPort?: number | string;
  dstAddress: string;
  dstPort?: number | string;
  protocol: string;
  txRate: number; // bps
  rxRate: number; // bps
  txPackets?: number;
  rxPackets?: number;
}

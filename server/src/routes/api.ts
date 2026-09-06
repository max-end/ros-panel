import { Router } from 'express';
import { requireRosAuth } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as telemetryController from '../controllers/telemetryController.js';
import * as interfaceController from '../controllers/interfaceController.js';
import * as ipController from '../controllers/ipController.js';
import * as firewallController from '../controllers/firewallController.js';
import * as wireguardController from '../controllers/wireguardController.js';
import * as queueController from '../controllers/queueController.js';
import * as systemController from '../controllers/systemController.js';
import * as wolController from '../controllers/wolController.js';
import * as wanController from '../controllers/wanController.js';
import * as routeController from '../controllers/routeController.js';
import * as dnsController from '../controllers/dnsController.js';
import * as userController from '../controllers/userController.js';
import * as backupController from '../controllers/backupController.js';
import * as ddnsController from '../controllers/ddnsController.js';

export const apiRouter = Router();

// Auth routes (public)
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/logout', authController.logout);
apiRouter.get('/auth/status', authController.getStatus);

// Protected routes below
apiRouter.use(requireRosAuth);

// Dashboard
apiRouter.get('/dashboard/overview', dashboardController.getDashboardOverview);

// Telemetry (SSE stream & poll)
apiRouter.get('/telemetry/traffic-stream', telemetryController.streamTraffic);
apiRouter.get('/telemetry/traffic-once', telemetryController.getTrafficOnce);

// Interfaces
apiRouter.get('/interfaces', interfaceController.getInterfaces);
apiRouter.patch('/interfaces/:id/toggle', interfaceController.toggleInterface);
apiRouter.patch('/interfaces/:id', interfaceController.updateInterface);

// IP, DHCP & ARP
apiRouter.get('/ip/addresses', ipController.getIpAddresses);
apiRouter.post('/ip/addresses', ipController.addIpAddress);
apiRouter.delete('/ip/addresses/:id', ipController.removeIpAddress);

apiRouter.get('/ip/dhcp-leases', ipController.getDhcpLeases);
apiRouter.post('/ip/dhcp-leases/:id/make-static', ipController.makeDhcpLeaseStatic);
apiRouter.patch('/ip/dhcp-leases/:id/toggle', ipController.toggleDhcpLease);
apiRouter.delete('/ip/dhcp-leases/:id', ipController.removeDhcpLease);

apiRouter.get('/ip/dhcp-servers', ipController.getDhcpServers);
apiRouter.patch('/ip/dhcp-servers/:id/toggle', ipController.toggleDhcpServer);
apiRouter.get('/ip/dhcp-networks', ipController.getDhcpNetworks);
apiRouter.post('/ip/dhcp-networks', ipController.addDhcpNetwork);
apiRouter.delete('/ip/dhcp-networks/:id', ipController.removeDhcpNetwork);
apiRouter.get('/ip/pools', ipController.getIpPools);
apiRouter.post('/ip/pools', ipController.addIpPool);
apiRouter.delete('/ip/pools/:id', ipController.removeIpPool);

apiRouter.get('/ip/arp', ipController.getArpTable);
apiRouter.post('/ip/arp/:id/make-static', ipController.makeArpStatic);

// Firewall & NAT
apiRouter.get('/firewall/filter', firewallController.getFilterRules);
apiRouter.post('/firewall/filter', firewallController.addFilterRule);
apiRouter.post('/firewall/filter/move', firewallController.moveFilterRule);
apiRouter.patch('/firewall/filter/:id', firewallController.updateFilterRule);
apiRouter.patch('/firewall/filter/:id/toggle', firewallController.toggleFilterRule);
apiRouter.delete('/firewall/filter/:id', firewallController.removeFilterRule);
apiRouter.get('/firewall/nat', firewallController.getNatRules);
apiRouter.post('/firewall/nat/port-forward', firewallController.addPortForwardRule);
apiRouter.post('/firewall/nat/move', firewallController.moveNatRule);
apiRouter.patch('/firewall/nat/:id', firewallController.updateNatRule);
apiRouter.patch('/firewall/nat/:id/toggle', firewallController.toggleNatRule);
apiRouter.delete('/firewall/nat/:id', firewallController.removeNatRule);

// WireGuard VPN
apiRouter.get('/wireguard/interfaces', wireguardController.getWireguardInterfaces);
apiRouter.get('/wireguard/peers', wireguardController.getWireguardPeers);
apiRouter.post('/wireguard/peers', wireguardController.addWireguardPeer);
apiRouter.patch('/wireguard/peers/:id/toggle', wireguardController.toggleWireguardPeer);
apiRouter.delete('/wireguard/peers/:id', wireguardController.removeWireguardPeer);

// Simple Queues
apiRouter.get('/queues', queueController.getSimpleQueues);
apiRouter.post('/queues', queueController.addSimpleQueue);
apiRouter.patch('/queues/:id/toggle', queueController.toggleSimpleQueue);
apiRouter.delete('/queues/:id', queueController.removeSimpleQueue);

// System maintenance & diagnostic
apiRouter.get('/system/logs', systemController.getLogs);
apiRouter.post('/system/reboot', systemController.rebootSystem);
apiRouter.post('/system/ping', systemController.pingHost);
apiRouter.post('/system/traceroute', systemController.tracerouteHost);
apiRouter.post('/system/exec', systemController.executeCommand);

// Users
apiRouter.get('/users', userController.getUsers);
apiRouter.post('/users', userController.addUser);
apiRouter.delete('/users/:id', userController.removeUser);
apiRouter.patch('/users/:id/toggle', userController.toggleUser);
apiRouter.patch('/users/:id/password', userController.updateUserPassword);

// Backups & Files
apiRouter.get('/backup/files', backupController.getFiles);
apiRouter.post('/backup/create', backupController.createBackup);
apiRouter.delete('/backup/files/:id', backupController.removeFile);
apiRouter.get('/backup/export', backupController.exportConfig);

// Wake on LAN (WOL)
apiRouter.post('/wol/wake', wolController.wake);
apiRouter.get('/wol/devices', wolController.getDevices);
apiRouter.post('/wol/devices', wolController.addDevice);
apiRouter.delete('/wol/devices/:id', wolController.removeDevice);
apiRouter.post('/wol/devices/:id/wake', wolController.wakeDevice);
apiRouter.post('/wol/check-status', wolController.checkDeviceStatus);

// WAN / PPPoE / Dial-up
apiRouter.get('/wan/pppoe', wanController.getPppoeClients);
apiRouter.post('/wan/pppoe', wanController.addPppoeClient);
apiRouter.patch('/wan/pppoe/:id', wanController.updatePppoeClient);
apiRouter.delete('/wan/pppoe/:id', wanController.removePppoeClient);
apiRouter.patch('/wan/pppoe/:id/toggle', wanController.togglePppoeClient);
apiRouter.post('/wan/pppoe/:id/reconnect', wanController.reconnectPppoe);
apiRouter.get('/wan/dhcp-client', wanController.getDhcpClients);
apiRouter.patch('/wan/dhcp-client/:id/toggle', wanController.toggleDhcpClient);
apiRouter.post('/wan/dhcp-client/:id/release', wanController.releaseDhcpClient);
apiRouter.post('/wan/dhcp-client/:id/renew', wanController.renewDhcpClient);

// IP Routes
apiRouter.get('/routes', routeController.getRoutes);
apiRouter.post('/routes', routeController.addRoute);
apiRouter.delete('/routes/:id', routeController.removeRoute);
apiRouter.patch('/routes/:id/toggle', routeController.toggleRoute);

// DNS
apiRouter.get('/dns', dnsController.getDnsConfig);
apiRouter.patch('/dns', dnsController.updateDnsConfig);
apiRouter.post('/dns/flush', dnsController.flushDnsCache);
apiRouter.get('/dns/static', dnsController.getDnsStatic);
apiRouter.post('/dns/static', dnsController.addDnsStatic);
apiRouter.delete('/dns/static/:id', dnsController.removeDnsStatic);
apiRouter.patch('/dns/static/:id/toggle', dnsController.toggleDnsStatic);

// DDNS (Cloud & Custom)
apiRouter.get('/ddns/cloud', ddnsController.getCloud);
apiRouter.patch('/ddns/cloud', ddnsController.updateCloud);
apiRouter.post('/ddns/cloud/force-update', ddnsController.forceUpdateCloud);
apiRouter.get('/ddns/custom', ddnsController.getCustomDdns);
apiRouter.post('/ddns/custom', ddnsController.addCustomDdns);
apiRouter.delete('/ddns/custom/:id', ddnsController.removeCustomDdns);
apiRouter.post('/ddns/custom/:id/sync', ddnsController.syncCustomDdns);

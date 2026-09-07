import { Request, Response } from 'express';

export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  try {
    const client = req.rosClient!;
    const [
      systemResource,
      systemHealth,
      interfaces,
      leases,
      firewallNat,
      firewallFilters,
      peers,
      queues,
      pppoeClients,
      logs,
      ipAddresses,
    ] = await Promise.all([
      client.getSystemResource(),
      client.getSystemHealth().catch(() => ({})),
      client.getInterfaces().catch(() => []),
      client.getDhcpLeases().catch(() => []),
      client.getFirewallNatRules().catch(() => []),
      client.getFirewallFilterRules().catch(() => []),
      client.getWireguardPeers().catch(() => []),
      client.getSimpleQueues().catch(() => []),
      client.getPppoeClients().catch(() => []),
      client.getLogs().catch(() => []),
      client.getIpAddresses().catch(() => []),
    ]);

    const runningInterfaces = interfaces.filter(
      (i) => i.running === true || i.running === 'true'
    );

    // Compute WAN info
    const pppoe = pppoeClients.find(
      (p) => p.running === true || p.running === 'true' || p.status === 'connected'
    ) || pppoeClients[0];

    const wanInterface = interfaces.find(
      (i) => i.name.toLowerCase().includes('wan') || (pppoe && i.name === pppoe.interface)
    ) || interfaces[0];

    // Find actual public WAN IP from /ip/address
    let realWanIp = '';
    if (pppoe) {
      const matched = ipAddresses.find(
        (a) => a.interface === pppoe.name || a['actual-interface'] === pppoe.name
      );
      if (matched?.address) {
        realWanIp = matched.address.split('/')[0];
      }
    }
    if (!realWanIp && wanInterface) {
      const matched = ipAddresses.find(
        (a) => a.interface === wanInterface.name || a['actual-interface'] === wanInterface.name
      );
      if (matched?.address) {
        realWanIp = matched.address.split('/')[0];
      }
    }

    const wanData = {
      connected: pppoe ? (pppoe.running === true || pppoe.running === 'true' || pppoe.status === 'connected') : true,
      status: pppoe ? (pppoe.status || (pppoe.running ? 'connected' : 'disconnected')) : (wanInterface?.running ? 'connected' : 'disconnected'),
      ip: realWanIp || pppoe?.['active-address'] || '未分配外网 IP',
      interface: pppoe ? pppoe.name : (wanInterface?.name || 'ether1-wan'),
      physicalPort: pppoe?.interface || wanInterface?.name || 'ether1-wan',
      uptime: pppoe?.uptime || systemResource.uptime,
      rxBytes: Number(wanInterface?.['rx-byte'] || 0),
      txBytes: Number(wanInterface?.['tx-byte'] || 0),
      rxPackets: Number(wanInterface?.['rx-packet'] || 0),
      txPackets: Number(wanInterface?.['tx-packet'] || 0),
    };

    // Top active clients
    const topClients = leases
      .filter((l) => l.status === 'bound' || l.status === 'waiting')
      .slice(0, 6)
      .map((l) => ({
        id: l['.id'],
        name: l['host-name'] || '未知设备',
        ip: l.address,
        mac: l['mac-address'],
        status: l.status || 'bound',
        expiresAfter: l['expires-after'],
      }));

    // Latest 5 logs
    const recentLogs = logs.slice(-5).reverse();

    res.json({
      success: true,
      data: {
        systemResource,
        systemHealth,
        wan: wanData,
        topClients,
        recentLogs,
        stats: {
          interfacesTotal: interfaces.length,
          interfacesRunning: runningInterfaces.length,
          activeDhcpLeases: leases.filter((l) => l.status === 'bound').length,
          totalDhcpLeases: leases.length,
          firewallFilterRules: firewallFilters.length,
          firewallNatRules: firewallNat.length,
          wireguardPeersCount: peers.length,
          queuesCount: queues.length,
        },
        interfaces: interfaces.map((i) => ({
          id: i['.id'],
          name: i.name,
          type: i.type,
          running: i.running === true || i.running === 'true',
          disabled: i.disabled === true || i.disabled === 'true',
          comment: i.comment,
          rxBytes: Number(i['rx-byte'] || 0),
          txBytes: Number(i['tx-byte'] || 0),
          macAddress: i['mac-address'],
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DASHBOARD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    });
  }
}

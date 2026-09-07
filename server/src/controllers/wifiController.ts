import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getWifiInterfaces(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getWifiInterfaces();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_WIFI_INTERFACES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch Wi-Fi interfaces',
    });
  }
}

export async function getWifiClients(req: Request, res: Response): Promise<void> {
  try {
    const [clients, leases] = await Promise.all([
      req.rosClient!.getWifiClients(),
      req.rosClient!.getDhcpLeases().catch(() => []),
    ]);

    // Enrich client hostnames from DHCP leases by MAC address
    const enriched = clients.map((client) => {
      const match = leases.find(
        (l) =>
          l['mac-address']?.toLowerCase() === client['mac-address']?.toLowerCase() ||
          l['active-mac-address']?.toLowerCase() === client['mac-address']?.toLowerCase()
      );
      return {
        ...client,
        hostname: client.hostname || match?.['host-name'] || '未知无线设备',
        ip: match?.address || '',
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_WIFI_CLIENTS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch Wi-Fi clients',
    });
  }
}

export async function getCapsmanConfig(req: Request, res: Response): Promise<void> {
  try {
    const data = await req.rosClient!.getCapsmanConfig();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_CAPSMAN_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch CAPsMAN config',
    });
  }
}

export async function updateWifiInterface(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Interface ID is required' });
      return;
    }
    await req.rosClient!.updateWifiInterface(id, req.body);
    res.json({ success: true, message: 'Wi-Fi interface updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_WIFI_INTERFACE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update Wi-Fi interface',
    });
  }
}

export async function quickSetupWifi(req: Request, res: Response): Promise<void> {
  try {
    const { ssid, password } = req.body;
    if (!ssid) {
      res.status(400).json({ success: false, message: 'SSID is required' });
      return;
    }
    await req.rosClient!.quickSetupWifi({ ssid, password });
    res.json({ success: true, message: `Wi-Fi SSID set to "${ssid}" across all radios` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'QUICK_SETUP_WIFI_FAILED',
      message: error instanceof Error ? error.message : 'Failed to quick setup Wi-Fi',
    });
  }
}

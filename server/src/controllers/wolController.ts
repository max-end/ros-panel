import { Request, Response } from 'express';
import { wolStorage } from '../services/wolStorage.js';
import { getParam } from '../utils/params.js';
import { IRosClient } from '../ros-client/client.js';

// MAC address validator: matches XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

/**
 * Dynamically resolves the actual LAN/Bridge interface on the router.
 * Prevents HTTP 400 Bad Request when hardcoded names like 'bridge-lan' don't exist.
 */
async function resolveInterface(client: IRosClient, requestedIface?: string): Promise<string> {
  const ifaces = await client.getInterfaces().catch(() => []);
  if (ifaces.length === 0) {
    return requestedIface || 'bridge';
  }

  // 1. If explicitly requested interface exists and is valid on this hardware, use it
  if (requestedIface && requestedIface !== 'bridge-lan') {
    const matched = ifaces.find((i) => i.name === requestedIface);
    if (matched) return matched.name;
  }

  // 2. Find any bridge interface (MikroTik standard default is 'bridge')
  const bridge = ifaces.find(
    (i) => i.type === 'bridge' || i.name === 'bridge' || i.name.toLowerCase().includes('bridge')
  );
  if (bridge) return bridge.name;

  // 3. Find any interface with "lan" in its name
  const lan = ifaces.find((i) => i.name.toLowerCase().includes('lan'));
  if (lan) return lan.name;

  // 4. Find first non-wan, non-vpn running ethernet port (e.g. ether2)
  const eth = ifaces.find(
    (i) =>
      (i.running === 'true' || i.running === true) &&
      !i.name.includes('pppoe') &&
      !i.name.includes('wan') &&
      !i.name.includes('wg') &&
      !i.name.includes('vpn')
  );
  if (eth) return eth.name;

  return ifaces[0].name;
}

export async function wake(req: Request, res: Response): Promise<void> {
  try {
    const { mac, interface: iface } = req.body;
    if (!mac) {
      res.status(400).json({ success: false, message: 'MAC address is required' });
      return;
    }

    const cleanMac = mac.trim().toUpperCase().replace(/-/g, ':');
    if (!MAC_REGEX.test(cleanMac)) {
      res.status(400).json({ success: false, message: 'Invalid MAC address format. Example: A4:83:E7:3B:55:12' });
      return;
    }

    const targetIface = await resolveInterface(req.rosClient!, iface);
    await req.rosClient!.wakeOnLan(cleanMac, targetIface);
    res.json({
      success: true,
      message: `WOL magic packet sent successfully to ${cleanMac} via ${targetIface}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'WOL_SEND_FAILED',
      message: error instanceof Error ? error.message : 'Failed to send WOL magic packet',
    });
  }
}

export function getDevices(req: Request, res: Response): void {
  const list = wolStorage.getAll();
  res.json({ success: true, data: list });
}

export function addDevice(req: Request, res: Response): void {
  try {
    const { name, mac, interface: iface = 'bridge-lan', ip, description } = req.body;
    if (!name || !mac) {
      res.status(400).json({ success: false, message: 'Device name and MAC address are required' });
      return;
    }

    const cleanMac = mac.trim().toUpperCase().replace(/-/g, ':');
    if (!MAC_REGEX.test(cleanMac)) {
      res.status(400).json({ success: false, message: 'Invalid MAC address format' });
      return;
    }

    const device = wolStorage.add({
      name,
      mac: cleanMac,
      interface: iface,
      ip,
      description,
    });

    res.json({ success: true, data: device, message: 'Device added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_WOL_DEVICE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to save WOL device',
    });
  }
}

export function removeDevice(req: Request, res: Response): void {
  const id = getParam(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Device id is required' });
    return;
  }

  const success = wolStorage.remove(id);
  if (success) {
    res.json({ success: true, message: 'Device removed successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Device not found' });
  }
}

export async function wakeDevice(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const device = wolStorage.getById(id);
    if (!device) {
      res.status(404).json({ success: false, message: 'Device not found' });
      return;
    }

    const targetIface = await resolveInterface(req.rosClient!, device.interface);
    await req.rosClient!.wakeOnLan(device.mac, targetIface);
    wolStorage.updateLastWoken(id);

    res.json({
      success: true,
      message: `WOL magic packet broadcast to ${device.name} (${device.mac}) via ${targetIface}`,
      lastWokenAt: new Date().toLocaleString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'WAKE_DEVICE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to wake device',
    });
  }
}

export async function checkDeviceStatus(req: Request, res: Response): Promise<void> {
  try {
    const { ip } = req.body;
    if (!ip) {
      res.status(400).json({ success: false, message: 'IP address is required' });
      return;
    }

    const result = await req.rosClient!.pingHost(String(ip), 2);
    const isOnline = result.received > 0;

    res.json({
      success: true,
      data: {
        ip,
        isOnline,
        latency: result.time,
      },
    });
  } catch {
    res.json({
      success: true,
      data: {
        ip: req.body.ip,
        isOnline: false,
      },
    });
  }
}

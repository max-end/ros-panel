import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getIpAddresses(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getIpAddresses();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_IP_ADDRESSES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch IP addresses',
    });
  }
}

export async function addIpAddress(req: Request, res: Response): Promise<void> {
  try {
    const { address, network, interface: iface, comment } = req.body;
    if (!address || !iface) {
      res.status(400).json({ success: false, message: 'Address and Interface are required' });
      return;
    }

    await req.rosClient!.addIpAddress({ address, network, interface: iface, comment });
    res.json({ success: true, message: 'IP address added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_IP_ADDRESS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add IP address',
    });
  }
}

export async function removeIpAddress(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'IP ID is required' });
      return;
    }

    await req.rosClient!.removeIpAddress(id);
    res.json({ success: true, message: 'IP address removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_IP_ADDRESS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove IP address',
    });
  }
}

export async function getDhcpLeases(req: Request, res: Response): Promise<void> {
  try {
    const leases = await req.rosClient!.getDhcpLeases();
    res.json({ success: true, data: leases });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DHCP_LEASES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch DHCP leases',
    });
  }
}

export async function makeDhcpLeaseStatic(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Lease ID is required' });
      return;
    }

    await req.rosClient!.makeDhcpLeaseStatic(id);
    res.json({ success: true, message: 'DHCP lease converted to static binding' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'MAKE_STATIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to make DHCP lease static',
    });
  }
}

export async function toggleDhcpLease(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'Invalid id or disabled parameter' });
      return;
    }

    await req.rosClient!.toggleDhcpLease(id, disabled);
    res.json({ success: true, message: `DHCP lease ${disabled ? 'blocked/disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_DHCP_LEASE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle DHCP lease',
    });
  }
}

export async function removeDhcpLease(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Lease ID is required' });
      return;
    }

    await req.rosClient!.removeDhcpLease(id);
    res.json({ success: true, message: 'DHCP lease removed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_DHCP_LEASE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove DHCP lease',
    });
  }
}

export async function getArpTable(req: Request, res: Response): Promise<void> {
  try {
    const table = await req.rosClient!.getArpTable();
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_ARP_TABLE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch ARP table',
    });
  }
}

export async function makeArpStatic(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ARP entry ID is required' });
      return;
    }

    await req.rosClient!.makeArpStatic(id);
    res.json({ success: true, message: 'ARP entry set to static' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'MAKE_ARP_STATIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to make ARP entry static',
    });
  }
}

export async function getDhcpServers(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getDhcpServers();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DHCP_SERVERS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch DHCP servers',
    });
  }
}

export async function toggleDhcpServer(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleDhcpServer(id, disabled);
    res.json({ success: true, message: `DHCP server ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_DHCP_SERVER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle DHCP server',
    });
  }
}

export async function getDhcpNetworks(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getDhcpNetworks();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DHCP_NETWORKS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch DHCP networks',
    });
  }
}

export async function addDhcpNetwork(req: Request, res: Response): Promise<void> {
  try {
    const { address, gateway, dnsServer, comment } = req.body;
    if (!address) {
      res.status(400).json({ success: false, message: 'Network Address is required (e.g. 192.168.88.0/24)' });
      return;
    }

    await req.rosClient!.addDhcpNetwork({ address, gateway, dnsServer, comment });
    res.json({ success: true, message: 'DHCP network parameter added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_DHCP_NETWORK_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add DHCP network',
    });
  }
}

export async function removeDhcpNetwork(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.removeDhcpNetwork(id);
    res.json({ success: true, message: 'DHCP network removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_DHCP_NETWORK_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove DHCP network',
    });
  }
}

export async function getIpPools(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getIpPools();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_IP_POOLS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch IP pools',
    });
  }
}

export async function addIpPool(req: Request, res: Response): Promise<void> {
  try {
    const { name, ranges, comment } = req.body;
    if (!name || !ranges) {
      res.status(400).json({ success: false, message: 'Pool Name and IP Ranges are required' });
      return;
    }

    await req.rosClient!.addIpPool({ name, ranges, comment });
    res.json({ success: true, message: 'IP pool created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_IP_POOL_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add IP pool',
    });
  }
}

export async function removeIpPool(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.removeIpPool(id);
    res.json({ success: true, message: 'IP pool removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_IP_POOL_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove IP pool',
    });
  }
}

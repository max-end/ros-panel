import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getPppoeClients(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getPppoeClients();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_PPPOE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch PPPoE clients',
    });
  }
}

export async function addPppoeClient(req: Request, res: Response): Promise<void> {
  try {
    const { name, interface: iface, user, password, addDefaultRoute, usePeerDns, comment } = req.body;
    if (!name || !iface || !user) {
      res.status(400).json({
        success: false,
        message: 'Name, Interface, and User (broadband account) are required',
      });
      return;
    }

    await req.rosClient!.addPppoeClient({
      name,
      interface: iface,
      user,
      password,
      addDefaultRoute,
      usePeerDns,
      comment,
    });

    res.json({ success: true, message: 'PPPoE client created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_PPPOE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add PPPoE client',
    });
  }
}

export async function updatePppoeClient(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.updatePppoeClient(id, req.body);
    res.json({ success: true, message: 'PPPoE client updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_PPPOE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update PPPoE client',
    });
  }
}

export async function removePppoeClient(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.removePppoeClient(id);
    res.json({ success: true, message: 'PPPoE client removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_PPPOE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove PPPoE client',
    });
  }
}

export async function togglePppoeClient(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.togglePppoeClient(id, disabled);
    res.json({ success: true, message: `PPPoE client ${disabled ? 'disconnected/disabled' : 'enabled/connecting'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_PPPOE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle PPPoE client',
    });
  }
}

export async function reconnectPppoe(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.reconnectPppoe(id);
    res.json({ success: true, message: 'Redial signal triggered. Reconnecting PPPoE...' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'RECONNECT_PPPOE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to redial PPPoE',
    });
  }
}

export async function getDhcpClients(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getDhcpClients();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DHCP_CLIENTS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch DHCP clients',
    });
  }
}

export async function toggleDhcpClient(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleDhcpClient(id, disabled);
    res.json({ success: true, message: `DHCP client ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_DHCP_CLIENT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle DHCP client',
    });
  }
}

export async function releaseDhcpClient(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.releaseDhcpClient(id);
    res.json({ success: true, message: 'DHCP lease released' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'RELEASE_DHCP_CLIENT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to release DHCP client',
    });
  }
}

export async function renewDhcpClient(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.renewDhcpClient(id);
    res.json({ success: true, message: 'DHCP lease renewal requested' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'RENEW_DHCP_CLIENT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to renew DHCP client',
    });
  }
}

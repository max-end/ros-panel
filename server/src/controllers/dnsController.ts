import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getDnsConfig(req: Request, res: Response): Promise<void> {
  try {
    const config = await req.rosClient!.getDnsConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DNS_CONFIG_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch DNS config',
    });
  }
}

export async function updateDnsConfig(req: Request, res: Response): Promise<void> {
  try {
    const { servers, allowRemoteRequests, cacheSize } = req.body;
    const payload: any = {};
    if (typeof servers === 'string') payload.servers = servers;
    if (typeof allowRemoteRequests === 'boolean') payload['allow-remote-requests'] = allowRemoteRequests ? 'true' : 'false';
    if (cacheSize) payload['cache-size'] = Number(cacheSize);

    await req.rosClient!.setDnsConfig(payload);
    res.json({ success: true, message: 'DNS settings updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_DNS_CONFIG_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update DNS config',
    });
  }
}

export async function flushDnsCache(req: Request, res: Response): Promise<void> {
  try {
    await req.rosClient!.flushDnsCache();
    res.json({ success: true, message: 'DNS cache flushed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FLUSH_DNS_CACHE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to flush DNS cache',
    });
  }
}

export async function getDnsStatic(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getDnsStaticList();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_DNS_STATIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch static DNS records',
    });
  }
}

export async function addDnsStatic(req: Request, res: Response): Promise<void> {
  try {
    const { name, address, ttl, comment } = req.body;
    if (!name || !address) {
      res.status(400).json({ success: false, message: 'Domain Name and IP Address are required' });
      return;
    }

    await req.rosClient!.addDnsStatic({ name, address, ttl, comment });
    res.json({ success: true, message: 'Static DNS record created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_DNS_STATIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add static DNS record',
    });
  }
}

export async function removeDnsStatic(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.removeDnsStatic(id);
    res.json({ success: true, message: 'Static DNS record deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_DNS_STATIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to delete static DNS record',
    });
  }
}

export async function toggleDnsStatic(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleDnsStatic(id, disabled);
    res.json({ success: true, message: `Static DNS record ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_DNS_STATIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle static DNS record',
    });
  }
}

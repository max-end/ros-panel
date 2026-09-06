import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getCloud(req: Request, res: Response): Promise<void> {
  try {
    const cloud = await req.rosClient!.getCloud();
    res.json({ success: true, data: cloud });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_CLOUD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch cloud DDNS status',
    });
  }
}

export async function updateCloud(req: Request, res: Response): Promise<void> {
  try {
    const { ddnsEnabled, updateTime } = req.body;
    await req.rosClient!.updateCloud({ ddnsEnabled, updateTime });
    res.json({ success: true, message: 'Cloud DDNS configuration updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_CLOUD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update cloud DDNS',
    });
  }
}

export async function forceUpdateCloud(req: Request, res: Response): Promise<void> {
  try {
    await req.rosClient!.forceUpdateCloud();
    res.json({ success: true, message: 'Cloud DDNS update forced successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FORCE_UPDATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to force update cloud DDNS',
    });
  }
}

export async function getCustomDdns(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getCustomDdns();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_CUSTOM_DDNS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch custom DDNS',
    });
  }
}

export async function addCustomDdns(req: Request, res: Response): Promise<void> {
  try {
    const { name, provider, domain, zoneId, apiKey, apiSecret, webhookUrl, checkInterval } = req.body;
    if (!name || !provider || !domain) {
      res.status(400).json({ success: false, message: 'Name, Provider and Domain are required' });
      return;
    }

    const created = await req.rosClient!.addCustomDdns({
      name,
      provider,
      domain,
      zoneId,
      apiKey,
      apiSecret,
      webhookUrl,
      checkInterval: checkInterval || '5m',
      enabled: true,
    });
    res.json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_CUSTOM_DDNS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add custom DDNS',
    });
  }
}

export async function removeCustomDdns(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'DDNS ID is required' });
      return;
    }

    await req.rosClient!.removeCustomDdns(id);
    res.json({ success: true, message: 'Custom DDNS removed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_CUSTOM_DDNS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove custom DDNS',
    });
  }
}

export async function syncCustomDdns(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'DDNS ID is required' });
      return;
    }

    const result = await req.rosClient!.syncCustomDdns(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SYNC_CUSTOM_DDNS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to sync custom DDNS',
    });
  }
}

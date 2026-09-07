import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getIpServices(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getIpServices();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_IP_SERVICES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch IP services',
    });
  }
}

export async function updateIpService(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Service ID is required' });
      return;
    }
    const { port, disabled, address } = req.body;
    await req.rosClient!.updateIpService(id, { port, disabled, address });
    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_IP_SERVICE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update IP service',
    });
  }
}

export async function toggleIpService(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Service ID is required' });
      return;
    }
    const { disabled } = req.body;
    await req.rosClient!.toggleIpService(id, disabled === true || disabled === 'true');
    res.json({ success: true, message: `Service ${disabled ? 'disabled' : 'enabled'} successfully` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_IP_SERVICE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle IP service',
    });
  }
}

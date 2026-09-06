import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getInterfaces(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getInterfaces();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_INTERFACES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch interfaces',
    });
  }
}

export async function toggleInterface(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'Invalid id or disabled parameter' });
      return;
    }

    await req.rosClient!.toggleInterface(id, disabled);
    res.json({ success: true, message: `Interface ${disabled ? 'disabled' : 'enabled'} successfully` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_INTERFACE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle interface',
    });
  }
}

export async function updateInterface(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { comment, name } = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: 'Interface id is required' });
      return;
    }

    await req.rosClient!.updateInterface(id, { comment, name });
    res.json({ success: true, message: 'Interface updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_INTERFACE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update interface',
    });
  }
}

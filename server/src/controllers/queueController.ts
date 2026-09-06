import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getSimpleQueues(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getSimpleQueues();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_QUEUES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch queues',
    });
  }
}

export async function addSimpleQueue(req: Request, res: Response): Promise<void> {
  try {
    const { name, target, maxLimit, comment } = req.body;
    if (!name || !target || !maxLimit) {
      res.status(400).json({
        success: false,
        message: 'Name, Target (IP/CIDR), and Max Limit (e.g. 10M/20M) are required',
      });
      return;
    }

    await req.rosClient!.addSimpleQueue({ name, target, maxLimit, comment });
    res.json({ success: true, message: 'Queue rule created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_QUEUE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to create queue',
    });
  }
}

export async function toggleSimpleQueue(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'Queue ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleSimpleQueue(id, disabled);
    res.json({ success: true, message: `Queue ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_QUEUE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle queue',
    });
  }
}

export async function removeSimpleQueue(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Queue ID is required' });
      return;
    }

    await req.rosClient!.removeSimpleQueue(id);
    res.json({ success: true, message: 'Queue deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_QUEUE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove queue',
    });
  }
}

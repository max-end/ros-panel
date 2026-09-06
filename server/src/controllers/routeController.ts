import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getRoutes(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getRoutes();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_ROUTES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch routes',
    });
  }
}

export async function addRoute(req: Request, res: Response): Promise<void> {
  try {
    const { dstAddress, gateway, distance, comment } = req.body;
    if (!dstAddress || !gateway) {
      res.status(400).json({
        success: false,
        message: 'Destination Address (dstAddress) and Gateway are required',
      });
      return;
    }

    await req.rosClient!.addRoute({
      dstAddress,
      gateway,
      distance: distance ? Number(distance) : 1,
      comment,
    });

    res.json({ success: true, message: 'Static route added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_ROUTE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add static route',
    });
  }
}

export async function removeRoute(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await req.rosClient!.removeRoute(id);
    res.json({ success: true, message: 'Route removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_ROUTE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove route',
    });
  }
}

export async function toggleRoute(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleRoute(id, disabled);
    res.json({ success: true, message: `Route ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_ROUTE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle route',
    });
  }
}

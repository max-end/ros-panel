import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getUsers();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_USERS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
}

export async function addUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, password, group, comment } = req.body;
    if (!name || !group) {
      res.status(400).json({ success: false, message: 'Username and Group are required' });
      return;
    }

    await req.rosClient!.addUser({ name, password, group, comment });
    res.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_USER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add user',
    });
  }
}

export async function removeUser(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    await req.rosClient!.removeUser(id);
    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_USER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove user',
    });
  }
}

export async function toggleUser(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleUser(id, disabled);
    res.json({ success: true, message: `User ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_USER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle user',
    });
  }
}

export async function updateUserPassword(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { password } = req.body;
    if (!id || !password) {
      res.status(400).json({ success: false, message: 'ID and password are required' });
      return;
    }

    await req.rosClient!.updateUserPassword(id, password);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_PASSWORD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update password',
    });
  }
}

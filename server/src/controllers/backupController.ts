import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getFiles(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getFiles();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_FILES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch files',
    });
  }
}

export async function createBackup(req: Request, res: Response): Promise<void> {
  try {
    const { name, password } = req.body;
    await req.rosClient!.createBackup(name, password);
    res.json({ success: true, message: 'Backup created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'CREATE_BACKUP_FAILED',
      message: error instanceof Error ? error.message : 'Failed to create backup',
    });
  }
}

export async function removeFile(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'File ID is required' });
      return;
    }

    await req.rosClient!.removeFile(id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_FILE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to delete file',
    });
  }
}

export async function exportConfig(req: Request, res: Response): Promise<void> {
  try {
    const content = await req.rosClient!.exportConfig();
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'EXPORT_CONFIG_FAILED',
      message: error instanceof Error ? error.message : 'Failed to export configuration',
    });
  }
}

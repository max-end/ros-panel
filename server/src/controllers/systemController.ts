import { Request, Response } from 'express';

export async function getLogs(req: Request, res: Response): Promise<void> {
  try {
    const logs = await req.rosClient!.getLogs();
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_LOGS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch logs',
    });
  }
}

export async function rebootSystem(req: Request, res: Response): Promise<void> {
  try {
    await req.rosClient!.rebootSystem();
    res.json({ success: true, message: 'Reboot command sent to RouterOS successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REBOOT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to reboot router',
    });
  }
}

export async function pingHost(req: Request, res: Response): Promise<void> {
  try {
    const { address, count = 4 } = req.body;
    if (!address) {
      res.status(400).json({ success: false, message: 'Destination address is required' });
      return;
    }

    const result = await req.rosClient!.pingHost(String(address), Number(count));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'PING_FAILED',
      message: error instanceof Error ? error.message : 'Ping command failed',
    });
  }
}

export async function tracerouteHost(req: Request, res: Response): Promise<void> {
  try {
    const { address, count = 1 } = req.body;
    if (!address) {
      res.status(400).json({ success: false, message: 'Target address is required' });
      return;
    }

    const hops = await req.rosClient!.tracerouteHost(String(address), Number(count));
    res.json({ success: true, data: hops });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TRACEROUTE_FAILED',
      message: error instanceof Error ? error.message : 'Traceroute command failed',
    });
  }
}

export async function executeCommand(req: Request, res: Response): Promise<void> {
  try {
    const { command } = req.body;
    if (!command) {
      res.status(400).json({ success: false, message: 'Command string is required' });
      return;
    }

    const output = await req.rosClient!.executeCommand(String(command));
    res.json({ success: true, data: output });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'EXECUTE_FAILED',
      message: error instanceof Error ? error.message : 'Command execution failed',
    });
  }
}

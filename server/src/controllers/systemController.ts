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

export async function getPackageUpdate(req: Request, res: Response): Promise<void> {
  try {
    const data = await req.rosClient!.getPackageUpdate();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_UPDATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch package update status',
    });
  }
}

export async function checkPackageUpdate(req: Request, res: Response): Promise<void> {
  try {
    const data = await req.rosClient!.checkPackageUpdate();
    res.json({ success: true, data, message: 'Check for updates completed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'CHECK_UPDATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to check for package updates',
    });
  }
}

export async function installPackageUpdate(req: Request, res: Response): Promise<void> {
  try {
    await req.rosClient!.installPackageUpdate();
    res.json({ success: true, message: 'Upgrade package downloaded, system will reboot into new version' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'INSTALL_UPDATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to install update',
    });
  }
}

export async function setPackageChannel(req: Request, res: Response): Promise<void> {
  try {
    const { channel } = req.body;
    if (!channel) {
      res.status(400).json({ success: false, message: 'Channel is required' });
      return;
    }
    await req.rosClient!.setPackageChannel(String(channel));
    res.json({ success: true, message: `Channel switched to ${channel}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SET_CHANNEL_FAILED',
      message: error instanceof Error ? error.message : 'Failed to set update channel',
    });
  }
}

export async function getRouterboard(req: Request, res: Response): Promise<void> {
  try {
    const data = await req.rosClient!.getRouterboard();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_ROUTERBOARD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch routerboard info',
    });
  }
}

export async function upgradeRouterboard(req: Request, res: Response): Promise<void> {
  try {
    await req.rosClient!.upgradeRouterboard();
    res.json({ success: true, message: 'RouterBOARD firmware upgraded successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPGRADE_ROUTERBOARD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to upgrade routerboard firmware',
    });
  }
}

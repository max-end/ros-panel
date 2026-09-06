import { Request, Response } from 'express';

export async function streamTraffic(req: Request, res: Response): Promise<void> {
  const client = req.rosClient;
  if (!client) {
    res.status(401).end();
    return;
  }

  const interfaceName = (req.query.interface as string) || 'ether1-wan';

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, etc.)
  res.flushHeaders();

  let isActive = true;

  const sendUpdate = async () => {
    if (!isActive) return;
    try {
      const [traffic, resource] = await Promise.all([
        client.monitorTraffic(interfaceName).catch(() => ({
          name: interfaceName,
          'rx-bits-per-second': 0,
          'tx-bits-per-second': 0,
        })),
        client.getSystemResource().catch(() => null),
      ]);

      const payload = {
        timestamp: new Date().toISOString(),
        interface: interfaceName,
        rxBps: traffic['rx-bits-per-second'],
        txBps: traffic['tx-bits-per-second'],
        cpuLoad: resource ? resource['cpu-load'] : undefined,
        freeMemory: resource ? resource['free-memory'] : undefined,
        totalMemory: resource ? resource['total-memory'] : undefined,
        uptime: resource ? resource.uptime : undefined,
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // Keep silent on transient network jitter
    }
  };

  // Send first reading immediately
  await sendUpdate();

  const intervalId = setInterval(sendUpdate, 1500);

  req.on('close', () => {
    isActive = false;
    clearInterval(intervalId);
    res.end();
  });
}

export async function getTrafficOnce(req: Request, res: Response): Promise<void> {
  try {
    const client = req.rosClient!;
    const interfaceName = (req.query.interface as string) || 'ether1-wan';
    const [traffic, resource] = await Promise.all([
      client.monitorTraffic(interfaceName),
      client.getSystemResource(),
    ]);

    res.json({
      success: true,
      data: {
        interface: interfaceName,
        rxBps: traffic['rx-bits-per-second'],
        txBps: traffic['tx-bits-per-second'],
        cpuLoad: resource['cpu-load'],
        freeMemory: resource['free-memory'],
        totalMemory: resource['total-memory'],
        uptime: resource.uptime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_TRAFFIC_FAILED',
      message: error instanceof Error ? error.message : 'Failed to get traffic sample',
    });
  }
}

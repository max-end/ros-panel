import { Request, Response } from 'express';

export async function snapshotTorch(req: Request, res: Response): Promise<void> {
  try {
    const { interface: iface, duration, srcAddress, dstAddress, protocol, port } = req.body;
    if (!iface) {
      res.status(400).json({ success: false, message: 'Interface is required' });
      return;
    }
    const flows = await req.rosClient!.runTorch({
      interface: iface,
      duration: duration ? Number(duration) : 2,
      srcAddress,
      dstAddress,
      protocol,
      port,
    });
    res.json({ success: true, data: flows });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TORCH_SNAPSHOT_FAILED',
      message: error instanceof Error ? error.message : 'Failed to capture Torch traffic flows',
    });
  }
}

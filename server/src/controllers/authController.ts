import { Request, Response } from 'express';
import { sessionService } from '../services/session.js';
import { RosRestClient } from '../ros-client/client.js';
import { MockRosClient } from '../ros-client/mock-client.js';
import { RosConnectionConfig } from '../types/ros.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const {
      host = '192.168.88.1',
      port = 443,
      useTls = true,
      username = 'admin',
      password = '',
      rejectUnauthorized = false,
      isDemo = false,
    } = req.body;

    const config: RosConnectionConfig = {
      host,
      port: Number(port),
      useTls: Boolean(useTls),
      username,
      password,
      rejectUnauthorized: Boolean(rejectUnauthorized),
      isDemo: Boolean(isDemo),
    };

    let tempClient = isDemo ? new MockRosClient() : new RosRestClient(config);
    const deviceInfo = await tempClient.testConnection();

    const sessionId = sessionService.createSession(config, deviceInfo);

    res.cookie('ros_session', sessionId, {
      httpOnly: true,
      secure: false, // allow local dev HTTP
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      sessionId,
      deviceInfo,
      config: {
        host: config.host,
        port: config.port,
        useTls: config.useTls,
        username: config.username,
        isDemo: config.isDemo,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'CONNECTION_FAILED',
      message: error instanceof Error ? error.message : 'Failed to connect to RouterOS',
    });
  }
}

export function logout(req: Request, res: Response): void {
  const sessionId = req.sessionId;
  if (sessionId) {
    sessionService.removeSession(sessionId);
  }
  res.clearCookie('ros_session');
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  let sessionId: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7);
  } else if (req.cookies && req.cookies.ros_session) {
    sessionId = req.cookies.ros_session;
  }

  const session = sessionService.getSession(sessionId);

  if (!session) {
    res.json({
      connected: false,
    });
    return;
  }

  try {
    const freshResource = await session.client.getSystemResource();
    res.json({
      connected: true,
      sessionId: session.sessionId,
      deviceInfo: freshResource,
      config: {
        host: session.config.host,
        port: session.config.port,
        useTls: session.config.useTls,
        username: session.config.username,
        isDemo: session.config.isDemo,
      },
    });
  } catch (error) {
    res.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Cannot reach RouterOS',
    });
  }
}

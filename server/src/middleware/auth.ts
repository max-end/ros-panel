import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.js';
import { IRosClient } from '../ros-client/client.js';
import { RosConnectionConfig } from '../types/ros.js';

declare global {
  namespace Express {
    interface Request {
      rosClient?: IRosClient;
      rosConfig?: RosConnectionConfig;
      sessionId?: string;
    }
  }
}

export function requireRosAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let sessionId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7);
  } else if (req.cookies && req.cookies.ros_session) {
    sessionId = req.cookies.ros_session;
  }

  const session = sessionService.getSession(sessionId);

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No active RouterOS connection. Please login/connect first.',
    });
    return;
  }

  req.rosClient = session.client;
  req.rosConfig = session.config;
  req.sessionId = session.sessionId;
  next();
}

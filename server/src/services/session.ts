import crypto from 'node:crypto';
import { RosConnectionConfig, SystemResource } from '../types/ros.js';
import { IRosClient, RosRestClient } from '../ros-client/client.js';
import { MockRosClient } from '../ros-client/mock-client.js';

interface SessionEntry {
  sessionId: string;
  config: RosConnectionConfig;
  client: IRosClient;
  lastActive: number;
  deviceInfo?: SystemResource;
}

class SessionService {
  private sessions = new Map<string, SessionEntry>();
  // Single active default session for quick reconnect
  private defaultSessionId: string | null = null;

  createSession(config: RosConnectionConfig, deviceInfo?: SystemResource): string {
    const sessionId = crypto.randomUUID();
    let client: IRosClient;

    if (config.isDemo) {
      client = new MockRosClient();
    } else {
      client = new RosRestClient(config);
    }

    const entry: SessionEntry = {
      sessionId,
      config,
      client,
      lastActive: Date.now(),
      deviceInfo,
    };

    this.sessions.set(sessionId, entry);
    this.defaultSessionId = sessionId;
    return sessionId;
  }

  getSession(sessionId?: string): SessionEntry | null {
    const id = sessionId || this.defaultSessionId;
    if (!id) return null;
    const entry = this.sessions.get(id);
    if (!entry) return null;

    entry.lastActive = Date.now();
    return entry;
  }

  removeSession(sessionId?: string): void {
    const id = sessionId || this.defaultSessionId;
    if (!id) return;
    this.sessions.delete(id);
    if (this.defaultSessionId === id) {
      this.defaultSessionId = null;
    }
  }

  cleanupExpired(maxAgeMs = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, entry] of this.sessions.entries()) {
      if (now - entry.lastActive > maxAgeMs) {
        this.sessions.delete(id);
        if (this.defaultSessionId === id) {
          this.defaultSessionId = null;
        }
      }
    }
  }
}

export const sessionService = new SessionService();

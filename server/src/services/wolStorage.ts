import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WolDevice } from '../types/ros.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'wol-devices.json');

const INITIAL_DEVICES: WolDevice[] = [];

class WolStorageService {
  private devices: WolDevice[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.devices = JSON.parse(raw);
      } else {
        this.devices = INITIAL_DEVICES;
        this.save();
      }
    } catch (err) {
      console.error('Failed to load wol-devices.json, using defaults', err);
      this.devices = INITIAL_DEVICES;
    }
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.devices, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save wol-devices.json', err);
    }
  }

  getAll(): WolDevice[] {
    return this.devices;
  }

  getById(id: string): WolDevice | undefined {
    return this.devices.find((d) => d.id === id);
  }

  add(data: { name: string; mac: string; interface: string; ip?: string; description?: string }): WolDevice {
    const formattedMac = data.mac.toUpperCase().replace(/-/g, ':');
    const newDevice: WolDevice = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      mac: formattedMac,
      interface: data.interface || 'bridge-lan',
      ip: data.ip?.trim() || undefined,
      description: data.description?.trim() || undefined,
      createdAt: new Date().toLocaleString(),
    };
    this.devices.push(newDevice);
    this.save();
    return newDevice;
  }

  remove(id: string): boolean {
    const prevLen = this.devices.length;
    this.devices = this.devices.filter((d) => d.id !== id);
    if (this.devices.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  updateLastWoken(id: string): void {
    const dev = this.devices.find((d) => d.id === id);
    if (dev) {
      dev.lastWokenAt = new Date().toLocaleString();
      this.save();
    }
  }
}

export const wolStorage = new WolStorageService();

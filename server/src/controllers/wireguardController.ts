import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getWireguardInterfaces(req: Request, res: Response): Promise<void> {
  try {
    const list = await req.rosClient!.getWireguardInterfaces();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_WIREGUARD_INTERFACES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch WireGuard interfaces',
    });
  }
}

export async function getWireguardPeers(req: Request, res: Response): Promise<void> {
  try {
    const peers = await req.rosClient!.getWireguardPeers();
    res.json({ success: true, data: peers });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_WIREGUARD_PEERS_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch WireGuard peers',
    });
  }
}

export async function addWireguardPeer(req: Request, res: Response): Promise<void> {
  try {
    const { interface: iface, publicKey, allowedAddress, endpointAddress, endpointPort, comment } = req.body;

    if (!iface || !publicKey || !allowedAddress) {
      res.status(400).json({
        success: false,
        message: 'WireGuard Interface, Public Key, and Allowed Address are required',
      });
      return;
    }

    await req.rosClient!.addWireguardPeer({
      interface: iface,
      publicKey,
      allowedAddress,
      endpointAddress,
      endpointPort: endpointPort ? Number(endpointPort) : undefined,
      comment,
    });

    res.json({ success: true, message: 'WireGuard peer added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_WIREGUARD_PEER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add WireGuard peer',
    });
  }
}

export async function toggleWireguardPeer(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'Peer ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleWireguardPeer(id, disabled);
    res.json({ success: true, message: `WireGuard peer ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_WIREGUARD_PEER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle WireGuard peer',
    });
  }
}

export async function removeWireguardPeer(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Peer ID is required' });
      return;
    }

    await req.rosClient!.removeWireguardPeer(id);
    res.json({ success: true, message: 'WireGuard peer removed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_WIREGUARD_PEER_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove WireGuard peer',
    });
  }
}

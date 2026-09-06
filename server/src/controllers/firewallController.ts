import { Request, Response } from 'express';
import { getParam } from '../utils/params.js';

export async function getFilterRules(req: Request, res: Response): Promise<void> {
  try {
    const rules = await req.rosClient!.getFirewallFilterRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_FILTER_RULES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch filter rules',
    });
  }
}

export async function addFilterRule(req: Request, res: Response): Promise<void> {
  try {
    const { chain = 'forward', action = 'accept', protocol, dstPort, srcAddress, dstAddress, inInterface, outInterface, comment } = req.body;

    await req.rosClient!.addFirewallFilterRule({
      chain,
      action,
      protocol: protocol ? String(protocol).toLowerCase() : undefined,
      'dst-port': dstPort ? String(dstPort) : undefined,
      'src-address': srcAddress ? String(srcAddress) : undefined,
      'dst-address': dstAddress ? String(dstAddress) : undefined,
      'in-interface': inInterface ? String(inInterface) : undefined,
      'out-interface': outInterface ? String(outInterface) : undefined,
      comment: comment ? String(comment) : undefined,
    });

    res.json({ success: true, message: 'Filter rule created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_FILTER_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add filter rule',
    });
  }
}

export async function updateFilterRule(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    const { chain, action, protocol, dstPort, srcAddress, dstAddress, inInterface, outInterface, comment, disabled } = req.body;

    const payload: Record<string, any> = {};
    if (chain !== undefined) payload.chain = chain;
    if (action !== undefined) payload.action = action;
    if (protocol !== undefined) payload.protocol = protocol ? String(protocol).toLowerCase() : '';
    if (dstPort !== undefined) payload['dst-port'] = String(dstPort);
    if (srcAddress !== undefined) payload['src-address'] = String(srcAddress);
    if (dstAddress !== undefined) payload['dst-address'] = String(dstAddress);
    if (inInterface !== undefined) payload['in-interface'] = String(inInterface);
    if (outInterface !== undefined) payload['out-interface'] = String(outInterface);
    if (comment !== undefined) payload.comment = String(comment);
    if (disabled !== undefined) payload.disabled = disabled ? 'true' : 'false';

    await req.rosClient!.updateFirewallFilterRule(id, payload);
    res.json({ success: true, message: 'Filter rule updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_FILTER_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update filter rule',
    });
  }
}

export async function toggleFilterRule(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'Rule ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleFirewallFilterRule(id, disabled);
    res.json({ success: true, message: `Filter rule ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_FILTER_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle filter rule',
    });
  }
}

export async function removeFilterRule(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    await req.rosClient!.removeFirewallFilterRule(id);
    res.json({ success: true, message: 'Filter rule deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_FILTER_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove filter rule',
    });
  }
}

export async function getNatRules(req: Request, res: Response): Promise<void> {
  try {
    const rules = await req.rosClient!.getFirewallNatRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_NAT_RULES_FAILED',
      message: error instanceof Error ? error.message : 'Failed to fetch NAT rules',
    });
  }
}

export async function addPortForwardRule(req: Request, res: Response): Promise<void> {
  try {
    const { name, protocol = 'tcp', dstPort, toAddress, toPort, inInterface, comment } = req.body;

    if (!dstPort || !toAddress || !toPort) {
      res.status(400).json({
        success: false,
        message: 'External Port (dstPort), Internal Address (toAddress), and Internal Port (toPort) are required',
      });
      return;
    }

    await req.rosClient!.addPortForwardRule({
      name,
      protocol: protocol.toLowerCase() === 'udp' ? 'udp' : 'tcp',
      dstPort: String(dstPort),
      toAddress: String(toAddress),
      toPort: String(toPort),
      inInterface,
      comment,
    });

    res.json({ success: true, message: 'Port forward rule created successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ADD_PORT_FORWARD_FAILED',
      message: error instanceof Error ? error.message : 'Failed to add port forward rule',
    });
  }
}

export async function updateNatRule(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    const { chain, action, protocol, dstPort, toAddress, toPort, inInterface, outInterface, comment, disabled } = req.body;

    const payload: Record<string, any> = {};
    if (chain !== undefined) payload.chain = chain;
    if (action !== undefined) payload.action = action;
    if (protocol !== undefined) payload.protocol = protocol ? String(protocol).toLowerCase() : '';
    if (dstPort !== undefined) payload['dst-port'] = String(dstPort);
    if (toAddress !== undefined) payload['to-addresses'] = String(toAddress);
    if (toPort !== undefined) payload['to-ports'] = String(toPort);
    if (inInterface !== undefined) payload['in-interface'] = String(inInterface);
    if (outInterface !== undefined) payload['out-interface'] = String(outInterface);
    if (comment !== undefined) payload.comment = String(comment);
    if (disabled !== undefined) payload.disabled = disabled ? 'true' : 'false';

    await req.rosClient!.updateFirewallNatRule(id, payload);
    res.json({ success: true, message: 'NAT rule updated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_NAT_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update NAT rule',
    });
  }
}

export async function toggleNatRule(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const { disabled } = req.body;
    if (!id || typeof disabled !== 'boolean') {
      res.status(400).json({ success: false, message: 'Rule ID and disabled boolean are required' });
      return;
    }

    await req.rosClient!.toggleFirewallNatRule(id, disabled);
    res.json({ success: true, message: `NAT rule ${disabled ? 'disabled' : 'enabled'}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'TOGGLE_NAT_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to toggle NAT rule',
    });
  }
}

export async function removeNatRule(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    await req.rosClient!.removeFirewallNatRule(id);
    res.json({ success: true, message: 'NAT rule deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'REMOVE_NAT_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to remove NAT rule',
    });
  }
}

export async function moveFilterRule(req: Request, res: Response): Promise<void> {
  try {
    const { id, destinationId } = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: 'Source rule ID (id) is required' });
      return;
    }

    await req.rosClient!.moveFirewallFilterRule(id, destinationId);
    res.json({ success: true, message: 'Filter rule moved successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'MOVE_FILTER_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to move filter rule',
    });
  }
}

export async function moveNatRule(req: Request, res: Response): Promise<void> {
  try {
    const { id, destinationId } = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: 'Source rule ID (id) is required' });
      return;
    }

    await req.rosClient!.moveFirewallNatRule(id, destinationId);
    res.json({ success: true, message: 'NAT rule moved successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'MOVE_NAT_RULE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to move NAT rule',
    });
  }
}

import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosFirewallRule, RosInterface } from '../types/index.js';
import {
  Shield,
  Plus,
  RefreshCw,
  Power,
  Trash2,
  Edit2,
  X,
  ArrowUpRight,
  Lock,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const Firewall: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nat' | 'filter'>('nat');
  const [filterRules, setFilterRules] = useState<RosFirewallRule[]>([]);
  const [natRules, setNatRules] = useState<RosFirewallRule[]>([]);
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [movingRule, setMovingRule] = useState(false);

  // Drag-and-drop state
  const [draggedNatIndex, setDraggedNatIndex] = useState<number | null>(null);
  const [dragOverNatIndex, setDragOverNatIndex] = useState<number | null>(null);
  const [draggedFilterIndex, setDraggedFilterIndex] = useState<number | null>(null);
  const [dragOverFilterIndex, setDragOverFilterIndex] = useState<number | null>(null);

  // Add Port Forward Modal state
  const [showPortForwardModal, setShowPortForwardModal] = useState(false);
  const [pfName, setPfName] = useState('');
  const [pfProtocol, setPfProtocol] = useState<'tcp' | 'udp'>('tcp');
  const [pfDstPort, setPfDstPort] = useState('');
  const [pfToAddress, setPfToAddress] = useState('');
  const [pfToPort, setPfToPort] = useState('');
  const [pfInInterface, setPfInInterface] = useState('');
  const [pfSubmitting, setPfSubmitting] = useState(false);

  // Edit NAT Rule Modal state
  const [editingNatRule, setEditingNatRule] = useState<RosFirewallRule | null>(null);
  const [editNatChain, setEditNatChain] = useState('dstnat');
  const [editNatAction, setEditNatAction] = useState('dst-nat');
  const [editNatProtocol, setEditNatProtocol] = useState('tcp');
  const [editNatDstPort, setEditNatDstPort] = useState('');
  const [editNatToAddress, setEditNatToAddress] = useState('');
  const [editNatToPort, setEditNatToPort] = useState('');
  const [editNatInInterface, setEditNatInInterface] = useState('');
  const [editNatComment, setEditNatComment] = useState('');
  const [editNatSubmitting, setEditNatSubmitting] = useState(false);

  // Add Filter Rule Modal state
  const [showAddFilterModal, setShowAddFilterModal] = useState(false);
  const [addFilterChain, setAddFilterChain] = useState<'forward' | 'input' | 'output'>('forward');
  const [addFilterAction, setAddFilterAction] = useState('accept');
  const [addFilterProtocol, setAddFilterProtocol] = useState('tcp');
  const [addFilterDstPort, setAddFilterDstPort] = useState('');
  const [addFilterSrcAddress, setAddFilterSrcAddress] = useState('');
  const [addFilterDstAddress, setAddFilterDstAddress] = useState('');
  const [addFilterInInterface, setAddFilterInInterface] = useState('');
  const [addFilterOutInterface, setAddFilterOutInterface] = useState('');
  const [addFilterComment, setAddFilterComment] = useState('');
  const [addFilterSubmitting, setAddFilterSubmitting] = useState(false);

  // Edit Filter Rule Modal state
  const [editingFilterRule, setEditingFilterRule] = useState<RosFirewallRule | null>(null);
  const [editFilterChain, setEditFilterChain] = useState('forward');
  const [editFilterAction, setEditFilterAction] = useState('accept');
  const [editFilterProtocol, setEditFilterProtocol] = useState('tcp');
  const [editFilterDstPort, setEditFilterDstPort] = useState('');
  const [editFilterSrcAddress, setEditFilterSrcAddress] = useState('');
  const [editFilterDstAddress, setEditFilterDstAddress] = useState('');
  const [editFilterInInterface, setEditFilterInInterface] = useState('');
  const [editFilterOutInterface, setEditFilterOutInterface] = useState('');
  const [editFilterComment, setEditFilterComment] = useState('');
  const [editFilterSubmitting, setEditFilterSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRules, nRules, ifaces] = await Promise.all([
        rosApi.getFilterRules(),
        rosApi.getNatRules(),
        rosApi.getInterfaces().catch(() => []),
      ]);
      setFilterRules(fRules);
      setNatRules(nRules);
      setInterfaces(ifaces);
      if (ifaces.length > 0 && !pfInInterface) {
        const wan = ifaces.find((i) => i.name.includes('wan'));
        setPfInInterface(wan ? wan.name : ifaces[0].name);
      }
    } catch (err) {
      console.error('Failed to load firewall rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Drag & Drop Reordering Logic ---
  const handleReorder = async (type: 'nat' | 'filter', fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const currentList = type === 'nat' ? [...natRules] : [...filterRules];
    if (fromIdx < 0 || fromIdx >= currentList.length || toIdx < 0 || toIdx >= currentList.length) return;

    const [movedItem] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, movedItem);

    // Optimistic UI update
    if (type === 'nat') {
      setNatRules(currentList);
    } else {
      setFilterRules(currentList);
    }

    try {
      setMovingRule(true);
      // In RouterOS, `move numbers destination` places the rule before destinationId
      const destinationId = toIdx < currentList.length - 1 ? currentList[toIdx + 1]['.id'] : undefined;
      if (type === 'nat') {
        await rosApi.moveNatRule(movedItem['.id'], destinationId);
      } else {
        await rosApi.moveFilterRule(movedItem['.id'], destinationId);
      }
    } catch (err: any) {
      console.error('Failed to move rule on router', err);
      // Rollback on failure
      await fetchData();
      alert('调整顺序失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setMovingRule(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number, type: 'nat' | 'filter') => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (type === 'nat') {
      setDraggedNatIndex(index);
    } else {
      setDraggedFilterIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'nat' | 'filter') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (type === 'nat') {
      if (dragOverNatIndex !== index) setDragOverNatIndex(index);
    } else {
      if (dragOverFilterIndex !== index) setDragOverFilterIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, type: 'nat' | 'filter') => {
    e.preventDefault();
    const sourceIndex = type === 'nat' ? draggedNatIndex : draggedFilterIndex;
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      await handleReorder(type, sourceIndex, targetIndex);
    }
    setDraggedNatIndex(null);
    setDragOverNatIndex(null);
    setDraggedFilterIndex(null);
    setDragOverFilterIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedNatIndex(null);
    setDragOverNatIndex(null);
    setDraggedFilterIndex(null);
    setDragOverFilterIndex(null);
  };

  // --- Rule Actions ---
  const handleToggleFilter = async (rule: RosFirewallRule) => {
    const isCurrentlyDisabled = rule.disabled === 'true' || rule.disabled === true;
    try {
      setBusyId(rule['.id']);
      await rosApi.toggleFilterRule(rule['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteFilter = async (id: string, comment?: string) => {
    if (!confirm(`确定要删除过滤规则 "${comment || id}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeFilterRule(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenEditFilter = (rule: RosFirewallRule) => {
    setEditingFilterRule(rule);
    setEditFilterChain(rule.chain || 'forward');
    setEditFilterAction(rule.action || 'accept');
    setEditFilterProtocol(rule.protocol || '');
    setEditFilterDstPort(rule['dst-port'] || '');
    setEditFilterSrcAddress(rule['src-address'] || '');
    setEditFilterDstAddress(rule['dst-address'] || '');
    setEditFilterInInterface(rule['in-interface'] || '');
    setEditFilterOutInterface(rule['out-interface'] || '');
    setEditFilterComment(rule.comment || '');
  };

  const handleUpdateFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFilterRule) return;

    try {
      setEditFilterSubmitting(true);
      await rosApi.updateFilterRule(editingFilterRule['.id'], {
        chain: editFilterChain,
        action: editFilterAction,
        protocol: editFilterProtocol || undefined,
        dstPort: editFilterDstPort || undefined,
        srcAddress: editFilterSrcAddress || undefined,
        dstAddress: editFilterDstAddress || undefined,
        inInterface: editFilterInInterface || undefined,
        outInterface: editFilterOutInterface || undefined,
        comment: editFilterComment || undefined,
      });
      setEditingFilterRule(null);
      await fetchData();
    } catch (err: any) {
      alert('保存过滤规则失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditFilterSubmitting(false);
    }
  };

  const handleAddFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddFilterSubmitting(true);
      await rosApi.addFilterRule({
        chain: addFilterChain,
        action: addFilterAction,
        protocol: addFilterProtocol || undefined,
        dstPort: addFilterDstPort || undefined,
        srcAddress: addFilterSrcAddress || undefined,
        dstAddress: addFilterDstAddress || undefined,
        inInterface: addFilterInInterface || undefined,
        outInterface: addFilterOutInterface || undefined,
        comment: addFilterComment || undefined,
      });
      setShowAddFilterModal(false);
      setAddFilterDstPort('');
      setAddFilterSrcAddress('');
      setAddFilterDstAddress('');
      setAddFilterComment('');
      await fetchData();
    } catch (err: any) {
      alert('新建过滤规则失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddFilterSubmitting(false);
    }
  };

  const handleToggleNat = async (rule: RosFirewallRule) => {
    const isCurrentlyDisabled = rule.disabled === 'true' || rule.disabled === true;
    try {
      setBusyId(rule['.id']);
      await rosApi.toggleNatRule(rule['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteNat = async (id: string, comment?: string) => {
    if (!confirm(`确定要删除 NAT 规则 "${comment || id}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeNatRule(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenEditNat = (rule: RosFirewallRule) => {
    setEditingNatRule(rule);
    setEditNatChain(rule.chain || 'dstnat');
    setEditNatAction(rule.action || 'dst-nat');
    setEditNatProtocol(rule.protocol || 'tcp');
    setEditNatDstPort(rule['dst-port'] || '');
    setEditNatToAddress(rule['to-addresses'] || '');
    setEditNatToPort(rule['to-ports'] || '');
    setEditNatInInterface(rule['in-interface'] || '');
    setEditNatComment(rule.comment || '');
  };

  const handleUpdateNat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNatRule) return;

    try {
      setEditNatSubmitting(true);
      await rosApi.updateNatRule(editingNatRule['.id'], {
        chain: editNatChain,
        action: editNatAction,
        protocol: editNatProtocol || undefined,
        dstPort: editNatDstPort || undefined,
        toAddress: editNatToAddress || undefined,
        toPort: editNatToPort || undefined,
        inInterface: editNatInInterface || undefined,
        comment: editNatComment || undefined,
      });
      setEditingNatRule(null);
      await fetchData();
    } catch (err: any) {
      alert('保存 NAT 规则失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditNatSubmitting(false);
    }
  };

  const handleAddPortForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfDstPort || !pfToAddress || !pfToPort) return;
    try {
      setPfSubmitting(true);
      await rosApi.addPortForwardRule({
        name: pfName,
        protocol: pfProtocol,
        dstPort: pfDstPort,
        toAddress: pfToAddress,
        toPort: pfToPort,
        inInterface: pfInInterface,
      });
      setShowPortForwardModal(false);
      setPfName('');
      setPfDstPort('');
      setPfToAddress('');
      setPfToPort('');
      await fetchData();
    } catch (err: any) {
      alert('创建端口映射失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setPfSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>防火墙与网络地址转换 (Firewall & NAT)</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-0.5">
            <p className="text-xs text-slate-400">
              配置端口映射 (Port Forwarding)、源地址伪装 (Masquerade) 以及数据包访问控制规则
            </p>
            <span className="text-[11px] text-blue-400/90 font-medium">
              💡 规则遵循自顶向下匹配，可拖拽手柄或点击箭头调序
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {movingRule && (
            <span className="text-[11px] text-blue-400 font-mono flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>保存排序中...</span>
            </span>
          )}

          <button
            onClick={fetchData}
            disabled={loading || movingRule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          {activeTab === 'nat' ? (
            <button
              onClick={() => setShowPortForwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建端口转发</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddFilterModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建过滤规则</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('nat')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'nat'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>NAT 规则 & 端口转发 ({natRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('filter')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'filter'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>过滤规则 (Filter Rules) ({filterRules.length})</span>
        </button>
      </div>

      {/* Tab 1: NAT */}
      {activeTab === 'nat' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-3 font-medium w-20 text-center">次序</th>
                  <th className="py-3.5 px-4 font-medium">状态</th>
                  <th className="py-3.5 px-4 font-medium">链 (Chain)</th>
                  <th className="py-3.5 px-4 font-medium">动作 (Action)</th>
                  <th className="py-3.5 px-4 font-medium">协议 / 外网端口</th>
                  <th className="py-3.5 px-4 font-medium">内网目标 (To IP:Port)</th>
                  <th className="py-3.5 px-4 font-medium">接口</th>
                  <th className="py-3.5 px-4 font-medium">注释备注</th>
                  <th className="py-3.5 px-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {natRules.map((rule, index) => {
                  const isDisabled = rule.disabled === 'true' || rule.disabled === true;
                  const isBusy = busyId === rule['.id'];
                  const isDragged = draggedNatIndex === index;
                  const isDragOver = dragOverNatIndex === index;

                  return (
                    <tr
                      key={rule['.id']}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'nat')}
                      onDragOver={(e) => handleDragOver(e, index, 'nat')}
                      onDrop={(e) => handleDrop(e, index, 'nat')}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors duration-150 ${
                        isDragged ? 'opacity-30 bg-slate-800/90' : ''
                      } ${
                        isDragOver
                          ? 'border-t-2 border-blue-500 bg-blue-500/10'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Order & Drag Handle Column */}
                      <td className="py-2.5 px-2 text-center select-none">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className="p-1 text-slate-500 hover:text-slate-200 cursor-grab active:cursor-grabbing rounded hover:bg-slate-800 transition"
                            title="按住拖拽排序"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 w-4 text-right">
                            {index}
                          </span>
                          <div className="flex flex-col -space-y-0.5 ml-0.5">
                            <button
                              onClick={() => handleReorder('nat', index, index - 1)}
                              disabled={index === 0 || movingRule}
                              className="text-slate-500 hover:text-blue-400 disabled:opacity-20 p-0.5 cursor-pointer disabled:cursor-not-allowed transition"
                              title="上移一行"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReorder('nat', index, index + 1)}
                              disabled={index === natRules.length - 1 || movingRule}
                              className="text-slate-500 hover:text-blue-400 disabled:opacity-20 p-0.5 cursor-pointer disabled:cursor-not-allowed transition"
                              title="下移一行"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isDisabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            已禁用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            生效中
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {rule.chain}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                            rule.action === 'masquerade'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : rule.action === 'dst-nat'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {rule.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        {rule.protocol ? `${rule.protocol.toUpperCase()} : ${rule['dst-port'] || 'any'}` : '--'}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {rule['to-addresses'] ? (
                          <span className="text-emerald-400 font-semibold">
                            {rule['to-addresses']}
                            {rule['to-ports'] ? `:${rule['to-ports']}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-500">--</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {rule['in-interface'] || rule['out-interface'] || 'any'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {rule.comment || '--'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditNat(rule)}
                            disabled={isBusy || movingRule}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition cursor-pointer"
                            title="编辑规则"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleNat(rule)}
                            disabled={isBusy || movingRule}
                            className={`p-1 rounded transition cursor-pointer ${
                              isDisabled
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            }`}
                            title={isDisabled ? '启用' : '禁用'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteNat(rule['.id'], rule.comment)}
                            disabled={isBusy || movingRule}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                            title="删除规则"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Filter */}
      {activeTab === 'filter' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-3 font-medium w-20 text-center">次序</th>
                  <th className="py-3.5 px-4 font-medium">状态</th>
                  <th className="py-3.5 px-4 font-medium">链 (Chain)</th>
                  <th className="py-3.5 px-4 font-medium">动作 (Action)</th>
                  <th className="py-3.5 px-4 font-medium">协议 / 端口</th>
                  <th className="py-3.5 px-4 font-medium">接口 (In / Out)</th>
                  <th className="py-3.5 px-4 font-medium">累计匹配</th>
                  <th className="py-3.5 px-4 font-medium">注释说明</th>
                  <th className="py-3.5 px-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filterRules.map((rule, index) => {
                  const isDisabled = rule.disabled === 'true' || rule.disabled === true;
                  const isBusy = busyId === rule['.id'];
                  const isDragged = draggedFilterIndex === index;
                  const isDragOver = dragOverFilterIndex === index;

                  return (
                    <tr
                      key={rule['.id']}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'filter')}
                      onDragOver={(e) => handleDragOver(e, index, 'filter')}
                      onDrop={(e) => handleDrop(e, index, 'filter')}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors duration-150 ${
                        isDragged ? 'opacity-30 bg-slate-800/90' : ''
                      } ${
                        isDragOver
                          ? 'border-t-2 border-blue-500 bg-blue-500/10'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Order & Drag Handle Column */}
                      <td className="py-2.5 px-2 text-center select-none">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className="p-1 text-slate-500 hover:text-slate-200 cursor-grab active:cursor-grabbing rounded hover:bg-slate-800 transition"
                            title="按住拖拽排序"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 w-4 text-right">
                            {index}
                          </span>
                          <div className="flex flex-col -space-y-0.5 ml-0.5">
                            <button
                              onClick={() => handleReorder('filter', index, index - 1)}
                              disabled={index === 0 || movingRule}
                              className="text-slate-500 hover:text-blue-400 disabled:opacity-20 p-0.5 cursor-pointer disabled:cursor-not-allowed transition"
                              title="上移一行"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReorder('filter', index, index + 1)}
                              disabled={index === filterRules.length - 1 || movingRule}
                              className="text-slate-500 hover:text-blue-400 disabled:opacity-20 p-0.5 cursor-pointer disabled:cursor-not-allowed transition"
                              title="下移一行"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isDisabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            已禁用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            生效中
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {rule.chain}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                            rule.action === 'accept'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : rule.action === 'drop'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {rule.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        {rule.protocol ? `${rule.protocol.toUpperCase()}` : 'any'}
                        {rule['dst-port'] ? ` : ${rule['dst-port']}` : ''}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {rule['in-interface'] ? `In: ${rule['in-interface']}` : ''}
                        {rule['out-interface'] ? ` Out: ${rule['out-interface']}` : ''}
                        {!rule['in-interface'] && !rule['out-interface'] ? 'any' : ''}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {rule.packets ? `${rule.packets} pkts` : '--'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {rule.comment || '--'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditFilter(rule)}
                            disabled={isBusy || movingRule}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition cursor-pointer"
                            title="编辑规则"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleFilter(rule)}
                            disabled={isBusy || movingRule}
                            className={`p-1 rounded transition cursor-pointer ${
                              isDisabled
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            }`}
                            title={isDisabled ? '启用' : '禁用'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteFilter(rule['.id'], rule.comment)}
                            disabled={isBusy || movingRule}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                            title="删除规则"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add Port Forward Modal */}
      {showPortForwardModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">新建外网端口转发规则</h3>
              </div>
              <button
                onClick={() => setShowPortForwardModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPortForward} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  规则备注名称 (可选)
                </label>
                <input
                  type="text"
                  placeholder="例如: NAS-Web / HomeAssistant"
                  value={pfName}
                  onChange={(e) => setPfName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">传输协议</label>
                  <select
                    value={pfProtocol}
                    onChange={(e) => setPfProtocol(e.target.value as 'tcp' | 'udp')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">入网接口 (WAN)</label>
                  <select
                    value={pfInInterface}
                    onChange={(e) => setPfInInterface(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {interfaces.map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    外网访问端口 (External Dst Port)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 8080"
                    value={pfDstPort}
                    onChange={(e) => {
                      setPfDstPort(e.target.value);
                      if (!pfToPort) setPfToPort(e.target.value);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    内网目标端口 (Internal Port)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 5000"
                    value={pfToPort}
                    onChange={(e) => setPfToPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  内网目标 IP 地址 (Internal Target IP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 192.168.88.200"
                  value={pfToAddress}
                  onChange={(e) => setPfToAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs flex items-center justify-between">
                <span>下发规则预览:</span>
                <span className="font-mono text-blue-400 font-semibold">
                  WAN:{pfDstPort || '??'} → {pfToAddress || '192.168.x.x'}:{pfToPort || '??'} ({pfProtocol.toUpperCase()})
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPortForwardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pfSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {pfSubmitting ? '下发中...' : '生成并应用规则'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit NAT Rule Modal */}
      {editingNatRule && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">
                  编辑 NAT 规则 ({editingNatRule['.id']})
                </h3>
              </div>
              <button
                onClick={() => setEditingNatRule(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateNat} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">链 (Chain)</label>
                  <select
                    value={editNatChain}
                    onChange={(e) => setEditNatChain(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="dstnat">dstnat (目的地址转换/端口映射)</option>
                    <option value="srcnat">srcnat (源地址转换/出网伪装)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">动作 (Action)</label>
                  <select
                    value={editNatAction}
                    onChange={(e) => setEditNatAction(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="dst-nat">dst-nat</option>
                    <option value="masquerade">masquerade</option>
                    <option value="src-nat">src-nat</option>
                    <option value="redirect">redirect</option>
                    <option value="accept">accept</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">传输协议</label>
                  <select
                    value={editNatProtocol}
                    onChange={(e) => setEditNatProtocol(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                    <option value="">any (任意)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">入网接口 (In Interface)</label>
                  <select
                    value={editNatInInterface}
                    onChange={(e) => setEditNatInInterface(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">any (任意接口)</option>
                    {interfaces.map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    目标端口 (Dst. Port)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 8080"
                    value={editNatDstPort}
                    onChange={(e) => setEditNatDstPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    内网目标端口 (To Ports)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 80"
                    value={editNatToPort}
                    onChange={(e) => setEditNatToPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  内网目标 IP (To Addresses)
                </label>
                <input
                  type="text"
                  placeholder="例如: 192.168.88.200"
                  value={editNatToAddress}
                  onChange={(e) => setEditNatToAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">注释备注 (Comment)</label>
                <input
                  type="text"
                  placeholder="规则用途备注"
                  value={editNatComment}
                  onChange={(e) => setEditNatComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingNatRule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={editNatSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {editNatSubmitting ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Filter Rule Modal */}
      {showAddFilterModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">新建过滤规则 (Filter Rule)</h3>
              </div>
              <button
                onClick={() => setShowAddFilterModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFilter} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">链 (Chain)</label>
                  <select
                    value={addFilterChain}
                    onChange={(e) => setAddFilterChain(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="forward">forward (转发数据流)</option>
                    <option value="input">input (入站访问本机)</option>
                    <option value="output">output (本机发起出站)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">执行动作 (Action)</label>
                  <select
                    value={addFilterAction}
                    onChange={(e) => setAddFilterAction(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="accept">accept (允许通过)</option>
                    <option value="drop">drop (静默丢弃)</option>
                    <option value="reject">reject (拒绝并响应)</option>
                    <option value="fasttrack-connection">fasttrack-connection (快速通道)</option>
                    <option value="passthrough">passthrough (穿透)</option>
                    <option value="log">log (记录日志)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">传输协议</label>
                  <select
                    value={addFilterProtocol}
                    onChange={(e) => setAddFilterProtocol(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                    <option value="">any (全部协议)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">目标端口 (Dst. Port)</label>
                  <input
                    type="text"
                    placeholder="例如: 22,80,443"
                    value={addFilterDstPort}
                    onChange={(e) => setAddFilterDstPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">源 IP 地址 (Src. Address)</label>
                  <input
                    type="text"
                    placeholder="例如: 192.168.88.0/24"
                    value={addFilterSrcAddress}
                    onChange={(e) => setAddFilterSrcAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">目标 IP 地址 (Dst. Address)</label>
                  <input
                    type="text"
                    placeholder="例如: 0.0.0.0/0"
                    value={addFilterDstAddress}
                    onChange={(e) => setAddFilterDstAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">入网接口 (In Interface)</label>
                  <select
                    value={addFilterInInterface}
                    onChange={(e) => setAddFilterInInterface(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">any (任意接口)</option>
                    {interfaces.map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">出网接口 (Out Interface)</label>
                  <select
                    value={addFilterOutInterface}
                    onChange={(e) => setAddFilterOutInterface(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">any (任意接口)</option>
                    {interfaces.map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">注释说明 (Comment)</label>
                <input
                  type="text"
                  placeholder="规则说明"
                  value={addFilterComment}
                  onChange={(e) => setAddFilterComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddFilterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={addFilterSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {addFilterSubmitting ? '创建中...' : '生成并应用规则'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Edit Filter Rule Modal */}
      {editingFilterRule && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">
                  编辑过滤规则 ({editingFilterRule['.id']})
                </h3>
              </div>
              <button
                onClick={() => setEditingFilterRule(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFilter} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">链 (Chain)</label>
                  <select
                    value={editFilterChain}
                    onChange={(e) => setEditFilterChain(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="forward">forward (转发数据流)</option>
                    <option value="input">input (入站访问本机)</option>
                    <option value="output">output (本机发起出站)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">执行动作 (Action)</label>
                  <select
                    value={editFilterAction}
                    onChange={(e) => setEditFilterAction(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="accept">accept (允许通过)</option>
                    <option value="drop">drop (静默丢弃)</option>
                    <option value="reject">reject (拒绝并响应)</option>
                    <option value="fasttrack-connection">fasttrack-connection (快速通道)</option>
                    <option value="passthrough">passthrough (穿透)</option>
                    <option value="log">log (记录日志)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">传输协议</label>
                  <select
                    value={editFilterProtocol}
                    onChange={(e) => setEditFilterProtocol(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP</option>
                    <option value="">any (全部协议)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">目标端口 (Dst. Port)</label>
                  <input
                    type="text"
                    placeholder="例如: 22,80,443"
                    value={editFilterDstPort}
                    onChange={(e) => setEditFilterDstPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">源 IP 地址 (Src. Address)</label>
                  <input
                    type="text"
                    placeholder="例如: 192.168.88.0/24"
                    value={editFilterSrcAddress}
                    onChange={(e) => setEditFilterSrcAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">目标 IP 地址 (Dst. Address)</label>
                  <input
                    type="text"
                    placeholder="例如: 0.0.0.0/0"
                    value={editFilterDstAddress}
                    onChange={(e) => setEditFilterDstAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">入网接口 (In Interface)</label>
                  <select
                    value={editFilterInInterface}
                    onChange={(e) => setEditFilterInInterface(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">any (任意接口)</option>
                    {interfaces.map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">出网接口 (Out Interface)</label>
                  <select
                    value={editFilterOutInterface}
                    onChange={(e) => setEditFilterOutInterface(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">any (任意接口)</option>
                    {interfaces.map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">注释说明 (Comment)</label>
                <input
                  type="text"
                  placeholder="规则说明"
                  value={editFilterComment}
                  onChange={(e) => setEditFilterComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFilterRule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={editFilterSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {editFilterSubmitting ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

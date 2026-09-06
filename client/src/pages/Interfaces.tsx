import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosInterface } from '../types/index.js';
import { Network, RefreshCw, Power, Edit2, Check, X, ArrowDown, ArrowUp } from 'lucide-react';

function formatBytes(bytes: number | string | undefined): string {
  if (!bytes) return '0 B';
  const num = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (isNaN(num) || num <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${(num / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export const Interfaces: React.FC = () => {
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInterfaces = async () => {
    try {
      setLoading(true);
      const data = await rosApi.getInterfaces();
      setInterfaces(data);
    } catch (err) {
      console.error('Failed to fetch interfaces', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterfaces();
  }, []);

  const handleToggle = async (iface: RosInterface) => {
    const isCurrentlyDisabled = iface.disabled === 'true' || iface.disabled === true;
    const targetDisabled = !isCurrentlyDisabled;
    try {
      setActionLoadingId(iface['.id']);
      await rosApi.toggleInterface(iface['.id'], targetDisabled);
      await fetchInterfaces();
    } catch (err) {
      alert('切换接口状态失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveComment = async (id: string) => {
    try {
      setActionLoadingId(id);
      await rosApi.updateInterface(id, { comment: editComment });
      setEditingId(null);
      await fetchInterfaces();
    } catch (err) {
      alert('修改注释失败');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            <span>网络接口管理</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            查看与配置以太网口、网桥、VLAN 及虚拟接口参数
          </p>
        </div>
        <button
          onClick={fetchInterfaces}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新接口</span>
        </button>
      </div>

      {/* Interfaces Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">状态</th>
                <th className="py-3.5 px-4 font-medium">接口名称</th>
                <th className="py-3.5 px-4 font-medium">类型</th>
                <th className="py-3.5 px-4 font-medium">MTU</th>
                <th className="py-3.5 px-4 font-medium">MAC 地址</th>
                <th className="py-3.5 px-4 font-medium">累计收发 (Rx / Tx)</th>
                <th className="py-3.5 px-4 font-medium">注释备注</th>
                <th className="py-3.5 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {interfaces.map((iface) => {
                const isRunning = iface.running === 'true' || iface.running === true;
                const isDisabled = iface.disabled === 'true' || iface.disabled === true;
                const isBusy = actionLoadingId === iface['.id'];

                return (
                  <tr key={iface['.id']} className="hover:bg-slate-800/40 transition-colors">
                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isDisabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            已禁用
                          </span>
                        ) : isRunning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            运行中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            无链路 (Down)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-100">
                      {iface.name}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px] font-mono">
                        {iface.type}
                      </span>
                    </td>

                    {/* MTU */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {iface.mtu || 1500}
                    </td>

                    {/* MAC */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {iface['mac-address'] || '--'}
                    </td>

                    {/* Rx/Tx Total */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <ArrowDown className="w-3 h-3" />
                          <span>{formatBytes(iface['rx-byte'])}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <ArrowUp className="w-3 h-3" />
                          <span>{formatBytes(iface['tx-byte'])}</span>
                        </div>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="py-3 px-4">
                      {editingId === iface['.id'] ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="输入注释"
                          />
                          <button
                            onClick={() => handleSaveComment(iface['.id'])}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="text-slate-400 text-[11px]">
                            {iface.comment || <span className="text-slate-600 italic">无</span>}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(iface['.id']);
                              setEditComment(iface.comment || '');
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                            title="修改注释"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggle(iface)}
                        disabled={isBusy}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                          isDisabled
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                        }`}
                        title={isDisabled ? '点击启用接口' : '点击禁用接口'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{isDisabled ? '启用' : '禁用'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {interfaces.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    未发现网络接口
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

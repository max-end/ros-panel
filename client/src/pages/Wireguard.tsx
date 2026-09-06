import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosWireguardInterface, RosWireguardPeer } from '../types/index.js';
import { RadioTower, Plus, RefreshCw, Power, Trash2, Key, Clock, X, ArrowDown, ArrowUp } from 'lucide-react';

function formatBytes(bytes: number | string | undefined): string {
  if (!bytes) return '0 B';
  const num = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (isNaN(num) || num <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${(num / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export const Wireguard: React.FC = () => {
  const [interfaces, setInterfaces] = useState<RosWireguardInterface[]>([]);
  const [peers, setPeers] = useState<RosWireguardPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add Peer Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [peerInterface, setPeerInterface] = useState('');
  const [peerPublicKey, setPeerPublicKey] = useState('');
  const [peerAllowedAddress, setPeerAllowedAddress] = useState('');
  const [peerEndpointAddress, setPeerEndpointAddress] = useState('');
  const [peerEndpointPort, setPeerEndpointPort] = useState('');
  const [peerComment, setPeerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ifaces, peerList] = await Promise.all([
        rosApi.getWireguardInterfaces(),
        rosApi.getWireguardPeers(),
      ]);
      setInterfaces(ifaces);
      setPeers(peerList);
      if (ifaces.length > 0 && !peerInterface) {
        setPeerInterface(ifaces[0].name);
      }
    } catch (err) {
      console.error('Failed to load WireGuard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePeer = async (peer: RosWireguardPeer) => {
    const isCurrentlyDisabled = peer.disabled === 'true' || peer.disabled === true;
    try {
      setBusyId(peer['.id']);
      await rosApi.toggleWireguardPeer(peer['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePeer = async (id: string, comment?: string) => {
    if (!confirm(`确定要移除 Peer "${comment || id}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeWireguardPeer(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddPeer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerInterface || !peerPublicKey || !peerAllowedAddress) return;
    try {
      setSubmitting(true);
      await rosApi.addWireguardPeer({
        interface: peerInterface,
        publicKey: peerPublicKey,
        allowedAddress: peerAllowedAddress,
        endpointAddress: peerEndpointAddress || undefined,
        endpointPort: peerEndpointPort ? Number(peerEndpointPort) : undefined,
        comment: peerComment || undefined,
      });
      setShowAddModal(false);
      setPeerPublicKey('');
      setPeerAllowedAddress('');
      setPeerEndpointAddress('');
      setPeerEndpointPort('');
      setPeerComment('');
      await fetchData();
    } catch (err: any) {
      alert('添加 Peer 失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <RadioTower className="w-5 h-5 text-purple-400" />
            <span>WireGuard VPN 管理</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            配置现代高安全性、低开销的 WireGuard 隧道网关与远程客户端节点 (Peers)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={interfaces.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加 Peer 客户端</span>
          </button>
        </div>
      </div>

      {/* Interfaces Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interfaces.map((iface) => (
          <div
            key={iface['.id']}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100">{iface.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    监听端口: {iface['listen-port']}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{iface.comment || 'WireGuard 接口'}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <RadioTower className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">公钥 (Public Key):</span>
              <p className="font-mono text-xs text-slate-300 break-all select-all mt-0.5">
                {iface['public-key']}
              </p>
            </div>
          </div>
        ))}

        {interfaces.length === 0 && !loading && (
          <div className="col-span-2 p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-500">
            未配置 WireGuard 接口。请先在路由器接口列表中添加 WireGuard 接口。
          </div>
        )}
      </div>

      {/* Peers Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-xs text-slate-200">
            WireGuard 客户端节点列表 (Peers) ({peers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">状态</th>
                <th className="py-3.5 px-4 font-medium">接口</th>
                <th className="py-3.5 px-4 font-medium">允许的 IP (Allowed IPs)</th>
                <th className="py-3.5 px-4 font-medium">远端连接端点 (Endpoint)</th>
                <th className="py-3.5 px-4 font-medium">最后握手时间</th>
                <th className="py-3.5 px-4 font-medium">累计收发 (Rx / Tx)</th>
                <th className="py-3.5 px-4 font-medium">注释备注</th>
                <th className="py-3.5 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {peers.map((peer) => {
                const isDisabled = peer.disabled === 'true' || peer.disabled === true;
                const isBusy = busyId === peer['.id'];

                return (
                  <tr key={peer['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {isDisabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                          已禁用
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          就绪
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {peer.interface}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {peer['allowed-address']}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {peer['current-endpoint-address'] || peer['endpoint-address'] ? (
                        `${peer['current-endpoint-address'] || peer['endpoint-address']}:${peer['current-endpoint-port'] || peer['endpoint-port']}`
                      ) : (
                        <span className="text-slate-600 italic">等待远端连接</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{peer['last-handshake'] || '未握手'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <ArrowDown className="w-3 h-3" />
                          <span>{formatBytes(peer.rx)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <ArrowUp className="w-3 h-3" />
                          <span>{formatBytes(peer.tx)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {peer.comment || '--'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTogglePeer(peer)}
                          disabled={isBusy}
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
                          onClick={() => handleDeletePeer(peer['.id'], peer.comment)}
                          disabled={isBusy}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="删除 Peer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {peers.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    暂无 WireGuard Peer 客户端
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Peer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-100">添加 WireGuard Peer 节点</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPeer} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">接口</label>
                <select
                  value={peerInterface}
                  onChange={(e) => setPeerInterface(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {interfaces.map((i) => (
                    <option key={i['.id']} value={i.name}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Peer 客户端公钥 (Public Key)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Base64 公钥字符串"
                  value={peerPublicKey}
                  onChange={(e) => setPeerPublicKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  允许通过的 IP / 子网 (Allowed Address)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 10.0.0.2/32"
                  value={peerAllowedAddress}
                  onChange={(e) => setPeerAllowedAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    远端地址 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: branch.example.com"
                    value={peerEndpointAddress}
                    onChange={(e) => setPeerEndpointAddress(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    远端端口 (可选)
                  </label>
                  <input
                    type="number"
                    placeholder="51820"
                    value={peerEndpointPort}
                    onChange={(e) => setPeerEndpointPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  设备描述 / 备注
                </label>
                <input
                  type="text"
                  placeholder="例如: 张三的办公室笔记本"
                  value={peerComment}
                  onChange={(e) => setPeerComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submitting ? '添加中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

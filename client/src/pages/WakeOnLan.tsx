import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { WolDevice, RosInterface, RosDhcpLease } from '../types/index.js';
import {
  Zap,
  Plus,
  RefreshCw,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  Laptop,
  Server,
  Activity,
  X,
  Radio,
  HelpCircle,
} from 'lucide-react';

export const WakeOnLan: React.FC = () => {
  const [devices, setDevices] = useState<WolDevice[]>([]);
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [dhcpLeases, setDhcpLeases] = useState<RosDhcpLease[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual wake state
  const [manualMac, setManualMac] = useState('');
  const [manualInterface, setManualInterface] = useState('bridge-lan');
  const [manualSending, setManualSending] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Action states for saved devices
  const [wakingDeviceId, setWakingDeviceId] = useState<string | null>(null);
  const [deviceOnlineMap, setDeviceOnlineMap] = useState<Record<string, { isOnline: boolean; latency?: string }>>({});
  const [checkingDeviceId, setCheckingDeviceId] = useState<string | null>(null);
  const [deviceSuccessMsg, setDeviceSuccessMsg] = useState<{ id: string; msg: string } | null>(null);

  // Add Device Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<'dhcp' | 'manual'>('dhcp');
  const [newName, setNewName] = useState('');
  const [newMac, setNewMac] = useState('');
  const [newInterface, setNewInterface] = useState('bridge-lan');
  const [newIp, setNewIp] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devList, ifaceList, leases] = await Promise.all([
        rosApi.getWolDevices(),
        rosApi.getInterfaces().catch(() => []),
        rosApi.getDhcpLeases().catch(() => []),
      ]);
      setDevices(devList);
      setInterfaces(ifaceList);
      setDhcpLeases(leases);

      if (ifaceList.length > 0) {
        const bridge = ifaceList.find((i) => i.name.includes('bridge') || i.type === 'bridge');
        const defaultIface = bridge ? bridge.name : ifaceList[0].name;
        setManualInterface(defaultIface);
        setNewInterface(defaultIface);
      }
    } catch (err) {
      console.error('Failed to load WOL data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualWake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMac || !manualInterface) return;
    try {
      setManualSending(true);
      setManualSuccessMsg(null);
      const res = await rosApi.wakeOnLan(manualMac, manualInterface);
      setManualSuccessMsg(res.message);
      setTimeout(() => setManualSuccessMsg(null), 5000);
    } catch (err: any) {
      alert('唤醒发送失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setManualSending(false);
    }
  };

  const handleWakeDevice = async (device: WolDevice) => {
    try {
      setWakingDeviceId(device.id);
      const res = await rosApi.wakeWolDevice(device.id);
      setDeviceSuccessMsg({ id: device.id, msg: '魔术包已广播' });
      setTimeout(() => setDeviceSuccessMsg(null), 4000);
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, lastWokenAt: res.lastWokenAt } : d))
      );
    } catch (err: any) {
      alert('网络唤醒失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setWakingDeviceId(null);
    }
  };

  const handleCheckOnline = async (device: WolDevice) => {
    if (!device.ip) {
      alert('该设备未设置 IP 地址，无法进行网络在线探测');
      return;
    }
    try {
      setCheckingDeviceId(device.id);
      const res = await rosApi.checkDeviceStatus(device.ip);
      setDeviceOnlineMap((prev) => ({
        ...prev,
        [device.id]: { isOnline: res.isOnline, latency: res.latency },
      }));
    } catch (err: any) {
      alert('探测在线状态失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setCheckingDeviceId(null);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`确定要移除 "${name}" 吗？`)) return;
    try {
      await rosApi.removeWolDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleImportDhcpLease = (lease: RosDhcpLease) => {
    setNewName(lease['host-name'] || `主机-${lease.address.slice(-3)}`);
    setNewMac(lease['mac-address']);
    setNewIp(lease.address);
    setNewDesc(`自动导入于 DHCP (${lease.address})`);
    setActiveImportTab('manual');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMac || !newInterface) return;
    try {
      setAddLoading(true);
      const res = await rosApi.addWolDevice({
        name: newName,
        mac: newMac,
        interface: newInterface,
        ip: newIp || undefined,
        description: newDesc || undefined,
      });
      setDevices((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setNewName('');
      setNewMac('');
      setNewIp('');
      setNewDesc('');
    } catch (err: any) {
      alert('添加设备失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>网络唤醒中心 (Wake-on-LAN / WoL)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            通过 RouterOS 向局域网广播魔术数据包（Magic Packet），远程唤醒已关机的电脑与服务器
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加常用唤醒设备</span>
          </button>
        </div>
      </div>

      {/* Manual Quick Wake Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-xs text-slate-100 uppercase tracking-wider">
              快速手动网络唤醒
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            目标主板 BIOS 需开启 Wake-on-LAN 支持
          </span>
        </div>

        {manualSuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{manualSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleManualWake} className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full md:w-auto">
            <label className="text-xs font-medium text-slate-300 block mb-1">
              目标网卡物理地址 (MAC Address)
            </label>
            <input
              type="text"
              required
              placeholder="例如: A4:83:E7:3B:55:12 或 a4-83-e7-3b-55-12"
              value={manualMac}
              onChange={(e) => setManualMac(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full md:w-60">
            <label className="text-xs font-medium text-slate-300 block mb-1">
              广播接口 (Interface)
            </label>
            <select
              value={manualInterface}
              onChange={(e) => setManualInterface(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {interfaces.map((i) => (
                <option key={i['.id']} value={i.name}>
                  {i.name} ({i.type})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <button
              type="submit"
              disabled={manualSending}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs py-2 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {manualSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  <span>广播中...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>发送唤醒魔术包</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Saved Devices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            <span>常驻收藏唤醒列表</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {devices.length} 台
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            支持一键唤醒及开机后在线状态回测
          </span>
        </div>

        {/* Using items-start to prevent vertical stretching */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {devices.map((device) => {
            const isWaking = wakingDeviceId === device.id;
            const isChecking = checkingDeviceId === device.id;
            const status = deviceOnlineMap[device.id];
            const successNotice = deviceSuccessMsg?.id === device.id ? deviceSuccessMsg.msg : null;

            return (
              <div
                key={device.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        {device.name.includes('NAS') || device.name.includes('服务器') ? (
                          <Server className="w-5 h-5" />
                        ) : (
                          <Laptop className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-100 truncate">{device.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {device.description || '常驻网络设备'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDevice(device.id, device.name)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1 rounded-lg transition cursor-pointer shrink-0"
                      title="移除此设备"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Device Spec Table */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">MAC 地址</span>
                      <span className="font-mono font-semibold text-slate-200 select-all">
                        {device.mac}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">广播接口</span>
                      <span className="font-mono text-blue-400">{device.interface}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">内网 IP</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">
                          {device.ip || '未指定'}
                        </span>
                        {device.ip && (
                          <button
                            onClick={() => handleCheckOnline(device)}
                            disabled={isChecking}
                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                            title="探测是否已开机在线"
                          >
                            <Activity className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                            <span>{isChecking ? '探测中' : '测开机'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {status && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-500">当前开机状态</span>
                        {status.isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            已开机在线 ({status.latency || '<1ms'})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            离线关机中
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center py-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        上次唤醒
                      </span>
                      <span className="font-mono">
                        {device.lastWokenAt || '从未唤醒'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wake Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-800">
                  {successNotice ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{successNotice}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleWakeDevice(device)}
                      disabled={isWaking}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isWaking ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>魔术包广播中...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>立即网络唤醒 (Wake Up)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {devices.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-xs text-slate-500">
              暂无收藏的唤醒设备。点击右上角“添加常用唤醒设备”添加您的台式机或 NAS。
            </div>
          )}
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-slate-100">添加常驻网络唤醒设备</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-slate-800 py-3 mb-4">
              <button
                type="button"
                onClick={() => setActiveImportTab('dhcp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeImportTab === 'dhcp'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                从 DHCP 客户端直接选取 ({dhcpLeases.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveImportTab('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeImportTab === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                手动填写参数
              </button>
            </div>

            {activeImportTab === 'dhcp' ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {dhcpLeases.map((lease) => (
                  <div
                    key={lease['.id']}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-100">
                        {lease['host-name'] || '未命名设备'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {lease.address} · {lease['mac-address']}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImportDhcpLease(lease)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition cursor-pointer"
                    >
                      导入填表
                    </button>
                  </div>
                ))}
                {dhcpLeases.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    暂未发现 DHCP 在线租约客户端
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    设备名称
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 个人工作站 PC 或 群晖 NAS"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    MAC 物理地址
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={newMac}
                    onChange={(e) => setNewMac(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      广播接口
                    </label>
                    <select
                      value={newInterface}
                      onChange={(e) => setNewInterface(e.target.value)}
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
                      设备 IP (选填，用于探测开机)
                    </label>
                    <input
                      type="text"
                      placeholder="192.168.88.x"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    备注信息 (选填)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 主卧电脑，支持 PCIe WoL"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
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
                    disabled={addLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                  >
                    {addLoading ? '保存中...' : '保存至唤醒列表'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

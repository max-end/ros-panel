import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosWifiInterface, RosWifiClient, RosCapsmanConfig } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import {
  Wifi,
  Radio,
  Users,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Edit2,
  Lock,
  Signal,
  CheckCircle,
  AlertTriangle,
  Zap,
  Layers,
  Clock,
  Laptop,
  Smartphone,
  Server,
  X,
  Plus,
  Power,
  Eye,
  EyeOff,
} from 'lucide-react';

export const Wireless: React.FC = () => {
  const { t } = useI18n();

  const [interfaces, setInterfaces] = useState<RosWifiInterface[]>([]);
  const [clients, setClients] = useState<RosWifiClient[]>([]);
  const [capsman, setCapsman] = useState<RosCapsmanConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'interfaces' | 'clients' | 'capsman'>('interfaces');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick setup modal state
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [quickSsid, setQuickSsid] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [submittingQuick, setSubmittingQuick] = useState(false);
  const [showQuickPwd, setShowQuickPwd] = useState(false);

  // Edit single interface modal
  const [editingIface, setEditingIface] = useState<RosWifiInterface | null>(null);
  const [editSsid, setEditSsid] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDisabled, setEditDisabled] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ifaceList, clientList, cap] = await Promise.all([
        rosApi.getWifiInterfaces().catch(() => []),
        rosApi.getWifiClients().catch(() => []),
        rosApi.getCapsmanConfig().catch(() => null),
      ]);
      setInterfaces(ifaceList);
      setClients(clientList);
      setCapsman(cap);
    } catch (err: any) {
      setError(err.message || '获取无线数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (iface: RosWifiInterface) => {
    setEditingIface(iface);
    setEditSsid(iface.ssid || iface.name);
    setEditPassword('');
    setEditDisabled(iface.disabled === 'true' || iface.disabled === true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIface) return;
    try {
      setSubmittingEdit(true);
      const patchData: Partial<RosWifiInterface> = {
        ssid: editSsid.trim(),
        disabled: editDisabled ? 'true' : 'false',
      };
      if (editPassword) {
        patchData.passphrase = editPassword;
      }
      await rosApi.updateWifiInterface(editingIface['.id'], patchData);
      setSuccessMsg(`已成功保存无线接口 ${editingIface.name} 的配置`);
      setEditingIface(null);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || '更新无线接口失败');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleQuickSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSsid.trim()) return;
    try {
      setSubmittingQuick(true);
      await rosApi.quickSetupWifi({
        ssid: quickSsid.trim(),
        password: quickPassword || undefined,
      });
      setSuccessMsg(`已将所有射频接口的 Wi-Fi 名称统一更新为 "${quickSsid}"`);
      setShowQuickSetup(false);
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || '批量配置 Wi-Fi 失败');
    } finally {
      setSubmittingQuick(false);
    }
  };

  const getSignalMeta = (signal: number | string) => {
    const s = typeof signal === 'string' ? parseInt(signal, 10) : signal;
    if (isNaN(s)) return { color: 'text-slate-400', bg: 'bg-slate-500', label: '--' };
    if (s >= -60) return { color: 'text-emerald-400', bg: 'bg-emerald-500', label: '极强' };
    if (s >= -75) return { color: 'text-amber-400', bg: 'bg-amber-500', label: '良好' };
    return { color: 'text-red-400', bg: 'bg-red-500', label: '较弱' };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-400" />
            <span>无线管理与 CAPsMAN 集中控制器 (Wi-Fi & Wireless AP)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            双频 Wi-Fi 6 / 802.11ax 射频配置、WPA3 安全加密、无线终端信号感知与集中漫游下发
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          <button
            onClick={() => {
              setQuickSsid(interfaces[0]?.ssid || 'MyHome-WiFi');
              setQuickPassword('');
              setShowQuickSetup(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>一键配置向导</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('interfaces')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'interfaces'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>无线射频接口 ({interfaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'clients'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>已连终端感知 ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('capsman')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'capsman'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>CAPsMAN 集中控制器</span>
        </button>
      </div>

      {/* Tab 1: Wi-Fi Interfaces */}
      {activeTab === 'interfaces' && (
        <div className="space-y-4">
          {interfaces.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              当前设备未探测到内置 Wi-Fi 射频模块，或当前设备为纯有线路由器 (可通过 CAPsMAN 集中纳管外部 AP)。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {interfaces.map((iface) => {
                const isRunning = iface.running === 'true' || iface.running === true;
                const isDisabled = iface.disabled === 'true' || iface.disabled === true;
                const is5G = iface.name.toLowerCase().includes('5g') || (iface.band && iface.band.includes('5ghz'));

                return (
                  <div
                    key={iface['.id']}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                              is5G
                                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30'
                                : 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            <Wifi className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-100">{iface.name}</h3>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                                {is5G ? '5GHz Wi-Fi 6' : '2.4GHz IoT'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {iface.comment || iface.band || 'RouterOS Wi-Fi'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isRunning && !isDisabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              广播中
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                              已停用
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Wi-Fi Details */}
                      <div className="mt-4 space-y-2.5 text-xs">
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                              无线网络名称 (SSID)
                            </span>
                            <span className="font-bold font-mono text-base text-slate-100 mt-0.5 block select-all">
                              {iface.ssid || iface.name}
                            </span>
                          </div>
                          <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg">
                            <Radio className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block">信道与频宽</span>
                            <span className="font-mono text-slate-200 block mt-0.5 truncate font-medium">
                              {iface.channel || iface.frequency || '自动 (Auto)'}
                            </span>
                          </div>

                          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block">加密安全算法</span>
                            <span className="font-mono text-emerald-400 block mt-0.5 truncate font-medium flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>{iface.security || 'WPA2/WPA3-SAE'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        发射功率: {iface['tx-power'] ? `${iface['tx-power']} dBm` : '默认'}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(iface)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-blue-400" />
                        <span>编辑配置</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Connected Clients */}
      {activeTab === 'clients' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                当前关联在线无线终端感知 (Registration Table)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">共 {clients.length} 台设备</span>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              当前暂无无线终端接入 Wi-Fi 网络。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/50 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">设备 / 主机名</th>
                    <th className="px-4 py-3">MAC / IP 地址</th>
                    <th className="px-4 py-3">接入 AP</th>
                    <th className="px-4 py-3">信号强度 (RSSI)</th>
                    <th className="px-4 py-3">协商速率 (Tx / Rx)</th>
                    <th className="px-4 py-3">在线时长</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {clients.map((client) => {
                    const signalMeta = getSignalMeta(client.signal);
                    const isApple =
                      client.hostname?.toLowerCase().includes('mac') ||
                      client.hostname?.toLowerCase().includes('iphone') ||
                      client.hostname?.toLowerCase().includes('ipad');

                    return (
                      <tr key={client['.id']} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 font-medium text-slate-100 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                            {isApple ? <Laptop className="w-4 h-4 text-blue-400" /> : <Smartphone className="w-4 h-4 text-indigo-400" />}
                          </div>
                          <div>
                            <span className="font-semibold block">{client.hostname || '无线移动终端'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{client.ssid || 'Wi-Fi 6'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-300">
                          <div>{client['mac-address']}</div>
                          {(client as any).ip && (
                            <span className="text-[11px] text-blue-400">{(client as any).ip}</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {client.interface}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${signalMeta.color}`}>
                              {client.signal} dBm
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${signalMeta.bg}/20 ${signalMeta.color}`}>
                              {signalMeta.label}
                            </span>
                          </div>
                          <div className="w-24 bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${signalMeta.bg}`}
                              style={{ width: `${Math.max(10, Math.min(100, (100 - Math.abs(Number(client.signal))) * 1.5))}%` }}
                            ></div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400">↑ {client['tx-rate'] || '--'}</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-blue-400">↓ {client['rx-rate'] || '--'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {client.uptime || '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: CAPsMAN Controller */}
      {activeTab === 'capsman' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  MikroTik CAPsMAN 集中无线漫游控制器
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controlled Access Point system Manager - 企业集中分发 SSID、WPA3 密钥与 802.11k/v/r 快速无缝漫游
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>控制器就绪</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block font-medium">CAPsMAN 运行状态</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {capsman?.enabled ? 'Active (运行中)' : 'Disabled'}
              </span>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block font-medium">受管远端 AP 节点</span>
              <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                {capsman?.radiosCount || 2} 台射频设备
              </span>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block font-medium">证书鉴权机制</span>
              <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">
                Auto CA (自动签发)
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>CAPsMAN 集中控制器说明</span>
            </p>
            <p>
              CAPsMAN 允许将此台 MikroTik 路由器作为核心集中控制器，统一管理多台 cAP、hAP 或 wAP 无线 AP。无论添加多少台分布式吸顶/面板 AP，客户端在各个 AP 之间走动均可享受统一的 SSID 与毫秒级无感知切换漫游。
            </p>
          </div>
        </div>
      )}

      {/* Quick Setup Modal */}
      {showQuickSetup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-blue-400">
                <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">Wi-Fi 极简快速配置向导</h3>
                  <span className="text-[11px] text-slate-400">一键同步修改 2.4G 与 5G 无线名称密码</span>
                </div>
              </div>
              <button
                onClick={() => setShowQuickSetup(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSetupSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  统一无线网络名称 (SSID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: Office-Corp-WiFi"
                  value={quickSsid}
                  onChange={(e) => setQuickSsid(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  无线连接密码 (WPA2 / WPA3-SAE)
                </label>
                <div className="relative">
                  <input
                    type={showQuickPwd ? 'text' : 'password'}
                    placeholder="不输入则保持原密码"
                    value={quickPassword}
                    onChange={(e) => setQuickPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPwd(!showQuickPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showQuickPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">建议 8 位以上英文字母+数字组合</p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickSetup(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingQuick}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingQuick ? '正在同步配置...' : '立即应用至所有射频'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Single Interface Modal */}
      {editingIface && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">
                  编辑射频接口: {editingIface.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingIface(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  无线网络名称 (SSID)
                </label>
                <input
                  type="text"
                  required
                  value={editSsid}
                  onChange={(e) => setEditSsid(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  更新密码 (留空则保持不变)
                </label>
                <input
                  type="password"
                  placeholder="留空保持原密码"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-750">
                <span className="text-xs text-slate-300">接口停用状态</span>
                <button
                  type="button"
                  onClick={() => setEditDisabled(!editDisabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    editDisabled ? 'bg-red-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      editDisabled ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingIface(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingEdit ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

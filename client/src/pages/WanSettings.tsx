import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosPppoeClient, RosDhcpClient, RosInterface } from '../types/index.js';
import { formatRosUptime, formatRosUptimeDetailed } from '../utils/format.js';
import {
  Globe,
  Plus,
  RefreshCw,
  Power,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Network,
  Radio,
  Server,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const WanSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pppoe' | 'dhcp'>('pppoe');
  const [pppoeClients, setPppoeClients] = useState<RosPppoeClient[]>([]);
  const [dhcpClients, setDhcpClients] = useState<RosDhcpClient[]>([]);
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [loading, setLoading] = useState(true);

  // Redial states
  const [redialingId, setRedialingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ id: string; msg: string } | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Add PPPoE Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('pppoe-out1');
  const [addInterface, setAddInterface] = useState('ether1-wan');
  const [addUser, setAddUser] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addDefaultRoute, setAddDefaultRoute] = useState(true);
  const [addPeerDns, setAddPeerDns] = useState(true);
  const [addComment, setAddComment] = useState('电信宽带拨号');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit PPPoE Modal state
  const [editingClient, setEditingClient] = useState<RosPppoeClient | null>(null);
  const [editUser, setEditUser] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editInterface, setEditInterface] = useState('');
  const [editDefaultRoute, setEditDefaultRoute] = useState(true);
  const [editPeerDns, setEditPeerDns] = useState(true);
  const [editComment, setEditComment] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pppoeList, dhcpList, ifaceList] = await Promise.all([
        rosApi.getPppoeClients(),
        rosApi.getDhcpClients().catch(() => []),
        rosApi.getInterfaces().catch(() => []),
      ]);
      setPppoeClients(pppoeList);
      setDhcpClients(dhcpList);
      setInterfaces(ifaceList);

      if (ifaceList.length > 0 && !addInterface) {
        const wan = ifaceList.find((i) => i.name.includes('wan') || i.name.includes('ether1'));
        setAddInterface(wan ? wan.name : ifaceList[0].name);
      }
    } catch (err) {
      console.error('Failed to load WAN settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedial = async (client: RosPppoeClient) => {
    try {
      setRedialingId(client['.id']);
      const res = await rosApi.reconnectPppoe(client['.id']);
      setActionSuccessMsg({ id: client['.id'], msg: '已触发重拨，正在重新协商获取 IP...' });
      setTimeout(() => setActionSuccessMsg(null), 5000);
      setTimeout(fetchData, 1500);
    } catch (err: any) {
      alert('重新拨号失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setRedialingId(null);
    }
  };

  const handleTogglePppoe = async (client: RosPppoeClient) => {
    const isCurrentlyDisabled = client.disabled === 'true' || client.disabled === true;
    try {
      await rosApi.togglePppoeClient(client['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePppoe = async (id: string, name: string) => {
    if (!confirm(`确定要移除 PPPoE 拨号连接 "${name}" 吗？`)) return;
    try {
      await rosApi.removePppoeClient(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (client: RosPppoeClient) => {
    setEditingClient(client);
    setEditUser(client.user || '');
    setEditPassword(client.password || '');
    setEditInterface(client.interface);
    setEditDefaultRoute(client['add-default-route'] === 'true' || client['add-default-route'] === true);
    setEditPeerDns(client['use-peer-dns'] === 'true' || client['use-peer-dns'] === true);
    setEditComment(client.comment || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      setSubmittingEdit(true);
      await rosApi.updatePppoeClient(editingClient['.id'], {
        user: editUser,
        password: editPassword,
        interface: editInterface,
        'add-default-route': editDefaultRoute ? 'true' : 'false',
        'use-peer-dns': editPeerDns ? 'true' : 'false',
        comment: editComment,
      });
      setEditingClient(null);
      await fetchData();
    } catch (err: any) {
      alert('保存修改失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleAddPppoeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addInterface || !addUser) return;
    try {
      setSubmittingAdd(true);
      await rosApi.addPppoeClient({
        name: addName,
        interface: addInterface,
        user: addUser,
        password: addPassword,
        addDefaultRoute,
        usePeerDns: addPeerDns,
        comment: addComment,
      });
      setShowAddModal(false);
      setAddUser('');
      setAddPassword('');
      await fetchData();
    } catch (err: any) {
      alert('创建拨号失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAdd(false);
    }
  };

  // DHCP Client handlers
  const handleToggleDhcp = async (client: RosDhcpClient) => {
    const isCurrentlyDisabled = client.disabled === 'true' || client.disabled === true;
    try {
      await rosApi.toggleDhcpClient(client['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRenewDhcp = async (id: string) => {
    try {
      await rosApi.renewDhcpClient(id);
      alert('已发送 DHCP 租约续订请求');
      await fetchData();
    } catch (err: any) {
      alert('续订失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReleaseDhcp = async (id: string) => {
    try {
      await rosApi.releaseDhcpClient(id);
      alert('已释放当前 DHCP 租约');
      await fetchData();
    } catch (err: any) {
      alert('释放失败: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <span>外网接入与宽带拨号 (WAN Settings)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            配置光纤 PPPoE 宽带账号密码、公网 IP 监控、一键重新拨号与 DHCP 动态接入
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

          {activeTab === 'pppoe' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建 PPPoE 宽带拨号</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('pppoe')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'pppoe'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>PPPoE 宽带拨号 ({pppoeClients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dhcp')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'dhcp'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>动态 IP 接入 (DHCP Client) ({dhcpClients.length})</span>
        </button>
      </div>

      {/* Tab 1: PPPoE Client */}
      {activeTab === 'pppoe' && (
        <div className="space-y-4">
          {pppoeClients.map((client) => {
            const isRunning = client.running === 'true' || client.running === true;
            const isDisabled = client.disabled === 'true' || client.disabled === true;
            const isRedialing = redialingId === client['.id'];
            const successNotice = actionSuccessMsg?.id === client['.id'] ? actionSuccessMsg.msg : null;
            const showPwd = showPasswordMap[client['.id']] || false;

            return (
              <div
                key={client['.id']}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Top Status & Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-100 font-mono">{client.name}</h3>
                        {isDisabled ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-500 border border-slate-700 font-medium">
                            已禁用 / 已断开
                          </span>
                        ) : isRunning ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            拨号已连通 (Connected)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span>
                            正在拨号协商中 (Dialing...)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        承载网卡: <span className="font-mono text-blue-400">{client.interface}</span>
                        {client.comment && <span className="ml-2 text-slate-500">({client.comment})</span>}
                      </p>
                    </div>
                  </div>

                  {/* Redial & Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRedial(client)}
                      disabled={isRedialing || isDisabled}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="强制断开并重新发起宽带拨号，通常可更换公网动态 IP"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRedialing ? 'animate-spin' : ''}`} />
                      <span>{isRedialing ? '正在重拨...' : '一键重新拨号'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(client)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>修改账密</span>
                    </button>

                    <button
                      onClick={() => handleTogglePppoe(client)}
                      className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                        isDisabled
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                      }`}
                      title={isDisabled ? '启用拨号' : '断开拨号'}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeletePppoe(client['.id'], client.name)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                      title="删除此连接"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {successNotice && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successNotice}</span>
                  </div>
                )}

                {/* Main Specs View */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
                  {/* Public IP Hero Card */}
                  <div className="md:col-span-2 bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                        当前获取的外网公网 IPv4 地址
                      </span>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 select-all flex items-center gap-2">
                        <span>{client['active-address'] || client.address || '未获取 / 等待拨通'}</span>
                      </div>
                      {client.gateway && (
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          远端网关: <span className="text-slate-300 font-semibold">{client.gateway}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span
                          className="cursor-help"
                          title={`详细在线时长: ${formatRosUptimeDetailed(client.uptime)}`}
                        >
                          在线时长: {formatRosUptime(client.uptime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span>MTU: {client['max-mtu'] || 1492}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account & Password */}
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">宽带上网账号 (Username)</span>
                      <span className="font-mono font-bold text-slate-200 select-all block mt-0.5">
                        {client.user}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">宽带密码 (Password)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">
                          {showPwd ? client.password || '******' : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordMap((prev) => ({
                              ...prev,
                              [client['.id']]: !showPwd,
                            }))
                          }
                          className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                        >
                          {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gateway & DNS Config */}
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <span className="text-[11px] text-slate-400 block">网络路由与解析策略</span>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">默认路由 (Default Route):</span>
                        <span
                          className={`font-semibold font-mono ${
                            client['add-default-route'] === 'true' || client['add-default-route'] === true
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {client['add-default-route'] === 'true' || client['add-default-route'] === true
                            ? '已启用'
                            : '未启用'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">使用运营商 DNS (Peer DNS):</span>
                        <span
                          className={`font-semibold font-mono ${
                            client['use-peer-dns'] === 'true' || client['use-peer-dns'] === true
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {client['use-peer-dns'] === 'true' || client['use-peer-dns'] === true
                            ? '已启用'
                            : '未启用'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {pppoeClients.length === 0 && !loading && (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-3">
              <p>暂无配置 PPPoE 宽带拨号客户端。</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>立即新建宽带拨号</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: DHCP Client */}
      {activeTab === 'dhcp' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-xs text-slate-200">
              WAN 动态 IP 接入列表 (DHCP Clients)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-medium">状态</th>
                  <th className="py-3.5 px-4 font-medium">绑定网口</th>
                  <th className="py-3.5 px-4 font-medium">获取的 IP / 掩码</th>
                  <th className="py-3.5 px-4 font-medium">网关 (Gateway)</th>
                  <th className="py-3.5 px-4 font-medium">主 DNS</th>
                  <th className="py-3.5 px-4 font-medium">默认路由</th>
                  <th className="py-3.5 px-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {dhcpClients.map((client) => {
                  const isDisabled = client.disabled === 'true' || client.disabled === true;
                  const isBound = client.status === 'bound';

                  return (
                    <tr key={client['.id']} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        {isDisabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            已禁用
                          </span>
                        ) : isBound ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            已获取 (Bound)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {client.status || 'Searching...'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {client.interface}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-100 font-semibold">
                        {client.address || '--'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        {client.gateway || '--'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {client['primary-dns'] || '--'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {client['add-default-route'] === 'true' || client['add-default-route'] === true
                          ? '是'
                          : '否'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRenewDhcp(client['.id'])}
                            className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] transition cursor-pointer"
                            title="重新向光猫或上级网络请求续订租约"
                          >
                            续租
                          </button>

                          <button
                            onClick={() => handleReleaseDhcp(client['.id'])}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                            title="释放当前获取的租约"
                          >
                            释放
                          </button>

                          <button
                            onClick={() => handleToggleDhcp(client)}
                            className={`p-1 rounded transition cursor-pointer ${
                              isDisabled
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                            }`}
                            title={isDisabled ? '启用' : '禁用'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {dhcpClients.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      暂无 WAN 口 DHCP 客户端
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add PPPoE Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">新建 PPPoE 宽带拨号连接</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPppoeSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  连接名称 (Interface Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="pppoe-out1"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  承载物理网口 (连接光猫千兆口)
                </label>
                <select
                  value={addInterface}
                  onChange={(e) => setAddInterface(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {interfaces
                    .filter((i) => i.type !== 'bridge' && i.type !== 'pppoe')
                    .map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name} ({i.type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  宽带账号 (Username)
                </label>
                <input
                  type="text"
                  required
                  placeholder="运营商提供的上网账号"
                  value={addUser}
                  onChange={(e) => setAddUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  宽带密码 (Password)
                </label>
                <input
                  type="password"
                  placeholder="运营商提供的上网密码"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addDefaultRoute}
                    onChange={(e) => setAddDefaultRoute(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-300">自动添加默认路由 (Add Default Route)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addPeerDns}
                    onChange={(e) => setAddPeerDns(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-300">使用运营商下发的 DNS (Use Peer DNS)</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  注释备注 (选填)
                </label>
                <input
                  type="text"
                  placeholder="例如: 电信千兆专线"
                  value={addComment}
                  onChange={(e) => setAddComment(e.target.value)}
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
                  disabled={submittingAdd}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingAdd ? '创建中...' : '立即拨号'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit PPPoE Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">
                  修改宽带账密 ({editingClient.name})
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  承载物理网口
                </label>
                <select
                  value={editInterface}
                  onChange={(e) => setEditInterface(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {interfaces
                    .filter((i) => i.type !== 'bridge' && i.type !== 'pppoe')
                    .map((i) => (
                      <option key={i['.id']} value={i.name}>
                        {i.name} ({i.type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  宽带上网账号 (Username)
                </label>
                <input
                  type="text"
                  required
                  value={editUser}
                  onChange={(e) => setEditUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  宽带上网密码 (Password)
                </label>
                <input
                  type="text"
                  placeholder="留空则保持原密码不变"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDefaultRoute}
                    onChange={(e) => setEditDefaultRoute(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-300">自动添加默认路由 (Add Default Route)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPeerDns}
                    onChange={(e) => setEditPeerDns(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-300">使用运营商下发的 DNS (Use Peer DNS)</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  注释备注
                </label>
                <input
                  type="text"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingEdit ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

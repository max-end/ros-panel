import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosDhcpLease, RosDhcpServer, RosDhcpNetwork, RosIpPool } from '../types/index.js';
import {
  Users,
  RefreshCw,
  BookmarkCheck,
  ShieldBan,
  Trash2,
  Search,
  Laptop,
  Zap,
  Check,
  Server,
  Network,
  Layers,
  Power,
  Plus,
  X,
} from 'lucide-react';

export const DHCPLeases: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leases' | 'servers' | 'networks' | 'pools'>('leases');
  const [leases, setLeases] = useState<RosDhcpLease[]>([]);
  const [servers, setServers] = useState<RosDhcpServer[]>([]);
  const [networks, setNetworks] = useState<RosDhcpNetwork[]>([]);
  const [pools, setPools] = useState<RosIpPool[]>([]);
  const [loading, setLoading] = useState(true);

  // Leases tab states
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [wakeSuccessId, setWakeSuccessId] = useState<string | null>(null);

  // Add Network Modal
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [netAddress, setNetAddress] = useState('');
  const [netGateway, setNetGateway] = useState('');
  const [netDns, setNetDns] = useState('');
  const [netComment, setNetComment] = useState('');
  const [submittingNet, setSubmittingNet] = useState(false);

  // Add Pool Modal
  const [showAddPool, setShowAddPool] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [poolRanges, setPoolRanges] = useState('');
  const [poolComment, setPoolComment] = useState('');
  const [submittingPool, setSubmittingPool] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leasesData, serversData, networksData, poolsData] = await Promise.all([
        rosApi.getDhcpLeases().catch(() => []),
        rosApi.getDhcpServers().catch(() => []),
        rosApi.getDhcpNetworks().catch(() => []),
        rosApi.getIpPools().catch(() => []),
      ]);
      setLeases(leasesData);
      setServers(serversData);
      setNetworks(networksData);
      setPools(poolsData);
    } catch (err) {
      console.error('Failed to fetch DHCP data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMakeStatic = async (lease: RosDhcpLease) => {
    try {
      setBusyId(lease['.id']);
      await rosApi.makeDhcpLeaseStatic(lease['.id']);
      await fetchData();
    } catch (err: any) {
      alert('静态化失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleWake = async (lease: RosDhcpLease) => {
    try {
      setBusyId(lease['.id']);
      await rosApi.wakeOnLan(lease['mac-address']);
      setWakeSuccessId(lease['.id']);
      setTimeout(() => setWakeSuccessId(null), 3000);
    } catch (err: any) {
      alert('唤醒失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleLease = async (lease: RosDhcpLease) => {
    const isCurrentlyDisabled = lease.disabled === 'true' || lease.disabled === true;
    try {
      setBusyId(lease['.id']);
      await rosApi.toggleDhcpLease(lease['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteLease = async (id: string, ip: string) => {
    if (!confirm(`确定要移除 ${ip} 的租约吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeDhcpLease(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  // Server toggle
  const handleToggleServer = async (server: RosDhcpServer) => {
    const isCurrentlyDisabled = server.disabled === 'true' || server.disabled === true;
    try {
      setBusyId(server['.id']);
      await rosApi.toggleDhcpServer(server['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  // Network add & delete
  const handleAddNetworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netAddress) return;
    try {
      setSubmittingNet(true);
      await rosApi.addDhcpNetwork({
        address: netAddress,
        gateway: netGateway || undefined,
        dnsServer: netDns || undefined,
        comment: netComment || undefined,
      });
      setShowAddNetwork(false);
      setNetAddress('');
      setNetGateway('');
      setNetDns('');
      setNetComment('');
      await fetchData();
    } catch (err: any) {
      alert('添加网络参数失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingNet(false);
    }
  };

  const handleDeleteNetwork = async (id: string, address: string) => {
    if (!confirm(`确定要移除网段配置 ${address} 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeDhcpNetwork(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  // Pool add & delete
  const handleAddPoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName || !poolRanges) return;
    try {
      setSubmittingPool(true);
      await rosApi.addIpPool({
        name: poolName,
        ranges: poolRanges,
        comment: poolComment || undefined,
      });
      setShowAddPool(false);
      setPoolName('');
      setPoolRanges('');
      setPoolComment('');
      await fetchData();
    } catch (err: any) {
      alert('添加地址池失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingPool(false);
    }
  };

  const handleDeletePool = async (id: string, name: string) => {
    if (!confirm(`确定要移除地址池 ${name} 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeIpPool(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const filteredLeases = leases.filter((l) => {
    const q = search.toLowerCase();
    const hostname = (l['host-name'] || '').toLowerCase();
    const ip = l.address.toLowerCase();
    const mac = l['mac-address'].toLowerCase();
    return hostname.includes(q) || ip.includes(q) || mac.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>DHCP 综合管理中心 (DHCP Center)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            局域网客户端租约监控、DHCP 服务端参数、下发网关与 IP 地址池配置
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('leases')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'leases'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>客户端租约 ({leases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'servers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>DHCP 服务端 ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('networks')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'networks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>下发网络参数 ({networks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'pools'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>IP 地址池 ({pools.length})</span>
        </button>
      </div>

      {/* Tab 1: Leases */}
      {activeTab === 'leases' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索主机名、IP、MAC 地址..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              共 <strong className="text-slate-200 font-mono">{filteredLeases.length}</strong> 台已分配客户端
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">设备主机名</th>
                    <th className="py-3.5 px-4 font-medium">IP 地址</th>
                    <th className="py-3.5 px-4 font-medium">MAC 物理地址</th>
                    <th className="py-3.5 px-4 font-medium">类型</th>
                    <th className="py-3.5 px-4 font-medium">租约剩余</th>
                    <th className="py-3.5 px-4 font-medium">状态</th>
                    <th className="py-3.5 px-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredLeases.map((lease) => {
                    const isDynamic = lease.dynamic === 'true' || lease.dynamic === true;
                    const isDisabled = lease.disabled === 'true' || lease.disabled === true;
                    const isBound = lease.status === 'bound';
                    const isBusy = busyId === lease['.id'];

                    return (
                      <tr key={lease['.id']} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                              <Laptop className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-slate-200">
                              {lease['host-name'] || '未知设备'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-100">
                          {lease.address}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-400 select-all">
                          {lease['mac-address']}
                        </td>

                        <td className="py-3 px-4">
                          {isDynamic ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                              动态分配
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                              静态绑定
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-400">
                          {lease['expires-after'] || '永久有效'}
                        </td>

                        <td className="py-3 px-4">
                          {isDisabled ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                              已阻断/禁用
                            </span>
                          ) : isBound ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              正常连接 (Bound)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {lease.status || '等待连接'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleWake(lease)}
                              disabled={isBusy}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] transition cursor-pointer border ${
                                wakeSuccessId === lease['.id']
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-medium'
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                              }`}
                              title="向该设备发送网络唤醒魔术包 (Wake-on-LAN)"
                            >
                              {wakeSuccessId === lease['.id'] ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>已唤醒</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>唤醒</span>
                                </>
                              )}
                            </button>

                            {isDynamic && (
                              <button
                                onClick={() => handleMakeStatic(lease)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] transition cursor-pointer"
                                title="固定为此设备的静态 IP"
                              >
                                <BookmarkCheck className="w-3 h-3" />
                                <span>固定 IP</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleLease(lease)}
                              disabled={isBusy}
                              className={`p-1 rounded transition cursor-pointer ${
                                isDisabled
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-amber-400 hover:bg-amber-500/10'
                              }`}
                              title={isDisabled ? '解禁该设备' : '禁用/阻断该设备'}
                            >
                              <ShieldBan className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteLease(lease['.id'], lease.address)}
                              disabled={isBusy}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                              title="移除租约"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeases.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                        未找到匹配的 DHCP 客户端
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Servers */}
      {activeTab === 'servers' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-medium">服务端名称</th>
                  <th className="py-3.5 px-4 font-medium">监听接口</th>
                  <th className="py-3.5 px-4 font-medium">默认租约时长 (Lease Time)</th>
                  <th className="py-3.5 px-4 font-medium">绑定地址池 (Address Pool)</th>
                  <th className="py-3.5 px-4 font-medium">状态</th>
                  <th className="py-3.5 px-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {servers.map((server) => {
                  const isDisabled = server.disabled === 'true' || server.disabled === true;
                  const isBusy = busyId === server['.id'];

                  return (
                    <tr key={server['.id']} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {server.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-400">
                        {server.interface}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {server['lease-time'] || '10m'}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {server['address-pool'] || '无'}
                      </td>
                      <td className="py-3 px-4">
                        {isDisabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            已禁用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            运行中 (Running)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleServer(server)}
                          disabled={isBusy}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDisabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                          title={isDisabled ? '启用服务' : '禁用服务'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Networks */}
      {activeTab === 'networks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              配置分配给客户机的 IP 网关、DNS、子网掩码等全局网络参数
            </p>
            <button
              onClick={() => setShowAddNetwork(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加网络参数</span>
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">网段 (Address / CIDR)</th>
                    <th className="py-3.5 px-4 font-medium">下发网关 (Gateway)</th>
                    <th className="py-3.5 px-4 font-medium">下发 DNS 服务器</th>
                    <th className="py-3.5 px-4 font-medium">备注说明</th>
                    <th className="py-3.5 px-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {networks.map((net) => (
                    <tr key={net['.id']} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {net.address}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-400 font-semibold">
                        {net.gateway || '--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {net['dns-server'] || '--'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {net.comment || '--'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteNetwork(net['.id'], net.address)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Pools */}
      {activeTab === 'pools' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              定义用于 DHCP 或 VPN 动态分配的连续 IP 地址段 (IP Pools)
            </p>
            <button
              onClick={() => setShowAddPool(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建地址池</span>
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">地址池名称 (Pool Name)</th>
                    <th className="py-3.5 px-4 font-medium">分配 IP 范围 (Ranges)</th>
                    <th className="py-3.5 px-4 font-medium">备注说明</th>
                    <th className="py-3.5 px-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {pools.map((pool) => (
                    <tr key={pool['.id']} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {pool.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                        {pool.ranges}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {pool.comment || '--'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeletePool(pool['.id'], pool.name)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Network Modal */}
      {showAddNetwork && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">添加 DHCP 网络下发配置</h3>
              </div>
              <button
                onClick={() => setShowAddNetwork(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNetworkSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  子网网络地址 (Address / Mask)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 192.168.88.0/24"
                  value={netAddress}
                  onChange={(e) => setNetAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  网关 IP (Gateway)
                </label>
                <input
                  type="text"
                  placeholder="例如: 192.168.88.1"
                  value={netGateway}
                  onChange={(e) => setNetGateway(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  DNS 服务器 (逗号分隔)
                </label>
                <input
                  type="text"
                  placeholder="例如: 192.168.88.1, 223.5.5.5"
                  value={netDns}
                  onChange={(e) => setNetDns(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  备注说明 (选填)
                </label>
                <input
                  type="text"
                  placeholder="例如: 办公室主网络"
                  value={netComment}
                  onChange={(e) => setNetComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddNetwork(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingNet}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingNet ? '保存中...' : '保存网络参数'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pool Modal */}
      {showAddPool && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">新建 IP 地址池 (IP Pool)</h3>
              </div>
              <button
                onClick={() => setShowAddPool(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPoolSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  地址池名称 (Pool Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: office-pool"
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  分配范围 (Ranges, 如 192.168.88.10-192.168.88.250)
                </label>
                <input
                  type="text"
                  required
                  placeholder="192.168.88.10-192.168.88.250"
                  value={poolRanges}
                  onChange={(e) => setPoolRanges(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  备注说明 (选填)
                </label>
                <input
                  type="text"
                  placeholder="地址池用途说明"
                  value={poolComment}
                  onChange={(e) => setPoolComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPool(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingPool}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingPool ? '保存中...' : '创建地址池'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

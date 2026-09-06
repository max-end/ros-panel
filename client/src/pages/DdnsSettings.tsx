import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosCloud, CustomDdnsItem } from '../types/index.js';
import {
  Globe2,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Power,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  Server,
  Layers,
} from 'lucide-react';

export const DdnsSettings: React.FC = () => {
  const [cloud, setCloud] = useState<RosCloud | null>(null);
  const [customList, setCustomList] = useState<CustomDdnsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceUpdating, setForceUpdating] = useState(false);
  const [togglingCloud, setTogglingCloud] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Add Custom DDNS modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [provider, setProvider] = useState<'cloudflare' | 'aliyun' | 'dnspod' | 'duckdns' | 'webhook'>('cloudflare');
  const [domain, setDomain] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [checkInterval, setCheckInterval] = useState('5m');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cloudData, customData] = await Promise.all([
        rosApi.getCloud().catch(() => null),
        rosApi.getCustomDdns().catch(() => []),
      ]);
      setCloud(cloudData);
      setCustomList(customData);
    } catch (err) {
      console.error('Failed to load DDNS data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleCloudDdns = async () => {
    if (!cloud) return;
    const isCurrentlyEnabled = cloud['ddns-enabled'] === 'true' || cloud['ddns-enabled'] === true;
    try {
      setTogglingCloud(true);
      await rosApi.updateCloud({ ddnsEnabled: !isCurrentlyEnabled });
      await fetchData();
    } catch (err: any) {
      alert('切换 Cloud DDNS 失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingCloud(false);
    }
  };

  const handleToggleUpdateTime = async () => {
    if (!cloud) return;
    const isCurrentlyUpdatingTime = cloud['update-time'] === 'true' || cloud['update-time'] === true;
    try {
      setTogglingCloud(true);
      await rosApi.updateCloud({ updateTime: !isCurrentlyUpdatingTime });
      await fetchData();
    } catch (err: any) {
      alert('切换时间同步设置失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingCloud(false);
    }
  };

  const handleForceUpdate = async () => {
    try {
      setForceUpdating(true);
      await rosApi.forceUpdateCloud();
      await fetchData();
      alert('已下发强制更新指令，MikroTik Cloud 解析记录已刷新！');
    } catch (err: any) {
      alert('强制刷新失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setForceUpdating(false);
    }
  };

  const handleCopyDomain = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleSyncCustom = async (id: string) => {
    try {
      setSyncingId(id);
      const res = await rosApi.syncCustomDdns(id);
      alert(res.message);
      await fetchData();
    } catch (err: any) {
      alert('同步失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    if (!confirm(`确定要移除 DDNS 任务 "${name}" 吗？`)) return;
    try {
      await rosApi.removeCustomDdns(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !domain) return;
    try {
      setSubmittingAdd(true);
      await rosApi.addCustomDdns({
        name: taskName,
        provider,
        domain,
        zoneId: zoneId || undefined,
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        webhookUrl: webhookUrl || undefined,
        checkInterval,
      });
      setShowAddModal(false);
      setTaskName('');
      setDomain('');
      setZoneId('');
      setApiKey('');
      setApiSecret('');
      setWebhookUrl('');
      await fetchData();
    } catch (err: any) {
      alert('添加 DDNS 任务失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAdd(false);
    }
  };

  const isCloudEnabled = cloud ? (cloud['ddns-enabled'] === 'true' || cloud['ddns-enabled'] === true) : false;
  const isUpdateTime = cloud ? (cloud['update-time'] === 'true' || cloud['update-time'] === true) : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-blue-400" />
            <span>动态域名解析 (DDNS / Dynamic DNS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            配置 MikroTik 官方免费 Cloud 域名与 Cloudflare、阿里云、DNSPod 多服务商公网动态解析
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新状态</span>
        </button>
      </div>

      {/* Official MikroTik Cloud DDNS Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/40 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">MikroTik 官方原厂 Cloud DDNS</h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  零配置 · 永久免费
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                基于 MikroTik 官方云端节点，根据路由器序列号直接生成专属公网访问域名
              </p>
            </div>
          </div>

          {/* Cloud Switch & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleToggleCloudDdns}
              disabled={togglingCloud}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                isCloudEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isCloudEnabled ? '服务已启用 (Enabled)' : '服务已关闭 (Disabled)'}</span>
            </button>

            <button
              onClick={handleForceUpdate}
              disabled={forceUpdating || !isCloudEnabled}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${forceUpdating ? 'animate-spin' : ''}`} />
              <span>{forceUpdating ? '刷新中...' : '强制立即更新'}</span>
            </button>
          </div>
        </div>

        {/* Cloud Info Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Domain name */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block mb-1">专属云解析域名 (DNS Name)</span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="font-mono font-bold text-xs text-blue-400 truncate select-all">
                {cloud?.['dns-name'] || '未获取或未启用'}
              </span>
              {cloud?.['dns-name'] && (
                <button
                  onClick={() => handleCopyDomain(cloud['dns-name']!)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
                  title="复制完整域名"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Detected Public IPv4 */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block mb-1">云端探测公网 IPv4</span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="font-mono font-bold text-xs text-emerald-400 select-all">
                {cloud?.['public-address'] || '--'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {cloud?.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Detected Public IPv6 & Sync status */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block mb-1">探测公网 IPv6 / 状态</span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="font-mono text-xs text-slate-300 truncate select-all">
                {cloud?.['public-address-ipv6'] || '未检测到 IPv6'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional settings */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isUpdateTime}
                onChange={handleToggleUpdateTime}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>通过 MikroTik Cloud 自动同步路由器网络时间 (Update Time)</span>
            </label>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>自动监测周期: 默认 1 分钟检测一次公网 IP 变动</span>
          </div>
        </div>
      </div>

      {/* Third-Party Custom DDNS Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>第三方主流服务商动态域名 (Cloudflare / 阿里云 / DNSPod / DuckDNS)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              将自己的顶级个人域名绑定到家庭/办公宽带公网 IP，IP 变化时自动推送更新
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建 DDNS 任务</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customList.map((item) => {
            const isSyncing = syncingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{item.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {item.provider}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-semibold text-blue-400 mt-1 select-all">
                        {item.domain}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCustom(item.id, item.name)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition cursor-pointer"
                      title="删除任务"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">最新解析 IP</span>
                      <span className="font-mono font-bold text-slate-200 select-all">
                        {item.lastIp || '未同步'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">检测周期</span>
                      <span className="font-mono text-slate-400">{item.checkInterval || '5m'}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-500">上次同步时间</span>
                      <span className="font-mono text-slate-400">{item.lastSyncTime || '--'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] text-emerald-400 font-medium">运行正常</span>
                  </div>

                  <button
                    onClick={() => handleSyncCustom(item.id)}
                    disabled={isSyncing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
                    <span>{isSyncing ? '同步中...' : '测试并同步'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {customList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800/60 rounded-2xl">
              暂未添加第三方 DDNS 任务。点击右上角“新建 DDNS 任务”即可配置 Cloudflare 或阿里云域名动态解析。
            </div>
          )}
        </div>
      </div>

      {/* Add Custom DDNS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">新建第三方 DDNS 任务</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">任务备注名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 家庭 NAS Cloudflare DDNS"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">DNS 服务商</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="cloudflare">Cloudflare (推荐 · 免费 API)</option>
                  <option value="aliyun">阿里云 DNS (Aliyun)</option>
                  <option value="dnspod">腾讯云 DNSPod</option>
                  <option value="duckdns">DuckDNS</option>
                  <option value="webhook">自定义 Webhook 推送</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">需要动态解析的域名</label>
                <input
                  type="text"
                  required
                  placeholder="例如: nas.example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {provider === 'cloudflare' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Cloudflare Zone ID</label>
                    <input
                      type="text"
                      placeholder="在 Cloudflare 域名概述页面右侧获取"
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">API Token (拥有 DNS 编辑权限)</label>
                    <input
                      type="password"
                      placeholder="Cloudflare API Token"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {provider === 'aliyun' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">AccessKey ID</label>
                    <input
                      type="text"
                      placeholder="LTAI..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">AccessKey Secret</label>
                    <input
                      type="password"
                      placeholder="阿里云密钥 Secret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {provider === 'webhook' && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Webhook URL</label>
                  <input
                    type="url"
                    placeholder="https://api.example.com/ddns?ip="
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">更新检测间隔</label>
                <select
                  value={checkInterval}
                  onChange={(e) => setCheckInterval(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="1m">每 1 分钟检测一次</option>
                  <option value="5m">每 5 分钟检测一次 (推荐)</option>
                  <option value="10m">每 10 分钟检测一次</option>
                  <option value="30m">每 30 分钟检测一次</option>
                </select>
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
                  {submittingAdd ? '保存中...' : '保存并生效'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

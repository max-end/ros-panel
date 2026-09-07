import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosDnsConfig, RosDnsStatic } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import {
  Binary,
  Plus,
  RefreshCw,
  Trash2,
  Power,
  Search,
  CheckCircle2,
  X,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DnsSettings: React.FC = () => {
  const { t } = useI18n();
  const [config, setConfig] = useState<RosDnsConfig | null>(null);
  const [staticList, setStaticList] = useState<RosDnsStatic[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState(false);

  // Global form states
  const [servers, setServers] = useState('');
  const [allowRemote, setAllowRemote] = useState(true);
  const [cacheSize, setCacheSize] = useState(2048);

  // Static DNS states
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTtl, setNewTtl] = useState('1d');
  const [newComment, setNewComment] = useState('');
  const [submittingStatic, setSubmittingStatic] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dnsConf, statics] = await Promise.all([
        rosApi.getDnsConfig(),
        rosApi.getDnsStatic(),
      ]);
      setConfig(dnsConf);
      setServers(dnsConf.servers || '');
      setAllowRemote(dnsConf['allow-remote-requests'] === 'true' || dnsConf['allow-remote-requests'] === true);
      setCacheSize(Number(dnsConf['cache-size'] || 2048));
      setStaticList(statics);
    } catch (err) {
      console.error('Failed to load DNS data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGlobal(true);
      await rosApi.updateDnsConfig({
        servers,
        allowRemoteRequests: allowRemote,
        cacheSize,
      });
      setGlobalSuccess(true);
      setTimeout(() => setGlobalSuccess(false), 3000);
      await fetchData();
    } catch (err: any) {
      alert('保存 DNS 配置失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleFlushCache = async () => {
    try {
      await rosApi.flushDnsCache();
      alert('已成功清空 RouterOS DNS 缓存');
      await fetchData();
    } catch (err: any) {
      alert('清空缓存失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatic = async (item: RosDnsStatic) => {
    const isCurrentlyDisabled = item.disabled === 'true' || item.disabled === true;
    try {
      setBusyId(item['.id']);
      await rosApi.toggleDnsStatic(item['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteStatic = async (id: string, name: string) => {
    if (!confirm(`确定要删除静态解析域名 "${name}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeDnsStatic(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddStaticSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAddress) return;
    try {
      setSubmittingStatic(true);
      await rosApi.addDnsStatic({
        name: newName,
        address: newAddress,
        ttl: newTtl || undefined,
        comment: newComment || undefined,
      });
      setShowAddModal(false);
      setNewName('');
      setNewAddress('');
      setNewComment('');
      await fetchData();
    } catch (err: any) {
      alert('添加静态记录失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingStatic(false);
    }
  };

  const filtered = staticList.filter((s) => {
    const query = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.address.toLowerCase().includes(query) ||
      (s.comment && s.comment.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span>{t('dns.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('dns.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Global DNS Settings Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
              {t('dns.servers')}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleFlushCache}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            {t('dns.flushCache')}
          </button>
        </div>

        {globalSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('dns.saved', '全局 DNS 配置已成功保存！')}</span>
          </div>
        )}

        <form onSubmit={handleSaveGlobal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t('dns.upstreamServers', '上游公共 DNS 服务器 (逗号分隔)')}
              </label>
              <input
                type="text"
                placeholder="223.5.5.5, 119.29.29.29, 8.8.8.8"
                value={servers}
                onChange={(e) => setServers(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setServers('223.5.5.5,223.6.6.6')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Aliyun DNS
                </button>
                <button
                  type="button"
                  onClick={() => setServers('119.29.29.29,182.254.116.116')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Tencent DNSPod
                </button>
                <button
                  type="button"
                  onClick={() => setServers('8.8.8.8,1.1.1.1')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Google/Cloudflare
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('dns.cacheSize', '缓存大小限制 (KB)')}
                </label>
                <input
                  type="number"
                  value={cacheSize}
                  onChange={(e) => setCacheSize(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={allowRemote}
                  onChange={(e) => setAllowRemote(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs text-slate-200 font-medium block">
                    {t('dns.allowRemote')}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Allow LAN clients to query DNS through router
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono">
              <span>Dynamic DNS: {config?.['dynamic-servers'] || 'none'}</span>
              <span className="ml-4">{t('dns.cacheSize')}: {config?.['cache-used'] || 0} KB</span>
            </div>

            <button
              type="submit"
              disabled={savingGlobal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              {savingGlobal ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>

      {/* Static DNS Records Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
              {t('dns.staticRecords')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Custom static mappings (e.g. nas.lan -&gt; 192.168.88.200)
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <input
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('dns.addStatic')}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">{t('ddns.domain')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.address')}</th>
                <th className="py-3.5 px-4 font-medium">TTL</th>
                <th className="py-3.5 px-4 font-medium">{t('common.comment')}</th>
                <th className="py-3.5 px-4 font-medium text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => {
                const isDisabled = item.disabled === 'true' || item.disabled === true;
                const isBusy = busyId === item['.id'];

                return (
                  <tr key={item['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {item.name}
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      {item.address}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {item.ttl || '1d'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">
                      {item.comment || '--'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatic(item)}
                          disabled={isBusy}
                          className={`p-1 rounded transition cursor-pointer ${
                            isDisabled
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                          }`}
                          title={isDisabled ? t('common.enabled') : t('common.disabled')}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteStatic(item['.id'], item.name)}
                          disabled={isBusy}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Static DNS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">{t('dns.addStatic', '添加静态 DNS 解析')}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaticSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('ddns.domain')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nas.lan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('common.address')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.88.200"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  TTL
                </label>
                <input
                  type="text"
                  placeholder="1d"
                  value={newTtl}
                  onChange={(e) => setNewTtl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('common.comment')}
                </label>
                <input
                  type="text"
                  placeholder="Comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingStatic}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingStatic ? t('common.creating') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

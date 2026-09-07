import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosRoute, RosInterface } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import {
  Route as RouteIcon,
  Plus,
  RefreshCw,
  Trash2,
  Power,
  Search,
  CheckCircle2,
  X,
  HelpCircle,
  Layers,
} from 'lucide-react';

export const Routes: React.FC = () => {
  const { t } = useI18n();
  const [routes, setRoutes] = useState<RosRoute[]>([]);
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add Route Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [dstAddress, setDstAddress] = useState('');
  const [gateway, setGateway] = useState('');
  const [distance, setDistance] = useState(1);
  const [comment, setComment] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const [routeList, ifaceList] = await Promise.all([
        rosApi.getRoutes(),
        rosApi.getInterfaces().catch(() => []),
      ]);
      setRoutes(routeList);
      setInterfaces(ifaceList);
    } catch (err) {
      console.error('Failed to load routes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleToggle = async (route: RosRoute) => {
    const isCurrentlyDisabled = route.disabled === 'true' || route.disabled === true;
    try {
      setBusyId(route['.id']);
      await rosApi.toggleRoute(route['.id'], !isCurrentlyDisabled);
      await fetchRoutes();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, dst: string) => {
    if (!confirm(`确定要删除目标为 ${dst} 的路由记录吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeRoute(id);
      await fetchRoutes();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dstAddress || !gateway) return;
    try {
      setSubmittingAdd(true);
      await rosApi.addRoute({
        dstAddress,
        gateway,
        distance,
        comment: comment || undefined,
      });
      setShowAddModal(false);
      setDstAddress('');
      setGateway('');
      setComment('');
      await fetchRoutes();
    } catch (err: any) {
      alert('添加静态路由失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAdd(false);
    }
  };

  const filtered = routes.filter((r) => {
    const query = search.toLowerCase();
    return (
      r['dst-address'].toLowerCase().includes(query) ||
      r.gateway.toLowerCase().includes(query) ||
      (r.comment && r.comment.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-400" />
            <span>{t('routes.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('routes.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoutes}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('routes.addRoute')}</span>
          </button>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">A</span>
            <span>Active</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">S</span>
            <span>Static</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">D</span>
            <span>Dynamic</span>
          </span>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">{t('common.status')}</th>
                <th className="py-3.5 px-4 font-medium">{t('routes.dstAddress')}</th>
                <th className="py-3.5 px-4 font-medium">{t('routes.nextHop')}</th>
                <th className="py-3.5 px-4 font-medium">{t('routes.distance')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.type')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.comment')}</th>
                <th className="py-3.5 px-4 font-medium text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((route) => {
                const isActive = route.active === 'true' || route.active === true;
                const isDynamic = route.dynamic === 'true' || route.dynamic === true;
                const isStatic = route.static === 'true' || route.static === true;
                const isConnect = route.connect === 'true' || route.connect === true;
                const isDisabled = route.disabled === 'true' || route.disabled === true;
                const isBusy = busyId === route['.id'];

                return (
                  <tr key={route['.id']} className="hover:bg-slate-800/40 transition-colors">
                    {/* Flags */}
                    <td className="py-3 px-4 font-mono font-bold">
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title={t('routes.active', 'Active')}>
                            A
                          </span>
                        )}
                        {isStatic && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20" title={t('routes.static', 'Static')}>
                            S
                          </span>
                        )}
                        {isDynamic && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20" title={t('routes.dynamic', 'Dynamic')}>
                            D
                          </span>
                        )}
                        {isConnect && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20" title={t('routes.connect', 'Connect')}>
                            C
                          </span>
                        )}
                        {isDisabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500 border border-slate-700" title={t('common.disabled', 'Disabled')}>
                            X
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {route['dst-address']}
                    </td>

                    <td className="py-3 px-4 font-mono text-blue-400 font-medium">
                      {route.gateway}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {route.distance}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {route['routing-table'] || 'main'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">
                      {route.comment || '--'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isDynamic && (
                          <>
                            <button
                              onClick={() => handleToggle(route)}
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
                              onClick={() => handleDelete(route['.id'], route['dst-address'])}
                              disabled={isBusy}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">{t('routes.addRoute', '新建静态路由')}</h3>
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
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('routes.dstAddress', '目标网络子网 (Dst. Address)')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10.0.0.0/8 or 0.0.0.0/0"
                  value={dstAddress}
                  onChange={(e) => setDstAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('routes.gateway', '下一跳网关 IP 或 承载接口 (Gateway)')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.88.254 or ether1-wan"
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {interfaces.slice(0, 5).map((i) => (
                    <button
                      key={i['.id']}
                      type="button"
                      onClick={() => setGateway(i.name)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      {i.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('routes.distance', '路由跃点距离 (Distance)')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="255"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
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
                  disabled={submittingAdd}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingAdd ? t('common.creating') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

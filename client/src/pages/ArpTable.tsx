import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosArp } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import { GitFork, RefreshCw, BookmarkCheck, Search } from 'lucide-react';

export const ArpTable: React.FC = () => {
  const { t } = useI18n();
  const [arpList, setArpList] = useState<RosArp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchArp = async () => {
    try {
      setLoading(true);
      const data = await rosApi.getArpTable();
      setArpList(data);
    } catch (err) {
      console.error('Failed to fetch ARP table', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArp();
  }, []);

  const handleMakeStatic = async (arp: RosArp) => {
    try {
      setBusyId(arp['.id']);
      await rosApi.makeArpStatic(arp['.id']);
      await fetchArp();
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = arpList.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.address || '').toLowerCase().includes(q) ||
      (a['mac-address'] || '').toLowerCase().includes(q) ||
      (a.interface || '').toLowerCase().includes(q) ||
      (a.comment || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-400" />
            <span>{t('arp.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('arp.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>

          <button
            onClick={fetchArp}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">{t('common.ipAddress', 'IP 地址')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.macAddress', 'MAC 地址')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.interface', '接口')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.type', '类型')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.comment', '注释')}</th>
                <th className="py-3.5 px-4 font-medium text-right">{t('common.actions', '操作')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => {
                const isDynamic = item.dynamic === 'true' || item.dynamic === true;
                const isBusy = busyId === item['.id'];

                return (
                  <tr key={item['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{item.address}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{item['mac-address']}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700/60 font-mono text-[11px]">
                        {item.interface}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isDynamic ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t('common.dynamic', '动态')} (D)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                          {t('common.static', '静态')} (S)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{item.comment || '--'}</td>
                    <td className="py-3 px-4 text-right">
                      {isDynamic && (
                        <button
                          onClick={() => handleMakeStatic(item)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] transition cursor-pointer"
                        >
                          <BookmarkCheck className="w-3 h-3" />
                          <span>{t('arp.makeStatic', '转为静态')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    {t('common.noData')}
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

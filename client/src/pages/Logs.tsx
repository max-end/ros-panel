import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosLog } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import { FileText, RefreshCw, Search, Filter } from 'lucide-react';

export const Logs: React.FC = () => {
  const { t } = useI18n();
  const [logs, setLogs] = useState<RosLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await rosApi.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      (l.message || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.topics || '').toLowerCase().includes(search.toLowerCase());

    const matchesTopic =
      selectedTopic === 'all' || (l.topics || '').toLowerCase().includes(selectedTopic.toLowerCase());

    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>{t('logs.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('logs.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">{t('logs.allTopics')}</option>
              <option value="error">error</option>
              <option value="warning">warning</option>
              <option value="info">info</option>
              <option value="dhcp">DHCP</option>
              <option value="firewall">Firewall</option>
              <option value="wireguard">WireGuard</option>
              <option value="account">Account</option>
            </select>
          </div>

          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Logs Terminal View */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{t('logs.totalEntries')}: {filtered.length}</span>
          <span className="text-[10px] text-slate-500">{t('logs.chronological')}</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto p-2">
          {filtered.map((log) => {
            const isError = log.topics.includes('error') || log.topics.includes('critical');
            const isWarning = log.topics.includes('warning');

            return (
              <div
                key={log['.id']}
                className="py-2 px-3 hover:bg-slate-800/40 rounded flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 transition-colors"
              >
                <span className="text-slate-500 shrink-0 text-[11px]">{log.time}</span>

                <div className="flex flex-wrap gap-1 shrink-0">
                  {log.topics.split(',').map((t, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        t === 'error' || t === 'critical'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : t === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {t.trim()}
                    </span>
                  ))}
                </div>

                <span
                  className={`flex-1 break-all ${
                    isError
                      ? 'text-red-300 font-semibold'
                      : isWarning
                      ? 'text-amber-300'
                      : 'text-slate-200'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center text-slate-500 text-xs font-sans">
              {t('common.noData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

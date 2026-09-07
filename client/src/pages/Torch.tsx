import React, { useEffect, useState, useRef } from 'react';
import { rosApi } from '../api/client.js';
import { RosTorchFlow, RosInterface } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import {
  Activity,
  Play,
  Square,
  RefreshCw,
  Network,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  Zap,
} from 'lucide-react';

function formatBps(bps: number): string {
  if (!bps || bps <= 0) return '0 bps';
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
  return `${bps} bps`;
}

export const Torch: React.FC = () => {
  const { t } = useI18n();
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('ether1-wan');
  const [flows, setFlows] = useState<RosTorchFlow[]>([]);
  const [sniffing, setSniffing] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [protocolFilter, setProtocolFilter] = useState<string>('any');
  const [srcFilter, setSrcFilter] = useState<string>('');
  const [dstFilter, setDstFilter] = useState<string>('');
  const [portFilter, setPortFilter] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Load interfaces on mount
  useEffect(() => {
    rosApi.getInterfaces().then((list) => {
      setInterfaces(list);
      const wan = list.find((i) => i.name.includes('wan') && i.running);
      if (wan) {
        setSelectedInterface(wan.name);
      } else if (list.length > 0) {
        setSelectedInterface(list[0].name);
      }
    }).catch((err) => console.error('Failed to load interfaces', err));
  }, []);

  const sampleOnce = async () => {
    if (!selectedInterface) return;
    try {
      setLoading(true);
      const data = await rosApi.snapshotTorch({
        interface: selectedInterface,
        protocol: protocolFilter !== 'any' ? protocolFilter : undefined,
        srcAddress: srcFilter.trim() || undefined,
        dstAddress: dstFilter.trim() || undefined,
        port: portFilter.trim() || undefined,
      });
      // Sort flows by total bandwidth descending
      data.sort((a, b) => (b.rxRate + b.txRate) - (a.rxRate + a.txRate));
      setFlows(data);
    } catch (err) {
      console.error('Torch snapshot error', err);
    } finally {
      setLoading(false);
    }
  };

  // Continuous sniffing loop
  useEffect(() => {
    if (!sniffing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    sampleOnce();
    timerRef.current = setInterval(() => {
      sampleOnce();
    }, 1800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sniffing, selectedInterface, protocolFilter, srcFilter, dstFilter, portFilter]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Calculate totals
  const totalRxRate = flows.reduce((acc, f) => acc + (f.rxRate || 0), 0);
  const totalTxRate = flows.reduce((acc, f) => acc + (f.txRate || 0), 0);
  const maxRxRate = Math.max(...flows.map((f) => f.rxRate || 0), 1);
  const maxTxRate = Math.max(...flows.map((f) => f.txRate || 0), 1);
  const topTalker = flows.length > 0 ? flows[0].srcAddress : '--';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-blue-500" />
            <span>{t('torch.title', 'Torch 实时流量嗅探器 (Traffic Sniffer)')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('torch.subtitle', '深度抓取指定接口进出双向 Socket 流，快速排查局域网高带宽占用、异常攻击与连接明细')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSniffing(!sniffing)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition cursor-pointer ${
              sniffing
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 shadow-amber-500/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {sniffing ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{t('torch.pause', '暂停嗅探')}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('torch.start', '启动嗅探')}</span>
              </>
            )}
          </button>

          <button
            onClick={sampleOnce}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-300 border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
            title={t('common.refresh', '单次采样')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Interface Select */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Network className="w-3 h-3 text-blue-400" />
              <span>{t('torch.interface', '嗅探接口 (Interface)')}</span>
            </label>
            <select
              value={selectedInterface}
              onChange={(e) => setSelectedInterface(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono cursor-pointer"
            >
              {interfaces.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name} {i.running ? '(UP)' : '(DOWN)'}
                </option>
              ))}
            </select>
          </div>

          {/* Protocol Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-purple-400" />
              <span>{t('torch.protocol', '协议过滤 (Protocol)')}</span>
            </label>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="any">{t('torch.protoAll', '全部协议 (All)')}</option>
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="icmp">ICMP</option>
            </select>
          </div>

          {/* Src Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">
              {t('torch.srcFilter', '源 IP 过滤')}
            </label>
            <input
              type="text"
              value={srcFilter}
              onChange={(e) => setSrcFilter(e.target.value)}
              placeholder="192.168.88.x"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          {/* Dst Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">
              {t('torch.dstFilter', '目的 IP 过滤')}
            </label>
            <input
              type="text"
              value={dstFilter}
              onChange={(e) => setDstFilter(e.target.value)}
              placeholder="0.0.0.0"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          {/* Port Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">
              {t('torch.portFilter', '端口过滤')}
            </label>
            <input
              type="text"
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value)}
              placeholder="443, 80"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Realtime KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] text-slate-400 block">{t('torch.activeFlows', '活跃流连接数')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-100">{flows.length}</span>
            <span className="text-[10px] text-slate-500">Flows</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] text-slate-400 block">{t('torch.totalRx', '当前入站实时速率 (Rx)')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">{formatBps(totalRxRate)}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] text-slate-400 block">{t('torch.totalTx', '当前出站实时速率 (Tx)')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-blue-400">{formatBps(totalTxRate)}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[11px] text-slate-400 block">{t('torch.topTalker', '最大带宽占用主机')}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold font-mono text-amber-400 truncate select-all">{topTalker}</span>
          </div>
        </div>
      </div>

      {/* Flows Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-xs text-slate-200">
              {t('torch.flowsList', '流经会话矩阵明细')} ({flows.length})
            </h3>
          </div>
          {sniffing && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {t('torch.liveSniffing', '实时持续采样中 (1.8s)')}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('torch.src', '源端 (Source)')}</th>
                <th className="px-5 py-3 font-semibold">{t('torch.dst', '目的端 (Destination)')}</th>
                <th className="px-3 py-3 font-semibold text-center">{t('torch.proto', '协议')}</th>
                <th className="px-5 py-3 font-semibold">{t('torch.rxRate', '下行吞吐 (Rx)')}</th>
                <th className="px-5 py-3 font-semibold">{t('torch.txRate', '上行吞吐 (Tx)')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('torch.actions', '操作')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {flows.map((flow) => {
                const rxPercent = Math.min(100, Math.round((flow.rxRate / maxRxRate) * 100));
                const txPercent = Math.min(100, Math.round((flow.txRate / maxTxRate) * 100));

                let protoBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                if (flow.protocol.toLowerCase() === 'tcp') protoBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                else if (flow.protocol.toLowerCase() === 'udp') protoBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                else if (flow.protocol.toLowerCase() === 'icmp') protoBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                return (
                  <tr key={flow.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Source */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100 select-all">{flow.srcAddress}</span>
                        {flow.srcPort && <span className="text-slate-500">:{flow.srcPort}</span>}
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 select-all">{flow.dstAddress}</span>
                        {flow.dstPort && <span className="text-slate-500">:{flow.dstPort}</span>}
                      </div>
                    </td>

                    {/* Protocol */}
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${protoBadge} uppercase`}>
                        {flow.protocol}
                      </span>
                    </td>

                    {/* Rx Rate */}
                    <td className="px-5 py-3">
                      <div className="space-y-1 min-w-[130px]">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" />
                            {formatBps(flow.rxRate)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${rxPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Tx Rate */}
                    <td className="px-5 py-3">
                      <div className="space-y-1 min-w-[130px]">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-blue-400 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            {formatBps(flow.txRate)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${txPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleCopy(flow.srcAddress)}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                        title={t('torch.copySrc', '复制源 IP')}
                      >
                        {copiedText === flow.srcAddress ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {flows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 text-xs">
                    {sniffing ? t('torch.listening', '正在嗅探数据流，等待报文捕获...') : t('torch.paused', '嗅探已暂停，请点击“启动嗅探”开始分析')}
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

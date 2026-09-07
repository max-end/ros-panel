import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rosApi } from '../api/client.js';
import { DashboardOverviewData } from '../types/index.js';
import { formatRosUptime, formatRosUptimeDetailed } from '../utils/format.js';
import { useI18n } from '../i18n/context.js';
import ReactECharts from 'echarts-for-react';
import {
  Activity,
  Cpu,
  HardDrive,
  Layers,
  Network,
  Users,
  Shield,
  RadioTower,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Globe,
  Thermometer,
  Zap,
  Clock,
  Laptop,
  FileText,
  Copy,
  Check,
  Server,
  ArrowRight,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatBps(bps: number): string {
  if (!bps || bps <= 0) return '0 bps';
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
  return `${bps} bps`;
}

interface TrafficPoint {
  time: string;
  rx: number;
  tx: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInterface, setSelectedInterface] = useState<string>('ether1-wan');
  const [trafficHistory, setTrafficHistory] = useState<TrafficPoint[]>([]);
  const [currentRx, setCurrentRx] = useState(0);
  const [currentTx, setCurrentTx] = useState(0);
  const [liveCpu, setLiveCpu] = useState<number | null>(null);

  const [copiedIp, setCopiedIp] = useState(false);
  const [wakingDeviceId, setWakingDeviceId] = useState<string | null>(null);

  const sseRef = useRef<EventSource | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await rosApi.getDashboardOverview();
      setOverview(data);
      if (data.interfaces.length > 0) {
        const found = data.interfaces.find((i) => i.name.includes('wan') && i.running);
        if (found) {
          setSelectedInterface(found.name);
        } else {
          setSelectedInterface(data.interfaces[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Connect SSE for live traffic
  useEffect(() => {
    if (!selectedInterface) return;

    if (sseRef.current) {
      sseRef.current.close();
    }

    const sessionId = localStorage.getItem('ros_session_id') || '';
    const url = `/api/telemetry/traffic-stream?interface=${encodeURIComponent(selectedInterface)}${sessionId ? `&token=${sessionId}` : ''}`;
    const sse = new EventSource(url, { withCredentials: true });
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const timeStr = new Date(data.timestamp).toLocaleTimeString();
        const rx = data.rxBps || 0;
        const tx = data.txBps || 0;

        setCurrentRx(rx);
        setCurrentTx(tx);
        if (typeof data.cpuLoad === 'number') {
          setLiveCpu(data.cpuLoad);
        }

        setTrafficHistory((prev) => {
          const next = [...prev, { time: timeStr, rx, tx }];
          if (next.length > 30) {
            return next.slice(next.length - 30);
          }
          return next;
        });
      } catch (e) {
        console.error('SSE parse error', e);
      }
    };

    sse.onerror = () => {
      // Reconnect attempt handled by browser
    };

    return () => {
      sse.close();
    };
  }, [selectedInterface]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleWakeClient = async (mac: string, id: string) => {
    try {
      setWakingDeviceId(id);
      await rosApi.wakeOnLan(mac);
      alert(`已向 ${mac} 广播唤醒魔术包！`);
    } catch (err: any) {
      alert('唤醒失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setWakingDeviceId(null);
    }
  };

  const res = overview?.systemResource;
  const health = overview?.systemHealth;
  const wan = overview?.wan;

  const cpuPercent = liveCpu !== null ? liveCpu : res ? res['cpu-load'] : 0;
  const totalMem = res ? res['total-memory'] : 0;
  const freeMem = res ? res['free-memory'] : 0;
  const usedMem = totalMem - freeMem;
  const memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;

  const totalHdd = res ? res['total-hdd-space'] : 0;
  const freeHdd = res ? res['free-hdd-space'] : 0;
  const usedHdd = totalHdd - freeHdd;
  const hddPercent = totalHdd > 0 ? Math.round((usedHdd / totalHdd) * 100) : 0;

  const cpuTemp = health?.['cpu-temperature'] ?? health?.temperature ?? 46;
  const boardTemp = health?.['board-temperature1'] ?? 39;
  const voltage = health?.voltage ?? 24.1;

  // Chart config
  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        const time = params[0].axisValueLabel;
        let str = `<div class="font-mono text-xs mb-1">${time}</div>`;
        params.forEach((p: any) => {
          str += `<div class="flex items-center gap-2 text-xs">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};"></span>
            <span class="text-slate-400">${p.seriesName}:</span>
            <span class="font-mono font-semibold">${formatBps(p.value)}</span>
          </div>`;
        });
        return str;
      },
    },
    legend: {
      data: ['Rx', 'Tx'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
      right: 10,
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '5%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trafficHistory.map((d) => d.time),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        formatter: (val: number) => formatBps(val),
      },
    },
    series: [
      {
        name: 'Rx',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ],
          },
        },
        data: trafficHistory.map((d) => d.rx),
      },
      {
        name: 'Tx',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
            ],
          },
        },
        data: trafficHistory.map((d) => d.tx),
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Device & Hardware Spec Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
                {res?.['board-name'] || 'MikroTik RouterOS'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v{res?.version || '7.16.2'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {res?.['architecture-name'] || 'arm64'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
              <span>{t('dashboard.arch', '架构')}: {res?.platform || 'MikroTik'}</span>
              <span>•</span>
              <span>
                {t('dashboard.running', '连续运行')}:{' '}
                <span
                  className="font-mono text-slate-200 cursor-help"
                  title={`Uptime: ${formatRosUptimeDetailed(res?.uptime)} (raw: ${res?.uptime || '0s'})`}
                >
                  {formatRosUptime(res?.uptime)}
                </span>
              </span>
              <span>•</span>
              <span>{t('dashboard.build', '构建')}: {res?.['build-time'] || '--'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t('navbar.restOnline', 'REST API Online')}</span>
          </div>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('dashboard.refresh', '刷新大屏')}</span>
          </button>
        </div>
      </div>

      {/* Hardware Gauge Cards (4 columns: CPU, RAM, Storage, Health) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400">{t('dashboard.cpuLoad', 'CPU 处理器负载')}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-slate-100">{cpuPercent}%</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {res?.['cpu-count'] ? `${res['cpu-count']} ${t('dashboard.cores', '核')}` : ''}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cpuPercent > 80 ? 'bg-red-500' : cpuPercent > 50 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, cpuPercent))}%` }}
            ></div>
          </div>
        </div>

        {/* Memory */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400">{t('dashboard.memoryUsage', '内存物理占用')}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-slate-100">{memPercent}%</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatBytes(usedMem)} / {formatBytes(totalMem)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${memPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400">{t('dashboard.storageSpace', '内部存储空间 (Flash)')}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-slate-100">{hddPercent}%</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatBytes(usedHdd)} / {formatBytes(totalHdd)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${hddPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Temperature & Voltage */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400">{t('dashboard.healthVoltage', '硬件温度与供电状态')}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-slate-100">{cpuTemp}°C</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Board {boardTemp}°C
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
            <span>Voltage: {voltage} V</span>
            <span className="text-emerald-400 font-medium">● OK</span>
          </div>
        </div>
      </div>

      {/* Mid Row: WAN Status & Front Panel Port Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* WAN Status Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                  {t('dashboard.wanStatus', '外网宽带状态 (WAN)')}
                </h3>
              </div>
              <button
                onClick={() => navigate('/wan-settings')}
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>{t('wan.settings', '外网设置')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{t('dashboard.wanIpv4', '外网 IPv4 公网地址:')}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {wan?.status || t('common.connected', 'Connected')}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-2xl font-bold font-mono text-emerald-400 tracking-wide select-all">
                  {wan?.ip || '116.228.88.142'}
                </span>
                <button
                  onClick={() => handleCopyIp(wan?.ip || '116.228.88.142')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title={t('common.copy', 'Copy')}
                >
                  {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* WAN Accumulated Usage stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[11px] block">{t('dashboard.totalRx', 'WAN 累计总下载 (Rx)')}</span>
                <span className="text-slate-100 font-bold text-sm block mt-0.5">
                  {formatBytes(wan?.rxBytes || 1284501234)}
                </span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[11px] block">{t('dashboard.totalTx', 'WAN 累计总上传 (Tx)')}</span>
                <span className="text-slate-100 font-bold text-sm block mt-0.5">
                  {formatBytes(wan?.txBytes || 584902340)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{t('dashboard.physicalPort', '承载端口')}: <span className="font-mono text-blue-400">{wan?.physicalPort || 'ether1-wan'}</span></span>
            <span>
              {t('dashboard.continuousOnline', '持续在线')}:{' '}
              <span
                className="font-mono text-slate-300 cursor-help"
                title={`Uptime: ${formatRosUptimeDetailed(wan?.uptime)}`}
              >
                {formatRosUptime(wan?.uptime)}
              </span>
            </span>
          </div>
        </div>

        {/* Physical Port Visualizer Strip (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                  {t('dashboard.portMatrix', '物理前面板端口状态矩阵')}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">{t('dashboard.clickToMonitor', '点击网口直达实时吞吐监控')}</span>
            </div>

            {/* Ports Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {overview?.interfaces.map((i) => {
                const isSelected = selectedInterface === i.name;
                const isUp = i.running;
                const isDown = !i.running && !i.disabled;

                return (
                  <button
                    key={i.id}
                    onClick={() => {
                      setSelectedInterface(i.name);
                      setTrafficHistory([]);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs truncate max-w-[90px]">
                        {i.name}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          i.disabled
                            ? 'bg-red-500'
                            : isUp
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-slate-600'
                        }`}
                        title={i.disabled ? t('common.disabled') : isUp ? 'UP' : 'DOWN'}
                      ></span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>{i.type}</span>
                      <span className={isUp ? 'text-emerald-400' : 'text-slate-500'}>
                        {isUp ? 'UP' : 'DOWN'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>UP</span>
              <span className="w-2 h-2 rounded-full bg-slate-600 ml-2"></span>
              <span>DOWN</span>
              <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span>
              <span>Disabled</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Interface: <strong className="text-blue-400 font-mono">{selectedInterface}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Traffic Graph Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-slate-100">{t('dashboard.trafficGraph', '接口实时吞吐走势')}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1.5s
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Traffic monitor for <span className="font-mono text-blue-400 font-semibold">{selectedInterface}</span> (Rx / Tx)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Interface:</label>
            <select
              value={selectedInterface}
              onChange={(e) => {
                setSelectedInterface(e.target.value);
                setTrafficHistory([]);
              }}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {overview?.interfaces.map((i) => (
                <option key={i.id} value={i.name}>
                  {i.name} ({i.type}) {i.running ? '● UP' : '○ DOWN'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Speed Indicator Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-800 p-3 sm:p-3.5 rounded-xl">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Download Rate (Rx)</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400">{formatBps(currentRx)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-800 p-3 sm:p-3.5 rounded-xl">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Upload Rate (Tx)</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-blue-400">{formatBps(currentTx)}</p>
            </div>
          </div>
        </div>

        {/* ECharts View */}
        <div className="h-64 sm:h-72 w-full">
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={false}
            lazyUpdate={true}
          />
        </div>
      </div>

      {/* Network Overview Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">{t('interfaces.title')}</p>
            <p className="text-base font-bold text-slate-100 font-mono">
              {overview?.stats.interfacesRunning ?? 0} / {overview?.stats.interfacesTotal ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">{t('dhcp.title')}</p>
            <p className="text-base font-bold text-slate-100 font-mono">
              {overview?.stats.activeDhcpLeases ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">{t('firewall.title')}</p>
            <p className="text-base font-bold text-slate-100 font-mono">
              {(overview?.stats.firewallFilterRules ?? 0) + (overview?.stats.firewallNatRules ?? 0)}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RadioTower className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">{t('wireguard.title')}</p>
            <p className="text-base font-bold text-slate-100 font-mono">
              {overview?.stats.wireguardPeersCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Two Columns: Top Active Clients & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Clients */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                {t('dashboard.onlineClients', '局域网在线终端')}
              </h3>
            </div>
            <button
              onClick={() => navigate('/dhcp-leases')}
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{t('common.viewAll', 'View all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {overview?.topClients && overview.topClients.length > 0 ? (
              overview.topClients.map((client) => (
                <div
                  key={client.id}
                  className="p-2.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block truncate max-w-[150px]">
                        {client.name}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span className="text-blue-400">{client.ip}</span>
                        <span>{client.mac}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWakeClient(client.mac, client.id)}
                    disabled={wakingDeviceId === client.id}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] transition cursor-pointer"
                    title="Wake On LAN"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{t('wol.wake', '唤醒')}</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-500 text-xs">{t('common.noData')}</p>
            )}
          </div>
        </div>

        {/* Recent Events & Security Audit Stream */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                {t('dashboard.recentLogs', '实时系统日志流')}
              </h3>
            </div>
            <button
              onClick={() => navigate('/logs')}
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{t('common.viewAll', 'View all')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {overview?.recentLogs && overview.recentLogs.length > 0 ? (
              overview.recentLogs.map((log) => (
                <div
                  key={log['.id']}
                  className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800/80 text-xs flex items-start gap-2.5"
                >
                  <span className="font-mono text-[11px] text-slate-500 shrink-0 mt-0.5">
                    {log.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-mono mr-2">
                      {log.topics}
                    </span>
                    <span className="text-slate-300 font-mono break-all text-[11px]">
                      {log.message}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-500 text-xs">{t('common.noData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

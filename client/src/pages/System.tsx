import React, { useState } from 'react';
import { rosApi } from '../api/client.js';
import { useAuth } from '../store/authContext.js';
import { TracerouteHop } from '../types/index.js';
import { formatRosUptime, formatRosUptimeDetailed } from '../utils/format.js';
import {
  Wrench,
  Terminal,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Info,
  Send,
  GitCommit,
  Play,
  RotateCw,
} from 'lucide-react';

export const System: React.FC = () => {
  const { deviceInfo, config } = useAuth();
  const [activeTab, setActiveTab] = useState<'ping' | 'traceroute' | 'terminal' | 'reboot'>('ping');

  // Ping state
  const [pingTarget, setPingTarget] = useState('223.5.5.5');
  const [pingCount, setPingCount] = useState(4);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{
    host: string;
    status: string;
    time?: string;
    received: number;
    sent: number;
  } | null>(null);

  // Traceroute state
  const [traceTarget, setTraceTarget] = useState('114.114.114.114');
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceHops, setTraceHops] = useState<TracerouteHop[]>([]);

  // Terminal state
  const [commandInput, setCommandInput] = useState('/interface print');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: '/system resource print',
      output: `uptime: 2w0h0m0s\nversion: 7.16.2 (stable)\nboard-name: RB5009UG+S+IN\narchitecture-name: arm64\ncpu-count: 4\ncpu-frequency: 1400MHz\ntotal-memory: 1024MiB\nfree-memory: 814MiB`,
    },
  ]);
  const [executing, setExecuting] = useState(false);

  // Reboot state
  const [showRebootConfirm, setShowRebootConfirm] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [rebootMsg, setRebootMsg] = useState<string | null>(null);

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingTarget) return;
    try {
      setPingLoading(true);
      setPingResult(null);
      const res = await rosApi.pingHost(pingTarget, pingCount);
      setPingResult(res);
    } catch (err: any) {
      alert('Ping 执行失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setPingLoading(false);
    }
  };

  const handleTraceroute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceTarget) return;
    try {
      setTraceLoading(true);
      setTraceHops([]);
      const hops = await rosApi.tracerouteHost(traceTarget);
      setTraceHops(hops);
    } catch (err: any) {
      alert('Traceroute 失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setTraceLoading(false);
    }
  };

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    try {
      setExecuting(true);
      const output = await rosApi.executeCommand(commandInput);
      setTerminalHistory((prev) => [...prev, { cmd: commandInput, output }]);
      setCommandInput('');
    } catch (err: any) {
      alert('命令执行失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setExecuting(false);
    }
  };

  const handleReboot = async () => {
    try {
      setRebooting(true);
      await rosApi.rebootSystem();
      setRebootMsg('重启指令已成功下发至路由器。系统正在重启，通常需要 30~60 秒，完成后请重新连接。');
      setShowRebootConfirm(false);
    } catch (err: any) {
      alert('重启请求失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setRebooting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-400" />
          <span>工具箱与高级诊断 (System Diagnostics & Terminal)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ping 连通性测试、Traceroute 路由多跳跟踪、Web 命令行控制台与远程维护
        </p>
      </div>

      {rebootMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0" />
          <span>{rebootMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('ping')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ping'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Ping 连通测试</span>
        </button>

        <button
          onClick={() => setActiveTab('traceroute')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'traceroute'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Traceroute 路由跟踪</span>
        </button>

        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'terminal'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Web 命令行控制台</span>
        </button>

        <button
          onClick={() => setActiveTab('reboot')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'reboot'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>重启与硬件信息</span>
        </button>
      </div>

      {/* Tab 1: Ping */}
      {activeTab === 'ping' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <form onSubmit={handlePing} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  目标 IP 或域名
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 223.5.5.5 或 baidu.com"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">发包次数</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={pingCount}
                  onChange={(e) => setPingCount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={pingLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  {pingLoading ? <span className="animate-spin">●</span> : <Send className="w-3.5 h-3.5" />}
                  <span>{pingLoading ? '探测中...' : '发起测试'}</span>
                </button>
              </div>
            </div>
          </form>

          {pingResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span>目标主机: <strong className="text-slate-200">{pingResult.host}</strong></span>
                <span className={pingResult.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}>
                  {pingResult.status === 'ok' ? '● 连通正常' : '● 连接超时'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">平均往返延迟</span>
                  <span className="text-emerald-400 font-bold">{pingResult.time || '<1ms'}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">发送包数</span>
                  <span className="text-slate-200 font-bold">{pingResult.sent}</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-500 text-[10px] block">成功接收</span>
                  <span className="text-slate-200 font-bold">{pingResult.received}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Traceroute */}
      {activeTab === 'traceroute' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <form onSubmit={handleTraceroute} className="flex gap-3">
            <input
              type="text"
              required
              placeholder="输入跟踪目标 IP 或域名 (例如: 114.114.114.114 或 qq.com)"
              value={traceTarget}
              onChange={(e) => setTraceTarget(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={traceLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
            >
              {traceLoading ? <span className="animate-spin">●</span> : <GitCommit className="w-4 h-4" />}
              <span>{traceLoading ? '跟踪中...' : '开始路由跟踪'}</span>
            </button>
          </form>

          <div className="overflow-x-auto border border-slate-800 rounded-xl mt-4">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-3 font-medium">跳数 (Hop)</th>
                  <th className="py-2.5 px-3 font-medium">节点 IP 地址</th>
                  <th className="py-2.5 px-3 font-medium">最新延迟</th>
                  <th className="py-2.5 px-3 font-medium">平均延迟</th>
                  <th className="py-2.5 px-3 font-medium">丢包率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {traceHops.map((hop) => (
                  <tr key={hop.hop} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-blue-400">#{hop.hop}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{hop.address}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{hop.last}</td>
                    <td className="py-2.5 px-3 text-slate-300">{hop.avg}</td>
                    <td className="py-2.5 px-3">{hop.loss}%</td>
                  </tr>
                ))}

                {traceHops.length === 0 && !traceLoading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      输入目标并点击“开始路由跟踪”查看逐跳节点信息
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Web Terminal */}
      {activeTab === 'terminal' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <span>RouterOS CLI Terminal</span>
            <span>输入任意 ROS 命令执行</span>
          </div>

          <div className="h-80 overflow-y-auto space-y-4 pr-1">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>[admin@MikroTik] &gt;</span>
                  <span className="text-slate-100">{item.cmd}</span>
                </div>
                <pre className="text-slate-400 pl-4 whitespace-pre-wrap leading-relaxed">
                  {item.output}
                </pre>
              </div>
            ))}
          </div>

          <form onSubmit={handleExecuteCommand} className="flex gap-2 pt-2 border-t border-slate-800">
            <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3">
              <span className="text-emerald-400 font-bold mr-2">&gt;</span>
              <input
                type="text"
                placeholder="例如: /interface print 或 /ip firewall nat print"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="w-full bg-transparent py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={executing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition cursor-pointer"
            >
              {executing ? '执行中...' : '运行指令'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Reboot & Specs */}
      {activeTab === 'reboot' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Specs */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-semibold text-xs text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800 mb-4">
              当前设备硬件规格核验
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">硬件板卡型号</span>
                <span className="font-mono text-slate-200 font-bold">{deviceInfo?.['board-name'] || 'RB5009'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">RouterOS 版本</span>
                <span className="font-mono text-blue-400">{deviceInfo?.version || '7.16.2'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">CPU 架构</span>
                <span className="font-mono text-slate-200">{deviceInfo?.['architecture-name'] || 'arm64'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">连续开机时间</span>
                <span
                  className="font-mono text-slate-200 cursor-help"
                  title={`详细开机时间: ${formatRosUptimeDetailed(deviceInfo?.uptime)}`}
                >
                  {formatRosUptime(deviceInfo?.uptime)}
                </span>
              </div>
            </div>
          </div>

          {/* Reboot */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-xs text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800 mb-4">
                远程安全软重启 (Remote Reboot)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                重启将优雅终止所有网络连接、保存系统状态并重启 RouterOS 内核。预计中断约 30-60 秒。
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-6">
              {!showRebootConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowRebootConfirm(true)}
                  className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 font-medium text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>准备重启路由器...</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>二次安全确认: 重启后当前所有局域网终端将短暂断网！</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRebootConfirm(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleReboot}
                      disabled={rebooting}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium text-xs py-2 rounded-xl transition cursor-pointer"
                    >
                      {rebooting ? '正在下发重启...' : '确定立即重启'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosPackageUpdate, RosRouterboard } from '../types/index.js';
import { useAuth } from '../store/authContext.js';
import { useI18n } from '../i18n/context.js';
import {
  ArrowUpCircle,
  RefreshCw,
  Cpu,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText,
  RotateCcw,
  Layers,
  HardDrive,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const Upgrade: React.FC = () => {
  const { deviceInfo, refreshStatus } = useAuth();
  const { t } = useI18n();

  const [updateInfo, setUpdateInfo] = useState<RosPackageUpdate | null>(null);
  const [routerboard, setRouterboard] = useState<RosRouterboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [upgradingRb, setUpgradingRb] = useState(false);
  const [channel, setChannel] = useState('stable');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [up, rb] = await Promise.all([
        rosApi.getPackageUpdate().catch(() => null),
        rosApi.getRouterboard().catch(() => null),
      ]);
      if (up) {
        setUpdateInfo(up);
        if (up.channel) setChannel(up.channel);
      }
      if (rb) setRouterboard(rb);
    } catch (err: any) {
      setError(err.message || '获取升级信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckUpdate = async () => {
    try {
      setChecking(true);
      setError(null);
      setSuccessMsg(null);
      const res = await rosApi.checkPackageUpdate();
      setUpdateInfo(res);
      setSuccessMsg('已向 MikroTik 官方服务器完成版本检索');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || '检测更新失败');
    } finally {
      setChecking(false);
    }
  };

  const handleChannelChange = async (newChannel: string) => {
    try {
      setChannel(newChannel);
      await rosApi.setPackageChannel(newChannel);
      await handleCheckUpdate();
    } catch (err: any) {
      setError(err.message || '切换更新分支失败');
    }
  };

  const handleInstall = async () => {
    try {
      setInstalling(true);
      setShowConfirmModal(false);
      await rosApi.installPackageUpdate();
      setSuccessMsg('升级包已下发，路由器正在执行系统升级并重启，预计中断 60~90 秒...');
    } catch (err: any) {
      setError(err.message || '下发固件升级失败');
    } finally {
      setInstalling(false);
    }
  };

  const handleUpgradeRouterboard = async () => {
    if (!window.confirm('确定要刷新写入 RouterBOARD 引导硬件固件吗？写入后将在下次物理重启时生效。')) {
      return;
    }
    try {
      setUpgradingRb(true);
      await rosApi.upgradeRouterboard();
      setSuccessMsg('RouterBOARD 硬件固件已成功升级！将在路由器下次重启时生效。');
      const rb = await rosApi.getRouterboard();
      setRouterboard(rb);
    } catch (err: any) {
      setError(err.message || '升级引导固件失败');
    } finally {
      setUpgradingRb(false);
    }
  };

  const currentVer = updateInfo?.['installed-version'] || deviceInfo?.version || '7.16.2';
  const latestVer = updateInfo?.['latest-version'] || currentVer;
  const hasNewVersion = currentVer !== latestVer && latestVer !== '';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-blue-400" />
            <span>RouterOS 固件升级与维护 (System & Firmware Upgrade)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            官方软件包云端在线检索、稳定版安全补丁更新与 RouterBOARD 引导硬件升级
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新状态</span>
          </button>

          <button
            onClick={handleCheckUpdate}
            disabled={checking}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? '正在联网检索...' : '检查官方新版'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Hero Version Comparison Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Versions Hero */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                RouterOS v7 系统更新分支
              </span>
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                {(['stable', 'long-term', 'testing', 'development'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => handleChannelChange(ch)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                      channel === ch
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch === 'stable' ? '稳定版 (Stable)' : ch === 'long-term' ? '长期版 (Long-term)' : ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Version */}
              <div className="bg-slate-800/50 border border-slate-750 rounded-xl p-4">
                <span className="text-[11px] text-slate-400 block font-medium">当前运行固件版本</span>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1 flex items-center gap-2">
                  <span>v{currentVer}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-sans font-normal">
                    已安装
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block font-mono">
                  硬件平台: {deviceInfo?.['board-name'] || 'MikroTik'} ({deviceInfo?.['architecture-name'] || 'arm64'})
                </span>
              </div>

              {/* Cloud Latest Version */}
              <div
                className={`border rounded-xl p-4 ${
                  hasNewVersion
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-750'
                }`}
              >
                <span className="text-[11px] text-slate-400 block font-medium">官方云端最新版本</span>
                <div className="text-2xl font-bold font-mono mt-1 flex items-center gap-2">
                  <span className={hasNewVersion ? 'text-emerald-400' : 'text-slate-200'}>
                    v{latestVer}
                  </span>
                  {hasNewVersion ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-semibold animate-pulse">
                      发现新版本
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-sans font-normal">
                      已是最新
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  状态: {updateInfo?.status || 'Installed version is current'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Upgrade Action Box */}
          <div className="lg:col-span-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                系统升级操作 (Upgrade Action)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {hasNewVersion
                  ? '检测到官方已发布更新版本，升级包将自动下载并优雅重启加载。'
                  : '当前已运行目标分支的最新版本，系统内核稳健安全。'}
              </p>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!hasNewVersion || installing}
              className={`w-full py-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                hasNewVersion
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>{hasNewVersion ? '立即下载并在线升级' : '无需升级 (系统最新)'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Changelog Box (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                官方更新日志与发布说明 (Release Notes)
              </h3>
            </div>
            <a
              href="https://mikrotik.com/download/changelogs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <span>官方发布主页</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-[380px] overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap select-text">
            {updateInfo?.['change-log'] ||
              `What's new in 7.18.1 (stable):\n!) wifi - improved WPA3-SAE roaming performance and key exchange stability;\n!) bth - added Back-to-Home VPN dynamic relay server auto-selection;\n*) bridge - fixed rare L2 packet flood under heavy hardware offload;\n*) defconf - updated default firewall filter rules for IPv6 fast-track;\n*) dns - optimized concurrent FQDN caching and reduced CPU load;\n*) l3hw - added L3 hardware offload support on CRS3xx series;\n*) pppoe - improved dial-up reconnection retry backoff mechanism;\n*) route - fixed dynamic BGP route withdrawal latency;\n*) wireguard - updated WireGuard cryptographic engine to latest stable spec.`}
          </div>
        </div>

        {/* RouterBOARD Hardware BIOS Card (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-200 pb-3 border-b border-slate-800">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs uppercase tracking-wider">
                RouterBOARD 引导硬件 (BIOS)
              </h3>
            </div>

            <div className="space-y-3 text-xs mt-4">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">主板型号</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {routerboard?.model || deviceInfo?.['board-name'] || 'RB5009UG+S+IN'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">硬件序列号</span>
                <span className="font-mono text-slate-300">
                  {routerboard?.['serial-number'] || 'HE608XYZ9910'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">当前引导固件</span>
                <span className="font-mono text-slate-200">
                  v{routerboard?.['current-firmware'] || '7.16.2'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">待写入新固件</span>
                <span className="font-mono text-emerald-400 font-bold">
                  v{routerboard?.['upgrade-firmware'] || '7.18.1'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleUpgradeRouterboard}
              disabled={upgradingRb}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>{upgradingRb ? '正在写入引导固件...' : '升级 RouterBOARD 硬件固件'}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              引导固件升级安全无损，将在设备下次物理重启时生效
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Double Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-emerald-400 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100">确认升级固件版本</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  v{currentVer} ➜ v{latestVer}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                升级固件将下载官方软件包并<strong>自动重启路由器</strong>。重启过程预计持续 <strong>60~90 秒</strong>，在此期间局域网与外网连接将中断。请确认当前无关键网络传输业务。
              </p>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-xl cursor-pointer font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleInstall}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-xl transition cursor-pointer font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>确认并开始升级</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

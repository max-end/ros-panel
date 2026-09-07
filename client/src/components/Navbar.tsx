import React, { useState } from 'react';
import { useAuth } from '../store/authContext.js';
import { Router, Cpu, Clock, LogOut, Menu, RotateCcw, ChevronDown } from 'lucide-react';
import { formatRosUptime, formatRosUptimeDetailed } from '../utils/format.js';
import { RebootModal } from './RebootModal.js';
import { DeviceSwitcherModal } from './DeviceSwitcherModal.js';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { deviceInfo, config, logout, savedDevices } = useAuth();
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [showDeviceSwitcher, setShowDeviceSwitcher] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 lg:hidden cursor-pointer shrink-0 transition"
            aria-label="打开侧边导航菜单"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Router Quick Switcher Trigger */}
          <button
            onClick={() => setShowDeviceSwitcher(true)}
            className="flex items-center gap-2.5 min-w-0 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition cursor-pointer text-left group"
            title="点击打开设备簿，快速切换路由器节点"
          >
            <div className="p-1.5 sm:p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 shrink-0 group-hover:border-blue-400/50 transition">
              <Router className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-slate-100 text-xs sm:text-sm tracking-wide truncate max-w-[120px] sm:max-w-[200px]">
                  {deviceInfo?.['board-name'] || 'MikroTik RouterOS'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition shrink-0" />
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono shrink-0">
                  v{deviceInfo?.version || '7.x'}
                </span>
                {config?.isDemo && (
                  <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium shrink-0">
                    模拟演示
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {config?.host}:{config?.port} ({config?.username})
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Quick status pills for tablet/desktop */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-300">
            <div
              className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 cursor-help"
              title={`连续运行：${formatRosUptimeDetailed(deviceInfo?.uptime)} (原始: ${deviceInfo?.uptime || '--'})`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">运行:</span>
              <span className="font-mono text-slate-200">{formatRosUptime(deviceInfo?.uptime)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">CPU:</span>
              <span className="font-mono text-slate-200">{deviceInfo?.['cpu-load'] ?? 0}%</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>REST API 在线</span>
            </div>
          </div>

          {/* Quick Actions: Reboot & Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRebootModal(true)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 bg-slate-800/50 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/30 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="安全重启当前路由器"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重启</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="断开连接"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">断开</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <RebootModal
        isOpen={showRebootModal}
        onClose={() => setShowRebootModal(false)}
      />

      <DeviceSwitcherModal
        isOpen={showDeviceSwitcher}
        onClose={() => setShowDeviceSwitcher(false)}
      />
    </>
  );
};

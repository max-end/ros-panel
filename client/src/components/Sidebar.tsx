import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/authContext.js';
import { useI18n } from '../i18n/context.js';
import {
  LayoutDashboard,
  Globe,
  Globe2,
  Route as RouteIcon,
  Server,
  Network,
  Binary,
  Users,
  GitFork,
  Shield,
  RadioTower,
  Sliders,
  Zap,
  Terminal,
  HardDriveDownload,
  UserCheck,
  FileText,
  Radio,
  LogOut,
  User,
  X,
  Wifi,
  ArrowUpCircle,
} from 'lucide-react';

interface MenuItem {
  path: string;
  translationKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  groupKey?: string;
  defaultTitle?: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    items: [{ path: '/', translationKey: 'nav.dashboard', defaultLabel: '监控大屏', icon: LayoutDashboard }],
  },
  {
    groupKey: 'nav.wanGroup',
    defaultTitle: '外网与路由',
    items: [
      { path: '/wan-settings', translationKey: 'nav.wan', defaultLabel: '外网拨号', icon: Globe },
      { path: '/ddns', translationKey: 'nav.ddns', defaultLabel: '动态域名', icon: Globe2 },
      { path: '/routes', translationKey: 'nav.routes', defaultLabel: '路由管理', icon: RouteIcon },
      { path: '/dns', translationKey: 'nav.dns', defaultLabel: 'DNS 服务', icon: Server },
    ],
  },
  {
    groupKey: 'nav.networkGroup',
    defaultTitle: '网络与接口',
    items: [
      { path: '/interfaces', translationKey: 'nav.interfaces', defaultLabel: '接口管理', icon: Network },
      { path: '/wireless', translationKey: 'nav.wireless', defaultLabel: '无线管理', icon: Wifi },
      { path: '/ip-addresses', translationKey: 'nav.ipAddresses', defaultLabel: 'IP 地址', icon: Binary },
      { path: '/dhcp-leases', translationKey: 'nav.dhcp', defaultLabel: 'DHCP 服务', icon: Users },
      { path: '/arp', translationKey: 'nav.arp', defaultLabel: 'ARP 列表', icon: GitFork },
    ],
  },
  {
    groupKey: 'nav.securityGroup',
    defaultTitle: '安全与互联',
    items: [
      { path: '/firewall', translationKey: 'nav.firewall', defaultLabel: '防火墙', icon: Shield },
      { path: '/wireguard', translationKey: 'nav.wireguard', defaultLabel: 'WireGuard', icon: RadioTower },
      { path: '/queues', translationKey: 'nav.queues', defaultLabel: '带宽限速', icon: Sliders },
      { path: '/wol', translationKey: 'nav.wol', defaultLabel: '网络唤醒', icon: Zap },
    ],
  },
  {
    groupKey: 'nav.systemGroup',
    defaultTitle: '系统与运维',
    items: [
      { path: '/system', translationKey: 'nav.diagnostics', defaultLabel: '系统工具', icon: Terminal },
      { path: '/upgrade', translationKey: 'nav.upgrade', defaultLabel: '固件升级', icon: ArrowUpCircle },
      { path: '/backup', translationKey: 'nav.backup', defaultLabel: '系统备份', icon: HardDriveDownload },
      { path: '/users', translationKey: 'nav.users', defaultLabel: '用户管理', icon: UserCheck },
      { path: '/logs', translationKey: 'nav.logs', defaultLabel: '系统日志', icon: FileText },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { deviceInfo, config, logout } = useAuth();
  const { t } = useI18n();
  const boardName = deviceInfo?.['board-name'] || 'RB5009';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-60 bg-[#0B0F19] border-r border-slate-800/70 flex flex-col shrink-0 select-none z-50 transition-transform duration-200 ease-in-out fixed inset-y-0 left-0 h-screen max-h-screen lg:sticky lg:top-0 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
              <Radio className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-slate-100 text-sm tracking-wide">RouterOS</span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold leading-none">
                  v7
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight leading-none">
                  {boardName} · 在线
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="关闭侧边菜单"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-2.5 py-3 space-y-3 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {group.groupKey && (
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-slate-500/90 tracking-wider">
                  {t(group.groupKey, group.defaultTitle)}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border group ${
                        isActive
                          ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-slate-200" />
                    <span className="tracking-tight">{t(item.translationKey, item.defaultLabel)}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card / Bottom Info */}
        <div className="p-3 border-t border-slate-800/70 bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate leading-tight font-mono">
                  {config?.username || 'admin'}
                </p>
                <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 font-mono">
                  {config?.host || 'router.lan'}:{config?.port}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

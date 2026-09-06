import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/authContext.js';
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
} from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  groupTitle?: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    items: [{ path: '/', label: '监控大屏', icon: LayoutDashboard }],
  },
  {
    groupTitle: '外网与路由',
    items: [
      { path: '/wan-settings', label: '外网拨号', icon: Globe },
      { path: '/ddns', label: '动态域名', icon: Globe2 },
      { path: '/routes', label: '路由管理', icon: RouteIcon },
      { path: '/dns', label: 'DNS 服务', icon: Server },
    ],
  },
  {
    groupTitle: '网络与接口',
    items: [
      { path: '/interfaces', label: '接口管理', icon: Network },
      { path: '/ip-addresses', label: 'IP 地址', icon: Binary },
      { path: '/dhcp-leases', label: 'DHCP 服务', icon: Users },
      { path: '/arp', label: 'ARP 列表', icon: GitFork },
    ],
  },
  {
    groupTitle: '安全与互联',
    items: [
      { path: '/firewall', label: '防火墙', icon: Shield },
      { path: '/wireguard', label: 'WireGuard', icon: RadioTower },
      { path: '/queues', label: '带宽限速', icon: Sliders },
      { path: '/wol', label: '网络唤醒', icon: Zap },
    ],
  },
  {
    groupTitle: '系统与运维',
    items: [
      { path: '/system', label: '系统工具', icon: Terminal },
      { path: '/backup', label: '系统备份', icon: HardDriveDownload },
      { path: '/users', label: '用户管理', icon: UserCheck },
      { path: '/logs', label: '系统日志', icon: FileText },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { deviceInfo, config, logout } = useAuth();
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
        className={`w-60 bg-[#0B0F19] border-r border-slate-800/70 flex flex-col shrink-0 min-h-screen select-none z-50 transition-transform duration-200 ease-in-out fixed inset-y-0 left-0 lg:static lg:translate-x-0 ${
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
              {group.groupTitle && (
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-slate-500/90 tracking-wider">
                  {group.groupTitle}
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
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="tracking-wide">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Status & Logout Footer */}
        <div className="p-2.5 border-t border-slate-800/70 bg-slate-950/40">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200 text-xs truncate">
                    {config?.username || 'admin'}
                  </span>
                  <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono leading-tight">
                    full
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate font-mono leading-tight">
                  {config?.host || '127.0.0.1'}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer shrink-0"
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

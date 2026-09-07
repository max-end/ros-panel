import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosIpService } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  X,
  Server,
  Globe,
  Terminal,
  Radio,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

export const Services: React.FC = () => {
  const { t } = useI18n();
  const [services, setServices] = useState<RosIpService[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingService, setEditingService] = useState<RosIpService | null>(null);
  const [editPort, setEditPort] = useState<number>(80);
  const [editAddress, setEditAddress] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await rosApi.getIpServices();
      setServices(data);
    } catch (err) {
      console.error('Failed to load IP services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggle = async (service: RosIpService) => {
    const isCurrentlyDisabled = service.disabled === true || service.disabled === 'true';
    const willDisable = !isCurrentlyDisabled;

    // Safety check for web management services
    if (willDisable && (service.name === 'www' || service.name === 'www-ssl')) {
      const confirmDisable = window.confirm(
        t('services.disableWebWarning', '警告：您正在禁用当前 Web 控制台依赖的管理服务。禁用后您可能无法通过浏览器访问此控制台。确认继续吗？')
      );
      if (!confirmDisable) return;
    }

    try {
      setTogglingId(service['.id']);
      await rosApi.toggleIpService(service['.id'], willDisable);
      setSuccessMsg(
        willDisable
          ? t('services.disabledSuccess', `服务 ${service.name} 已成功禁用`)
          : t('services.enabledSuccess', `服务 ${service.name} 已成功启用`)
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchServices();
    } catch (err) {
      console.error('Failed to toggle service', err);
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (service: RosIpService) => {
    setEditingService(service);
    setEditPort(service.port);
    setEditAddress(service.address || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      setSavingEdit(true);
      await rosApi.updateIpService(editingService['.id'], {
        port: Number(editPort),
        address: editAddress.trim(),
      });
      setSuccessMsg(t('services.updateSuccess', `服务 ${editingService.name} 配置已更新`));
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingService(null);
      await fetchServices();
    } catch (err) {
      console.error('Failed to update service', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const getServiceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'winbox':
        return <Server className="w-5 h-5" />;
      case 'www':
      case 'www-ssl':
        return <Globe className="w-5 h-5" />;
      case 'ssh':
      case 'telnet':
        return <Terminal className="w-5 h-5" />;
      case 'api':
      case 'api-ssl':
        return <Radio className="w-5 h-5" />;
      default:
        return <FileCode className="w-5 h-5" />;
    }
  };

  // Security assessment stats
  const hasTelnetOpen = services.some(s => s.name === 'telnet' && !(s.disabled === true || s.disabled === 'true'));
  const hasFtpOpen = services.some(s => s.name === 'ftp' && !(s.disabled === true || s.disabled === 'true'));
  const hasOpenWinboxNoWhitelist = services.some(
    s => s.name === 'winbox' && !(s.disabled === true || s.disabled === 'true') && (!s.address || s.address.trim() === '')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-blue-500" />
            <span>{t('services.title', 'IP 服务与安全端口 (IP Services)')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('services.subtitle', '管理 WinBox、SSH、Web 及 API 守护服务，配置自定义非标端口及访问白名单')}
          </p>
        </div>

        <button
          onClick={fetchServices}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-300 border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>{t('common.refresh', '刷新')}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Security Audit Banner */}
      {(hasTelnetOpen || hasFtpOpen || hasOpenWinboxNoWhitelist) ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4.5 flex items-start gap-3.5 text-xs text-slate-300 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-semibold text-amber-300">
              {t('services.securityAdviceTitle', '安全合规建议 (Security Hardening Advice)')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              {hasTelnetOpen && (
                <li>
                  <span className="text-amber-200">{t('services.telnetWarning', 'Telnet 正在运行：')}</span>
                  {t('services.telnetAdvice', '采用明文传输密码，强烈建议在公共网络中禁用，推荐使用 SSH 替代。')}
                </li>
              )}
              {hasFtpOpen && (
                <li>
                  <span className="text-amber-200">{t('services.ftpWarning', 'FTP 正在运行：')}</span>
                  {t('services.ftpAdvice', '文件传输协议未加密，建议在不用时予以禁用。')}
                </li>
              )}
              {hasOpenWinboxNoWhitelist && (
                <li>
                  <span className="text-amber-200">{t('services.winboxWarning', 'WinBox 允许任意地址访问：')}</span>
                  {t('services.winboxAdvice', '未设置白名单。若路由器拥有公网 IP，建议限制仅允许内网或配置非标端口。')}
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{t('services.securityGood', '服务端口基线检查良好：明文高危服务已关闭或配置了来源限制。')}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((srv) => {
          const isDisabled = srv.disabled === true || srv.disabled === 'true';
          const isToggling = togglingId === srv['.id'];

          return (
            <div
              key={srv['.id']}
              className={`border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between relative overflow-hidden ${
                isDisabled
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top service header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isDisabled
                          ? 'bg-slate-800/40 text-slate-500 border-slate-700/40'
                          : 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {getServiceIcon(srv.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 font-mono tracking-wide uppercase">
                        {srv.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isDisabled ? (
                          <span className="text-slate-500">{t('common.disabled', '已禁用')}</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">● {t('common.enabled', '正在监听')}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    title={t('common.edit', '编辑')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Specs */}
                <div className="mt-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">{t('services.port', '监听端口')}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700/60 font-semibold">
                      {srv.port}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-500">{t('services.allowedFrom', '白名单来源')}</span>
                    <span
                      className={`truncate max-w-[150px] font-medium ${
                        srv.address ? 'text-emerald-400' : 'text-slate-400 italic'
                      }`}
                      title={srv.address || '0.0.0.0/0 (全部开放)'}
                    >
                      {srv.address || t('services.allAddresses', '全部开放')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Toggle */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isDisabled ? t('services.disabledDesc', '服务未激活') : t('services.runningDesc', '正常接受连接')}
                </span>
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => handleToggle(srv)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isDisabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                  }`}
                >
                  {isToggling ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></span>
                  ) : isDisabled ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('services.enable', '启用')}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('services.disable', '停用')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100 uppercase">
                  {t('services.editTitle', '配置服务:')} {editingService.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t('services.listenPort', '监听端口号')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="65535"
                  value={editPort}
                  onChange={(e) => setEditPort(Number(e.target.value))}
                  placeholder="80"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  {t('services.portHint', '建议将默认的敏感端口（如 8291、22、80）修改为非常规端口以防探测')}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t('services.allowedAddressesLabel', '允许访问的来源 IP / 子网白名单')}
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="192.168.88.0/24, 10.0.0.0/8"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  {t('services.addressHint', '留空表示对所有 IP 开放。支持 CIDR 格式，如 192.168.88.0/24，多个可用逗号分隔')}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  {t('common.cancel', '取消')}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {savingEdit ? t('common.saving', '保存中...') : t('common.save', '保存生效')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

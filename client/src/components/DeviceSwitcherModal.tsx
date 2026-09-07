import React, { useState, useEffect } from 'react';
import { useAuth, SavedDevice } from '../store/authContext.js';
import { useI18n } from '../i18n/context.js';
import {
  Router,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  X,
  Server,
  KeyRound,
  User,
  Shield,
  Clock,
} from 'lucide-react';

interface DeviceSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSwitcherModal: React.FC<DeviceSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const {
    config,
    deviceInfo,
    savedDevices,
    switchDevice,
    removeSavedDevice,
    addSavedDevice,
  } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New device form state
  const [newName, setNewName] = useState('');
  const [newHost, setNewHost] = useState('');
  const [newPort, setNewPort] = useState('443');
  const [newUseTls, setNewUseTls] = useState(true);
  const [newUsername, setNewUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [newRejectUnauthorized, setNewRejectUnauthorized] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAddForm(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHost = config?.host;
  const currentPort = config?.port;

  const handleSwitch = async (device: SavedDevice) => {
    try {
      setSwitchingId(device.id);
      setError(null);
      const ok = await switchDevice(device);
      if (ok) {
        onClose();
        window.location.reload();
      } else {
        setError(`连接到 ${device.name || device.host} 失败，请检查设备状态与网络`);
      }
    } catch (err: any) {
      setError(err.message || '切换设备失败');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHost || !newPort || !newUsername) return;

    try {
      setSubmittingAdd(true);
      setError(null);
      const ok = await addSavedDevice({
        name: newName.trim() || `${newHost}:${newPort}`,
        host: newHost.trim(),
        port: Number(newPort),
        useTls: newUseTls,
        username: newUsername.trim(),
        password: newPassword,
        rejectUnauthorized: newRejectUnauthorized,
      });

      if (ok) {
        setShowAddForm(false);
        setNewName('');
        setNewHost('');
        setNewPassword('');
      } else {
        setError('添加并连接设备失败，请核对信息');
      }
    } catch (err: any) {
      setError(err.message || '添加失败');
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Router className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">{t('modal.deviceSwitcherTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('modal.deviceSwitcherDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-3">
          {!showAddForm ? (
            <>
              {savedDevices.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  {t('common.noData')}
                </div>
              ) : (
                savedDevices.map((dev) => {
                  const isCurrent =
                    dev.host === currentHost && Number(dev.port) === Number(currentPort);
                  const isBusy = switchingId === dev.id;

                  return (
                    <div
                      key={dev.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-600/10 border-blue-500/30'
                          : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isCurrent
                              ? 'bg-blue-600 text-white border-blue-500/40 shadow-md shadow-blue-600/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <Router className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-slate-100 truncate">
                              {dev.name || dev.boardName || dev.host}
                            </h4>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Connected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                            {dev.useTls ? 'https' : 'http'}://{dev.host}:{dev.port} ({dev.username})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isCurrent && (
                          <button
                            onClick={() => handleSwitch(dev)}
                            disabled={isBusy}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition shadow-md shadow-blue-600/20"
                          >
                            <span>{isBusy ? '...' : 'Switch'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => removeSavedDevice(dev.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 text-xs text-slate-400 hover:text-blue-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('modal.addRouter')}</span>
              </button>
            </>
          ) : (
            /* Add New Device Form */
            <form onSubmit={handleAddSubmit} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-medium text-slate-200">
                <span>{t('modal.addRouter')}</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {t('common.cancel')}
                </button>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Router Alias
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Core Gateway"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Protocol</label>
                  <select
                    value={newUseTls ? 'https' : 'http'}
                    onChange={(e) => {
                      const isHttps = e.target.value === 'https';
                      setNewUseTls(isHttps);
                      setNewPort(isHttps ? '443' : '80');
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 cursor-pointer"
                  >
                    <option value="https">HTTPS</option>
                    <option value="http">HTTP</option>
                  </select>
                </div>

                <div className="col-span-5">
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">IP / Host</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.88.1"
                    value={newHost}
                    onChange={(e) => setNewHost(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div className="col-span-3">
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">{t('common.port', '端口')}</label>
                  <input
                    type="number"
                    required
                    placeholder="443"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-100 font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">{t('common.username', '用户名')}</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">{t('common.password', '密码')}</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-xl font-medium shadow-md shadow-blue-600/30"
                >
                  {submittingAdd ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>{savedDevices.length} devices</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { rosApi } from '../api/client.js';
import { useAuth } from '../store/authContext.js';
import { useI18n } from '../i18n/context.js';
import { RotateCcw, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface RebootModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RebootModal: React.FC<RebootModalProps> = ({ isOpen, onClose }) => {
  const { deviceInfo, config, refreshStatus } = useAuth();
  const { t } = useI18n();
  const [phase, setPhase] = useState<'confirm' | 'rebooting' | 'success' | 'timeout'>('confirm');
  const [countdown, setCountdown] = useState(45);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('confirm');
      setCountdown(45);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Polling loop when in rebooting phase
  useEffect(() => {
    if (phase !== 'rebooting') return;

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Heartbeat check every 3s starting after 10s
    const checkTimer = setInterval(async () => {
      try {
        const res = await rosApi.getStatus();
        if (res.connected) {
          clearInterval(timer);
          clearInterval(checkTimer);
          setPhase('success');
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2000);
        }
      } catch {
        // Still rebooting, keep waiting
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(checkTimer);
    };
  }, [phase, onClose]);

  const handleStartReboot = async () => {
    try {
      setErrorMsg(null);
      await rosApi.rebootSystem();
      setPhase('rebooting');
      setCountdown(45);
    } catch (err: any) {
      // If network was dropped immediately, that means reboot started!
      setPhase('rebooting');
      setCountdown(45);
    }
  };

  if (!isOpen) return null;

  const deviceLabel = deviceInfo?.['board-name'] || config?.host || '当前路由器';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Phase 1: Confirm */}
        {phase === 'confirm' && (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{t('modal.rebootTitle')}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{deviceLabel}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="my-5 space-y-3">
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t('modal.rebootWarning')}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="text-slate-200">{config?.host}:{config?.port}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="text-slate-200">{deviceInfo?.['board-name'] || 'RouterOS v7'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="text-slate-200">{deviceInfo?.uptime || '--'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-xl cursor-pointer transition font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleStartReboot}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs py-2.5 rounded-xl transition cursor-pointer font-medium shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('header.reboot', '重启设备')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Rebooting countdown */}
        {phase === 'rebooting' && (
          <div className="text-center py-4 space-y-5">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <RotateCcw className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-100">{t('modal.rebootCountdown')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Reboot signal sent. Monitoring connectivity...
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 max-w-xs mx-auto">
              <div className="text-2xl font-bold font-mono text-blue-400">
                {countdown} <span className="text-xs text-slate-400 font-normal">s</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((45 - countdown) / 45) * 100)}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              The page will automatically refresh once the router is back online.
            </p>
          </div>
        )}

        {/* Phase 3: Success */}
        {phase === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Online!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Router restored. Reloading console...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

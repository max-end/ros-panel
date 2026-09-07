import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/authContext.js';
import { useI18n } from '../i18n/context.js';
import { Router, Server, KeyRound, User, Sparkles, AlertCircle, ArrowRight, Globe } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  const { language, toggleLanguage, t } = useI18n();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [host, setHost] = useState('192.168.88.1');
  const [port, setPort] = useState('443');
  const [useTls, setUseTls] = useState(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rejectUnauthorized, setRejectUnauthorized] = useState(false);
  const [rememberCredentials, setRememberCredentials] = useState(true);

  // Load saved credentials or active draft on mount
  useEffect(() => {
    try {
      // Priority 1: Check sessionStorage draft (in case of browser refresh during editing)
      const draft = sessionStorage.getItem('ros_login_draft');
      if (draft) {
        const data = JSON.parse(draft);
        if (data.host) setHost(data.host);
        if (data.port) setPort(String(data.port));
        if (data.useTls !== undefined) setUseTls(data.useTls);
        if (data.username) setUsername(data.username);
        if (data.password !== undefined) setPassword(data.password);
        if (data.rejectUnauthorized !== undefined) setRejectUnauthorized(data.rejectUnauthorized);
        if (data.rememberCredentials !== undefined) setRememberCredentials(data.rememberCredentials);
        return;
      }

      // Priority 2: Check localStorage saved credentials
      const saved = localStorage.getItem('ros_saved_credentials');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.host) setHost(data.host);
        if (data.port) setPort(String(data.port));
        if (data.useTls !== undefined) setUseTls(data.useTls);
        if (data.username) setUsername(data.username);
        if (data.password !== undefined) setPassword(data.password);
        if (data.rejectUnauthorized !== undefined) setRejectUnauthorized(data.rejectUnauthorized);
        setRememberCredentials(true);
      }
    } catch (e) {
      console.error('Failed to parse saved credentials or draft', e);
    }
  }, []);

  // Synchronize user inputs to sessionStorage draft to prevent accidental loss
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'ros_login_draft',
        JSON.stringify({
          host,
          port,
          useTls,
          username,
          password,
          rejectUnauthorized,
          rememberCredentials,
        })
      );
    } catch {
      // ignore
    }
  }, [host, port, useTls, username, password, rejectUnauthorized, rememberCredentials]);

  // Focus password input when an error is returned
  useEffect(() => {
    if (error && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login({
      host,
      port: Number(port),
      useTls,
      username,
      password,
      rejectUnauthorized,
      isDemo: false,
    });

    if (ok) {
      // Clear temporary draft upon successful login
      sessionStorage.removeItem('ros_login_draft');

      if (rememberCredentials) {
        try {
          localStorage.setItem(
            'ros_saved_credentials',
            JSON.stringify({
              host,
              port: Number(port),
              useTls,
              username,
              password,
              rejectUnauthorized,
            })
          );
        } catch (e) {
          console.error('Failed to save credentials', e);
        }
      } else {
        localStorage.removeItem('ros_saved_credentials');
      }
    }
  };

  const handleDemoLogin = async () => {
    const ok = await login({
      host: 'demo.mikrotik.local',
      port: 443,
      useTls: true,
      username: 'admin',
      password: '',
      rejectUnauthorized: false,
      isDemo: true,
    });
    if (ok) {
      sessionStorage.removeItem('ros_login_draft');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-blue-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition cursor-pointer font-medium shadow-md"
          title="切换界面语言 / Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>{language === 'zh' ? 'English' : '简体中文'}</span>
        </button>
      </div>

      {/* Ambient background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400 mb-4 shadow-xl shadow-blue-500/10">
            <Router className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{t('login.title')}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Connection Failed</p>
                <p className="opacity-90 mt-0.5 break-all leading-relaxed">{error}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Please verify the IP address, port, username or password and retry.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Host & Protocol */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>{t('login.host')}</span>
                <span className="text-[10px] text-slate-500">IP / Domain</span>
              </label>
              <div className="flex gap-2">
                <select
                  disabled={loading}
                  value={useTls ? 'https' : 'http'}
                  onChange={(e) => {
                    const isHttps = e.target.value === 'https';
                    setUseTls(isHttps);
                    setPort(isHttps ? '443' : '80');
                  }}
                  className="bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer disabled:opacity-60"
                >
                  <option value="https">HTTPS</option>
                  <option value="http">HTTP</option>
                </select>

                <div className="relative flex-1">
                  <Server className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="192.168.88.1"
                    className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:opacity-60"
                  />
                </div>

                <input
                  type="number"
                  required
                  disabled={loading}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder={t('login.port')}
                  className="w-20 bg-slate-800/90 border border-slate-700 text-slate-100 text-xs rounded-xl px-2.5 py-2 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:opacity-60"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t('login.username')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t('login.password')}</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  ref={passwordRef}
                  type="password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:opacity-60"
                />
              </div>
            </div>

            {/* Options: Remember credentials & Self-signed SSL */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember-credentials"
                    disabled={loading}
                    checked={rememberCredentials}
                    onChange={(e) => setRememberCredentials(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-60"
                  />
                  <label
                    htmlFor="remember-credentials"
                    className="text-xs text-slate-300 cursor-pointer font-medium select-none"
                  >
                    {t('login.remember')}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ssl-verify"
                  disabled={loading}
                  checked={!rejectUnauthorized}
                  onChange={(e) => setRejectUnauthorized(!e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-60"
                />
                <label htmlFor="ssl-verify" className="text-xs text-slate-400 cursor-pointer select-none">
                  Allow self-signed SSL certificates
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{t('login.connecting')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.submit')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('login.demo')}</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2">
              {t('login.securityNotice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

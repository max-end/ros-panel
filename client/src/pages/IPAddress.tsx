import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosIpAddress, RosInterface } from '../types/index.js';
import { useI18n } from '../i18n/context.js';
import { Binary, Plus, Trash2, RefreshCw, X, Check } from 'lucide-react';

export const IPAddress: React.FC = () => {
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<RosIpAddress[]>([]);
  const [interfaces, setInterfaces] = useState<RosInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newAddress, setNewAddress] = useState('');
  const [newInterface, setNewInterface] = useState('');
  const [newComment, setNewComment] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [addrList, ifaceList] = await Promise.all([
        rosApi.getIpAddresses(),
        rosApi.getInterfaces().catch(() => []),
      ]);
      setAddresses(addrList);
      setInterfaces(ifaceList);
      if (ifaceList.length > 0 && !newInterface) {
        setNewInterface(ifaceList[0].name);
      }
    } catch (err) {
      console.error('Failed to load IP addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress || !newInterface) return;
    try {
      setSubmitting(true);
      await rosApi.addIpAddress({
        address: newAddress,
        interface: newInterface,
        comment: newComment,
      });
      setShowAddModal(false);
      setNewAddress('');
      setNewComment('');
      await fetchData();
    } catch (err: any) {
      alert('添加 IP 失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIp = async (id: string, addr: string) => {
    if (!confirm(`确定要移除 IP 地址 ${addr} 吗？`)) return;
    try {
      await rosApi.removeIpAddress(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Binary className="w-5 h-5 text-blue-400" />
            <span>{t('ip.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('ip.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('ip.newIp')}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">{t('common.address')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.network')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.interface')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.type')}</th>
                <th className="py-3.5 px-4 font-medium">{t('common.comment')}</th>
                <th className="py-3.5 px-4 font-medium text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {addresses.map((item) => {
                const isDynamic = item.dynamic === 'true' || item.dynamic === true;
                const isDisabled = item.disabled === 'true' || item.disabled === true;

                return (
                  <tr key={item['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {item.address}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {item.network}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700/60 font-mono text-[11px]">
                        {item.interface}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        {isDynamic ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {t('common.dynamic')}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {t('common.static')}
                          </span>
                        )}
                        {isDisabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                            {t('common.disabled')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.comment || <span className="text-slate-600 italic">--</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isDynamic && (
                        <button
                          onClick={() => handleDeleteIp(item['.id'], item.address)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {addresses.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-100">{t('ip.newIp')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIp} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('ip.addressWithMask')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.10.1/24"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('ip.selectInterface')}
                </label>
                <select
                  value={newInterface}
                  onChange={(e) => setNewInterface(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {interfaces.map((i) => (
                    <option key={i['.id']} value={i.name}>
                      {i.name} ({i.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t('common.comment')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Gateway"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

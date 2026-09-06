import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosSimpleQueue } from '../types/index.js';
import { Sliders, Plus, RefreshCw, Power, Trash2, X, Gauge } from 'lucide-react';

export const Queues: React.FC = () => {
  const [queues, setQueues] = useState<RosSimpleQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add Queue Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [qName, setQName] = useState('');
  const [qTarget, setQTarget] = useState('');
  const [qUploadLimit, setQUploadLimit] = useState('10M');
  const [qDownloadLimit, setQDownloadLimit] = useState('30M');
  const [qComment, setQComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await rosApi.getSimpleQueues();
      setQueues(list);
    } catch (err) {
      console.error('Failed to load queues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (q: RosSimpleQueue) => {
    const isCurrentlyDisabled = q.disabled === 'true' || q.disabled === true;
    try {
      setBusyId(q['.id']);
      await rosApi.toggleSimpleQueue(q['.id'], !isCurrentlyDisabled);
      await fetchData();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除限速规则 "${name}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeSimpleQueue(id);
      await fetchData();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qName || !qTarget) return;
    try {
      setSubmitting(true);
      const maxLimit = `${qUploadLimit}/${qDownloadLimit}`;
      await rosApi.addSimpleQueue({
        name: qName,
        target: qTarget,
        maxLimit,
        comment: qComment || undefined,
      });
      setShowAddModal(false);
      setQName('');
      setQTarget('');
      setQComment('');
      await fetchData();
    } catch (err: any) {
      alert('添加限速规则失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>带宽限速管理 (Simple Queues / QoS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            针对单个局域网 IP 或子网网段设置上传和下载最高速率限制
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加限速规则</span>
          </button>
        </div>
      </div>

      {/* Queues Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">状态</th>
                <th className="py-3.5 px-4 font-medium">规则名称</th>
                <th className="py-3.5 px-4 font-medium">目标主机 / 网段 (Target)</th>
                <th className="py-3.5 px-4 font-medium">速率上限 (上传 / 下载)</th>
                <th className="py-3.5 px-4 font-medium">实时速率</th>
                <th className="py-3.5 px-4 font-medium">注释说明</th>
                <th className="py-3.5 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {queues.map((q) => {
                const isDisabled = q.disabled === 'true' || q.disabled === true;
                const isBusy = busyId === q['.id'];

                return (
                  <tr key={q['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {isDisabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-500 border border-slate-700">
                          已禁用
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          生效中
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-100">
                      {q.name}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {q.target}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-semibold">
                        {q['max-limit']}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {q.rate || '--'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {q.comment || '--'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(q)}
                          disabled={isBusy}
                          className={`p-1 rounded transition cursor-pointer ${
                            isDisabled
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                          }`}
                          title={isDisabled ? '启用' : '禁用'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(q['.id'], q.name)}
                          disabled={isBusy}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="删除限速"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {queues.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    暂无限速规则
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-100">创建简单限速规则</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQueue} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">规则名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如: Guest-Wifi-Cap 或 Client-Limit"
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  目标 IP 或网段 (Target CIDR)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: 192.168.88.50/32 或 192.168.88.0/24"
                  value={qTarget}
                  onChange={(e) => setQTarget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">上传限制</label>
                  <select
                    value={qUploadLimit}
                    onChange={(e) => setQUploadLimit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="2M">2M bps</option>
                    <option value="5M">5M bps</option>
                    <option value="10M">10M bps</option>
                    <option value="20M">20M bps</option>
                    <option value="50M">50M bps</option>
                    <option value="100M">100M bps</option>
                    <option value="unlimited">不限速 (unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">下载限制</label>
                  <select
                    value={qDownloadLimit}
                    onChange={(e) => setQDownloadLimit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="5M">5M bps</option>
                    <option value="10M">10M bps</option>
                    <option value="20M">20M bps</option>
                    <option value="30M">30M bps</option>
                    <option value="50M">50M bps</option>
                    <option value="100M">100M bps</option>
                    <option value="200M">200M bps</option>
                    <option value="unlimited">不限速 (unlimited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  注释备注 (选填)
                </label>
                <input
                  type="text"
                  placeholder="限速说明"
                  value={qComment}
                  onChange={(e) => setQComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submitting ? '保存中...' : '确认下发'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

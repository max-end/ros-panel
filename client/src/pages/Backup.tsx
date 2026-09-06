import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosFile } from '../types/index.js';
import {
  HardDriveDownload,
  FileCode,
  Download,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Trash2,
  FileArchive,
  Lock,
  X,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const Backup: React.FC = () => {
  const [files, setFiles] = useState<RosFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportText, setExportText] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Create Backup Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const list = await rosApi.getFiles();
      setFiles(list);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const text = await rosApi.exportConfig();
      setExportText(text);
    } catch (err: any) {
      alert('导出配置失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    handleExport();
  }, []);

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportText);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleDownloadRsc = () => {
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routeros-export-${new Date().toISOString().slice(0, 10)}.rsc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await rosApi.createBackup(backupName || undefined, backupPassword || undefined);
      setShowCreateModal(false);
      setBackupName('');
      setBackupPassword('');
      await fetchFiles();
      alert('系统备份创建成功！');
    } catch (err: any) {
      alert('创建备份失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFile = async (id: string, name: string) => {
    if (!confirm(`确定要永久删除备份文件 "${name}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeFile(id);
      await fetchFiles();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HardDriveDownload className="w-5 h-5 text-blue-400" />
            <span>系统配置备份与导出中心 (Backup & Export)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            生成 RouterOS 纯文本命令配置脚本 (.rsc) 或全量快照镜像 (.backup)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建系统快照备份 (.backup)</span>
          </button>
        </div>
      </div>

      {/* Configuration Script Export Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
              RouterOS 纯文本配置脚本 (/export)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              {exportLoading ? '正在导出...' : '重新导出'}
            </button>

            <button
              onClick={handleCopyExport}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedExport ? '已复制' : '复制脚本'}</span>
            </button>

            <button
              onClick={handleDownloadRsc}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .rsc 脚本</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto leading-relaxed select-all">
          <pre>{exportText || '# 正在导出配置脚本...'}</pre>
        </div>
      </div>

      {/* Binary Backups List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
            存储空间备份与文件列表 (RouterOS Storage Files)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">文件名 (File Name)</th>
                <th className="py-3.5 px-4 font-medium">文件类型</th>
                <th className="py-3.5 px-4 font-medium">文件大小</th>
                <th className="py-3.5 px-4 font-medium">创建时间</th>
                <th className="py-3.5 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {files.map((file) => (
                <tr key={file['.id']} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-blue-400" />
                    <span>{file.name}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {file.type || 'backup'}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-300">
                    {formatBytes(Number(file.size))}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400">
                    {file['creation-time']}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteFile(file['.id'], file.name)}
                      disabled={busyId === file['.id']}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                      title="删除备份文件"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {files.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    存储空间中暂无备份文件
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">创建全量系统快照备份</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBackup} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  备份文件名前缀 (选填)
                </label>
                <input
                  type="text"
                  placeholder="例如: office-core-backup"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  加密保护密码 (选填，防止备份泄露)
                </label>
                <input
                  type="password"
                  placeholder="留空则不设加密密码"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {creating ? '备份打包中...' : '立即创建备份'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

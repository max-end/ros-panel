import React, { useEffect, useState } from 'react';
import { rosApi } from '../api/client.js';
import { RosUser } from '../types/index.js';
import {
  UserCheck,
  Plus,
  RefreshCw,
  Trash2,
  Power,
  Key,
  Shield,
  X,
  Lock,
  User,
} from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<RosUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add User Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGroup, setNewGroup] = useState('full');
  const [newComment, setNewComment] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Change Password Modal state
  const [passwordUser, setPasswordUser] = useState<RosUser | null>(null);
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await rosApi.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (user: RosUser) => {
    const isCurrentlyDisabled = user.disabled === 'true' || user.disabled === true;
    try {
      setBusyId(user['.id']);
      await rosApi.toggleUser(user['.id'], !isCurrentlyDisabled);
      await fetchUsers();
    } catch (err: any) {
      alert('操作失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (name === 'admin') {
      alert('保护安全提示: 不能删除系统主管理员 admin！');
      return;
    }
    if (!confirm(`确定要移除管理员用户 "${name}" 吗？`)) return;
    try {
      setBusyId(id);
      await rosApi.removeUser(id);
      await fetchUsers();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      setSubmittingAdd(true);
      await rosApi.addUser({
        name: newName,
        password: newPassword || undefined,
        group: newGroup,
        comment: newComment || undefined,
      });
      setShowAddModal(false);
      setNewName('');
      setNewPassword('');
      setNewComment('');
      await fetchUsers();
    } catch (err: any) {
      alert('添加用户失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser || !updatedPassword) return;
    try {
      setSubmittingPassword(true);
      await rosApi.updateUserPassword(passwordUser['.id'], updatedPassword);
      alert(`已成功更新用户 ${passwordUser.name} 的登录密码！`);
      setPasswordUser(null);
      setUpdatedPassword('');
    } catch (err: any) {
      alert('修改密码失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <span>系统用户与权限管理 (Users & Security)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            配置 RouterOS 访问账号、权限组角色 (full / write / read) 与密码管控
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
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
            <span>新建管理员用户</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4 font-medium">登录用户名</th>
                <th className="py-3.5 px-4 font-medium">权限角色组 (Group)</th>
                <th className="py-3.5 px-4 font-medium">上次登录时间</th>
                <th className="py-3.5 px-4 font-medium">账号状态</th>
                <th className="py-3.5 px-4 font-medium">注释备注</th>
                <th className="py-3.5 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((user) => {
                const isDisabled = user.disabled === 'true' || user.disabled === true;
                const isBusy = busyId === user['.id'];

                return (
                  <tr key={user['.id']} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>{user.name}</span>
                    </td>

                    <td className="py-3 px-4">
                      {user.group === 'full' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          full (超级管理)
                        </span>
                      ) : user.group === 'write' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                          write (配置运维)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                          read (只读审计)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {user['last-logged-in'] || '从未登录'}
                    </td>

                    <td className="py-3 px-4">
                      {isDisabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                          已禁用
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          正常生效
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">
                      {user.comment || '--'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPasswordUser(user)}
                          className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="修改登录密码"
                        >
                          <Key className="w-3 h-3" />
                          <span>改密</span>
                        </button>

                        <button
                          onClick={() => handleToggle(user)}
                          disabled={isBusy}
                          className={`p-1 rounded transition cursor-pointer ${
                            isDisabled
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                          }`}
                          title={isDisabled ? '启用账号' : '禁用账号'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {user.name !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user['.id'], user.name)}
                            disabled={isBusy}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                            title="删除账号"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-100">新建管理员用户</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  登录用户名
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: operator1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  登录密码 (选填)
                </label>
                <input
                  type="password"
                  placeholder="留空则初始无密码"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  所属权限组 (Permission Group)
                </label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="full">full (超级管理员 - 拥有全权)</option>
                  <option value="write">write (读写操作员 - 允许修改无法改权限)</option>
                  <option value="read">read (只读审计员 - 仅允许查看数据)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  注释说明
                </label>
                <input
                  type="text"
                  placeholder="例如: 外包工程师巡检账号"
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
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingAdd ? '创建中...' : '创建账号'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-slate-100">
                  修改登录密码 ({passwordUser.name})
                </h3>
              </div>
              <button
                onClick={() => setPasswordUser(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  请输入新密码
                </label>
                <input
                  type="password"
                  required
                  placeholder="至少 6 位复杂字符"
                  value={updatedPassword}
                  onChange={(e) => setUpdatedPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {submittingPassword ? '更新中...' : '确认更新密码'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

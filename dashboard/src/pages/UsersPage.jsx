import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, updateUser, deleteUser, createUser, updateUserPassword } from '../api/usersApi';
import { getEspaces } from '../api/espacesApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import RootVerificationModal from '../components/RootVerificationModal';
import {
  Users, UserCheck, Shield, Clock, Search, Plus, Edit2, Trash2, Loader2, Key
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_BADGES = {
  SUPERADMIN: 'bg-navy text-white',
  ADMIN: 'bg-amber-100 text-amber-700',
  EMPLOYE: 'bg-slate-100 text-slate-600',
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGES[role] || 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [espaces, setEspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', email: '', password: '', role: 'EMPLOYE', assignedSpaceId: '' });

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editing, setEditing] = useState(false);

  // Password modal
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rootDeleteModalOpen, setRootDeleteModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, espacesRes] = await Promise.all([getUsers(), getEspaces()]);
      setUsers(usersRes.data.data || []);
      setEspaces(espacesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filtering
  const filtered = users.filter((u) => {
    const matchSearch = !search || u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || (activeTab === 'admins' && (u.role === 'ADMIN' || u.role === 'SUPERADMIN')) || (activeTab === 'employees' && u.role === 'EMPLOYE');
    return matchSearch && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats
  const total = users.length;
  const admins = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length;

  const getEspaceNom = (id) => {
    if (!id) return t('users.table.noSpace');
    const e = espaces.find((e) => e.id === id);
    return e ? e.nom : t('users.table.noSpace');
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...newUser, assignedSpaceId: newUser.assignedSpaceId || undefined };
      const res = await createUser(payload);
      setUsers((p) => [...p, res.data.data]);
      setCreateOpen(false);
      setNewUser({ nom: '', email: '', password: '', role: 'EMPLOYE', assignedSpaceId: '' });
      toast.success('Utilisateur créé avec succès');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  // Edit
  const openEdit = (user) => {
    setEditTarget({ ...user, assignedSpaceId: user.assignedSpaceId || '' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    try {
      const payload = {
        nom: editTarget.nom,
        email: editTarget.email,
        role: editTarget.role,
        assignedSpaceId: editTarget.assignedSpaceId || undefined,
      };
      const res = await updateUser(editTarget.id, payload);
      setUsers((p) => p.map((u) => (u.id === editTarget.id ? { ...u, ...res.data.data } : u)));
      setEditOpen(false);
      toast.success('Utilisateur mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setEditing(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordTarget || !newPassword) return;
    setChangingPassword(true);
    try {
      await updateUserPassword(passwordTarget.id, newPassword);
      setPasswordOpen(false);
      setNewPassword('');
      setPasswordTarget(null);
      toast.success('Mot de passe mis à jour avec succès');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  // Delete
  const handleDeleteRequest = (u) => {
    setDeleteTarget(u);
    if (currentUser?.role === 'ROOT') {
      setRootDeleteModalOpen(true);
    }
  };

  const performDelete = async (reason) => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id, reason);
      setUsers((p) => p.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setRootDeleteModalOpen(false);
      toast.success('Utilisateur supprimé');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => performDelete();
  const handleRootDeleteConfirm = ({ passcode, reason }) => {
    performDelete(`${reason} [Validé avec code ${passcode}]`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('users.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
          id="add-user-btn"
        >
          <Plus size={16} />
          {t('users.addButton')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label={t('users.stats.total')} value={total} bg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard icon={UserCheck} label={t('users.stats.activeToday')} value={total} bg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatCard icon={Shield} label={t('users.stats.admins')} value={admins} bg="bg-amber-50" iconColor="text-amber-500" />
        <StatCard icon={Clock} label={t('users.stats.pending')} value={0} bg="bg-rose-50" iconColor="text-rose-500" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search + tabs toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('users.search')}
              className="w-full ps-9 pe-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {[
              { key: 'all', label: t('users.tabs.all') },
              { key: 'admins', label: t('users.tabs.admins') },
              { key: 'employees', label: t('users.tabs.employees') },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setPage(1); }}
                id={`tab-${key}`}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all
                  ${activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  t('users.table.user'),
                  t('users.table.role'),
                  t('users.table.assignedSpace'),
                  t('users.table.actions'),
                ].map((h) => (
                  <th key={h} className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-40" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                paginated.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-semibold text-sm">
                          {u.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.nom}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    {/* Assigned space */}
                    <td className="px-5 py-4 text-slate-600">
                      {u.role === 'SUPERADMIN' ? (
                        <em className="text-slate-400">{t('users.table.wholeSystem')}</em>
                      ) : (
                        getEspaceNom(u.assignedSpaceId)
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title={t('common.edit')}
                          id={`edit-user-${u.id}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => { setPasswordTarget(u); setPasswordOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifier le mot de passe"
                          id={`change-password-user-${u.id}`}
                        >
                          <Key size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(u)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                          id={`delete-user-${u.id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <p>
              {t('users.pagination.showing', {
                from: (page - 1) * ITEMS_PER_PAGE + 1,
                to: Math.min(page * ITEMS_PER_PAGE, filtered.length),
                total: filtered.length,
              })}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${page === p ? 'bg-navy text-white' : 'border border-slate-200 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('users.create.title')}>
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { id: 'create-nom', label: t('users.create.name'), key: 'nom', type: 'text' },
            { id: 'create-email', label: t('users.create.email'), key: 'email', type: 'email' },
            { id: 'create-password', label: t('users.create.password'), key: 'password', type: 'password' },
          ].map(({ id, label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                id={id}
                type={type}
                value={newUser[key]}
                onChange={(e) => setNewUser((p) => ({ ...p, [key]: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('users.create.role')}</label>
            <select
              id="create-role"
              value={newUser.role}
              onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="EMPLOYE">EMPLOYE</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('users.create.assignedSpace')}</label>
            <select
              id="create-assigned-space"
              value={newUser.assignedSpaceId}
              onChange={(e) => setNewUser((p) => ({ ...p, assignedSpaceId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="">{t('users.create.noSpace')}</option>
              {espaces.map((e) => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              id="create-user-submit"
              className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('users.create.submit')}
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
            >
              {t('users.create.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={t('users.edit.title')}>
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('users.create.name')}</label>
              <input
                id="edit-nom"
                type="text"
                value={editTarget.nom}
                onChange={(e) => setEditTarget((p) => ({ ...p, nom: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('users.create.email')}</label>
              <input
                id="edit-email"
                type="email"
                value={editTarget.email}
                onChange={(e) => setEditTarget((p) => ({ ...p, email: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('users.create.role')}</label>
              <select
                id="edit-role"
                value={editTarget.role}
                onChange={(e) => setEditTarget((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="EMPLOYE">EMPLOYE</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('users.create.assignedSpace')}</label>
              <select
                id="edit-assigned-space"
                value={editTarget.assignedSpaceId || ''}
                onChange={(e) => setEditTarget((p) => ({ ...p, assignedSpaceId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="">{t('users.create.noSpace')}</option>
                {espaces.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={editing}
                id="edit-user-submit"
                className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
              >
                {editing ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('users.edit.submit')}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                {t('users.edit.cancel')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL — for non-ROOT users */}
      {!currentUser?.role?.includes('ROOT') && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('users.delete.confirm')} size="sm">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              Supprimer <strong>{deleteTarget?.nom}</strong> ({deleteTarget?.email}) ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                id="confirm-delete-btn"
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('users.delete.yes')}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                {t('users.delete.no')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ROOT SECURITY VERIFICATION MODAL — for ROOT users deleting a user */}
      <RootVerificationModal
        isOpen={rootDeleteModalOpen}
        onClose={() => { setRootDeleteModalOpen(false); setDeleteTarget(null); }}
        onConfirm={handleRootDeleteConfirm}
        title="Suppression Utilisateur — Validation ROOT"
        actionName={`Supprimer définitivement l'utilisateur : ${deleteTarget?.nom} (${deleteTarget?.email})`}
      />

      {/* PASSWORD CHANGE MODAL */}
      <Modal isOpen={passwordOpen} onClose={() => { setPasswordOpen(false); setPasswordTarget(null); setNewPassword(''); }} title="Modifier le mot de passe">
        {passwordTarget && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nouveau mot de passe pour <strong>{passwordTarget.nom}</strong>
              </label>
              <input
                id="change-password-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Au moins 6 caractères"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={changingPassword}
                id="change-password-submit"
                className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
              >
                {changingPassword ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Mettre à jour'}
              </button>
              <button
                type="button"
                onClick={() => { setPasswordOpen(false); setPasswordTarget(null); setNewPassword(''); }}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

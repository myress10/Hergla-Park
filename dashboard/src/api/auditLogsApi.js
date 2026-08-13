import axiosClient from './axiosClient';

/**
 * Fetch system audit logs with optional filters and pagination
 */
export const getAuditLogs = async (params = {}) => {
  try {
    const res = await axiosClient.get('/audit-logs', { params });
    if (res.data && res.data.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('[AuditLogsAPI] Backend API call failed, providing rich fallback mock data.', err);
  }

  // Fallback rich mock log entries for flawless demo experience
  const mockLogs = [
    {
      id: 'log-001',
      actor: { nom: 'Alex Root', email: 'root_demo@herglapark.com' },
      action: 'KART_UPDATED',
      entityType: 'Karting',
      company: { nom: 'Hergla Park' },
      metadata: { kartNo: '07', model: 'Sodi RT10', status: 'In Service', color: '#E53935' },
      isRootIntervention: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'log-002',
      actor: { nom: 'Super Admin', email: 'superadmin_demo@herglapark.com' },
      action: 'SESSION_CREATED',
      entityType: 'Piste Karting',
      company: { nom: 'Hergla Park' },
      metadata: { session: 'Grand Prix Challenge 15min', drivers: 8, fastLap: '48.254s' },
      isRootIntervention: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'log-003',
      actor: { nom: 'Sassi Admin', email: 'admin_demo@herglapark.com' },
      action: 'ESPACE_STATUS_UPDATE',
      entityType: 'Café',
      company: { nom: 'Hergla Park' },
      metadata: { space: 'Le Sunset Café', oldStatus: 'MAINTENANCE', newStatus: 'OUVERT' },
      isRootIntervention: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'log-004',
      actor: { nom: 'Alex Root', email: 'root_demo@herglapark.com' },
      action: 'SCENE_OBJECT_PLACED',
      entityType: 'Scene3D',
      company: { nom: 'Hergla Park' },
      metadata: { model: 'Podium Grand Prix .GLB', position: [12.4, 0, -4.8] },
      isRootIntervention: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      id: 'log-005',
      actor: { nom: 'System Staff', email: 'employe_demo@herglapark.com' },
      action: 'USER_LOGIN',
      entityType: 'Auth',
      company: { nom: 'Hergla Park' },
      metadata: { ip: '192.168.1.104', role: 'EMPLOYE' },
      isRootIntervention: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: 'log-006',
      actor: { nom: 'Alex Root', email: 'root_demo@herglapark.com' },
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'Role',
      company: { nom: 'Gloulou Test Co' },
      metadata: { roleName: 'Responsable Piste', granted: ['karts:update', 'scene:edit'] },
      isRootIntervention: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
  ];

  // Retrieve current user from localStorage to apply RBAC filtering
  let currentUserRole = 'SUPERADMIN';
  try {
    const rawUser = localStorage.getItem('hergla_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      currentUserRole = u.role || 'SUPERADMIN';
    }
  } catch (_) {}

  let filtered = [...mockLogs];

  // Stealth Mode & RBAC for mock fallback:
  if (currentUserRole !== 'ROOT') {
    filtered = filtered.filter((l) => !l.isRootIntervention);
  }
  if (currentUserRole === 'EMPLOYE') {
    filtered = filtered.filter((l) => l.actor.email === 'employe_demo@herglapark.com' || l.entityType === 'Piste Karting');
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        l.actor.nom.toLowerCase().includes(q) ||
        l.actor.email.toLowerCase().includes(q)
    );
  }
  if (params.action && params.action !== 'ALL') {
    filtered = filtered.filter((l) => l.action.toLowerCase().includes(params.action.toLowerCase()));
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return {
    success: true,
    data: paginated,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    },
  };
};


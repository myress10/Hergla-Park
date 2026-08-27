import axiosClient from './axiosClient';

/**
 * Get active company plan, quotas, usage metrics, and pending requests
 */
export const getMyPlan = (companyId) => {
  const params = companyId ? { companyId } : {};
  return axiosClient.get('/subscriptions/my-plan', { params });
};

/**
 * Submit an upgrade request (Superadmin / Root)
 */
export const requestUpgrade = ({ targetPack, notes, contactPhone, companyId }) => {
  const params = companyId ? { companyId } : {};
  return axiosClient.post(
    '/subscriptions/upgrade-request',
    { targetPack, notes, contactPhone },
    { params }
  );
};

/**
 * List all upgrade requests across companies (ROOT only)
 */
export const getRootUpgradeRequests = (status) => {
  const params = status ? { status } : {};
  return axiosClient.get('/subscriptions/root/requests', { params });
};

/**
 * Approve an upgrade request (ROOT only)
 */
export const approveUpgradeRequest = (requestId, adminResponse) => {
  return axiosClient.post(`/subscriptions/root/requests/${requestId}/approve`, {
    adminResponse,
  });
};

/**
 * Reject an upgrade request (ROOT only)
 */
export const rejectUpgradeRequest = (requestId, adminResponse) => {
  return axiosClient.post(`/subscriptions/root/requests/${requestId}/reject`, {
    adminResponse,
  });
};

/**
 * Manually update company pack (ROOT only)
 */
export const updateCompanyPackDirectly = (companyId, pack, reason) => {
  return axiosClient.patch(`/subscriptions/root/company/${companyId}/pack`, {
    pack,
    reason,
  });
};


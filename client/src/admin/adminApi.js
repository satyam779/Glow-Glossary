import { api, ApiError } from '../lib/api';

// Admin API calls. A 401 means the session ended: send the admin back to the login page.
export async function adminApi(path, options) {
  try {
    return await api(`/admin${path}`, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !path.startsWith('/login')) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/admin/login?next=${next}`);
    }
    throw err;
  }
}

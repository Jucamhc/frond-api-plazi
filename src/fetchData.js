const API_BASE = import.meta.env.VITE_API_URL || '';

export function fetchData(user) {
  return fetch(`${API_BASE}/api_profile/${user}`)
    .then((response) => response.json());
}

export function fetchData(user) {
  
    return fetch(`https://burly-discussion-production.up.railway.app/api_profile/${user}`)
      .then((response) => response.json());
  }

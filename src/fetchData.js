export function fetchData(user) {
    return fetch(`https://api-platzi-profile-production.up.railway.app/api_profile/${user}`)
      .then((response) => response.json());
  }

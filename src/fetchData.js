export function fetchData(user) {
  
    return fetch(`https://api-platzi-profile.hop.sh/api_profile/${user}`)
      .then((response) => response.json());
  }

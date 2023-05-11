export function fetchData(user) {
    return fetch(`https://api-platzi-profile.hop.sh/api_profile/AndresLaguilavo/${user}`)
      .then((response) => response.json());
  }

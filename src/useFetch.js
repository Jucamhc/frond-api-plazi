import { useState, useEffect } from "react";

export function useFetch() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch('https://api-platzi-profile-production.up.railway.app/api_profile/freddier')
            .then((response) => response.json())
            .then((data) => setData(data))
            .finally(() => setLoading(false))
    }, []);

    return { data, loading };
}
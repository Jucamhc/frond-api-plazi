import express from 'express';
import cors from 'cors';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();

app.use(express.json());
app.use(cors());

/* ─── Caché en memoria (TTL: 5 min) ────────────────── */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { cache.delete(key); return null; }
    return entry.data;
}
function setCache(key, data) {
    cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

/* ─── Headers ───────────────────────────────────────── */
const PAGE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

const API_HEADERS = {
    'accept': '*/*',
    'accept-language': 'es',
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'origin': 'https://platzi.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'x-requested-with': 'XMLHttpRequest',
};

const DIPLOMAS_PAGE_SIZE = 9;

/* ─── Validación de username ────────────────────────── */
const VALID_USERNAME = /^[a-zA-Z0-9_.-]{1,80}$/;

/* ─── Extrae studentProfile del payload RSC del HTML ── */
function extractStudentProfile(html) {
    const spIdx = html.indexOf('studentProfile\\":');
    if (spIdx === -1) return null;

    const pushMarker = 'self.__next_f.push([1,"';
    let pushStart = -1;
    for (let i = spIdx; i >= 0; i--) {
        if (html.slice(i, i + pushMarker.length) === pushMarker) {
            pushStart = i + pushMarker.length;
            break;
        }
    }
    if (pushStart === -1) return null;

    const pushEnd = html.indexOf('"])', spIdx);
    if (pushEnd === -1) return null;

    let content;
    try {
        content = JSON.parse('"' + html.slice(pushStart, pushEnd) + '"');
    } catch {
        return null;
    }

    const profileIdx = content.indexOf('"studentProfile":');
    if (profileIdx === -1) return null;

    const objStart = content.indexOf('{', profileIdx);
    if (objStart === -1) return null;

    let depth = 0;
    let objEnd = -1;
    for (let i = objStart; i < content.length; i++) {
        if (content[i] === '{' || content[i] === '[') depth++;
        else if (content[i] === '}' || content[i] === ']') {
            depth--;
            if (depth === 0) { objEnd = i + 1; break; }
        }
    }
    if (objEnd === -1) return null;

    try {
        return JSON.parse(content.slice(objStart, objEnd));
    } catch {
        return null;
    }
}

/* ─── Fetch paralelo de todas las páginas de cursos ── */
async function fetchAllCourses(username) {
    const diplomaHeaders = { ...API_HEADERS, referer: `https://platzi.com/p/${username}/` };
    const url = (page) =>
        `https://api.platzi.com/students/v1/diplomas/${username}/?page=${page}&page_size=${DIPLOMAS_PAGE_SIZE}`;

    // 1. Primera página para saber el total
    const firstRes = await fetch(url(1), { method: 'GET', headers: diplomaHeaders });
    if (!firstRes.ok) {
        console.warn(`[diplomas] página 1 devolvió ${firstRes.status}`);
        return [];
    }
    const firstJson = await firstRes.json();
    const firstCourses = firstJson?.data?.courses ?? [];
    const totalPages = firstJson?.metadata?.pages ?? 1;

    console.log(`[diplomas] ${username} -> ${totalPages} páginas en paralelo`);

    if (totalPages <= 1) return firstCourses;

    // 2. Resto de páginas en paralelo
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const remaining = await Promise.all(
        pageNumbers.map(async (page) => {
            try {
                const res = await fetch(url(page), { method: 'GET', headers: diplomaHeaders });
                if (!res.ok) return [];
                const json = await res.json();
                return json?.data?.courses ?? [];
            } catch {
                return [];
            }
        }),
    );

    return [firstCourses, ...remaining].flat();
}

/* ─── Normaliza un curso con todos sus datos útiles ── */
function normalizeCourse(course) {
    const diploma = course.diploma ?? {};
    return {
        id: course.id,
        title: course.title,
        badge: course.badge_url,
        slug: course.slug,
        completed: course.progress,
        deprecated: course.deprecated ?? false,
        diploma_url: diploma.diploma_url ?? '',
        diploma_image: diploma.diploma_image ?? '',
        approved_date: diploma.approved_date ?? null,
        twitter_share: diploma.twitter_share ?? '',
        facebook_share: diploma.facebook_share ?? '',
        linkedin_share: diploma.linkedin_share ?? '',
        download_url: diploma.download_url ?? null,
        is_paywall_enabled: diploma.is_paywall_enabled ?? false,
    };
}

/* ─── Proxy de imágenes (evita CORS en Canvas) ──────── */
app.get('/api_profile/proxy-image', async (req, res) => {
    const url = req.query.url;
    if (!url || !url.startsWith('https://')) {
        return res.status(400).json({ error: 'URL inválida.' });
    }
    try {
        const imgRes = await fetch(url, { headers: PAGE_HEADERS });
        if (!imgRes.ok) return res.status(imgRes.status).end();
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch {
        res.status(502).json({ error: 'No se pudo obtener la imagen.' });
    }
});

/* ─── Rutas ─────────────────────────────────────────── */
app.get('/', (req, res) => {
    res.json({ message: 'API Platzi Profile. Consulta: /api_profile/:username' });
});

app.get('/api_profile/:id', async (req, res) => {
    const user = req.params.id.trim();

    if (!VALID_USERNAME.test(user)) {
        return res.status(400).json({ error: 'Nombre de usuario inválido.' });
    }

    // Servir desde caché si existe
    const cached = getCached(user.toLowerCase());
    if (cached) {
        console.log(`[cache] HIT ${user}`);
        return res.json(cached);
    }

    try {
        // 1. HTML del perfil
        const pageRes = await fetch(`https://platzi.com/p/${user}/`, {
            method: 'GET',
            headers: PAGE_HEADERS,
            redirect: 'follow',
        });

        console.log(`[profile] ${user} -> ${pageRes.status}`);

        if (pageRes.status === 404) {
            return res.status(404).json({ error: `El usuario "${user}" no existe en Platzi.` });
        }
        if (pageRes.status !== 200) {
            return res.status(pageRes.status).json({ error: 'Error al contactar Platzi.' });
        }

        const html = await pageRes.text();
        const studentProfile = extractStudentProfile(html);

        if (!studentProfile) {
            return res.status(404).json({ error: 'Perfil privado o no encontrado.' });
        }

        // 2. Todos los cursos en paralelo
        const rawCourses = await fetchAllCourses(user);
        const courses = rawCourses.map(normalizeCourse);

        // 3. Respuesta final
        const profile = {
            username: studentProfile.username,
            name: studentProfile.name,
            avatar: studentProfile.avatar,
            badge: studentProfile.badge,
            bio: studentProfile.bio,
            country: studentProfile.country,
            flag: studentProfile.flag,
            points: parseInt(String(studentProfile.points).replace(/[.,\s]/g, ''), 10) || 0,
            answers: parseInt(studentProfile.answers, 10) || 0,
            questions: parseInt(studentProfile.discussions_count, 10) || 0,
            socials: studentProfile.social_links ?? [],
            is_public: studentProfile.is_public_profile,
            courses,
        };

        setCache(user.toLowerCase(), profile);
        res.json(profile);

    } catch (error) {
        console.error('[error]', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API escuchando en el puerto ${PORT}`));

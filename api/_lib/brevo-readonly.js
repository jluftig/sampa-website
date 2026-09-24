const BASE = 'https://api.brevo.com/v3';

export async function brevoGet(apiKey, path, fetchImpl = fetch) {
  const res = await fetchImpl(`${BASE}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.message || `Brevo ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function loadSentCampaigns(apiKey, get = brevoGet) {
  const campaigns = [];
  let offset = 0;
  for (let page = 0; page < 4; page += 1) {
    const data = await get(
      apiKey,
      `/emailCampaigns?status=sent&statistics=globalStats&type=classic&limit=50&offset=${offset}&sort=desc`,
    );
    const batch = Array.isArray(data?.campaigns) ? data.campaigns : [];
    campaigns.push(...batch);
    const total = Number(data?.count);
    offset += batch.length;
    if (!batch.length || !Number.isFinite(total) || offset >= total) break;
  }
  return campaigns;
}

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export function authHeader(){
  const b = localStorage.getItem("auth");
  return b ? { Authorization: `Basic ${b}` } : {};
}

export async function me(){
  const r = await fetch(`${BASE}/auth/me`, { headers: authHeader(), credentials: "include" });
  if(!r.ok) throw new Error("Neautorizovan");
  return r.json();
}

export async function mojaGrla(owner){
  const q = owner ? `?owner=${encodeURIComponent(owner)}` : "";
  const r = await fetch(`${BASE}/grla${q}`, { headers: authHeader() });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getGrlo(id){
  const r = await fetch(`${BASE}/grla/${id}`, { headers: authHeader() });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateGrlo(id, data){
  const r = await fetch(`${BASE}/grla/${id}`, { method:"PUT", headers: {"Content-Type":"application/json", ...authHeader()}, body: JSON.stringify(data)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteGrlo(id){
  const r = await fetch(`${BASE}/grla/${id}`, { method:"DELETE", headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return true;
}

export async function kreirajGrlo(data){
  const r = await fetch(`${BASE}/grla`, { method:"POST", headers: {"Content-Type":"application/json", ...authHeader()}, body: JSON.stringify(data)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adminListUsers(){
  const r = await fetch(`${BASE}/admin/users`, { headers: authHeader() });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adminCreateUser(data){
  const r = await fetch(`${BASE}/admin/users`, { method:"POST", headers: {"Content-Type":"application/json", ...authHeader()}, body: JSON.stringify(data)});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getIzvestaj(owner){
  const q = owner ? `?owner=${encodeURIComponent(owner)}` : "";
  const r = await fetch(`${BASE}/izvestaj${q}`, { headers: authHeader() });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export const TipDogadjaja = { TELJENJE:'TELJENJE', OSEMENJAVANJE:'OSEMENJAVANJE', POTVRDJENA_STEONOST:'POTVRDJENA_STEONOST', ZASUSENJE:'ZASUSENJE' };

export async function dodajDogadjaj(grloId, data, opts = {}){
  const q = opts && opts.force ? `?force=true` : '';
  const r = await fetch(`${BASE}/dogadjaji/${grloId}${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(data)
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function dodajDogadjajBulk(payload){
  const r = await fetch(`${BASE}/dogadjaji/bulkByBroj`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload)
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}


export async function dogadjajiZaGrlo(grloId){
  const r = await fetch(`${BASE}/dogadjaji/${grloId}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function obrisiDogadjaj(dogadjajId){
  const r = await fetch(`${BASE}/dogadjaji/event/${dogadjajId}`, { method: "DELETE", headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return true;
}

export async function adminOwners(){ const r = await fetch(BASE+'/admin/owners', {credentials:'include'}); if(!r.ok) throw new Error(await r.text()); return await r.json(); }
export async function grlaZa(owner){ const r = await fetch(BASE+'/admin/grla?owner='+encodeURIComponent(owner), {credentials:'include'}); if(!r.ok) throw new Error(await r.text()); return await r.json(); }


// --- KALENDAR ---
export async function kalendarLista(from, to){
  const r = await fetch(`${BASE}/kalendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function kalendarKreiraj(data){
  const r = await fetch(`${BASE}/kalendar`, { method: "POST", headers: { "Content-Type":"application/json", ...authHeader() }, body: JSON.stringify(data) });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function kalendarObrisi(id){
  const r = await fetch(`${BASE}/kalendar/${id}`, { method: "DELETE", headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return true;
}

// --- TELJENJA / TELAD ---
export async function recentTeljenja(months = 3, owner){
  const q = new URLSearchParams();
  q.set('months', String(months));
  if(owner) q.set('owner', owner);
  const r = await fetch(`${BASE}/teljenja/recent?${q.toString()}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function obradiTeljenje(grloId, teleBroj){
  const r = await fetch(`${BASE}/teljenja/${grloId}/obradi`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ teleBroj, mrtvo: false })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function obradiTeljenjeMrtvo(grloId){
  const r = await fetch(`${BASE}/teljenja/${grloId}/obradi`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ teleBroj: null, mrtvo: true })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getGenetika(owner){
  const q = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const r = await fetch(`${BASE}/izvestaj/genetika${q}`, { headers: authHeader() });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

// --- SEMENA (stanje / ručne korekcije) ---
export async function getSemeStanje(){
  const r = await fetch(`${BASE}/semena`, { headers: authHeader() });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adjustSeme({ bik, delta }){
  const r = await fetch(`${BASE}/semena/adjust`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ bik, delta })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

// --- MLEKO ---
export async function mlekoGetDay(date, owner){
  const q = new URLSearchParams();
  if(date) q.set('date', date);
  if(owner) q.set('owner', owner);
  const r = await fetch(`${BASE}/mleko/day?${q.toString()}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function mlekoSaveDay({ datum, litaraUkupno, litaraTelad }, owner){
  const q = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const r = await fetch(`${BASE}/mleko/day${q}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ datum, litaraUkupno, litaraTelad })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function mlekoListMuzeSe(date, owner){
  const q = new URLSearchParams();
  if(date) q.set('date', date);
  if(owner) q.set('owner', owner);
  const r = await fetch(`${BASE}/mleko/muzeSe?${q.toString()}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function mlekoSaveOverrides({ datum, includeIds, excludeIds }, owner){
  const q = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const r = await fetch(`${BASE}/mleko/overrides${q}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ datum, includeIds, excludeIds })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function mlekoMonths(owner){
  const q = new URLSearchParams();
  if(owner) q.set('owner', owner);
  const r = await fetch(`${BASE}/mleko/months?${q.toString()}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function mlekoMonth(ym, owner){
  const q = new URLSearchParams();
  q.set('ym', ym);
  if(owner) q.set('owner', owner);
  const r = await fetch(`${BASE}/mleko/month?${q.toString()}`, { headers: { ...authHeader() } });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

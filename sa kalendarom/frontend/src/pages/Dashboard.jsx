import React, { useEffect, useMemo, useState } from "react";
import { mojaGrla, getGrlo, updateGrlo, deleteGrlo, dodajDogadjaj, dogadjajiZaGrlo, obrisiDogadjaj, adminOwners, grlaZa, me } from "../api.js";
import { TipDogadjaja } from "../api.js";

function monthsBetween(aIso, bIso){
  const da = new Date(aIso);
  const db = new Date(bIso);
  if(isNaN(da) || isNaN(db)) return null;
  let m = (db.getFullYear()-da.getFullYear())*12 + (db.getMonth()-da.getMonth());
  if(db.getDate() < da.getDate()) m -= 1;
  return m;
}

export default function Dashboard(){
  const [allRows, setAllRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [adminOwnerInput, setAdminOwnerInput] = useState("");

  
  const [sortKey, setSortKey] = useState("broj");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

 
  // Modal za pregled/izmenu grla
  const [editId, setEditId] = useState(null);
  const [g, setG] = useState(null);
  const [saving, setSaving] = useState(false);

  
  const [eventList, setEventList] = useState([]);

  
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventGrloId, setEventGrloId] = useState(null);
  const [evGrlo, setEvGrlo] = useState(null);
  const [evMsg, setEvMsg] = useState("");
  const [evTip, setEvTip] = useState("OSEMENJAVANJE");
  const [evDatum, setEvDatum] = useState("");
  const [evBik, setEvBik] = useState("");
  const [evForce, setEvForce] = useState(false);

  function isoTime(iso){
    if(!iso) return null;
    const t = Date.parse(iso);
    return isNaN(t) ? null : t;
  }

  function applySort(list, key, dir){
    const mul = dir==='asc' ? 1 : -1;
    return [...list].sort((a,b)=>{
      const va = a[key], vb = b[key];
      if(va==null && vb==null) return 0; if(va==null) return -1*mul; if(vb==null) return 1*mul;
      if(typeof va==='number' && typeof vb==='number') return (va - vb) * mul;
      const da = Date.parse(va); const db = Date.parse(vb);
      if(!isNaN(da) && !isNaN(db)) return (da - db) * mul;
      return (''+va).localeCompare(''+vb) * mul;
    });
  }
  function refreshRows(base){
    const baseList = base ?? allRows;
    const q = (search||'').trim().toLowerCase();
    const filtered = q ? baseList.filter(r => String(r.broj ?? '').toLowerCase().includes(q)) : baseList;
    setRows(applySort(filtered, sortKey, sortDir));
  }
  function headerSort(key){
    const d = (sortKey===key && sortDir==='asc') ? 'desc' : 'asc';
    setSortKey(key); setSortDir(d);
    const q = (search||'').trim().toLowerCase();
    const base = allRows || [];
    const filtered = q ? base.filter(r => String(r.broj ?? '').toLowerCase().includes(q)) : base;
    setRows(applySort(filtered, key, d));
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(_){}
  }

  async function load(){
    try{
      setLoading(true); setErr("");
      const data = (isAdmin && selectedOwner) ? await grlaZa(selectedOwner) : await mojaGrla();
      // Na početnom ekranu NE prikazujemo telad/telice (do 14 meseci).
      const d = new Date();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      const today = `${d.getFullYear()}-${mm}-${dd}`;
      const filteredHome = (data||[]).filter(r => {
        if(!r || !r.datumRodjenja) return true;
        const m = monthsBetween(r.datumRodjenja, today);
        return !(m != null && m <= 14);
      });
      setAllRows(filteredHome);
      refreshRows(filteredHome);
    }catch(e){
      setErr(e?.message || "Greška pri učitavanju.");
    }finally{ setLoading(false); }
  }
  useEffect(()=>{ (async()=>{ try{ const u=await me(); const adm=(u?.roles||[]).includes('ROLE_ADMIN'); setIsAdmin(adm); if(adm){ setOwners(await adminOwners()); } }catch(e){} finally{ await load(); } })(); },[]);
  useEffect(()=>{ refreshRows(); }, [search, sortKey, sortDir, allRows]);
  useEffect(()=>{ if(isAdmin){ load(); } }, [selectedOwner, isAdmin]);

  function statusBadge(r){
    const s = r.status || (r.steona ? 'Steona' : 'Otvorena');
    const cls = {
      'Zasušena': 'bg-purple-50 text-purple-700',
      'Steona': 'bg-green-50 text-green-700',
      'Za proveru': 'bg-amber-50 text-amber-700',
      'Osemenjena': 'bg-blue-50 text-blue-700',
      'Za rad': 'bg-red-50 text-red-700',
      'Otvorena': 'bg-gray-100 text-gray-700'
    }[s] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{s}</span>;
  }

  async function openModal(id){
    setEditId(id);
    try{
      setG(await getGrlo(id));
      setEventList(await dogadjajiZaGrlo(id));
    }catch(e){
      setG(null); setEventList([]);
      alert(e?.message || "Greška pri učitavanju grla");
    }
  }
  function closeModal(){ setEditId(null); setG(null); setEventList([]); }

  async function saveModal(e){
    e.preventDefault();
    try{
      setSaving(true);
      await updateGrlo(editId, g);
      await load();
      closeModal();
    }catch(e2){ alert(e2?.message || "Greška pri snimanju"); }
    finally{ setSaving(false); }
  }

  async function deleteEvent(id){
    try{
      await obrisiDogadjaj(id);
      if(editId){ setEventList(await dogadjajiZaGrlo(editId)); }
      await load();
    }catch(e){ alert(e?.message || "Greška pri brisanju događaja"); }
  }

  
  async function openEventFor(row){
    setEventGrloId(row.id);
    setEvGrlo(row);
    setEvTip("OSEMENJAVANJE");
    setEvDatum("");
    setEvBik("");
    setEvMsg("");
    setEvForce(false);
    setShowEventModal(true);
  }
  function openEventFromEdit(){
    if(!editId) return;
    setEventGrloId(editId);
    setEvGrlo({ id: editId, broj: g?.broj });
    setEvTip("OSEMENJAVANJE");
    setEvDatum("");
    setEvBik("");
    setEvMsg("");
    setEvForce(false);
    setShowEventModal(true);
  }
  function closeEvent(){
    setShowEventModal(false);
    setEventGrloId(null);
    setEvGrlo(null);
    // Ako je otvoren i modal za "Izmena grla", zatvori ga kada izađeš iz dodavanja događaja.
    closeModal();
  }

  async function submitEvent(e){
    e.preventDefault();
    try{
      setEvMsg("");
      await dodajDogadjaj(eventGrloId, { tip: evTip, datum: evTip==='POTVRDJENA_STEONOST'? null : (evDatum||null), bik: evTip==='OSEMENJAVANJE'? (evBik||null) : null }, { force: evForce });
      setEvForce(false);
      await load();
      closeEvent();
      
    }catch(err){
      const m = (err?.message || "").toString();
      if(m.includes("POTVRDI_TELJENJE:") || m.includes("POTVRDI_OSEMENJAVANJE_NA_STEONU")){
        setEvMsg(m);
        setEvForce(true);
      }else if(m.includes("NIJE_OSEMENJENA")){
        setEvMsg("Krava mora imati bar jedno osemenjavanje pre teljenja.");
      }else{
        setEvMsg(m || "Greška");
      }
    }
  }

  // U "Izmeni grla" prikazuj samo događaje od poslednjeg teljenja (ako postoji).
  const lastTelTime = isoTime(g?.poslednjeTeljenje);
  const shownEvents = useMemo(()=>{
    if(!lastTelTime) return eventList || [];
    return (eventList || []).filter(ev => {
      const t = isoTime(ev?.datum);
      return t != null && t >= lastTelTime;
    });
  }, [eventList, lastTelTime]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Moja grla</h2>
        <div className="flex gap-2 items-center">
          <input className="border rounded px-2 py-1" placeholder="Pretraga po broju..." value={search} onChange={e=>setSearch(e.target.value)} />
          <button onClick={load} className="px-3 py-1 rounded bg-gray-100 border">{loading ? 'Učitavam...' : 'Osveži'}</button>
        </div>
      </div>
      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
      
      {false && (
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm text-gray-700">Korisnik:</label>
          <input
            className="border rounded px-2 py-1"
            placeholder="upiši username (npr. pera)"
            value={adminOwnerInput}
            onChange={e=>setAdminOwnerInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'){ setSelectedOwner(adminOwnerInput.trim()); } }}
          />
          <button
            type="button"
            className="px-3 py-1 rounded border bg-gray-50"
            onClick={()=> setSelectedOwner(adminOwnerInput.trim())}
          >
            Prikaži
          </button>
          {selectedOwner && <span className="text-xs text-gray-500">trenutno: <b>{selectedOwner}</b></span>}
        </div>
      )}

      <div className="overflow-auto">
        
{false && (
  <div className="flex items-center gap-2 mb-2">
    <input
      className="border rounded px-2 py-1"
      placeholder="Korisnik (upiši username)"
      value={adminOwnerInput}
      onChange={e=>setAdminOwnerInput(e.target.value)}
      onKeyDown={e=>{ if(e.key==='Enter'){ setSelectedOwner(adminOwnerInput.trim()); } }}
    />
    <button
      type="button"
      className="px-3 py-1 rounded border bg-gray-50"
      onClick={()=> setSelectedOwner(adminOwnerInput.trim())}
    >
      Prikaži
    </button>
  </div>
)}
<table className="w-full text-sm border">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('broj')}>Broj</th>
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('steona')}>Steona</th>
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('laktacija')}>Laktacija</th>
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('poslednjeTeljenje')}>Poslednje teljenje</th>
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('danaOdOsemenjavanja')}>Dana od osemenjavanja</th>
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('danaOdPoslednjegTeljenja')}>Dana od poslednjeg teljenja</th>
              <th className="p-2 cursor-pointer" onClick={()=>headerSort('brojOsemenjavanja')}>Broj osemenjavanja</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const clsAI = r.danaOdOsemenjavanja>0 ? "" : "text-gray-400";
              const clsTel = r.danaOdPoslednjegTeljenja>0 ? "" : "text-gray-400";
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-2"><button className="underline" onClick={()=>openModal(r.id)}>{r.broj}</button></td>
                  <td className="p-2">{r.steona? "Da":"Ne"}</td>
                  <td className="p-2">{r.laktacija}</td>
                  <td className="p-2">{r.poslednjeTeljenje||""}</td>
                  <td className={"p-2 "+clsAI}>{r.danaOdOsemenjavanja}</td>
                  <td className={"p-2 "+clsTel}>{r.danaOdPoslednjegTeljenja}</td>
                  <td className="p-2 text-right">{r.brojOsemenjavanja}</td>
                  <td className="p-2">{statusBadge(r)}</td>
                  <td className="p-2 text-right">
                    <button className="text-blue-600" onClick={()=>openEventFor(r)}>Dodaj događaj</button>
                  </td>
                </tr>
              );
            })}
            {rows.length===0 && (
              <tr><td className="p-2 text-gray-500" colSpan={9}>Nema podataka</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editId && g && (
        <div className="fixed inset-0 bg-black/40 grid items-start place-items-center overflow-y-auto p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Izmena grla</h3>
              <button onClick={closeModal} className="text-sm px-2 py-1 border rounded">Zatvori</button>
            </div>
            <form onSubmit={saveModal} className="grid gap-3">
              <label className="text-sm">Broj
                <input className="w-full border rounded px-2 py-1" value={g.broj||''} onChange={e=>setG({...g, broj:e.target.value})} required/>
              </label>
              <label className="text-sm">Datum rođenja
                <input className="w-full border rounded px-2 py-1" value={g.datumRodjenja||''} onChange={e=>setG({...g, datumRodjenja:e.target.value})} required/>
              </label>
              <label className="text-sm">Laktacija
                <input className="w-full border rounded px-2 py-1" value={g.laktacija||''} onChange={e=>setG({...g, laktacija:e.target.value})} required/>
              </label>
              <label className="text-sm">Poslednje teljenje
                <input className="w-full border rounded px-2 py-1" value={g.poslednjeTeljenje||''} onChange={e=>setG({...g, poslednjeTeljenje:e.target.value})}/>
              </label>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={openEventFromEdit} className="px-3 py-1 rounded bg-blue-50 text-blue-700 border">Dodaj događaj</button>
                <button type="button" onClick={()=>{ if(confirm('Obrisati grlo?')){ deleteGrlo(editId).then(load).finally(closeModal); } }} className="px-3 py-1 rounded bg-red-50 text-red-700 border">Obriši</button>
                <button type="submit" disabled={saving} className="px-3 py-1 rounded bg-black text-white">{saving? 'Čuvam...' : 'Snimi'}</button>
              </div>
            </form>

            <div className="mt-6">
              <h4 className="font-semibold mb-1">Istorija događaja (grlo)</h4>
              <div className="max-h-60 overflow-auto border rounded">
                
{false && (
  <div className="flex items-center gap-2 mb-2">
    <input
      className="border rounded px-2 py-1"
      placeholder="Korisnik (upiši username)"
      value={adminOwnerInput}
      onChange={e=>setAdminOwnerInput(e.target.value)}
      onKeyDown={e=>{ if(e.key==='Enter'){ setSelectedOwner(adminOwnerInput.trim()); } }}
    />
    <button
      type="button"
      className="px-3 py-1 rounded border bg-gray-50"
      onClick={()=> setSelectedOwner(adminOwnerInput.trim())}
    >
      Prikaži
    </button>
  </div>
)}
<table className="w-full text-sm">
                  <thead><tr className="bg-gray-50"><th className="p-2 text-left">Datum</th><th className="p-2 text-left">Tip</th><th className="p-2 text-left">Bik</th><th className="p-2 text-right">Akcije</th></tr></thead>
                  <tbody>
                    {shownEvents
                      .sort((a,b)=> (new Date(b.datum||0)) - (new Date(a.datum||0)))
                      .map(ev => (
                      <tr key={ev.id} className="border-b">
                        <td className="p-2">{ev.datum||'-'}</td>
                        <td className="p-2">{ev.tip}</td>
                        <td className="p-2">{ev.bik||''}</td>
                        <td className="p-2 text-right">
                          <button type="button" className="text-red-600" onClick={()=>deleteEvent(ev.id)}>Obriši</button>
                        </td>
                      </tr>
                    ))}
                    {shownEvents.length===0 && <tr><td className="p-2 text-gray-500" colSpan={4}>Nema događaja.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <button type="button" onClick={openEventFromEdit} className="px-3 py-1 rounded bg-blue-50 text-blue-700 border">Dodaj događaj</button>
              </div>
            </div>

            {(g.hbMajke || g.bikOtac) && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold mb-2">Genetika</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">HB majke</span>
                    <span className="font-semibold">{g.hbMajke || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bik otac</span>
                    <span className="font-semibold">{g.bikOtac || '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 grid items-start place-items-center overflow-y-auto p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Novi događaj{evGrlo?.broj ? ` – krava ${evGrlo.broj}` : ""}</h3>
              <button onClick={closeEvent} className="text-sm px-2 py-1 border rounded">Zatvori</button>
            </div>
            <form onSubmit={submitEvent} className="grid gap-3">
              <label className="text-sm">Tip
                <select className="w-full border rounded px-2 py-1" value={evTip} onChange={e=>setEvTip(e.target.value)}>
                  <option value="OSEMENJAVANJE">OSEMENJAVANJE</option>
                  <option value="POTVRDJENA_STEONOST">POTVRDJENA_STEONOST</option>
                  <option value="TELJENJE">TELJENJE</option>
                  <option value="ZASUSENJE">ZASUSENJE</option>
                </select>
              </label>
              {evTip!=='POTVRDJENA_STEONOST' && (
                <label className="text-sm">Datum
                  <input type="date" className="w-full border rounded px-2 py-1" value={evDatum} onChange={e=>setEvDatum(e.target.value)} />
                </label>
              )}
              {evTip==='OSEMENJAVANJE' && (
                <label className="text-sm">Bik
                  <input className="w-full border rounded px-2 py-1" value={evBik} onChange={e=>setEvBik(e.target.value)} placeholder="Upiši bika" />
                </label>
              )}
              {evMsg && <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-sm">{evMsg}</div>}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closeEvent} className="px-3 py-1 rounded border">Otkaži</button>
                <button type="submit" className={"px-3 py-1 rounded text-white "+(evForce?"bg-red-600":"bg-black")}>{evForce? "Potvrdi (force)" : "Snimi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

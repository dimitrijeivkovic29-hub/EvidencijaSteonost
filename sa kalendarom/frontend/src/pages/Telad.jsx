import React, { useEffect, useMemo, useState } from 'react';
import { deleteGrlo, getGrlo, mojaGrla, updateGrlo } from '../api.js';

function monthsBetween(a, b){
  // a,b are ISO date strings YYYY-MM-DD
  const da = new Date(a);
  const db = new Date(b);
  if(isNaN(da) || isNaN(db)) return null;
  let m = (db.getFullYear()-da.getFullYear())*12 + (db.getMonth()-da.getMonth());
  // ako dan u mesecu nije "prešao", umanji 1
  if(db.getDate() < da.getDate()) m -= 1;
  return m;
}

export default function Telad(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [limitMonths, setLimitMonths] = useState(14);

  // modal (kao na početnoj strani)
  const [openId, setOpenId] = useState(null);
  const [g, setG] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load(){
    try{
      setLoading(true); setErr('');
      const data = await mojaGrla();
      setRows(data);
    }catch(e){
      setErr(e?.message || 'Greška pri učitavanju');
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  const today = useMemo(()=>{
    const d = new Date();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  const telad = useMemo(()=>{
    return (rows||[])
      .filter(r => r && r.datumRodjenja)
      .map(r => ({
        ...r,
        starostMeseci: monthsBetween(r.datumRodjenja, today)
      }))
      .filter(r => r.starostMeseci != null && r.starostMeseci <= limitMonths)
      .sort((a,b)=> (a.starostMeseci - b.starostMeseci));
  }, [rows, today, limitMonths]);

  async function handleDelete(id, broj){
    if(!confirm(`Obrisati tele/grlo ${broj}?`)) return;
    try{
      await deleteGrlo(id);
      await load();
    }catch(e){
      alert(e?.message || 'Greška pri brisanju');
    }
  }

  async function openModal(id){
    setOpenId(id);
    try{
      setG(await getGrlo(id));
    }catch(e){
      setG(null);
      alert(e?.message || 'Greška pri učitavanju grla');
    }
  }
  function closeModal(){ setOpenId(null); setG(null); }

  async function saveModal(e){
    e.preventDefault();
    try{
      setSaving(true);
      await updateGrlo(openId, g);
      await load();
      closeModal();
    }catch(e2){
      alert(e2?.message || 'Greška pri snimanju');
    }finally{
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Telad / telice do {limitMonths} meseci</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Granica:</label>
          <select className="border rounded px-2 py-1" value={limitMonths} onChange={e=>setLimitMonths(Number(e.target.value))}>
            <option value={12}>12 meseci</option>
            <option value={14}>14 meseci</option>
            <option value={16}>16 meseci</option>
            <option value={18}>18 meseci</option>
          </select>
          <button onClick={load} className="px-3 py-1 rounded bg-gray-100 border">{loading?'Učitavam...':'Osveži'}</button>
        </div>
      </div>
      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

      <div className="bg-white border rounded-2xl p-4">
        <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">Broj</th>
                <th className="p-2">Datum rođenja</th>
                <th className="p-2">Starost (mes.)</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {telad.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-medium"><button className="underline" onClick={()=>openModal(r.id)}>{r.broj}</button></td>
                  <td className="p-2">{r.datumRodjenja}</td>
                  <td className="p-2">{r.starostMeseci}</td>
                  <td className="p-2 text-right">
                    <button className="px-2 py-1 rounded bg-white border" onClick={()=>handleDelete(r.id, r.broj)}>Obriši</button>
                  </td>
                </tr>
              ))}
              {telad.length===0 && (
                <tr><td className="p-2 text-gray-500" colSpan={4}>Nema teladi u izabranom opsegu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Prikaz se računa na osnovu <b>datum rođenja</b> u bazi.
        </div>
      </div>

      {/* POPUP / MODAL */}
      {openId && g && (
        <div className="fixed inset-0 bg-black/40 grid items-start place-items-center overflow-y-auto p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Tele / grlo</h3>
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
                <button
                  type="button"
                  onClick={()=>{ if(confirm('Obrisati grlo?')){ deleteGrlo(openId).then(load).finally(closeModal); } }}
                  className="px-3 py-1 rounded bg-red-50 text-red-700 border"
                >
                  Obriši
                </button>
                <button type="submit" disabled={saving} className="px-3 py-1 rounded bg-black text-white">{saving? 'Čuvam...' : 'Snimi'}</button>
              </div>

              {/* GENETIKA (traženo da bude skroz dole) */}
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Genetika</div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">HB majke</div>
                  <div className="font-medium">{g.hbMajke || '-'}</div>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <div className="text-gray-600">Bik otac</div>
                  <div className="font-medium">{g.bikOtac || '-'}</div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

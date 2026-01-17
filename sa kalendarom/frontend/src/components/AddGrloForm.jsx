import React, { useState } from 'react';
import { kreirajGrlo } from '../api.js';

export default function AddGrloForm({ showHints = true }){
  const [broj,setBroj]=useState('');
  const [datum,setDatum]=useState('');
  const [laktacija,setLaktacija]=useState(0);
  const [posTelj,setPosTelj]=useState('');
  const [err,setErr]=useState('');
  const [msg,setMsg]=useState('');

  async function submit(e){
    e.preventDefault(); setErr(''); setMsg('');
    try{
      const payload={ broj:broj, datumRodjenja:datum, laktacija:Number(laktacija), poslednjeTeljenje: (Number(laktacija)>0? posTelj: null) };
      const res = await kreirajGrlo(payload);
      setMsg(`Dodato grlo ${res.broj}`);
      setBroj(''); setDatum(''); setLaktacija(0); setPosTelj('');
    }catch(ex){ setErr(ex.message||'Greška'); }
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-white p-4 rounded-2xl shadow">
      <h3 className="font-semibold">Dodaj novo grlo</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Broj grla (HB)</label>
          <input className="border rounded px-2 py-1" placeholder={showHints ? "npr. 01234" : ""} value={broj} onChange={e=>setBroj(e.target.value)} required/>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Datum rođenja</label>
          <input className="border rounded px-2 py-1" type="date" value={datum} onChange={e=>setDatum(e.target.value)} required/>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Laktacija</label>
          <input className="border rounded px-2 py-1" type="number" min="0" value={laktacija} onChange={e=>setLaktacija(e.target.value)} required/>
          {showHints && <div className="text-[11px] text-gray-500">0 = tele/junica, 1+ = krava</div>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Poslednje teljenje (samo za krave)</label>
          <input className="border rounded px-2 py-1" type="date" value={posTelj} onChange={e=>setPosTelj(e.target.value)}
                 placeholder={showHints ? "Obavezno ako je laktacija > 0" : ""}
                 disabled={Number(laktacija)===0} required={Number(laktacija)>0}/>
          {showHints && Number(laktacija)>0 && <div className="text-[11px] text-gray-500">Ovaj datum se pamti i kao TELJENJE događaj.</div>}
        </div>
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {msg && <div className="text-green-700 text-sm">{msg}</div>}
      <button className="px-3 py-2 rounded bg-black text-white">Sačuvaj</button>
    </form>
  );
}

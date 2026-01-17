import React, { useEffect, useMemo, useState } from "react";
import { kalendarLista, kalendarKreiraj, kalendarObrisi } from "../api.js";


const TIP_BOJE = {
  VITAMINI: "bg-blue-100 text-blue-700 border-blue-300",
  VAKCINACIJA: "bg-purple-100 text-purple-700 border-purple-300",
  PROKRVARILA: "bg-rose-100 text-rose-700 border-rose-300",
  PG: "bg-amber-100 text-amber-800 border-amber-300",
  KALCIJUM: "bg-teal-100 text-teal-700 border-teal-300",
  DRUGO: "bg-gray-100 text-gray-700 border-gray-300",
};

function monthBounds(current){
  const start = new Date(current.getFullYear(), current.getMonth(), 1);
  const end = new Date(current.getFullYear(), current.getMonth()+1, 0);
  // pad to week grid (Mon-Sun)
  const day = (start.getDay()+6)%7; // convert Sun=0 -> 6
  const gridStart = new Date(start); gridStart.setDate(start.getDate() - day);
  const endDay = (end.getDay()+6)%7;
  const gridEnd = new Date(end); gridEnd.setDate(end.getDate() + (6 - endDay));
  return { start, end, gridStart, gridEnd };
}
function fmt(d){ return d.toISOString().slice(0,10); }

export default function Kalendar(){
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ brojGrla:"", naziv:"", tip:"DRUGO", datumDogadjaja:"", datumPodsetnika:"", poruka:"" });
  const [prikazOtvoren, setPrikazOtvoren] = useState(false);
  const [prikazDatum, setPrikazDatum] = useState("");
  const [prikazDogadjaji, setPrikazDogadjaji] = useState([]);
  const [loading, setLoading] = useState(false);
  const { gridStart, gridEnd, start, end } = useMemo(()=>monthBounds(cursor), [cursor]);

  useEffect(()=>{
    (async ()=>{
      setLoading(true);
      try{
        const items = await kalendarLista(fmt(gridStart), fmt(new Date(gridEnd.getFullYear(),gridEnd.getMonth(),gridEnd.getDate())));
        setEvents(items);
      }catch(e){ console.error(e); }
      setLoading(false);
    })();
  }, [cursor]);

  const days = [];
  for(let d=new Date(gridStart); d<=gridEnd; d.setDate(d.getDate()+1)){
    days.push(new Date(d));
  }

  function dayEvents(d){
    const ds = fmt(d);
    return events.filter(e => (e.datumDogadjaja===ds) || (e.datumPodsetnika===ds));
  }

  async function submit(){
    try{
      await kalendarKreiraj(form);
      setShowModal(false);
      setForm({ brojGrla:"", naziv:"", tip:"DRUGO", datumDogadjaja:"", datumPodsetnika:"", poruka:"" });
      // refresh
      const items = await kalendarLista(fmt(gridStart), fmt(new Date(gridEnd.getFullYear(),gridEnd.getMonth(),gridEnd.getDate())));
      setEvents(items);
    }catch(e){
      alert(e.message || "Greška pri čuvanju");
    }
  }


  function otvoriDan(d){
    const ds = fmt(d);
    setPrikazDatum(ds);
    setPrikazDogadjaji(dayEvents(d));
    setPrikazOtvoren(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Kalendar</h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1))}>← Prethodni</button>
          <button className="px-3 py-2 border rounded" onClick={()=>setCursor(new Date())}>Danas</button>
          <button className="px-3 py-2 border rounded" onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1))}>Sledeći →</button>
          <button className="px-4 py-2 rounded bg-black text-white" onClick={()=>setShowModal(true)}>Dodaj događaj</button>
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(TIP_BOJE).map(([tip, cls])=>(
          <span key={tip} className={`px-2 py-1 border rounded text-xs ${cls}`}>{tip}</span>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 border rounded overflow-hidden">
        {["Pon","Uto","Sre","Čet","Pet","Sub","Ned"].map(h=>(
          <div key={h} className="text-center text-sm font-medium py-2 bg-gray-50 border-b">{h}</div>
        ))}
        {days.map((d, i)=>{
          const inMonth = d.getMonth()===start.getMonth();
          const isToday = fmt(d)===fmt(today);
          const dayEv = dayEvents(d);
          return (
            <div key={i} className={`p-2 min-h-[110px] border-t ${i%7===0?'border-l':''} ${!inMonth?'bg-gray-50/50 text-gray-400':''}`} onClick={()=>otvoriDan(d)}>
              <div className={`text-xs mb-1 ${isToday?'font-bold underline':''}`}>{d.getDate()}.{d.getMonth()+1}.</div>
              <div className="space-y-1">
                {dayEv.map(e=>{
                  const cls = TIP_BOJE[e.tip] || TIP_BOJE["DRUGO"];
                  const label = e.naziv || e.tip;
                  const podsetnik = e.datumPodsetnika===fmt(d) ? " • podsetnik" : "";
                  return (
                    <div key={e.id} className={`text-xs border rounded px-2 py-1 flex items-center justify-between ${cls}`}>
                      <div className="truncate">{e.grlo?.broj} — {label}{podsetnik}</div>
                      <button className="text-[10px] underline" onClick={async (ev)=>{ ev.stopPropagation(); if(confirm("Obrisati događaj?")){ await kalendarObrisi(e.id); const items = await kalendarLista(fmt(gridStart), fmt(new Date(gridEnd.getFullYear(),gridEnd.getMonth(),gridEnd.getDate()))); setEvents(items);} }}>Obriši</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* modal prikaz dana */}
      {prikazOtvoren && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={()=>setPrikazOtvoren(false)}>
          <div className="bg-white rounded-xl p-4 w-[560px] max-w-[95vw] shadow-xl" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Šta treba {prikazDatum}</h3>
              <button onClick={()=>setPrikazOtvoren(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            {prikazDogadjaji.length===0 ? (
              <div className="text-sm text-gray-500">Nema događaja za ovaj dan.</div>
            ) : (
              <div className="space-y-2">
                {prikazDogadjaji.map(e=>{
                  const cls = TIP_BOJE[e.tip] || TIP_BOJE["DRUGO"];
                  return (
                    <div key={e.id} className={`border rounded p-3 ${cls}`}>
                      <div className="text-sm font-medium">{e.grlo?.broj} — {e.naziv || e.tip}</div>
                      <div className="text-xs opacity-80 mt-1">Tip: {e.tip} {e.datumPodsetnika===prikazDatum ? '(podsetnik)' : ''}</div>
                      {e.poruka && <div className="text-sm mt-2 whitespace-pre-wrap">{e.poruka}</div>}
                      <div className="text-[11px] mt-2">Datum događaja: {e.datumDogadjaja}{e.datumPodsetnika?` • Podsetnik: ${e.datumPodsetnika}`:''}</div>
                      <div className="mt-2 flex gap-2">
                        <button className="text-xs underline" onClick={async ()=>{ if(confirm("Obrisati događaj?")){ await kalendarObrisi(e.id); const items = await kalendarLista(fmt(gridStart), fmt(new Date(gridEnd.getFullYear(),gridEnd.getMonth(),gridEnd.getDate()))); setEvents(items); setPrikazDogadjaji(prikazDogadjaji.filter(x=>x.id!==e.id)); } }}>Obriši</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={()=>setPrikazOtvoren(false)}>Zatvori</button>
              <button className="px-3 py-2 rounded bg-black text-white" onClick={()=>{ setForm({ ...form, datumDogadjaja:prikazDatum }); setShowModal(true); setPrikazOtvoren(false); }}>Dodaj događaj za ovaj dan</button>
            </div>
          </div>
        </div>
      )}

      {/* modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-[520px] max-w-[95vw] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Novi događaj</h3>
              <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="block text-sm mb-1">Broj grla</label>
                <input value={form.brojGrla} onChange={e=>setForm({...form, brojGrla:e.target.value})} className="w-full border rounded px-2 py-1" placeholder="npr. RS7167..." />
              </div>
              <div className="col-span-1">
                <label className="block text-sm mb-1">Ime događaja</label>
                <input value={form.naziv} onChange={e=>setForm({...form, naziv:e.target.value})} className="w-full border rounded px-2 py-1" placeholder="npr. Vakcinacija" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm mb-1">Tip događaja (boja)</label>
                <select value={form.tip} onChange={e=>setForm({...form, tip:e.target.value})} className="w-full border rounded px-2 py-1">
                  {Object.keys(TIP_BOJE).map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm mb-1">Datum događaja</label>
                <input type="date" value={form.datumDogadjaja} onChange={e=>setForm({...form, datumDogadjaja:e.target.value})} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm mb-1">Datum podsetnika</label>
                <input type="date" value={form.datumPodsetnika} onChange={e=>setForm({...form, datumPodsetnika:e.target.value})} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-1">Poruka</label>
                <textarea value={form.poruka} onChange={e=>setForm({...form, poruka:e.target.value})} className="w-full border rounded px-2 py-1" rows={3} placeholder="Šta da piše u podsetniku…" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={()=>setShowModal(false)}>Otkaži</button>
              <button className="px-3 py-2 rounded bg-black text-white" onClick={submit}>Sačuvaj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
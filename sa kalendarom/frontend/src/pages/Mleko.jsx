import React, { useEffect, useMemo, useState } from 'react';
import { mlekoGetDay, mlekoListMuzeSe, mlekoSaveDay, mlekoSaveOverrides, mlekoMonth, mlekoMonths } from '../api.js';

function fmt(n){
  if(n == null || Number.isNaN(Number(n))) return '';
  const v = Number(n);
  return v.toLocaleString('sr-RS', { maximumFractionDigits: 2 });
}

function todayISO(){
  return new Date().toISOString().slice(0,10);
}

export default function Mleko(){
  const [datum, setDatum] = useState(todayISO());
  const [ukupno, setUkupno] = useState('');
  const [telad, setTelad] = useState('');
  const [day, setDay] = useState(null);
  const [err, setErr] = useState('');

  const [months, setMonths] = useState([]);
  const [selMonth, setSelMonth] = useState('');
  const [monthData, setMonthData] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [cows, setCows] = useState([]);
  const [savingOverrides, setSavingOverrides] = useState(false);

  async function refreshDay(d = datum){
    setErr('');
    const r = await mlekoGetDay(d);
    setDay(r);
    // popuni inpute ako postoje snimljeni podaci
    setUkupno(r.litaraUkupno?.toString?.() ?? String(r.litaraUkupno ?? 0));
    setTelad(r.litaraTelad?.toString?.() ?? String(r.litaraTelad ?? 0));
  }

  async function refreshMonths(){
    try{
      const m = await mlekoMonths();
      setMonths(m);
      // default: trenutni mesec (ako postoji u listi) ili prvi iz liste
      const nowYm = new Date().toISOString().slice(0,7);
      const pick = (m && m.includes(nowYm)) ? nowYm : (m?.[0] || nowYm);
      setSelMonth(pick);
    }catch(e){ /* ignore */ }
  }

  async function refreshMonth(ym){
    try{
      if(!ym) { setMonthData(null); return; }
      setMonthData(await mlekoMonth(ym));
    }catch(e){ /* ignore */ }
  }

  useEffect(()=>{ refreshDay(datum); refreshMonths(); }, []);

  useEffect(()=>{ refreshMonth(selMonth); }, [selMonth]);

  useEffect(()=>{ (async()=>{ try{ await refreshDay(datum); }catch(e){ setErr(String(e.message||e)); } })(); }, [datum]);

  async function snimi(){
    try{
      setErr('');
      const r = await mlekoSaveDay({
        datum,
        litaraUkupno: ukupno === '' ? 0 : Number(ukupno),
        litaraTelad: telad === '' ? 0 : Number(telad)
      });
      setDay(r);
      await refreshMonths();
      await refreshMonth(selMonth || new Date().toISOString().slice(0,7));
    }catch(e){
      setErr(String(e.message||e));
    }
  }

  const calc = useMemo(()=>{
    const u = Number(ukupno||0);
    const t = Number(telad||0);
    // "Popilo telad" se DODAJE na količinu: ukupno proizvedeno = količina + telad
    const neto = Math.max(0, u + t);
    const n = day?.muzeSeBrojKrava || 0;
    const avg = n > 0 ? neto / n : 0;
    return { neto, avg };
  }, [ukupno, telad, day]);

  async function openModal(){
    try{
      setErr('');
      const list = await mlekoListMuzeSe(datum);
      setCows(list);
      setModalOpen(true);
    }catch(e){
      setErr(String(e.message||e));
    }
  }

  function toggleCow(id){
    setCows(prev => prev.map(c => c.id === id ? { ...c, muzeSeFinal: !c.muzeSeFinal } : c));
  }

  async function saveOverrides(){
    try{
      setSavingOverrides(true);
      const includeIds = [];
      const excludeIds = [];
      for(const c of cows){
        if(c.muzeSeFinal && !c.defaultMuzeSe) includeIds.push(c.id);
        if(!c.muzeSeFinal && c.defaultMuzeSe) excludeIds.push(c.id);
      }
      const r = await mlekoSaveOverrides({ datum, includeIds, excludeIds });
      setDay(r);
      setModalOpen(false);
      await refreshMonth(selMonth);
    }catch(e){
      setErr(String(e.message||e));
    } finally{
      setSavingOverrides(false);
    }
  }

  useEffect(()=>{ refreshMonth(selMonth); }, [selMonth]);

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Mleko</h2>
          <p className="text-sm text-gray-600">Unesi dnevnu litražu i prati prosek po kravi.</p>
        </div>
        <button onClick={openModal} className="px-3 py-2 rounded bg-black text-white">Krave koje se muzu</button>
      </div>

      {err && <div className="mt-3 p-3 rounded bg-red-50 text-red-700 border border-red-200">{err}</div>}

      <div className="grid md:grid-cols-4 gap-3 mt-4">
        <div>
          <label className="text-sm text-gray-600">Datum</label>
          <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Litaraža (ukupno)</label>
          <input type="number" step="0.01" value={ukupno} onChange={e=>setUkupno(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" placeholder="npr 420" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Popilo telad</label>
          <input type="number" step="0.01" value={telad} onChange={e=>setTelad(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" placeholder="npr 35" />
        </div>
        <div className="flex items-end">
          <button onClick={snimi} className="w-full px-3 py-2 rounded bg-green-600 text-white">Snimi</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-600">Krava koje se muzu (za datum)</div>
          <div className="text-2xl font-bold">{day?.muzeSeBrojKrava ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Automatski: bar 1 teljenje i nije zasušena + tvoje ručne korekcije.</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-600">Ukupno proizvedeno (količina + telad)</div>
          <div className="text-2xl font-bold">{fmt(calc.neto)} L</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-600">Prosek po kravi</div>
          <div className="text-2xl font-bold">{fmt(calc.avg)} L</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold">Pregled po mesecima</h3>
            <p className="text-sm text-gray-600">Klikni mesec da vidiš podatke po danima i proseke.</p>
          </div>
          <div className="min-w-[220px]">
            <label className="text-sm text-gray-600">Mesec</label>
            <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} className="w-full mt-1 border rounded px-3 py-2">
              {/* ako nema nijedan mesec, ipak prikaži trenutni */}
              {(!months || months.length === 0) && (
                <option value={new Date().toISOString().slice(0,7)}>{new Date().toISOString().slice(0,7)}</option>
              )}
              {(months||[]).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {!monthData || !monthData.dani || monthData.dani.length === 0 ? (
          <div className="text-sm text-gray-600 mt-3">Nema unetih dana za ovaj mesec.</div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-3 mt-3">
              <div className="border rounded-xl p-3">
                <div className="text-sm text-gray-600">Broj unetih dana</div>
                <div className="text-2xl font-bold">{monthData.danaUkupno}</div>
              </div>
              <div className="border rounded-xl p-3">
                <div className="text-sm text-gray-600">Prosečno ukupno proizvedeno / dan</div>
                <div className="text-2xl font-bold">{fmt(monthData.avgUkupno)} L</div>
              </div>
              <div className="border rounded-xl p-3">
                <div className="text-sm text-gray-600">Prosek po kravi / dan</div>
                <div className="text-2xl font-bold">{fmt(monthData.avgPoKravi)} L</div>
              </div>
            </div>

            <div className="mt-3 border rounded-xl p-3 overflow-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Datum</th>
                    <th className="py-2">Količina (L)</th>
                    <th className="py-2">Telad (L)</th>
                    <th className="py-2">Ukupno proizvedeno (L)</th>
                    <th className="py-2">Krava koje se muzu</th>
                    <th className="py-2">Prosek po kravi (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {(monthData.dani||[]).map(d => (
                    <tr key={d.datum} className="border-t">
                      <td className="py-2 font-medium">{d.datum}</td>
                      <td className="py-2">{fmt(d.litaraUkupno)}</td>
                      <td className="py-2">{fmt(d.litaraTelad)}</td>
                      <td className="py-2">{fmt(d.netoLitara)}</td>
                      <td className="py-2">{d.muzeSeBrojKrava}</td>
                      <td className="py-2">{fmt(d.prosekPoKravi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl border shadow-xl">
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Krave koje se muzu</h3>
                <p className="text-sm text-gray-600">Datum: {datum}. Možeš ručno dodati ili izbaciti krave.</p>
              </div>
              <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setModalOpen(false)}>Zatvori</button>
            </div>

            <div className="p-4 max-h-[65vh] overflow-auto">
              <div className="text-xs text-gray-500 mb-2">Sivo = automatski (po pravilima). Ako čekiraš/odčekiraš, pamti se kao ručna korekcija za taj datum.</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {cows.map(c => (
                  <label key={c.id} className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${c.defaultMuzeSe ? 'bg-gray-50' : 'bg-white'}`}>
                    <input type="checkbox" checked={!!c.muzeSeFinal} onChange={()=>toggleCow(c.id)} />
                    <span className="font-medium">{c.broj}</span>
                    {c.defaultMuzeSe && <span className="text-xs text-gray-500">(auto)</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-gray-200" onClick={()=>setModalOpen(false)}>Otkaži</button>
              <button disabled={savingOverrides} className={`px-3 py-2 rounded text-white ${savingOverrides ? 'bg-gray-400' : 'bg-black'}`} onClick={saveOverrides}>
                Snimi listu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

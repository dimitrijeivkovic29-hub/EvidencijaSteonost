import React, { useEffect, useMemo, useState } from 'react';
import { obradiTeljenje, obradiTeljenjeMrtvo, recentTeljenja } from '../api.js';

function fmt(d){ return d || ''; }

export default function Teljenja(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [months, setMonths] = useState(3);

  const [teleInput, setTeleInput] = useState({}); // grloId -> hb
  const [busyId, setBusyId] = useState(null);

  async function load(){
    try{
      setLoading(true); setErr('');
      const data = await recentTeljenja(months);
      setRows(data);
    }catch(e){
      setErr(e?.message || 'Greška pri učitavanju teljenja');
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); }, [months]);

  const notProcessed = useMemo(() => rows.filter(r => !r.teleBroj), [rows]);
  const processed = useMemo(() => rows.filter(r => !!r.teleBroj), [rows]);

  async function handleObradi(grloId){
    const hb = (teleInput[grloId] || '').trim();
    if(!hb){ alert('Unesi HB broj teleta'); return; }
    try{
      setBusyId(grloId);
      await obradiTeljenje(grloId, hb);
      setTeleInput(prev => ({...prev, [grloId]: ''}));
      await load();
    }catch(e){
      alert(e?.message || 'Greška');
    }finally{
      setBusyId(null);
    }
  }

  async function handleMrtvo(grloId){
    if(!confirm('Označiti teljenje kao mrtvorođeno? (biće upisano X i neće se kreirati novo grlo)')) return;
    try{
      setBusyId(grloId);
      await obradiTeljenjeMrtvo(grloId);
      setTeleInput(prev => ({...prev, [grloId]: ''}));
      await load();
    }catch(e){
      alert(e?.message || 'Greška');
    }finally{ setBusyId(null); }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Teljene krave (poslednjih {months} meseca)</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Period:</label>
          <select className="border rounded px-2 py-1" value={months} onChange={e=>setMonths(Number(e.target.value))}>
            <option value={1}>1 mesec</option>
            <option value={2}>2 meseca</option>
            <option value={3}>3 meseca</option>
            <option value={6}>6 meseci</option>
          </select>
          <button onClick={load} className="px-3 py-1 rounded bg-gray-100 border">{loading?'Učitavam...':'Osveži'}</button>
        </div>
      </div>
      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

      <div className="bg-white border rounded-2xl p-4 mb-4">
        <h3 className="font-semibold mb-2">Za obradu (nema unet HB broj teleta)</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">Krava</th>
                <th className="p-2">Datum teljenja</th>
                <th className="p-2">HB broj teleta</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {notProcessed.map(r => (
                <tr key={r.grloId} className="border-b">
                  <td className="p-2 font-medium">{r.brojMajke}</td>
                  <td className="p-2">{fmt(r.datumTeljenja)}</td>
                  <td className="p-2">
                    <input
                      className="border rounded px-2 py-1 w-48"
                      placeholder="npr. HB12345"
                      value={teleInput[r.grloId] || ''}
                      onChange={e=>setTeleInput(prev=>({...prev, [r.grloId]: e.target.value}))}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-3 py-1 rounded bg-black text-white"
                        onClick={()=>handleObradi(r.grloId)}
                        disabled={busyId===r.grloId}
                      >
                        {busyId===r.grloId ? 'Sn...' : 'Dodaj tele'}
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-white border"
                        onClick={()=>handleMrtvo(r.grloId)}
                        disabled={busyId===r.grloId}
                        title="Označi kao mrtvorođeno (upisuje X)"
                      >
                        Mrtvorođeno
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notProcessed.length===0 && (
                <tr><td className="p-2 text-gray-500" colSpan={4}>Nema teljenja za obradu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Kada dodaš HB broj, sistem automatski kreira novo grlo (tele) sa datumom rođenja = datum teljenja.
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-semibold mb-2">Obrađeno</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">Krava</th>
                <th className="p-2">Datum teljenja</th>
                <th className="p-2">HB teleta</th>
              </tr>
            </thead>
            <tbody>
              {processed.map(r => (
                <tr key={r.grloId} className="border-b">
                  <td className="p-2">{r.brojMajke}</td>
                  <td className="p-2">{fmt(r.datumTeljenja)}</td>
                  <td className="p-2 font-medium">{r.teleBroj}</td>
                </tr>
              ))}
              {processed.length===0 && (
                <tr><td className="p-2 text-gray-500" colSpan={3}>Još nema obrađenih teljenja.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { adjustSeme, getGenetika, getIzvestaj, getSemeStanje } from '../api.js';

function Pie({ data, title }){
  const entries = Object.entries(data || {}).filter(([,v]) => (v||0) > 0);
  const total = entries.reduce((s, [,v]) => s + (v||0), 0);
  if(!total) return <div className="text-sm text-gray-500">Nema podataka.</div>;

  const colors = [
    '#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed',
    '#0ea5e9','#f97316','#14b8a6','#a3e635','#e11d48'
  ];

  let acc = 0;
  const stops = entries.map(([,v], idx) => {
    const start = acc;
    const pct = (v / total) * 100;
    acc += pct;
    const c = colors[idx % colors.length];
    return `${c} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
  }).join(', ');

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <div className="w-48 h-48 rounded-full border" style={{ background: `conic-gradient(${stops})` }} />
      <div className="text-sm">
        <div className="font-semibold mb-2">{title || 'Udeo po biku'}</div>
        <div className="space-y-1">
          {entries.map(([k,v], idx) => (
            <div key={k} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="min-w-[140px]">{k}</span>
              <span className="text-gray-600">{v} ({Math.round((v/total)*100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Report({ isAdmin }){
  const [data, setData] = React.useState(null);
  const [gen, setGen] = React.useState(null);
  const [semeStanje, setSemeStanje] = React.useState([]);
  const [err, setErr] = React.useState('');
  const [view, setView] = React.useState('izvestaj'); // izvestaj | semena | genetika
  const [ownerState, setOwnerState] = React.useState(undefined);

  const [adjBik, setAdjBik] = React.useState('');
  const [adjKolicina, setAdjKolicina] = React.useState(1);

  const semenStats = React.useMemo(()=>{
    if(!data) return { totalSemen:0, totalPreg:0, successRate:0, byBull:[] };
    const semenMap = data.osemenjavanjaPoBiku || {};
    const pregMap = data.steonostiPoBiku || {};
    const totalSemen = Object.values(semenMap).reduce((s,v)=>s+(v||0),0);
    const totalPreg = Object.values(pregMap).reduce((s,v)=>s+(v||0),0);
    const successRate = totalSemen ? Math.round((totalPreg * 100) / totalSemen) : 0;

    const bulls = Array.from(new Set([...Object.keys(semenMap), ...Object.keys(pregMap)]));
    const byBull = bulls.map((b)=>({
      bik: b,
      semen: semenMap[b] || 0,
      steone: pregMap[b] || 0,
      uspeh: (semenMap[b] || 0) ? Math.round(((pregMap[b] || 0) * 100) / (semenMap[b] || 0)) : 0
    })).sort((a,b)=> (b.semen - a.semen) || (b.steone - a.steone) || a.bik.localeCompare(b.bik));

    return { totalSemen, totalPreg, successRate, byBull };
  }, [data]);

  function formatYearMonth(ymStr){
    // backend šalje YearMonth.toString() npr "2026-01"
    if(!ymStr) return '';
    const m = /^\s*(\d{4})-(\d{2})\s*$/.exec(String(ymStr));
    if(!m) return String(ymStr);
    const year = Number(m[1]);
    const month = Number(m[2]);
    const months = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];
    const baseYear = Number(String(data?.generisano || '').slice(0,4)) || (new Date()).getFullYear();
    const label = months[month-1] || ymStr;
    return year === baseYear ? label : `${year} ${label}`;
  }

  function BucketBars({ buckets }){
    const entries = Object.entries(buckets || {});
    const total = entries.reduce((s, [,v]) => s + (v||0), 0);
    if(!total) return <div className="text-sm text-gray-500">Nema podataka.</div>;

    return (
      <div className="space-y-2">
        {entries.map(([k,v])=>{
          const pct = Math.round((v||0) * 100 / total);
          return (
            <div key={k} className="grid grid-cols-[140px_1fr_60px] gap-3 items-center text-sm">
              <div className="text-gray-700">{k}</div>
              <div className="h-3 bg-gray-100 rounded">
                <div className="h-3 bg-black rounded" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right text-gray-600">{pct}%</div>
            </div>
          );
        })}
      </div>
    );
  }

  async function load(owner){
    try{
      setErr('');
      setOwnerState(owner);
      setData(await getIzvestaj(owner));
      setGen(await getGenetika(owner));
      setSemeStanje(await getSemeStanje());
    }catch(e){ setErr(e?.message || 'Greška'); }
  }

  React.useEffect(()=>{ load(); },[]);

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Izveštaj</h2>
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <form
              onSubmit={e=>{e.preventDefault(); const owner=e.target.owner.value.trim(); load(owner||undefined); }}
              className="flex gap-2 items-center"
            >
              <input name="owner" className="border rounded px-2 py-1" placeholder="owner (samo admin)" defaultValue={ownerState||''}/>
              <button className="px-3 py-1 rounded bg-gray-100 border">Učitaj</button>
            </form>
          )}
          <button onClick={()=>load()} className="px-3 py-1 rounded bg-gray-100 border">Osveži</button>
        </div>
      </div>

      {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded ${view==='izvestaj' ? 'bg-black text-white' : 'bg-white border'}`}
          onClick={()=>setView('izvestaj')}
        >Izveštaj</button>
        <button
          className={`px-3 py-2 rounded ${view==='semena' ? 'bg-black text-white' : 'bg-white border'}`}
          onClick={()=>setView('semena')}
        >Semena</button>
        <button
          className={`px-3 py-2 rounded ${view==='genetika' ? 'bg-black text-white' : 'bg-white border'}`}
          onClick={()=>setView('genetika')}
        >Genetika</button>
      </div>

      {/* IZVEŠTAJ */}
      {view==='izvestaj' && (!data ? <div>Učitavam...</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{data.brojSteonih}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Steonih</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{data.brojOtvorenih}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Otvorenih</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{data.ukupnoGrla}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Ukupno</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Očekivana teljenja po mesecima</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50"><th className="text-left p-2">Mesec</th><th className="text-right p-2">Broj</th></tr>
              </thead>
              <tbody>
                {data.ocekivanaTeljenjaPoMesecu.map(m => (
                  <tr key={m.mesec} className="border-b">
                    <td className="p-2">{formatYearMonth(m.mesec)}</td>
                    <td className="p-2 text-right">{m.broj}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <h3 className="font-semibold mb-3">Dani od poslednjeg teljenja</h3>
            <BucketBars buckets={data.teljenjaPoMesecu} />
          </div>

          <div className="text-[11px] uppercase tracking-wide text-gray-500">
            Generisano: {data.generisano} • vlasnik: {data.vlasnik}
          </div>
        </div>
      ))}

      {/* SEMENA */}
      {view==='semena' && (!data ? <div>Učitavam...</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{data.zaOsemenjavanje}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Za osemenjavanje</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{data.zaPotvrduSteonosti}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Za potvrdu steonosti</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{semenStats.totalSemen}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Ukupno osemenjavanja</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border">
              <div className="text-3xl font-extrabold tracking-tight">{semenStats.successRate}%</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Procena uspeha</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Udeo potrošnje semena po biku</h3>
              <Pie data={data.osemenjavanjaPoBiku} title="Udeo potrošnje semena po biku" />
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Udeo steonih krava po biku</h3>
              <Pie data={data.steonostiPoBiku} title="Udeo steonih krava po biku" />
              <div className="text-xs text-gray-500 mt-2">Računa se po biku sa poslednjeg osemenjavanja (za krave koje su označene kao steone).</div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-semibold">Stanje semena (ručna korekcija)</h3>
              <form
                className="flex gap-2 items-center flex-wrap"
                onSubmit={async (e)=>{
                  e.preventDefault();
                  try{
                    setErr('');
                    const bik = String(adjBik||'').trim();
                    const k = Number(adjKolicina);
                    if(!bik) throw new Error('Unesi bika.');
                    if(!Number.isFinite(k) || k<=0) throw new Error('Količina mora biti broj > 0.');
                    // Dugmad će postaviti znak
                  }catch(ex){ setErr(ex?.message || 'Greška'); }
                }}
              >
                <input
                  className="border rounded px-2 py-1"
                  placeholder="Bik"
                  value={adjBik}
                  onChange={(e)=>setAdjBik(e.target.value)}
                  list="bikovi-seme"
                />
                <datalist id="bikovi-seme">
                  {[...new Set([...
                    Object.keys(data?.osemenjavanjaPoBiku||{}),
                    ...Object.keys(data?.steonostiPoBiku||{}),
                    ...(semeStanje||[]).map(x=>x.bik)
                  ])].filter(Boolean).sort().map((b)=> <option key={b} value={b} />)}
                </datalist>
                <input
                  className="border rounded px-2 py-1 w-28"
                  type="number"
                  min="1"
                  step="1"
                  value={adjKolicina}
                  onChange={(e)=>setAdjKolicina(e.target.value)}
                />
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-black text-white"
                  onClick={async ()=>{
                    try{
                      setErr('');
                      const bik = String(adjBik||'').trim();
                      const k = Number(adjKolicina);
                      if(!bik) throw new Error('Unesi bika.');
                      if(!Number.isFinite(k) || k<=0) throw new Error('Količina mora biti broj > 0.');
                      await adjustSeme({ bik, delta: +k });
                      setSemeStanje(await getSemeStanje());
                    }catch(ex){ setErr(ex?.message || 'Greška'); }
                  }}
                >Dodaj</button>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-white border"
                  onClick={async ()=>{
                    try{
                      setErr('');
                      const bik = String(adjBik||'').trim();
                      const k = Number(adjKolicina);
                      if(!bik) throw new Error('Unesi bika.');
                      if(!Number.isFinite(k) || k<=0) throw new Error('Količina mora biti broj > 0.');
                      await adjustSeme({ bik, delta: -k });
                      setSemeStanje(await getSemeStanje());
                    }catch(ex){ setErr(ex?.message || 'Greška'); }
                  }}
                >Izbaci</button>
              </form>
            </div>

            {!semeStanje?.length ? (
              <div className="text-sm text-gray-500">Nema unetog stanja semena. Dodaj bika i količinu gore.</div>
            ) : (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Bik</th>
                    <th className="text-right p-2">Količina</th>
                  </tr>
                </thead>
                <tbody>
                  {semeStanje
                    .slice()
                    .sort((a,b)=> (b.kolicina - a.kolicina) || String(a.bik).localeCompare(String(b.bik)))
                    .map((r)=>(
                      <tr key={r.bik} className="border-b">
                        <td className="p-2">{r.bik}</td>
                        <td className="p-2 text-right">{r.kolicina}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-1">Potrošeno semena po biku</h3>
              {!Object.keys(data.osemenjavanjaPoBiku || {}).length ? (
                <div className="text-sm text-gray-500">Nema podataka.</div>
              ) : (
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50"><th className="text-left p-2">Bik</th><th className="text-right p-2">Doza</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.osemenjavanjaPoBiku || {}).map(([k,v])=> (
                      <tr key={k} className="border-b"><td className="p-2">{k}</td><td className="p-2 text-right">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-1">Steone krave po biku (poslednje osemenjavanje)</h3>
              {!Object.keys(data.steonostiPoBiku || {}).length ? (
                <div className="text-sm text-gray-500">Nema podataka.</div>
              ) : (
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50"><th className="text-left p-2">Bik</th><th className="text-right p-2">Steonih</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.steonostiPoBiku || {}).map(([k,v])=> (
                      <tr key={k} className="border-b"><td className="p-2">{k}</td><td className="p-2 text-right">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Procena uspešnosti po biku</h3>
            {!semenStats.byBull.length ? (
              <div className="text-sm text-gray-500">Nema podataka.</div>
            ) : (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Bik</th>
                    <th className="text-right p-2">Osemenjavanja</th>
                    <th className="text-right p-2">Steonih</th>
                    <th className="text-right p-2">Uspeh</th>
                  </tr>
                </thead>
                <tbody>
                  {semenStats.byBull.map((r)=> (
                    <tr key={r.bik} className="border-b">
                      <td className="p-2">{r.bik}</td>
                      <td className="p-2 text-right">{r.semen}</td>
                      <td className="p-2 text-right">{r.steone}</td>
                      <td className="p-2 text-right">{r.uspeh}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="text-[11px] uppercase tracking-wide text-gray-500">
            Generisano: {data.generisano} • vlasnik: {data.vlasnik}
          </div>
        </div>
      ))}

      {/* GENETIKA */}
      {view==='genetika' && (
        !gen ? <div>Učitavam...</div> : (
          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Genetika stada</div>
                <div className="text-sm text-gray-600">Vlasnik: {gen.vlasnik} • Generisano: {gen.generisano}</div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>Ukupno grla: <b>{gen.ukupnoGrla}</b></div>
                <div>Sa poznatim bikom: <b>{gen.saPoznatimBikom}</b></div>
              </div>
            </div>

            <Pie data={gen.poBiku} title="Udeo po biku (od grla sa poznatim bikom)" />

            <div className="text-xs text-gray-500">
              Napomena: genetika se računa na osnovu podataka snimljenih na grlu (bikOtac). To se automatski popunjava kod teladi kada obradiš teljenje.
            </div>
          </div>
        )
      )}
    </div>
  );
}

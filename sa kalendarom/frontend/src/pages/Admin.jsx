import React from 'react';
import AddGrloForm from '../components/AddGrloForm.jsx';
import { dodajDogadjajBulk, adminListUsers, adminCreateUser } from '../api.js';

export default function Admin({ isAdmin }){
  const [showHints, setShowHints] = React.useState(() => {
    try{
      const v = localStorage.getItem('admin_show_hints');
      return v === null ? true : v === '1';
    }catch{ return true; }
  });

  const [bulkBrojevi, setBulkBrojevi] = React.useState('');
  const [bulkTip, setBulkTip] = React.useState('OSEMENJAVANJE');
  const [bulkDatum, setBulkDatum] = React.useState('');
  const [bulkBik, setBulkBik] = React.useState('');
  const [confirmTeljenje, setConfirmTeljenje] = React.useState(false);
  const [owner, setOwner] = React.useState('');
  const [bulkMsg, setBulkMsg] = React.useState('');

  async function submitBulk(e){
    e.preventDefault(); setBulkMsg('');
    const brojevi = bulkBrojevi.split(/[\n,;\s]+/).map(s=>s.trim()).filter(Boolean);
    if(brojevi.length===0){ setBulkMsg('Unesi bar jedan broj.'); return; }
    if(bulkTip==='OSEMENJAVANJE' && !bulkBik.trim()){ setBulkMsg('Za osemenjavanje moraš uneti bika.'); return; }
    if(bulkTip==='OSEMENJAVANJE' && bulkDatum && new Date(bulkDatum) > new Date()){ setBulkMsg('Datum osemenjavanja ne može biti u budućnosti.'); return; }
    try{
      await dodajDogadjajBulk({ brojevi, tip: bulkTip, datum: bulkTip==='POTVRDJENA_STEONOST' ? null : (bulkDatum || null), bik: bulkTip==='OSEMENJAVANJE' ? bulkBik : null, force: confirmTeljenje || false, owner: owner || null });
      setBulkMsg('Uspeh.');
      setConfirmTeljenje(false);
    }catch(err){
      const m = (''+err.message);
      if(m.includes('POTVRDI_TELJENJE:') || m.includes('POTVRDI_OSEMENJAVANJE_NA_STEONU')){
        setBulkMsg(m);
        setConfirmTeljenje(true);
        return;
      }
      setBulkMsg(m);
    }
  }

  const [users, setUsers] = React.useState([]);
  const [nu, setNu] = React.useState({username:'', password:'', admin:false});
  React.useEffect(()=>{ (async()=>{ try{ setUsers(await adminListUsers()); }catch{} })(); },[]);
  async function createUser(e){
    e.preventDefault();
    const roles = nu.admin ? ['ROLE_USER','ROLE_ADMIN'] : ['ROLE_USER'];
    const u = await adminCreateUser({ username: nu.username, password: nu.password, roles });
    setUsers([...users, u]); setNu({username:'',password:'',admin:false});
  }

  return (
    <div className="grid gap-6">
      <AddGrloForm showHints={showHints}/>

      <form onSubmit={submitBulk} className="bg-white p-4 rounded-2xl shadow">
        <h3 className="font-semibold mb-2">Krave koje ste radili</h3>
        <textarea className="w-full border rounded p-2" rows={4}
          placeholder={showHints ? "Unesi brojeve grla (npr: 0001 0002 ili jedan po liniji)" : ""}
          value={bulkBrojevi} onChange={e=>setBulkBrojevi(e.target.value)} />
        <div className="grid grid-cols-3 gap-3 mt-3">
          <select className="border rounded px-2 py-1" value={bulkTip} onChange={e=>{setBulkTip(e.target.value); setBulkMsg(''); setConfirmTeljenje(false);}}>
            <option value="TELJENJE">Teljenje</option>
            <option value="OSEMENJAVANJE">Osemenjavanje</option>
            <option value="POTVRDJENA_STEONOST">Potvrđena steonost</option>
          </select>
          {bulkTip!=='POTVRDJENA_STEONOST' && (
            <input className="border rounded px-2 py-1" type="date" value={bulkDatum} onChange={e=>setBulkDatum(e.target.value)} />
          )}
          {bulkTip==='OSEMENJAVANJE' && (
            <input className="border rounded px-2 py-1" placeholder={showHints ? "Bik (obavezno za osemenjavanje)" : ""} value={bulkBik} onChange={e=>setBulkBik(e.target.value)} />
          )}
          {isAdmin && (
            <input className="border rounded px-2 py-1" placeholder={showHints ? "owner (samo admin)" : ""} value={owner} onChange={e=>setOwner(e.target.value)} />
          )}
        </div>
        <button className="mt-3 px-3 py-2 rounded bg-black text-white">Snimi događaje</button>
        {bulkMsg && <div className="text-green-700 text-sm mt-2">{bulkMsg}</div>}
      </form>

      <div className="flex justify-end">
        <label className="text-sm text-gray-600 flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={showHints}
            onChange={e=>{
              const v = e.target.checked;
              setShowHints(v);
              try{ localStorage.setItem('admin_show_hints', v ? '1' : '0'); }catch{}
            }}
          />
          Prikaži pomoćni tekst u poljima
        </label>
      </div>

      {isAdmin && (
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="font-semibold mb-2">Korisnici (Admin)</h3>
          <form onSubmit={createUser} className="grid grid-cols-3 gap-3 mb-3">
            <input className="border rounded px-2 py-1" placeholder={showHints ? "username" : ""}
                  value={nu.username} onChange={e=>setNu({...nu, username:e.target.value})}/>
            <input className="border rounded px-2 py-1" type="password" placeholder={showHints ? "password" : ""}
                  value={nu.password} onChange={e=>setNu({...nu, password:e.target.value})}/>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nu.admin} onChange={e=>setNu({...nu, admin:e.target.checked})}/> Admin
            </label>
            <button className="col-span-3 px-3 py-2 rounded bg-black text-white">Kreiraj</button>
          </form>
          <ul className="text-sm">
            {users.map(u=> <li key={u.id} className="border-b py-1">{u.username} <span className="text-gray-500">({u.roles})</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

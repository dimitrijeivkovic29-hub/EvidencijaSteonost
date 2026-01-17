import Calendar from './pages/Calendar.jsx';
import React, { useEffect, useState } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Report from './pages/Report.jsx';
import Teljenja from './pages/Teljenja.jsx';
import Telad from './pages/Telad.jsx';
import Mleko from './pages/Mleko.jsx';
import { me } from './api.js';

export default function App(){
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState('dashboard');

  useEffect(()=>{ (async()=>{ try{ setUser(await me()); }catch{ setUser(null);} })(); },[]);
  if(!user) return <Login onLogin={setUser}/>;

  const isAdmin = (user.roles||[]).includes('ROLE_ADMIN') || (user.roles||[]).includes('ADMIN');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Steonost Tracker</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Prijavljen: {user.username}</span>
            <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>{ localStorage.removeItem('auth'); location.reload(); }

}>Odjava</button>
          </div>
        </header>
        <nav className="mb-4 flex gap-2 flex-wrap">
          <button className={`px-3 py-2 rounded ${tab==='dashboard'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('dashboard')}>Početna</button>
          <button className={`px-3 py-2 rounded ${tab === 'admin' ? 'bg-black text-white' : 'bg-white border'}`} onClick={() => setTab('admin')}>Administracija</button>
          <button className={`px-3 py-2 rounded ${tab === 'calendar' ? 'bg-black text-white' : 'bg-white border'}`} onClick={() => setTab('calendar')}>Kalendar</button>
          <button className={`px-3 py-2 rounded ${tab==='teljenja'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('teljenja')}>Teljenja</button>
          <button className={`px-3 py-2 rounded ${tab==='telad'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('telad')}>Telad</button>
          <button className={`px-3 py-2 rounded ${tab==='mleko'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('mleko')}>Mleko</button>
          <button className={`px-3 py-2 rounded ${tab==='report'?'bg-black text-white':'bg-white border'}`} onClick={()=>setTab('report')}>Izveštaj</button>
        </nav>
        {tab==='dashboard' && <Dashboard/>}
        {tab==='teljenja' && <Teljenja/>}
        {tab==='telad' && <Telad/>}
        {tab==='mleko' && <Mleko/>}
        {tab==='report' && <Report isAdmin={isAdmin}/>}
        {tab==='admin' && <Admin isAdmin={isAdmin}/>}
      </div>
    
    {tab==='calendar' && <Calendar/>}
</div>
  
    
);
}

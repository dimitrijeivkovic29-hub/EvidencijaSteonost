import React, { useState } from 'react';
import { me } from '../api.js';

export default function Login({onLogin}){
  const [username,setUsername]=useState('user');
  const [password,setPassword]=useState('user');
  const [err,setErr]=useState('');
  async function submit(e){
    e.preventDefault();
    const token = btoa(`${username}:${password}`);
    localStorage.setItem('auth', token);
    try{ const u = await me(); onLogin(u);}catch{ setErr('Pogrešan login.'); localStorage.removeItem('auth'); }
  }
  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={submit} className="bg-white p-6 rounded-2xl shadow w-full max-w-sm space-y-4">
        <h2 className="text-xl font-semibold">Prijava</h2>
        <input className="w-full border rounded px-3 py-2" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Korisničko ime"/>
        <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Lozinka"/>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-black text-white rounded py-2">Uđi</button>
        
      </form>
    </div>
  );
}

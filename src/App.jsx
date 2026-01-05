import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Zap, Footprints, Crosshair, RotateCcw, ShieldCheck, Eye, EyeOff
} from 'lucide-react';

/* ================== CONFIG ================== */
const AUTO_ADVANCE_KM = 0.3;

/* ================== STYLES ================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
:root { --yellow:#facc15; --red:#ff0000; --black:#050505; --cyan:#00e5ff; }
body,html,#root{margin:0;height:100%;background:var(--black);font-family:'JetBrains Mono',monospace;color:white;overflow:hidden}
.leaflet-container{filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); z-index:1}
.sniper-scope-marker{position:relative;width:80px;height:80px;display:flex;justify-content:center;align-items:center}
.scope-cross-h,.scope-cross-v{position:absolute;background:red;box-shadow:0 0 8px red}
.scope-cross-h{width:100%;height:1px}
.scope-cross-v{width:1px;height:100%}
.scope-circle{width:40px;height:40px;border:1px solid red;border-radius:50%}
.scope-pulse{position:absolute;width:40px;height:40px;border:2px solid red;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{to{transform:scale(3);opacity:0}}
.sensor-overlay{position:fixed;inset:0;background:black;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tactical-panel{position:fixed; top:80px; left:20px; z-index:1000; background:rgba(0,0,0,0.85); border:1px solid var(--yellow); padding:12px; border-radius:8px; min-width:160px; backdrop-filter:blur(4px)}
`;

/* ================== STAGES (FULL CAMINO FRANCÉS) ================== */
const STAGES = [
  { id:1, name:"St-Jean - Roncesvalles", dist:24.2, coords:[43.0125,-1.3148] },
  { id:2, name:"Roncesvalles - Zubiri", dist:21.4, coords:[42.9298,-1.5042] },
  { id:3, name:"Zubiri - Pamplona", dist:20.4, coords:[42.8125,-1.6458] },
  { id:4, name:"Pamplona - P. la Reina", dist:24.0, coords:[42.6719,-1.8139] },
  { id:5, name:"P. la Reina - Estella", dist:22.0, coords:[42.6715,-2.0315] },
  { id:6, name:"Estella - Los Arcos", dist:21.0, coords:[42.5684,-2.1917] },
  { id:7, name:"Los Arcos - Logroño", dist:28.0, coords:[42.4627,-2.445] },
  { id:8, name:"Logroño - Nájera", dist:29.0, coords:[42.4162,-2.7303] },
  { id:9, name:"Nájera - Sto. Domingo", dist:21.0, coords:[42.4411,-2.9535] },
  { id:10, name:"Sto. Domingo - Belorado", dist:22.0, coords:[42.4194,-3.1904] },
  { id:11, name:"Belorado - Agés", dist:27.4, coords:[42.3664,-3.4503] },
  { id:12, name:"Agés - Burgos", dist:23.0, coords:[42.3440,-3.6969] },
  { id:13, name:"Burgos - Hontanas", dist:31.1, coords:[42.3120,-4.0450] },
  { id:14, name:"Hontanas - Frómista", dist:34.5, coords:[42.2668,-4.4061] },
  { id:15, name:"Frómista - Carrión", dist:19.3, coords:[42.3389,-4.6067] },
  { id:16, name:"Carrión - Terradillos", dist:26.3, coords:[42.3610,-4.9248] },
  { id:17, name:"Terradillos - Sahagún", dist:13.9, coords:[42.3719,-5.0315] },
  { id:18, name:"Sahagún - B. Ranero", dist:18.0, coords:[42.4230,-5.2215] },
  { id:19, name:"B. Ranero - León", dist:37.1, coords:[42.5987,-5.5671] },
  { id:20, name:"León - San Martín", dist:25.9, coords:[42.5200,-5.8100] },
  { id:21, name:"San Martín - Astorga", dist:24.2, coords:[42.4544,-6.0560] },
  { id:22, name:"Astorga - Foncebadón", dist:25.8, coords:[42.4385,-6.3450] },
  { id:23, name:"Foncebadón - Ponferrada", dist:26.8, coords:[42.5455,-6.5936] },
  { id:24, name:"Ponferrada - Villafranca", dist:24.2, coords:[42.6074,-6.8115] },
  { id:25, name:"Villafranca - O Cebreiro", dist:27.8, coords:[42.7077,-7.0423] },
  { id:26, name:"O Cebreiro - Triacastela", dist:20.8, coords:[42.7565,-7.2403] },
  { id:27, name:"Triacastela - Sarria", dist:18.4, coords:[42.7770,-7.4160] },
  { id:28, name:"Sarria - Portomarín", dist:22.2, coords:[42.8075,-7.6160] },
  { id:29, name:"Portomarín - Palas Rei", dist:24.8, coords:[42.8732,-7.8687] },
  { id:30, name:"Palas Rei - Arzúa", dist:28.5, coords:[42.9265,-8.1634] },
  { id:31, name:"Arzúa - O Pedrouzo", dist:19.3, coords:[42.9100,-8.3600] },
  { id:32, name:"O Pedrouzo - Santiago", dist:19.4, coords:[42.8870,-8.5100] },
  { id:33, name:"Santiago de Compostela", dist:0, coords:[42.8806,-8.5464] }
];

/* ================== MAP CTRL ================== */
function MapController({ userPos, tracking, target }) {
  const map = useMap();
  useEffect(() => {
    if (tracking && userPos) map.setView(userPos, 16);
    else if (target) map.flyTo(target, 14);
  }, [userPos, tracking, target, map]);
  return null;
}

/* ================== APP ================== */
export default function App() {
  const [activeStage, setActiveStage] = useState(() => JSON.parse(localStorage.getItem('stage_v30')) || STAGES[0]);
  const [steps, setSteps] = useState(() => parseInt(localStorage.getItem('steps_v30')) || 0);
  const [stageStartSteps, setStageStartSteps] = useState(() => parseInt(localStorage.getItem('stage_start_v30')) || 0);
  const [userPos, setUserPos] = useState(() => JSON.parse(localStorage.getItem('last_pos_v30')) || null);
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('tracking_v30') === 'true');
  const [batterySave, setBatterySave] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const lastAcc = useRef(0);
  const debounce = useRef(false);

  useEffect(() => {
    localStorage.setItem('steps_v30', steps);
    localStorage.setItem('stage_v30', JSON.stringify(activeStage));
    localStorage.setItem('tracking_v30', isTracking);
  }, [steps, activeStage, isTracking]);

  useEffect(() => {
    const s = document.createElement('style');
    s.innerHTML = STYLES;
    document.head.appendChild(s);
    const watch = navigator.geolocation.watchPosition(
      p => {
        const pos = [p.coords.latitude, p.coords.longitude];
        setUserPos(pos);
        localStorage.setItem('last_pos_v30', JSON.stringify(pos));
      },
      null,
      { enableHighAccuracy: !batterySave, maximumAge: batterySave ? 10000 : 0 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [batterySave]);

  const handleMotion = useCallback((e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const v = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
    if (Math.abs(v - lastAcc.current) > 12.5 && !debounce.current) {
      setSteps(s => s + 1);
      debounce.current = true;
      setTimeout(() => debounce.current = false, 350);
    }
    lastAcc.current = v;
  }, []);

  const getDistance = () => {
    if (!userPos) return "0.00";
    const R = 6371;
    const dLat = (activeStage.coords[0]-userPos[0]) * Math.PI/180;
    const dLon = (activeStage.coords[1]-userPos[1]) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180) * Math.cos(activeStage.coords[0]*Math.PI/180) * Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
  };

  useEffect(() => {
    if (!userPos) return;
    if (parseFloat(getDistance()) <= AUTO_ADVANCE_KM) {
      const next = STAGES.find(s => s.id === activeStage.id + 1);
      if (next) {
        setStageStartSteps(steps);
        localStorage.setItem('stage_start_v30', steps);
        setActiveStage(next);
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }
  }, [userPos]);

  const resetSteps = () => {
    if (confirm("¿Reiniciar contadores de misión?")) {
      setSteps(0);
      setStageStartSteps(0);
      localStorage.setItem('stage_start_v30', 0);
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {showOverlay && (
        <div className="sensor-overlay">
          <ShieldCheck size={80} className="text-yellow-500 mb-6 animate-pulse"/>
          <button onClick={async () => {
            if (DeviceMotionEvent?.requestPermission) {
              const r = await DeviceMotionEvent.requestPermission();
              if (r === 'granted') window.addEventListener('devicemotion', handleMotion);
            } else window.addEventListener('devicemotion', handleMotion);
            setShowOverlay(false);
          }} className="px-10 py-4 bg-yellow-500 text-black font-black rounded-xl">INIT SYSTEMS</button>
        </div>
      )}

      <header className="h-16 flex justify-between items-center px-6 border-b border-yellow-500 bg-black z-[1001]">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" fill="currentColor" size={20}/>
          <span className="text-yellow-500 font-black italic text-xs">V32.0_FULL_CAMINO</span>
        </div>
        <span className="text-yellow-500 font-bold text-[10px] uppercase">E{activeStage.id}: {activeStage.name}</span>
      </header>

      <div className="tactical-panel">
        <div className="mb-2">
          <div className="text-[8px] text-white/40 font-bold tracking-tighter">TOTAL_MISSION_STEPS</div>
          <div className="text-lg font-black text-yellow-500">{steps.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[8px] text-white/40 font-bold tracking-tighter">CURRENT_STAGE_STEPS</div>
          <div className="text-lg font-black text-cyan-400">{(steps - stageStartSteps).toLocaleString()}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-[8px] text-white/40 font-bold">RANGE_TO_OBJ</div>
          <div className="text-xs font-bold text-white">{getDistance()} KM</div>
        </div>
      </div>

      <MapContainer center={activeStage.coords} zoom={14} zoomControl={false} style={{flex:1}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Polyline positions={STAGES.map(s=>s.coords)} color="#00e5ff" weight={3} dashArray="10, 10"/>
        {userPos && (
          <Marker position={userPos} icon={new L.DivIcon({
            html:`<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`,
            iconSize:[80,80], iconAnchor:[40,40]
          })}/>
        )}
        <MapController userPos={userPos} tracking={isTracking} target={activeStage.coords}/>
      </MapContainer>

      <div className="fixed bottom-8 right-6 flex flex-col gap-4 z-[1000]">
        <button onClick={()=>setBatterySave(!batterySave)} className={`p-5 rounded-2xl border ${batterySave ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-black text-cyan-400 border-cyan-400/30'}`}>
          {batterySave ? <EyeOff size={28}/> : <Eye size={28}/>}
        </button>
        <button onClick={()=>setIsTracking(!isTracking)} className={`p-5 rounded-2xl ${isTracking ? 'bg-yellow-500 text-black' : 'bg-black text-white border border-white/20'}`}>
          <Crosshair size={28}/>
        </button>
        <button onClick={resetSteps} className="p-5 bg-red-600 text-white rounded-2xl">
          <RotateCcw size={28}/>
        </button>
      </div>
    </div>
  );
}
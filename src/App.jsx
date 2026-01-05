import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Zap, Footprints, MessageCircle, Crosshair, Navigation, 
  RotateCcw, ShieldCheck, Eye, EyeOff, TrendingUp
} from 'lucide-react';

/* ===================== CONFIG ===================== */
const AUTO_ADVANCE_KM = 0.3;
const STEP_THRESHOLD = 12.5;
const STEP_DEBOUNCE_MS = 350;

/* ===================== STYLES ===================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
:root { --yellow:#facc15; --red:#ff0000; --black:#050505; --cyan:#00e5ff; }
html,body,#root{margin:0;height:100%;background:var(--black);font-family:'JetBrains Mono',monospace;color:white;overflow:hidden}
.leaflet-container{background:#000;filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); z-index:1}
.sniper-scope-marker{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
.scope-cross-h,.scope-cross-v{position:absolute;background:red;box-shadow:0 0 8px red}
.scope-cross-h{width:100%;height:1px}
.scope-cross-v{width:1px;height:100%}
.scope-circle{width:40px;height:40px;border:1px solid red;border-radius:50%}
.scope-pulse{position:absolute;width:40px;height:40px;border:2px solid red;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{to{transform:scale(3);opacity:0}}
.sensor-overlay{position:fixed;inset:0;background:black;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.tactical-stats{position:fixed; top:80px; left:20px; z-index:1000; background:rgba(0,0,0,0.85); border:1px solid var(--yellow); padding:12px; border-radius:8px; min-width:170px; pointer-events:none; backdrop-filter:blur(5px)}
`;

/* ===================== STAGES (FULL DATA) ===================== */
const STAGES = [
  { id:1, name:"St-Jean - Roncesvalles", gain:"+1250m", diff:"ALTA", coords:[43.0125,-1.3148] },
  { id:2, name:"Roncesvalles - Zubiri", gain:"+400m", diff:"MEDIA", coords:[42.9298,-1.5042] },
  { id:3, name:"Zubiri - Pamplona", gain:"+200m", diff:"BAJA", coords:[42.8125,-1.6458] },
  { id:4, name:"Pamplona - P. la Reina", gain:"+450m", diff:"MEDIA", coords:[42.6719,-1.8139] },
  { id:5, name:"P. la Reina - Estella", gain:"+400m", diff:"BAJA", coords:[42.6715,-2.0315] },
  { id:6, name:"Estella - Los Arcos", gain:"+350m", diff:"MEDIA", coords:[42.5684,-2.1917] },
  { id:7, name:"Los Arcos - Logroño", gain:"+450m", diff:"MEDIA", coords:[42.4627,-2.445] },
  { id:8, name:"Logroño - Nájera", gain:"+400m", diff:"BAJA", coords:[42.4162,-2.7303] },
  { id:9, name:"Nájera - Sto. Domingo", gain:"+300m", diff:"BAJA", coords:[42.4411,-2.9535] },
  { id:10, name:"Sto. Domingo - Belorado", gain:"+250m", diff:"BAJA", coords:[42.4194,-3.1904] },
  { id:11, name:"Belorado - Agés", gain:"+300m", diff:"MEDIA", coords:[42.3664,-3.4503] },
  { id:12, name:"Agés - Burgos", gain:"+150m", diff:"BAJA", coords:[42.3440,-3.6969] },
  { id:13, name:"Burgos - Hontanas", gain:"+200m", diff:"MEDIA", coords:[42.3120,-4.0450] },
  { id:14, name:"Hontanas - Frómista", gain:"+100m", diff:"BAJA", coords:[42.2668,-4.4061] },
  { id:15, name:"Frómista - Carrión", gain:"+50m", diff:"BAJA", coords:[42.3389,-4.6067] },
  { id:16, name:"Carrión - Terradillos", gain:"+150m", diff:"BAJA", coords:[42.3610,-4.9248] },
  { id:17, name:"Terradillos - Sahagún", gain:"+50m", diff:"BAJA", coords:[42.3719,-5.0315] },
  { id:18, name:"Sahagún - Bercianos", gain:"+100m", diff:"BAJA", coords:[42.4230,-5.2215] },
  { id:19, name:"Bercianos - León", gain:"+150m", diff:"MEDIA", coords:[42.5987,-5.5671] },
  { id:20, name:"León - San Martín", gain:"+100m", diff:"BAJA", coords:[42.5200,-5.8100] },
  { id:21, name:"San Martín - Astorga", gain:"+200m", diff:"BAJA", coords:[42.4544,-6.0560] },
  { id:22, name:"Astorga - Foncebadón", gain:"+600m", diff:"MEDIA", coords:[42.4385,-6.3450] },
  { id:23, name:"Foncebadón - Ponferrada", gain:"+200m", diff:"ALTA", coords:[42.5455,-6.5936] },
  { id:24, name:"Ponferrada - Villafranca", gain:"+150m", diff:"BAJA", coords:[42.6074,-6.8115] },
  { id:25, name:"Villafranca - O Cebreiro", gain:"+900m", diff:"ALTA", coords:[42.7077,-7.0423] },
  { id:26, name:"O Cebreiro - Triacastela", gain:"+100m", diff:"MEDIA", coords:[42.7565,-7.2403] },
  { id:27, name:"Triacastela - Sarria", gain:"+250m", diff:"MEDIA", coords:[42.7770,-7.4160] },
  { id:28, name:"Sarria - Portomarín", gain:"+350m", diff:"MEDIA", coords:[42.8075,-7.6160] },
  { id:29, name:"Portomarín - Palas de Rei", gain:"+400m", diff:"MEDIA", coords:[42.8732,-7.8687] },
  { id:30, name:"Palas de Rei - Arzúa", gain:"+450m", diff:"MEDIA", coords:[42.9265,-8.1634] },
  { id:31, name:"Arzúa - O Pedrouzo", gain:"+250m", diff:"BAJA", coords:[42.9100,-8.3600] },
  { id:32, name:"O Pedrouzo - Santiago", gain:"+300m", diff:"BAJA", coords:[42.8870,-8.5100] },
  { id:33, name:"Santiago de Compostela", gain:"0m", diff:"META", coords:[42.8806,-8.5464] }
];

function MapController({ userPos, tracking, target }) {
  const map = useMap();
  useEffect(() => {
    if (tracking && userPos) map.setView(userPos, 16, { animate:true });
    else if (target) map.flyTo(target, 14, { duration:1.5 });
  }, [userPos, tracking, target, map]);
  return null;
}

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
    localStorage.setItem('stage_start_v30', stageStartSteps);
  }, [steps, activeStage, isTracking, stageStartSteps]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = STYLES;
    document.head.appendChild(style);

    const watchId = navigator.geolocation.watchPosition(
      p => {
        const pos = [p.coords.latitude, p.coords.longitude];
        setUserPos(pos);
        localStorage.setItem('last_pos_v30', JSON.stringify(pos));
      },
      null,
      { enableHighAccuracy: !batterySave, maximumAge: batterySave ? 10000 : 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [batterySave]);

  const handleMotion = useCallback(e => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const v = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
    if (Math.abs(v - lastAcc.current) > STEP_THRESHOLD && !debounce.current) {
      setSteps(s => s + 1);
      debounce.current = true;
      setTimeout(() => debounce.current = false, STEP_DEBOUNCE_MS);
    }
    lastAcc.current = v;
  }, []);

  const distanceToTarget = useMemo(() => {
    if (!userPos) return null;
    const R = 6371;
    const dLat = (activeStage.coords[0] - userPos[0]) * Math.PI / 180;
    const dLon = (activeStage.coords[1] - userPos[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180) * Math.cos(activeStage.coords[0]*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }, [userPos, activeStage]);

  useEffect(() => {
    if (distanceToTarget !== null && distanceToTarget <= AUTO_ADVANCE_KM) {
      const next = STAGES.find(s => s.id === activeStage.id + 1);
      if (next) {
        setStageStartSteps(steps);
        setActiveStage(next);
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }
  }, [distanceToTarget, steps, activeStage.id]);

  const shareLocation = () => {
    if (!userPos) return alert("Esperando señal GPS...");
    const text = encodeURIComponent(`📍 INFORME TÁCTICO\nEtapa ${activeStage.id}: ${activeStage.name}\nPasos Etapa: ${steps - stageStartSteps}\nDificultad: ${activeStage.diff}\nUbicación: https://www.google.com/maps?q=${userPos[0]},${userPos[1]}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const resetSteps = () => {
    if (confirm("¿Reiniciar contador?")) {
      setSteps(0);
      setStageStartSteps(0);
    }
  };

  return (
    <div className="h-screen w-screen bg-black">
      {showOverlay && (
        <div className="sensor-overlay">
          <ShieldCheck size={80} className="text-yellow-500 mb-6 animate-pulse"/>
          <h2 className="text-yellow-500 font-black text-2xl mb-4">SANTIAGO TACTICAL</h2>
          <button onClick={async () => {
            if (DeviceMotionEvent?.requestPermission) {
              const r = await DeviceMotionEvent.requestPermission();
              if (r === 'granted') window.addEventListener('devicemotion', handleMotion);
            } else window.addEventListener('devicemotion', handleMotion);
            setShowOverlay(false);
          }} className="px-10 py-4 bg-yellow-500 text-black font-black rounded-xl">ACTIVAR SISTEMAS</button>
        </div>
      )}

      <header className="h-16 flex items-center justify-between px-6 border-b border-yellow-500 bg-black z-[1001]">
        <Zap className="text-yellow-500" fill="currentColor"/>
        <div className="flex flex-col items-center">
          <span className="text-yellow-500 font-bold text-xs italic">ETAPA {activeStage.id}/33</span>
          <span className="text-[10px] text-white/50 uppercase">{activeStage.name}</span>
        </div>
        <TrendingUp className="text-cyan-400"/>
      </header>

      <div className="tactical-stats">
        <div className="mb-2">
          <div className="text-[8px] text-white/40 font-bold tracking-widest uppercase">Total_Steps</div>
          <div className="text-lg font-black text-yellow-500">{steps.toLocaleString()}</div>
        </div>
        <div className="mb-2">
          <div className="text-[8px] text-white/40 font-bold tracking-widest uppercase">Stage_Steps</div>
          <div className="text-lg font-black text-cyan-400">{(steps - stageStartSteps).toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2 mb-2">
          <div>
            <div className="text-[7px] text-white/40 font-bold tracking-tighter">GAIN</div>
            <div className="text-[10px] font-bold text-white">{activeStage.gain}</div>
          </div>
          <div>
            <div className="text-[7px] text-white/40 font-bold tracking-tighter">DIFF</div>
            <div className="text-[10px] font-bold text-red-500">{activeStage.diff}</div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-1">
          <div className="text-[8px] text-white/40 font-bold">RANGE_TO_OBJ</div>
          <div className="text-xs font-bold text-white font-mono">{distanceToTarget ? distanceToTarget.toFixed(2) : "0.00"} KM</div>
        </div>
      </div>

      <MapContainer center={activeStage.coords} zoom={14} zoomControl={false} style={{ height: "calc(100% - 64px)" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Polyline positions={STAGES.map(s => s.coords)} pathOptions={{ color: '#00e5ff', weight: 4, opacity: 0.6 }}/>
        {userPos && (
          <Marker position={userPos} icon={new L.DivIcon({
            html: `<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`,
            iconSize:[80,80], iconAnchor:[40,40]
          })}/>
        )}
        <MapController userPos={userPos} tracking={isTracking} target={activeStage.coords}/>
      </MapContainer>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        <button onClick={shareLocation} className="p-4 bg-[#25D366] text-black rounded-xl shadow-lg active:scale-90 transition-transform"><MessageCircle size={28}/></button>
        <button onClick={()=>setBatterySave(!batterySave)} className={`p-4 bg-black border rounded-xl ${batterySave ? 'text-cyan-400 border-cyan-400' : 'text-white border-white/20'}`}>{batterySave ? <EyeOff size={28}/> : <Eye size={28}/>}</button>
        <button onClick={()=>setIsTracking(!isTracking)} className={`p-4 rounded-xl ${isTracking ? 'bg-yellow-500 text-black' : 'bg-black text-white border border-white/20'}`}><Crosshair size={28}/></button>
        <button onClick={resetSteps} className="p-4 bg-red-600 text-white rounded-xl"><RotateCcw size={28}/></button>
      </div>
    </div>
  );
}
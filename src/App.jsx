import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MessageCircle, Crosshair, RotateCcw, ShieldCheck, 
  Eye, EyeOff, AlertTriangle, Phone, ShieldAlert,
  Zap
} from 'lucide-react';

/* ===================== CONFIG & STYLES ===================== */
const STEP_THRESHOLD = 12.5;
const STEP_DEBOUNCE_MS = 350;

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
:root { --yellow:#facc15; --red:#ff0000; --black:#050505; --cyan:#00e5ff; --green:#22c55e; }
html,body,#root{margin:0;height:100%;background:var(--black);font-family:'JetBrains Mono',monospace;color:white;overflow:hidden}
.leaflet-container{background:#000;filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); z-index:1}

.sniper-scope-marker{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
.scope-cross-h,.scope-cross-v{position:absolute;background:red;box-shadow:0 0 8px red}
.scope-cross-h{width:100%;height:1px}
.scope-cross-v{width:1px;height:100%}
.scope-circle{width:40px;height:40px;border:1px solid red;border-radius:50%}
.scope-pulse{position:absolute;width:40px;height:40px;border:2px solid red;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{to{transform:scale(3);opacity:0}}

/* PANEL STATS AHORA A LA DERECHA */
.tactical-stats{position:fixed; top:20px; right:20px; z-index:1000; background:rgba(0,0,0,0.9); border:1px solid var(--cyan); padding:10px; border-radius:8px; min-width:140px; pointer-events:none; backdrop-filter:blur(5px); text-align:right;}

/* SELECTOR AHORA A LA IZQUIERDA */
.selector-container{position:fixed; top:20px; left:20px; z-index:1100; width:180px;}
select { background: #111; color: var(--yellow); border: 1px solid var(--yellow); padding: 10px; font-family: 'JetBrains Mono'; border-radius: 6px; width: 100%; font-size: 11px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }

.bottom-console { position: fixed; bottom: 0; left: 0; right: 0; background: #0a0a0a; border-top: 2px solid var(--cyan); display: flex; justify-content: space-around; align-items: center; padding: 12px 10px 25px 10px; z-index: 2000; }
.emergency-popover { position: absolute; bottom: 95px; left: 10px; display: flex; flex-direction: column; gap: 8px; width: 240px; animation: slideUp 0.2s ease-out; }
.btn-emergency { background: var(--red); color: white; padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 12px; border: 2px solid white; }
.btn-whatsapp { background: var(--green); color: black; padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 12px; border: 2px solid black; }

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

/* ===================== DATA: ALL 33 STAGES ===================== */
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
    if (tracking && userPos) map.setView(userPos, 17, { animate:true });
    else if (target) map.flyTo(target, 14, { duration:1.5 });
  }, [userPos, tracking, target, map]);
  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(() => JSON.parse(localStorage.getItem('stage_v41')) || STAGES[0]);
  const [steps, setSteps] = useState(() => parseInt(localStorage.getItem('steps_v41')) || 0);
  const [userPos, setUserPos] = useState(() => JSON.parse(localStorage.getItem('last_pos_v41')) || null);
  const [isTracking, setIsTracking] = useState(false);
  const [batterySave, setBatterySave] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [sosMenu, setSosMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('steps_v41', steps);
    localStorage.setItem('stage_v41', JSON.stringify(activeStage));
    if(userPos) localStorage.setItem('last_pos_v41', JSON.stringify(userPos));
  }, [steps, activeStage, userPos]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = STYLES;
    document.head.appendChild(style);
    const watchId = navigator.geolocation.watchPosition(
      p => setUserPos([p.coords.latitude, p.coords.longitude]),
      null, { enableHighAccuracy: !batterySave }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [batterySave]);

  const distanceToTarget = useMemo(() => {
    if (!userPos) return null;
    const R = 6371;
    const dLat = (activeStage.coords[0] - userPos[0]) * Math.PI / 180;
    const dLon = (activeStage.coords[1] - userPos[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180) * Math.cos(activeStage.coords[0]*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }, [userPos, activeStage]);

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      {showOverlay && (
        <div className="sensor-overlay">
          <ShieldCheck size={80} className="text-yellow-500 mb-6 animate-pulse"/>
          <button onClick={() => setShowOverlay(false)} className="px-12 py-5 bg-cyan-500 text-black font-black rounded-2xl uppercase">Entrar v41</button>
        </div>
      )}

      {/* IZQUIERDA: SELECTOR DE ETAPAS (Z-INDEX ALTO) */}
      <div className="selector-container">
        <select value={activeStage.id} onChange={(e) => setActiveStage(STAGES.find(x => x.id === parseInt(e.target.value)))}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
        </select>
      </div>

      {/* DERECHA: TELEMETRÍA (PASOS Y KM) */}
      <div className="tactical-stats">
        <div className="text-[8px] text-cyan-400 font-bold uppercase mb-1">Live_Telemetry</div>
        <div className="text-xl font-black text-yellow-500 leading-none">{steps.toLocaleString()} <span className="text-[7px] text-white/30">PASOS</span></div>
        <div className="text-sm font-bold text-white mt-1">{distanceToTarget ? distanceToTarget.toFixed(2) : "0.0"} KM</div>
      </div>

      <MapContainer center={activeStage.coords} zoom={14} zoomControl={false} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Polyline positions={STAGES.map(s => s.coords)} pathOptions={{ color: '#00e5ff', weight: 4 }}/>
        {userPos && <Marker position={userPos} icon={new L.DivIcon({ html: `<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`, iconSize:[80,80], iconAnchor:[40,40] })}/>}
        <MapController userPos={userPos} tracking={isTracking} target={activeStage.coords}/>
      </MapContainer>

      {/* CONSOLA DE MANDOS INFERIOR */}
      <div className="bottom-console">
        
        {/* BOTÓN SOS DINÁMICO */}
        <div className="relative">
          {sosMenu && (
            <div className="emergency-popover">
              <button onClick={() => window.open('tel:112')} className="btn-emergency">
                <Phone size={20}/> 112 EMERGENCIAS
              </button>
              <button onClick={() => window.open('tel:062')} className="btn-emergency" style={{background: '#003366'}}>
                <ShieldAlert size={20}/> 062 GUARDIA CIVIL
              </button>
              <button onClick={() => window.open(`https://wa.me/?text=🚨 SOS! UBICACIÓN: http://googleusercontent.com/maps.google.com/6${userPos?.[0]},${userPos?.[1]}`)} className="btn-whatsapp">
                <MessageCircle size={20}/> WHATSAPP SOS
              </button>
            </div>
          )}
          <button onClick={() => setSosMenu(!sosMenu)} className="p-4 bg-red-600 rounded-2xl border-2 border-white flex flex-col items-center justify-center min-w-[80px] animate-pulse">
            <AlertTriangle size={24} color="white"/>
            <span className="text-[10px] font-black text-white mt-1">SOS</span>
          </button>
        </div>

        {/* BOTÓN WHATSAPP (VERDE) */}
        <button onClick={() => window.open(`https://wa.me/?text=REPORTE: Etapa ${activeStage.id} - ${steps} pasos. Localización: http://googleusercontent.com/maps.google.com/6${userPos?.[0]},${userPos?.[1]}`)} 
          className="p-5 bg-green-500 text-black rounded-2xl border-2 border-black flex items-center justify-center">
          <span className="font-black text-[10px]">WHATSAPP</span>
        </button>

        {/* MIRA (AMARILLO) */}
        <button onClick={() => setIsTracking(!isTracking)} 
          className={`p-5 rounded-2xl transition-all ${isTracking ? 'bg-yellow-500 text-black scale-110 shadow-lg' : 'bg-gray-900 text-yellow-500 border border-yellow-500/50'}`}>
          <Crosshair size={28}/>
        </button>

        {/* MAPA/BATERIA (CYAN) */}
        <button onClick={() => setBatterySave(!batterySave)} 
          className={`p-5 rounded-2xl border-2 ${batterySave ? 'bg-cyan-500 text-black' : 'bg-black text-cyan-400 border-cyan-400/50'}`}>
          {batterySave ? <EyeOff size={28}/> : <Eye size={28}/>}
        </button>

        {/* REINICIAR (ROJO) */}
        <button onClick={() => { if(confirm("¿RESET?")) setSteps(0); }} className="p-5 bg-orange-600 text-white rounded-2xl">
          <RotateCcw size={28}/>
        </button>

      </div>
    </div>
  );
}
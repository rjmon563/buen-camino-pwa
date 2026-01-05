import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MessageCircle, Crosshair, RotateCcw, ShieldCheck, 
  Eye, EyeOff, AlertTriangle, Phone, ShieldAlert
} from 'lucide-react';

/* ===================== CONFIG & STYLES ===================== */
const STEP_THRESHOLD = 12.5; 
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
:root { 
  --yellow:#facc15; --red:#ff0000; --black:#050505; 
  --cyan:#00e5ff; --green:#22c55e; --orange:#f97316;
}
html,body,#root{margin:0;height:100%;background:var(--black);font-family:'JetBrains Mono',monospace;color:white;overflow:hidden}
.leaflet-container{background:#000;filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); z-index:1}

.sniper-scope-marker{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
.scope-cross-h,.scope-cross-v{position:absolute;background:red;box-shadow:0 0 8px red}
.scope-cross-h{width:100%;height:1px}
.scope-cross-v{width:1px;height:100%}
.scope-circle{width:40px;height:40px;border:1px solid red;border-radius:50%}
.scope-pulse{position:absolute;width:40px;height:40px;border:2px solid red;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{to{transform:scale(3);opacity:0}}

.tactical-stats{position:fixed; top:20px; right:20px; z-index:1000; background:rgba(0,0,0,0.9); border:2px solid var(--cyan); padding:10px; border-radius:8px; min-width:140px; pointer-events:none; backdrop-filter:blur(5px); text-align:right;}
.selector-container{position:fixed; top:20px; left:20px; z-index:1100; width:180px;}
select { background: #111; color: var(--yellow); border: 2px solid var(--yellow); padding: 10px; font-family: 'JetBrains Mono'; border-radius: 6px; width: 100%; font-size: 11px; font-weight: 800; }

.bottom-console { position: fixed; bottom: 0; left: 0; right: 0; background: #0a0a0a; border-top: 3px solid var(--yellow); display: flex; justify-content: space-around; align-items: center; padding: 12px 10px 25px 10px; z-index: 2000; }
.btn-ui { border-radius: 16px; border: 2px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-sos { background: var(--red); color: white; border-color: white; min-width: 75px; height: 75px; }
.btn-wa { background: var(--green); color: black; border-color: black; min-width: 85px; height: 70px; }
.btn-mira { background: var(--yellow); color: black; min-width: 70px; height: 70px; }
.btn-mapa { background: var(--cyan); color: black; min-width: 70px; height: 70px; }
.btn-reset { background: var(--orange); color: white; min-width: 70px; height: 70px; }

.emergency-popover { position: absolute; bottom: 95px; left: 10px; display: flex; flex-direction: column; gap: 8px; width: 240px; animation: slideUp 0.2s ease-out; z-index: 3000; }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.sensor-overlay{position:fixed;inset:0;background:black;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center}
`;

/* ===================== DATA: ALL 33 STAGES ===================== */
const STAGES = [
  { id:1, name:"St-Jean - Roncesvalles", coords:[43.0125,-1.3148] },
  { id:2, name:"Roncesvalles - Zubiri", coords:[42.9298,-1.5042] },
  { id:3, name:"Zubiri - Pamplona", coords:[42.8125,-1.6458] },
  { id:4, name:"Pamplona - P. la Reina", coords:[42.6719,-1.8139] },
  { id:5, name:"P. la Reina - Estella", coords:[42.6715,-2.0315] },
  { id:6, name:"Estella - Los Arcos", coords:[42.5684,-2.1917] },
  { id:7, name:"Los Arcos - Logroño", coords:[42.4627,-2.445] },
  { id:8, name:"Logroño - Nájera", coords:[42.4162,-2.7303] },
  { id:9, name:"Nájera - Sto. Domingo", coords:[42.4411,-2.9535] },
  { id:10, name:"Sto. Domingo - Belorado", coords:[42.4194,-3.1904] },
  { id:11, name:"Belorado - Agés", coords:[42.3664,-3.4503] },
  { id:12, name:"Agés - Burgos", coords:[42.3440,-3.6969] },
  { id:13, name:"Burgos - Hontanas", coords:[42.3120,-4.0450] },
  { id:14, name:"Hontanas - Frómista", coords:[42.2668,-4.4061] },
  { id:15, name:"Frómista - Carrión", coords:[42.3389,-4.6067] },
  { id:16, name:"Carrión - Terradillos", coords:[42.3610,-4.9248] },
  { id:17, name:"Terradillos - Sahagún", coords:[42.3719,-5.0315] },
  { id:18, name:"Sahagún - Bercianos", coords:[42.4230,-5.2215] },
  { id:19, name:"Bercianos - León", coords:[42.5987,-5.5671] },
  { id:20, name:"León - San Martín", coords:[42.5200,-5.8100] },
  { id:21, name:"San Martín - Astorga", coords:[42.4544,-6.0560] },
  { id:22, name:"Astorga - Foncebadón", coords:[42.4385,-6.3450] },
  { id:23, name:"Foncebadón - Ponferrada", coords:[42.5455,-6.5936] },
  { id:24, name:"Ponferrada - Villafranca", coords:[42.6074,-6.8115] },
  { id:25, name:"Villafranca - O Cebreiro", coords:[42.7077,-7.0423] },
  { id:26, name:"O Cebreiro - Triacastela", coords:[42.7565,-7.2403] },
  { id:27, name:"Triacastela - Sarria", coords:[42.7770,-7.4160] },
  { id:28, name:"Sarria - Portomarín", coords:[42.8075,-7.6160] },
  { id:29, name:"Portomarín - Palas de Rei", coords:[42.8732,-7.8687] },
  { id:30, name:"Palas de Rei - Arzúa", coords:[42.9265,-8.1634] },
  { id:31, name:"Arzúa - O Pedrouzo", coords:[42.9100,-8.3600] },
  { id:32, name:"O Pedrouzo - Santiago", coords:[42.8870,-8.5100] },
  { id:33, name:"Santiago de Compostela", coords:[42.8806,-8.5464] }
];

function MapController({ userPos, tracking, target }) {
  const map = useMap();
  useEffect(() => {
    // Si el seguimiento está activo y tenemos posición, centrar mapa constantemente
    if (tracking && userPos) {
      map.setView(userPos, map.getZoom(), { animate: true });
    }
  }, [userPos, tracking, map]);

  useEffect(() => {
    // Si cambiamos de etapa y no estamos en seguimiento, volar al destino
    if (!tracking && target) {
      map.flyTo(target, 14, { duration: 1.5 });
    }
  }, [target, tracking, map]);

  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(() => JSON.parse(localStorage.getItem('stage_v45')) || STAGES[0]);
  const [steps, setSteps] = useState(() => parseInt(localStorage.getItem('steps_v45')) || 0);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [batterySave, setBatterySave] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [sosMenu, setSosMenu] = useState(false);
  const lastStepTime = useRef(0);

  useEffect(() => {
    localStorage.setItem('steps_v45', steps);
    localStorage.setItem('stage_v45', JSON.stringify(activeStage));
  }, [steps, activeStage]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = STYLES;
    document.head.appendChild(style);

    const watchId = navigator.geolocation.watchPosition(
      p => setUserPos([p.coords.latitude, p.coords.longitude]),
      null, { enableHighAccuracy: !batterySave }
    );

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const totalAcc = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
      const now = Date.now();
      if (totalAcc > STEP_THRESHOLD && now - lastStepTime.current > 350) {
        setSteps(s => s + 1);
        lastStepTime.current = now;
      }
    };

    if (window.DeviceMotionEvent) window.addEventListener('devicemotion', handleMotion);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [batterySave]);

  const distanceToTarget = useMemo(() => {
    if (!userPos) return 0;
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
          <ShieldCheck size={80} className="text-cyan-500 mb-6 animate-pulse"/>
          <button onClick={() => setShowOverlay(false)} className="px-12 py-5 bg-cyan-500 text-black font-black rounded-2xl uppercase">Entrar a Consola v45</button>
        </div>
      )}

      <div className="selector-container">
        <select value={activeStage.id} onChange={(e) => {
          setActiveStage(STAGES.find(x => x.id === parseInt(e.target.value)));
          setIsTracking(false); // Al cambiar etapa, desactivamos tracking para ver destino
        }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
        </select>
      </div>

      <div className="tactical-stats">
        <div className="text-[8px] text-cyan-400 font-bold uppercase mb-1">Status_Live</div>
        <div className="text-xl font-black text-yellow-500 leading-none">{steps.toLocaleString()} <span className="text-[7px] text-white/30">STEPS</span></div>
        <div className="text-sm font-bold text-white mt-1">{userPos ? distanceToTarget.toFixed(2) : "0.00"} KM</div>
      </div>

      <MapContainer center={activeStage.coords} zoom={14} zoomControl={false} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Polyline positions={STAGES.map(s => s.coords)} pathOptions={{ color: '#00e5ff', weight: 4 }}/>
        {userPos && <Marker position={userPos} icon={new L.DivIcon({ html: `<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`, iconSize:[80,80], iconAnchor:[40,40] })}/>}
        <MapController userPos={userPos} tracking={isTracking} target={activeStage.coords}/>
      </MapContainer>

      <div className="bottom-console">
        <div className="relative">
          {sosMenu && (
            <div className="emergency-popover">
              <button onClick={() => window.open('tel:112')} className="p-4 bg-red-600 text-white rounded-xl border-2 border-white flex items-center gap-3 font-bold"><Phone size={20}/> 112</button>
              <button onClick={() => window.open('tel:062')} className="p-4 bg-blue-900 text-white rounded-xl border-2 border-white flex items-center gap-3 font-bold"><ShieldAlert size={20}/> 062 G. CIVIL</button>
              <button onClick={() => window.open(`https://wa.me/?text=🚨SOS! Posicion: http://maps.google.com/?q=${userPos?.[0]},${userPos?.[1]}`)} className="p-4 bg-green-600 text-white rounded-xl border-2 border-white flex items-center gap-3 font-bold"><MessageCircle size={20}/> WA SOS</button>
            </div>
          )}
          <button onClick={() => setSosMenu(!sosMenu)} className="btn-ui btn-sos animate-pulse">
            <AlertTriangle size={30}/>
            <span className="text-[11px] font-black mt-1">SOS</span>
          </button>
        </div>

        <button onClick={() => window.open(`https://wa.me/?text=REPORTE: Etapa ${activeStage.id} - ${steps} pasos. Posicion: http://maps.google.com/?q=${userPos?.[0]},${userPos?.[1]}`)} className="btn-ui btn-wa">
          <MessageCircle size={30}/>
          <span className="font-black text-[9px]">WHATSAPP</span>
        </button>

        {/* MIRA: AHORA CON SALTO INMEDIATO AL ACTIVAR */}
        <button onClick={() => setIsTracking(!isTracking)} className={`btn-ui btn-mira ${isTracking ? 'scale-110 shadow-lg shadow-yellow-500/50' : 'opacity-80'}`}>
          <Crosshair size={32}/>
        </button>

        <button onClick={() => setBatterySave(!batterySave)} className="btn-ui btn-mapa">
          {batterySave ? <EyeOff size={32}/> : <Eye size={32}/>}
        </button>

        <button onClick={() => { if(confirm("¿CONFIRMAR RESET?")) setSteps(0); }} className="btn-ui btn-reset">
          <RotateCcw size={32}/>
        </button>
      </div>
    </div>
  );
}
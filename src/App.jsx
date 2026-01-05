import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MessageCircle, Crosshair, RotateCcw, ShieldCheck, 
  Eye, EyeOff, AlertTriangle, Phone, ShieldAlert
} from 'lucide-react';

/* ===================== TACTICAL STYLES ===================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
:root { --yellow:#facc15; --red:#ff0000; --black:#050505; --cyan:#00e5ff; --green:#22c55e; --orange:#f97316; }
html,body,#root{margin:0;height:100%;background:var(--black);font-family:'JetBrains Mono',monospace;color:white;overflow:hidden}
.leaflet-container{background:#000;filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); z-index:1}

.sniper-scope-marker{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
.scope-cross-h,.scope-cross-v{position:absolute;background:red;box-shadow:0 0 8px red}
.scope-cross-h{width:100%;height:1px}
.scope-cross-v{width:1px;height:100%}
.scope-circle{width:40px;height:40px;border:1px solid red;border-radius:50%}
.scope-pulse{position:absolute;width:40px;height:40px;border:2px solid red;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{to{transform:scale(3);opacity:0}}

.tactical-stats{position:fixed; top:20px; right:20px; z-index:1000; background:rgba(0,0,0,0.9); border:2px solid var(--cyan); padding:10px; border-radius:8px; min-width:140px; text-align:right; pointer-events:none;}
.selector-container{position:fixed; top:20px; left:20px; z-index:5000; width:220px;}
select { background: #111; color: var(--yellow); border: 2px solid var(--yellow); padding: 12px; font-family: 'JetBrains Mono'; border-radius: 6px; width: 100%; font-size: 11px; font-weight: 800; cursor:pointer; }
.stage-info-box { background: rgba(0,0,0,0.9); color: var(--orange); border: 2px solid var(--orange); border-top: 0; padding: 6px 10px; font-size: 10px; font-weight: 800; border-radius: 0 0 8px 8px; }

.bottom-console { position: fixed; bottom: 0; left: 0; right: 0; background: #0a0a0a; border-top: 3px solid var(--yellow); display: flex; justify-content: space-around; align-items: center; padding: 12px 10px 25px 10px; z-index: 6000; }
.btn-ui { border-radius: 16px; border: 2px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s; position: relative; }
.btn-sos { background: var(--red); color: white; min-width: 75px; height: 75px; }
.btn-wa { background: var(--green); color: black; min-width: 85px; height: 70px; }
.btn-mira { background: var(--yellow); color: black; min-width: 70px; height: 70px; }
.btn-mapa { background: var(--cyan); color: black; min-width: 70px; height: 70px; }
.btn-reset { background: var(--orange); color: white; min-width: 70px; height: 70px; }

.emergency-popover { position: absolute; bottom: 95px; left: 10px; display: flex; flex-direction: column; gap: 8px; width: 220px; z-index: 7000; }
.pop-btn { padding: 15px; border-radius: 12px; border: 2px solid white; color: white; font-weight: 900; display: flex; align-items: center; gap: 10px; }

.lock-indicator { position: absolute; top: -10px; background: red; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; animation: blink 1s infinite; border: 1px solid white; }
@keyframes blink { 50% { opacity: 0; } }
.sensor-overlay{position:fixed;inset:0;background:black;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center}
`;

/* ===================== DATA: 33 STAGES ===================== */
const STAGES = [
  { id:1, name:"SJ Pied de Port - Roncesvalles", coords:[43.0125,-1.3148], dist:24.2, dPlus:1250, diff:"Muy Alta" },
  { id:2, name:"Roncesvalles - Zubiri", coords:[42.9298,-1.5042], dist:21.4, dPlus:300, diff:"Alta" },
  { id:3, name:"Zubiri - Pamplona", coords:[42.8125,-1.6458], dist:20.4, dPlus:190, diff:"Baja" },
  { id:4, name:"Pamplona - P. la Reina", coords:[42.6719,-1.8139], dist:24.0, dPlus:450, diff:"Media" },
  { id:5, name:"P. la Reina - Estella", coords:[42.6715,-2.0315], dist:22.6, dPlus:350, diff:"Media" },
  { id:6, name:"Estella - Los Arcos", coords:[42.5684,-2.1917], dist:21.3, dPlus:250, diff:"Media" },
  { id:7, name:"Los Arcos - Logroño", coords:[42.4627,-2.445], dist:27.6, dPlus:250, diff:"Media" },
  { id:8, name:"Logroño - Nájera", coords:[42.4162,-2.7303], dist:29.0, dPlus:350, diff:"Alta" },
  { id:9, name:"Nájera - Sto. Domingo", coords:[42.4411,-2.9535], dist:20.7, dPlus:250, diff:"Baja" },
  { id:10, name:"Sto. Domingo - Belorado", coords:[42.4194,-3.1904], dist:22.0, dPlus:150, diff:"Baja" },
  { id:11, name:"Belorado - Agés", coords:[42.3664,-3.4503], dist:27.4, dPlus:450, diff:"Media" },
  { id:12, name:"Agés - Burgos", coords:[42.3440,-3.6969], dist:23.0, dPlus:150, diff:"Baja" },
  { id:13, name:"Burgos - Hontanas", coords:[42.3120,-4.0450], dist:31.1, dPlus:250, diff:"Muy Alta" },
  { id:14, name:"Hontanas - Frómista", coords:[42.2668,-4.4061], dist:24.7, dPlus:150, diff:"Media" },
  { id:15, name:"Frómista - Carrión", coords:[42.3389,-4.6067], dist:18.8, dPlus:50, diff:"Baja" },
  { id:16, name:"Carrión - Terradillos", coords:[42.3610,-4.9248], dist:26.3, dPlus:100, diff:"Media" },
  { id:17, name:"Terradillos - Sahagún", coords:[42.3719,-5.0315], dist:13.3, dPlus:50, diff:"Baja" },
  { id:18, name:"Sahagún - Bercianos", coords:[42.4230,-5.2215], dist:17.2, dPlus:50, diff:"Baja" },
  { id:19, name:"Bercianos - León", coords:[42.5987,-5.5671], dist:26.3, dPlus:100, diff:"Media" },
  { id:20, name:"León - San Martín", coords:[42.5200,-5.8100], dist:24.6, dPlus:100, diff:"Baja" },
  { id:21, name:"San Martín - Astorga", coords:[42.4544,-6.0560], dist:23.7, dPlus:250, diff:"Media" },
  { id:22, name:"Astorga - Foncebadón", coords:[42.4385,-6.3450], dist:25.8, dPlus:600, diff:"Alta" },
  { id:23, name:"Foncebadón - Ponferrada", coords:[42.5455,-6.5936], dist:26.8, dPlus:150, diff:"Alta (B)" },
  { id:24, name:"Ponferrada - Villafranca", coords:[42.6074,-6.8115], dist:24.2, dPlus:150, diff:"Baja" },
  { id:25, name:"Villafranca - O Cebreiro", coords:[42.7077,-7.0423], dist:27.8, dPlus:1100, diff:"Muy Alta" },
  { id:26, name:"O Cebreiro - Triacastela", coords:[42.7565,-7.2403], dist:20.8, dPlus:100, diff:"Alta (B)" },
  { id:27, name:"Triacastela - Sarria", coords:[42.7770,-7.4160], dist:18.4, dPlus:250, diff:"Baja" },
  { id:28, name:"Sarria - Portomarín", coords:[42.8075,-7.6160], dist:22.2, dPlus:400, diff:"Media" },
  { id:29, name:"Portomarín - Palas de Rei", coords:[42.8732,-7.8687], dist:24.8, dPlus:450, diff:"Media" },
  { id:30, name:"Palas de Rei - Arzúa", coords:[42.9265,-8.1634], dist:28.5, dPlus:450, diff:"Alta" },
  { id:31, name:"Arzúa - O Pedrouzo", coords:[42.9100,-8.3600], dist:19.3, dPlus:200, diff:"Baja" },
  { id:32, name:"O Pedrouzo - Santiago", coords:[42.8870,-8.5100], dist:19.4, dPlus:250, diff:"Baja" },
  { id:33, name:"Santiago de Compostela", coords:[42.8806,-8.5464], dist:0, dPlus:0, diff:"META" }
];

function MapController({ userPos, tracking, targetCoords }) {
  const map = useMap();
  
  // EFECTO 1: SEGUIMIENTO GPS (MIRA)
  useEffect(() => {
    if (tracking && userPos) {
      map.setView(userPos, 17, { animate: true });
    }
  }, [userPos, tracking, map]);

  // EFECTO 2: VUELO A LA ETAPA AL SELECCIONARLA
  useEffect(() => {
    if (targetCoords && !tracking) {
      map.flyTo(targetCoords, 14, { duration: 1.5 });
    }
  }, [targetCoords, map]); // Eliminamos tracking de aquí para que vuele siempre que cambie target y no estemos lockeados

  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(() => JSON.parse(localStorage.getItem('stage_v51')) || STAGES[0]);
  const [steps, setSteps] = useState(() => parseInt(localStorage.getItem('steps_v51')) || 0);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [batterySave, setBatterySave] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [sosMenu, setSosMenu] = useState(false);
  const lastStepTime = useRef(0);

  useEffect(() => {
    localStorage.setItem('steps_v51', steps);
    localStorage.setItem('stage_v51', JSON.stringify(activeStage));
  }, [steps, activeStage]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = STYLES;
    document.head.appendChild(style);

    const watchId = navigator.geolocation.watchPosition(
      p => setUserPos([p.coords.latitude, p.coords.longitude]),
      null, { enableHighAccuracy: !batterySave, timeout: 5000, maximumAge: 0 }
    );

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const totalAcc = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
      const now = Date.now();
      if (totalAcc > 12.5 && now - lastStepTime.current > 350) {
        setSteps(s => s + 1);
        lastStepTime.current = now;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [batterySave]);

  const distanceToTarget = useMemo(() => {
    if (!userPos) return 0.00; // FIX KM: Si no hay posición, forzamos 0.00
    const R = 6371;
    const dLat = (activeStage.coords[0] - userPos[0]) * Math.PI / 180;
    const dLon = (activeStage.coords[1] - userPos[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180) * Math.cos(activeStage.coords[0]*Math.PI/180) * Math.sin(dLon/2)**2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return dist;
  }, [userPos, activeStage]);

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      {showOverlay && (
        <div className="sensor-overlay">
          <ShieldCheck size={80} className="text-cyan-500 mb-6 animate-pulse"/>
          <button onClick={() => setShowOverlay(false)} className="px-12 py-5 bg-cyan-500 text-black font-black rounded-2xl">V51: FLY & TRACK</button>
        </div>
      )}

      <div className="selector-container">
        <select value={activeStage.id} onChange={(e) => {
          const s = STAGES.find(x => x.id === parseInt(e.target.value));
          setActiveStage(s);
          setIsTracking(false); // Al elegir etapa nueva, quitamos el lock para ver el destino
        }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>Etapa {s.id}: {s.name.substring(0,12)}...</option>)}
        </select>
        <div className="stage-info-box">
          {activeStage.dist}KM | +{activeStage.dPlus}m | {activeStage.diff}
        </div>
      </div>

      <div className="tactical-stats">
        <div className="text-[8px] text-cyan-400 font-bold uppercase">GPS_Live</div>
        <div className="text-xl font-black text-yellow-500">{steps.toLocaleString()} <span className="text-[7px] text-white/30">PASOS</span></div>
        <div className="text-sm font-bold text-white">{userPos ? distanceToTarget.toFixed(2) : "0.00"} KM</div>
      </div>

      <MapContainer center={activeStage.coords} zoom={14} zoomControl={false} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Polyline positions={STAGES.map(s => s.coords)} pathOptions={{ color: '#00e5ff', weight: 3, opacity: 0.4 }}/>
        {userPos && (
          <Marker position={userPos} icon={new L.DivIcon({ 
            html: `<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`, 
            iconSize:[80,80], iconAnchor:[40,40] 
          })}/>
        )}
        <MapController userPos={userPos} tracking={isTracking} targetCoords={activeStage.coords} />
      </MapContainer>

      <div className="bottom-console">
        <div className="relative">
          {sosMenu && (
            <div className="emergency-popover">
              <button onClick={() => window.open('tel:112')} className="pop-btn bg-red-600"><Phone size={20}/> 112 SOS</button>
              <button onClick={() => window.open('tel:062')} className="pop-btn bg-blue-800"><ShieldAlert size={20}/> 062 GC</button>
            </div>
          )}
          <button onClick={() => setSosMenu(!sosMenu)} className="btn-ui btn-sos">
            <AlertTriangle size={30}/><span className="text-[11px] font-black mt-1">SOS</span>
          </button>
        </div>

        <button onClick={() => window.open(`https://wa.me/?text=Reporte: Etapa ${activeStage.id}. Restan ${distanceToTarget.toFixed(2)} km.`)} className="btn-ui btn-wa">
          <MessageCircle size={30}/><span className="font-black text-[9px]">REPORT</span>
        </button>

        <button onClick={() => setIsTracking(!isTracking)} className={`btn-ui btn-mira ${isTracking ? 'bg-yellow-400 shadow-[0_0_20px_#facc15]' : 'opacity-80'}`}>
          {isTracking && <span className="lock-indicator">GPS LOCK</span>}
          <Crosshair size={32}/>
        </button>

        <button onClick={() => setBatterySave(!batterySave)} className="btn-ui btn-mapa">
          {batterySave ? <EyeOff size={32}/> : <Eye size={32}/>}
        </button>

        <button onClick={() => { if(confirm("¿RESET?")) setSteps(0); }} className="btn-ui btn-reset">
          <RotateCcw size={32}/>
        </button>
      </div>
    </div>
  );
}
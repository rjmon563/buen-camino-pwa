import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Zap, Footprints, MessageCircle,
  Crosshair, Navigation, RotateCcw, ShieldCheck, Eye
} from 'lucide-react';

/* ================== CONFIG ================== */

const AUTO_ADVANCE_KM = 0.3;

/* ================== STYLES ================== */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
:root { --yellow:#facc15; --red:#ff0000; --black:#050505; --cyan:#00e5ff; }
body,html,#root{margin:0;height:100%;background:var(--black);font-family:'JetBrains Mono',monospace;color:white}
.leaflet-container{filter:invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%)}
.sniper-scope-marker{position:relative;width:80px;height:80px;display:flex;justify-content:center;align-items:center}
.scope-cross-h,.scope-cross-v{position:absolute;background:red;box-shadow:0 0 8px red}
.scope-cross-h{width:100%;height:1px}
.scope-cross-v{width:1px;height:100%}
.scope-circle{width:40px;height:40px;border:1px solid red;border-radius:50%}
.scope-pulse{position:absolute;width:40px;height:40px;border:2px solid red;border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{to{transform:scale(3);opacity:0}}
.sensor-overlay{position:fixed;inset:0;background:black;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center}
`;

/* ================== STAGES ================== */

const STAGES = [
  { id:1,name:"St-Jean - Roncesvalles",dist:"24.2",coords:[43.0125,-1.3148]},
  { id:2,name:"Roncesvalles - Zubiri",dist:"21.4",coords:[42.9298,-1.5042]},
  { id:3,name:"Zubiri - Pamplona",dist:"20.4",coords:[42.8125,-1.6458]},
  { id:4,name:"Pamplona - P. la Reina",dist:"24.0",coords:[42.6719,-1.8139]},
  { id:5,name:"P. la Reina - Estella",dist:"22.0",coords:[42.6715,-2.0315]},
  { id:6,name:"Estella - Los Arcos",dist:"21.0",coords:[42.5684,-2.1917]},
  { id:7,name:"Los Arcos - Logroño",dist:"28.0",coords:[42.4627,-2.445]},
  { id:8,name:"Logroño - Nájera",dist:"29.0",coords:[42.4162,-2.7303]},
  { id:9,name:"Nájera - Sto. Domingo",dist:"21.0",coords:[42.4411,-2.9535]},
  { id:10,name:"Sto. Domingo - Belorado",dist:"22.0",coords:[42.4194,-3.1904]},
  { id:33,name:"Santiago",dist:"META",coords:[42.8806,-8.5464]}
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

  const [activeStage, setActiveStage] = useState(() =>
    JSON.parse(localStorage.getItem('stage_v30')) || STAGES[0]
  );

  const [steps, setSteps] = useState(
    () => parseInt(localStorage.getItem('steps_v30')) || 0
  );

  const [stageStartSteps, setStageStartSteps] = useState(
    () => parseInt(localStorage.getItem('stage_start_v30')) || 0
  );

  const [userPos, setUserPos] = useState(
    () => JSON.parse(localStorage.getItem('last_pos_v30')) || null
  );

  const [isTracking, setIsTracking] = useState(
    () => localStorage.getItem('tracking_v30') === 'true'
  );

  const [batterySave, setBatterySave] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const lastAcc = useRef(0);
  const debounce = useRef(false);

  /* ===== Persist ===== */

  useEffect(() => {
    localStorage.setItem('steps_v30', steps);
    localStorage.setItem('stage_v30', JSON.stringify(activeStage));
    localStorage.setItem('tracking_v30', isTracking);
  }, [steps, activeStage, isTracking]);

  /* ===== Styles + GPS ===== */

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

  /* ===== Steps ===== */

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

  /* ===== Distance ===== */

  const getDistance = () => {
    if (!userPos) return "--";
    const R = 6371;
    const dLat = (activeStage.coords[0]-userPos[0]) * Math.PI/180;
    const dLon = (activeStage.coords[1]-userPos[1]) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 +
      Math.cos(userPos[0]*Math.PI/180) *
      Math.cos(activeStage.coords[0]*Math.PI/180) *
      Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
  };

  /* ===== Auto advance ===== */

  useEffect(() => {
    if (!userPos) return;
    if (parseFloat(getDistance()) <= AUTO_ADVANCE_KM) {
      const next = STAGES.find(s => s.id === activeStage.id + 1);
      if (next) {
        setStageStartSteps(steps);
        localStorage.setItem('stage_start_v30', steps);
        setActiveStage(next);
      }
    }
  }, [userPos]);

  /* ===== Reset ===== */

  const resetSteps = () => {
    if (confirm("¿Reiniciar contador?")) {
      setSteps(0);
      setStageStartSteps(0);
    }
  };

  /* ================== UI ================== */

  return (
    <div className="h-screen w-screen bg-black">

      {showOverlay &&
        <div className="sensor-overlay">
          <ShieldCheck size={80} className="text-yellow-500 mb-6 animate-pulse"/>
          <button onClick={async () => {
            if (DeviceMotionEvent?.requestPermission) {
              const r = await DeviceMotionEvent.requestPermission();
              if (r === 'granted') window.addEventListener('devicemotion', handleMotion);
            } else window.addEventListener('devicemotion', handleMotion);
            setShowOverlay(false);
          }} className="px-10 py-4 bg-yellow-500 text-black font-black rounded-xl">
            ACTIVAR SISTEMAS
          </button>
        </div>
      }

      <header className="h-16 flex justify-between items-center px-6 border-b border-yellow-500">
        <Zap className="text-yellow-500"/>
        <span className="text-yellow-500 font-bold">
          ETAPA {activeStage.id}
        </span>
      </header>

      <MapContainer center={activeStage.coords} zoom={14} style={{height:"calc(100% - 64px)"}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Polyline positions={STAGES.map(s=>s.coords)} color="#00e5ff"/>
        {userPos &&
          <Marker position={userPos} icon={new L.DivIcon({
            html:`<div class="sniper-scope-marker">
              <div class="scope-cross-h"></div>
              <div class="scope-cross-v"></div>
              <div class="scope-circle"></div>
              <div class="scope-pulse"></div>
            </div>`,
            iconSize:[80,80], iconAnchor:[40,40]
          })}/>
        }
        <MapController userPos={userPos} tracking={isTracking} target={activeStage.coords}/>
      </MapContainer>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button onClick={()=>setBatterySave(!batterySave)} className="p-4 bg-black border text-cyan-400">
          <Eye/>
        </button>
        <button onClick={()=>setIsTracking(!isTracking)} className="p-4 bg-yellow-500 text-black">
          <Crosshair/>
        </button>
        <button onClick={resetSteps} className="p-4 bg-red-600 text-white">
          <RotateCcw/>
        </button>
      </div>

    </div>
  );
}

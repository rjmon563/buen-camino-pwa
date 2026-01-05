import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Zap, Footprints, Activity, MessageCircle, 
  Crosshair, Navigation, Play, RotateCcw, Eye, Target, ShieldCheck
} from 'lucide-react';

// --- CONFIGURACIÓN DE ESTILOS TÁCTICOS ---
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
  :root { --yellow: #facc15; --red: #ff0000; --black: #050505; --cyan: #00e5ff; }
  body, html, #root { margin: 0; padding: 0; height: 100vh; width: 100vw; background: var(--black); font-family: 'JetBrains Mono', monospace; color: white; overflow: hidden; }
  .sidebar-tactical { width: 45%; background: rgba(5,5,5,0.98); border-right: 2px solid var(--yellow); display: flex; flex-direction: column; height: 100%; z-index: 4000; }
  .pedometer-dashboard { background: linear-gradient(180deg, #111 0%, #000 100%); padding: 18px; border-bottom: 1px solid #333; }
  .btn-reset-tactical { background: rgba(255,0,0,0.1); border: 1px solid var(--red); color: var(--red); padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
  .btn-reset-tactical:hover { background: var(--red); color: white; box-shadow: 0 0 15px var(--red); }
  .stage-list-container { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--yellow) #000; }
  .stage-card { border-left: 4px solid #1a1a1a; background: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 15px; cursor: pointer; transition: all 0.3s; position: relative; }
  .stage-card.active { border-left: 4px solid var(--yellow); background: #1a1a1a; }
  .leaflet-container { background: #000 !important; filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); height: 100%; width: 100%; }
  .sniper-scope-marker { position: relative; width: 80px; height: 80px; display: flex; justify-content: center; align-items: center; }
  .scope-cross-h { position: absolute; width: 100%; height: 1px; background: var(--red); box-shadow: 0 0 8px var(--red); }
  .scope-cross-v { position: absolute; width: 1px; height: 100%; background: var(--red); box-shadow: 0 0 8px var(--red); }
  .scope-circle { position: absolute; width: 40px; height: 40px; border: 1px solid var(--red); border-radius: 50%; }
  .scope-pulse { position: absolute; width: 40px; height: 40px; border: 2px solid var(--red); border-radius: 50%; animation: scopePulse 2s infinite; }
  @keyframes scopePulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
  .floating-controls { position: absolute; bottom: 30px; right: 20px; z-index: 5000; display: flex; flex-direction: column; gap: 15px; }
  .btn-tactical { width: 60px; height: 60px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); }
  .btn-sos { background: var(--red); color: white; font-weight: 900; box-shadow: 0 0 20px var(--red); border: none; animation: sosPulse 2s infinite; }
  @keyframes sosPulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  .status-badge { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 4500; background: rgba(0,0,0,0.9); border: 1px solid var(--yellow); padding: 8px 20px; border-radius: 4px; display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 10px; text-transform: uppercase; }
  .sensor-overlay { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; }
`;

// --- DATOS MAESTROS DE ETAPAS ---
const STAGES = [
  { id: 1, name: "St-Jean - Roncesvalles", dist: "24.2", coords: [43.0125, -1.3148] },
  { id: 2, name: "Roncesvalles - Zubiri", dist: "21.4", coords: [42.9298, -1.5042] },
  { id: 3, name: "Zubiri - Pamplona", dist: "20.4", coords: [42.8125, -1.6458] },
  { id: 4, name: "Pamplona - P. la Reina", dist: "24.0", coords: [42.6719, -1.8139] },
  { id: 5, name: "P. la Reina - Estella", dist: "22.0", coords: [42.6715, -2.0315] },
  { id: 6, name: "Estella - Los Arcos", dist: "21.0", coords: [42.5684, -2.1917] },
  { id: 7, name: "Los Arcos - Logroño", dist: "28.0", coords: [42.4627, -2.4450] },
  { id: 8, name: "Logroño - Nájera", dist: "29.0", coords: [42.4162, -2.7303] },
  { id: 9, name: "Nájera - Sto. Domingo", dist: "21.0", coords: [42.4411, -2.9535] },
  { id: 10, name: "Sto. Domingo - Belorado", dist: "22.0", coords: [42.4194, -3.1904] },
  { id: 11, name: "Belorado - Agés", dist: "27.0", coords: [42.3664, -3.4503] },
  { id: 12, name: "Agés - Burgos", dist: "23.0", coords: [42.3440, -3.6969] },
  { id: 13, name: "Burgos - Hontanas", dist: "31.1", coords: [42.3120, -4.0450] },
  { id: 14, name: "Hontanas - Frómista", dist: "34.5", coords: [42.2668, -4.4061] },
  { id: 15, name: "Frómista - Carrión", dist: "19.3", coords: [42.3389, -4.6067] },
  { id: 16, name: "Carrión - Terradillos", dist: "26.3", coords: [42.3610, -4.9248] },
  { id: 17, name: "Terradillos - Sahagún", dist: "13.9", coords: [42.3719, -5.0315] },
  { id: 18, name: "Sahagún - B. Ranero", dist: "18.0", coords: [42.4230, -5.2215] },
  { id: 19, name: "B. Ranero - León", dist: "37.1", coords: [42.5987, -5.5671] },
  { id: 20, name: "León - San Martín", dist: "25.9", coords: [42.5200, -5.8100] },
  { id: 21, name: "San Martín - Astorga", dist: "24.2", coords: [42.4544, -6.0560] },
  { id: 22, name: "Astorga - Foncebadón", dist: "25.8", coords: [42.4385, -6.3450] },
  { id: 23, name: "Foncebadón - Ponferrada", dist: "26.8", coords: [42.5455, -6.5936] },
  { id: 24, name: "Ponferrada - Villafranca", dist: "24.2", coords: [42.6074, -6.8115] },
  { id: 25, name: "Villafranca - O Cebreiro", dist: "27.8", coords: [42.7077, -7.0423] },
  { id: 26, name: "O Cebreiro - Triacastela", dist: "20.8", coords: [42.7565, -7.2403] },
  { id: 27, name: "Triacastela - Sarria", dist: "18.4", coords: [42.7770, -7.4160] },
  { id: 28, name: "Sarria - Portomarín", dist: "22.2", coords: [42.8075, -7.6160] },
  { id: 29, name: "Portomarín - Palas Rei", dist: "24.8", coords: [42.8732, -7.8687] },
  { id: 30, name: "Palas Rei - Arzúa", dist: "28.5", coords: [42.9265, -8.1634] },
  { id: 31, name: "Arzúa - O Pedrouzo", dist: "19.3", coords: [42.9100, -8.3600] },
  { id: 32, name: "O Pedrouzo - Santiago", dist: "19.4", coords: [42.8870, -8.5100] },
  { id: 33, name: "Santiago", dist: "META", coords: [42.8806, -8.5464] }
];

function MapController({ userPos, tracking, activeCoords }) {
  const map = useMap();
  useEffect(() => {
    if (tracking && userPos) {
      map.setView(userPos, 16, { animate: true });
    } else if (!tracking && activeCoords) {
      map.flyTo(activeCoords, 14, { duration: 1.5 });
    }
  }, [userPos, tracking, activeCoords, map]);
  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(() => {
    const saved = localStorage.getItem('tactical_stage_v30');
    return saved ? JSON.parse(saved) : STAGES[0];
  });
  
  const [steps, setSteps] = useState(() => {
    return parseInt(localStorage.getItem('tactical_steps_v30')) || 0;
  });

  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const lastAcc = useRef(0);
  const stepDebounce = useRef(false);

  useEffect(() => {
    localStorage.setItem('tactical_steps_v30', steps);
    localStorage.setItem('tactical_stage_v30', JSON.stringify(activeStage));
  }, [steps, activeStage]);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = STYLES;
    document.head.appendChild(styleTag);
    const watchId = navigator.geolocation.watchPosition(
      (p) => setUserPos([p.coords.latitude, p.coords.longitude]),
      null, { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // --- FUNCIÓN DE RESET EXPLÍCITA ---
  const resetSteps = () => {
    if (window.confirm("CONFIRMAR REINICIO DE CONTADOR TÁCTICO?")) {
      setSteps(0);
      localStorage.setItem('tactical_steps_v30', 0);
    }
  };

  const handleMotion = (e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const current = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
    if (Math.abs(current - lastAcc.current) > 12.5 && !stepDebounce.current) {
      setSteps(prev => prev + 1);
      stepDebounce.current = true;
      setTimeout(() => { stepDebounce.current = false; }, 350);
    }
    lastAcc.current = current;
  };

  const getDistanceToTarget = () => {
    if (!userPos) return "--";
    const rad = (x) => x * Math.PI / 180;
    const R = 6371;
    const dLat = rad(activeStage.coords[0] - userPos[0]);
    const dLong = rad(activeStage.coords[1] - userPos[1]);
    const a = Math.sin(dLat/2)**2 + Math.cos(rad(userPos[0])) * Math.cos(rad(activeStage.coords[0])) * Math.sin(dLong/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
      {showOverlay && (
        <div className="sensor-overlay">
          <ShieldCheck size={80} className="text-yellow-500 mb-6 animate-pulse" />
          <h2 className="text-yellow-500 font-black text-3xl mb-2 italic">SANTIAGO TACTICAL</h2>
          <button onClick={async () => {
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
              const res = await DeviceMotionEvent.requestPermission();
              if (res === 'granted') window.addEventListener('devicemotion', handleMotion);
            } else { window.addEventListener('devicemotion', handleMotion); }
            setShowOverlay(false);
          }} className="px-12 py-5 bg-yellow-500 text-black font-black rounded-xl">ACTIVAR SISTEMAS</button>
        </div>
      )}

      <header className="h-20 border-b border-yellow-500/50 flex items-center justify-between px-6 z-[6000] bg-black">
        <div className="flex items-center gap-4">
          <Zap size={24} className="text-yellow-500" fill="currentColor" />
          <div className="font-black italic text-yellow-500 text-sm">V30.1_REINFORCED</div>
        </div>
        <div className="text-xs font-bold text-yellow-500">STAGE {activeStage.id}/33</div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="sidebar-tactical">
          <div className="pedometer-dashboard">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <Footprints className="text-yellow-500" size={32} />
                <div>
                  <span className="text-[9px] text-white/40 font-black block">STEPS_COUNT</span>
                  <span className="text-3xl font-black italic">{steps.toLocaleString()}</span>
                </div>
              </div>
              {/* BOTÓN DE RESET REPARADO */}
              <button onClick={resetSteps} className="btn-reset-tactical" title="Reset Steps">
                <RotateCcw size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                <div className="text-[8px] text-white/40 font-bold">DISTANCE</div>
                <div className="text-lg font-black text-yellow-500">{(steps * 0.00075).toFixed(2)} KM</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-center">
                <div className="text-[8px] text-white/40 font-bold">CALORIES</div>
                <div className="text-lg font-black text-red-500">{(steps * 0.04).toFixed(0)}</div>
              </div>
            </div>
          </div>

          <div className="stage-list-container">
            {STAGES.map((s) => (
              <div key={s.id} onClick={() => { setActiveStage(s); setIsTracking(false); }} className={`stage-card ${activeStage.id === s.id ? 'active' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-white/40 italic">#PT_{s.id}</span>
                  <span className="text-[11px] font-black text-yellow-500">{s.dist} KM</span>
                </div>
                <h3 className="text-[13px] font-black uppercase tracking-tighter">{s.name}</h3>
                {activeStage.id === s.id && (
                  <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded flex items-center gap-2 text-cyan-400 font-bold text-[10px]">
                    <Navigation size={12} /> OBJ_RANGE: {getDistanceToTarget()} KM
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative">
          <div className="status-badge">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-yellow-500 animate-ping' : 'bg-cyan-400'}`} />
            <span>{isTracking ? 'Tracking' : 'Map Mode'}</span>
          </div>

          <div className="floating-controls">
            <button onClick={() => {
              if (userPos) window.open(`https://wa.me/?text=POSICIÓN: http://maps.google.com/maps?q=${userPos[0]},${userPos[1]}`);
            }} className="btn-tactical bg-[#25D366]/20 text-[#25D366]"><MessageCircle size={28} /></button>
            <button onClick={() => window.location.href="tel:112"} className="btn-tactical btn-sos">SOS</button>
            <button onClick={() => setIsTracking(!isTracking)} className={`btn-tactical ${isTracking ? 'bg-yellow-500 text-black' : 'bg-black text-white'}`}><Crosshair size={32} /></button>
          </div>

          <MapContainer center={activeStage.coords} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={STAGES.map(s => s.coords)} color="#00e5ff" weight={3} opacity={0.3} dashArray="5, 10" />
            {userPos && (
              <Marker position={userPos} icon={new L.DivIcon({
                html: `<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`,
                className: 'custom-icon', iconSize: [80, 80], iconAnchor: [40, 40]
              })} />
            )}
            <MapController userPos={userPos} tracking={isTracking} activeCoords={activeStage.coords} />
          </MapContainer>
        </main>
      </div>
    </div>
  );
}
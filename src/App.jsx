import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Target, MessageCircle, Activity, Zap, Wind, 
  Thermometer, Droplets, Footprints, Navigation2 
} from 'lucide-react';

// --- ESTILOS TÁCTICOS REVISADOS ---
const injectTacticalStyles = () => {
  if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      :root { --tactical-yellow: #facc15; }
      body { margin: 0; font-family: 'JetBrains Mono', monospace; background: #020617; color: white; overflow: hidden; }
      .leaflet-container { height: 100% !important; width: 100% !important; background: #0b1120 !important; }
      
      /* MIRA TELESCÓPICA: PEQUEÑA Y ABAJO A LA DERECHA */
      .sniper-btn { 
        position: absolute; bottom: 20px; right: 20px; z-index: 2000;
        width: 50px; height: 50px; border-radius: 50%; border: 3px solid #000;
        display: flex; justify-content: center; align-items: center; transition: all 0.2s;
      }
      .sniper-scope-ui { position: relative; width: 35px; height: 35px; display: flex; justify-content: center; align-items: center; }
      .scope-center { width: 4px; height: 4px; background: #ff0000; border-radius: 50%; z-index: 10; box-shadow: 0 0 8px #ff0000; }
      .scope-pulse { position: absolute; width: 20px; height: 20px; border: 1.5px solid #ff0000; border-radius: 50%; animation: pulse-gps 1.5s infinite; }
      .scope-cross-h { position: absolute; width: 35px; height: 1px; background: rgba(255, 0, 0, 0.5); }
      .scope-cross-v { position: absolute; width: 1px; height: 35px; background: rgba(255, 0, 0, 0.5); }
      @keyframes pulse-gps { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
      
      .glass-panel { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(6px); border: 1px solid rgba(250, 204, 21, 0.2); }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: #facc15; }
    `;
    document.head.appendChild(styleTag);
  }
};
injectTacticalStyles();

// --- ICONO DE USUARIO ---
const userSniperIcon = new L.DivIcon({
  html: `<div class="sniper-scope-ui"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-center"></div><div class="scope-pulse"></div></div>`,
  className: 'user-icon', iconSize: [35, 35], iconAnchor: [17, 17]
});

// --- LAS 33 ETAPAS COMPLETAS (Camino Francés) ---
const STAGES = [
  { id: 1, name: "SJ Pied de Port - Roncesvalles", dist: "24.2 km", coords: [43.0125, -1.3148] },
  { id: 2, name: "Roncesvalles - Zubiri", dist: "21.4 km", coords: [42.9298, -1.5042] },
  { id: 3, name: "Zubiri - Pamplona", dist: "20.4 km", coords: [42.8125, -1.6458] },
  { id: 4, name: "Pamplona - Puente la Reina", dist: "24.0 km", coords: [42.6719, -1.8139] },
  { id: 5, name: "Puente la Reina - Estella", dist: "22.0 km", coords: [42.6715, -2.0315] },
  { id: 6, name: "Estella - Los Arcos", dist: "21.0 km", coords: [42.5684, -2.1917] },
  { id: 7, name: "Los Arcos - Logroño", dist: "28.0 km", coords: [42.4627, -2.4450] },
  { id: 8, name: "Logroño - Nájera", dist: "29.0 km", coords: [42.4162, -2.7303] },
  { id: 9, name: "Nájera - Sto. Domingo", dist: "21.0 km", coords: [42.4411, -2.9535] },
  { id: 10, name: "Sto. Domingo - Belorado", dist: "22.0 km", coords: [42.4194, -3.1904] },
  { id: 11, name: "Belorado - Agés", dist: "27.0 km", coords: [42.3664, -3.4503] },
  { id: 12, name: "Agés - Burgos", dist: "23.0 km", coords: [42.3440, -3.6969] },
  { id: 13, name: "Burgos - Hontanas", dist: "31.1 km", coords: [42.3120, -4.0450] },
  { id: 14, name: "Hontanas - Frómista", dist: "34.5 km", coords: [42.2668, -4.4061] },
  { id: 15, name: "Frómista - Carrión", dist: "19.3 km", coords: [42.3389, -4.6067] },
  { id: 16, name: "Carrión - Terradillos", dist: "26.3 km", coords: [42.3610, -4.9248] },
  { id: 17, name: "Terradillos - Sahagún", dist: "13.9 km", coords: [42.3719, -5.0315] },
  { id: 18, name: "Sahagún - Burgo Ranero", dist: "18.0 km", coords: [42.4230, -5.2215] },
  { id: 19, name: "Burgo Ranero - León", dist: "37.1 km", coords: [42.5987, -5.5671] },
  { id: 20, name: "León - San Martín", dist: "25.9 km", coords: [42.5200, -5.8100] },
  { id: 21, name: "San Martín - Astorga", dist: "24.2 km", coords: [42.4544, -6.0560] },
  { id: 22, name: "Astorga - Foncebadón", dist: "25.8 km", coords: [42.4385, -6.3450] },
  { id: 23, name: "Foncebadón - Ponferrada", dist: "26.8 km", coords: [42.5455, -6.5936] },
  { id: 24, name: "Ponferrada - Villafranca", dist: "24.2 km", coords: [42.6074, -6.8115] },
  { id: 25, name: "Villafranca - O Cebreiro", dist: "27.8 km", coords: [42.7077, -7.0423] },
  { id: 26, name: "O Cebreiro - Triacastela", dist: "20.8 km", coords: [42.7565, -7.2403] },
  { id: 27, name: "Triacastela - Sarria", dist: "18.4 km", coords: [42.7770, -7.4160] },
  { id: 28, name: "Sarria - Portomarín", dist: "22.2 km", coords: [42.8075, -7.6160] },
  { id: 29, name: "Portomarín - Palas de Rei", dist: "24.8 km", coords: [42.8732, -7.8687] },
  { id: 30, name: "Palas de Rei - Arzúa", dist: "28.5 km", coords: [42.9265, -8.1634] },
  { id: 31, name: "Arzúa - O Pedrouzo", dist: "19.3 km", coords: [42.9100, -8.3600] },
  { id: 32, name: "O Pedrouzo - Santiago", dist: "19.4 km", coords: [42.8870, -8.5100] },
  { id: 33, name: "Santiago de Compostela", dist: "META", coords: [42.8806, -8.5464] }
];

function MapController({ coords, userPos, tracking }) {
  const map = useMap();
  useEffect(() => {
    if (tracking && userPos) map.flyTo(userPos, 16);
    else if (coords) map.flyTo(coords, 12);
  }, [coords, userPos, tracking, map]);
  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(STAGES[0]);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distanceWalked, setDistanceWalked] = useState(0);
  const lastPosRef = useRef(null);

  // GPS y Distancia
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((p) => {
      const newPos = [p.coords.latitude, p.coords.longitude];
      if (lastPosRef.current) {
        const d = L.latLng(lastPosRef.current).distanceTo(L.latLng(newPos));
        if (d > 2) setDistanceWalked(prev => prev + d);
      }
      lastPosRef.current = newPos;
      setUserPos(newPos);
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Podómetro
  useEffect(() => {
    let lastMag = 0;
    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
      if (Math.abs(mag - lastMag) > 3.8) setSteps(s => s + 1);
      lastMag = mag;
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617]">
      
      {/* BARRA SUPERIOR */}
      <header className="h-12 bg-black border-b border-yellow-500 flex items-center justify-between px-4 z-[2000]">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" size={18} fill="currentColor" />
          <span className="text-yellow-500 font-black text-xs uppercase italic">Camino Tactical v5.0</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-green-500 font-black text-[10px]"><Footprints size={14}/> {steps} STEPS</div>
          <button onClick={() => window.location.href="tel:112"} className="bg-red-600 text-white text-[9px] font-black px-4 py-1 rounded-full">SOS 112</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* PANEL IZQUIERDO: LAS 33 ETAPAS */}
        <aside className="w-[42%] border-r border-slate-800 bg-[#0b1120] flex flex-col">
          <div className="p-2 bg-slate-900 text-[8px] font-black text-slate-500 border-b border-slate-800 uppercase flex justify-between">
            <span>Stage Log / Full Route</span>
            <span className="text-yellow-500">33 FASES</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {STAGES.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setActiveStage(s)}
                className={`p-3 border-b border-slate-800/40 cursor-pointer flex justify-between items-center ${activeStage.id === s.id ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500' : ''}`}
              >
                <div>
                  <h4 className={`text-[10px] font-black uppercase ${activeStage.id === s.id ? 'text-yellow-400' : 'text-slate-200'}`}>{s.id}. {s.name}</h4>
                  <p className="text-[9px] font-bold text-slate-500 tracking-tighter">DISTANCIA: {s.dist}</p>
                </div>
                <Activity size={12} className={activeStage.id === s.id ? 'text-yellow-500' : 'text-slate-700'} />
              </div>
            ))}
          </div>
          
          {/* PODÓMETRO Y DISTANCIA PANEL */}
          <div className="p-3 bg-black border-t border-slate-800 grid grid-cols-2 gap-2">
            <div className="glass-panel p-2 rounded-lg text-center">
              <p className="text-[7px] text-slate-500 font-black uppercase">KM Hoy</p>
              <p className="text-sm font-black text-yellow-500">{(distanceWalked / 1000).toFixed(2)}</p>
            </div>
            <div className="glass-panel p-2 rounded-lg text-center">
              <p className="text-[7px] text-slate-500 font-black uppercase">Pasos</p>
              <p className="text-sm font-black text-white">{steps}</p>
            </div>
          </div>
        </aside>

        {/* MAPA OPERATIVO */}
        <main className="flex-1 relative bg-slate-900">
          
          {/* MIRA TELESCÓPICA - CAMBIO DE POSICIÓN (ABAJO DERECHA) */}
          <button 
            onClick={() => setIsTracking(!isTracking)}
            className={`sniper-btn ${isTracking ? 'bg-red-600' : 'bg-yellow-500'}`}
          >
            <div className="sniper-scope-ui">
              <div className="scope-cross-h"></div>
              <div className="scope-cross-v"></div>
              <div className="scope-center"></div>
              {isTracking && <div className="scope-pulse"></div>}
            </div>
          </button>

          <MapContainer center={activeStage.coords} zoom={12} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
            <Polyline positions={STAGES.map(s => s.coords)} color="#2563eb" weight={5} opacity={0.7} />
            {STAGES.map(s => (
              <Marker key={s.id} position={s.coords} icon={new L.DivIcon({
                html: `<div style="width:8px; height:8px; background:${s.id === activeStage.id ? '#facc15' : '#334155'}; border:1px solid white; border-radius:50%;"></div>`,
                className: 'dot', iconSize: [8, 8]
              })} />
            ))}
            {userPos && <Marker position={userPos} icon={userSniperIcon} />}
            <MapController coords={activeStage.coords} userPos={userPos} tracking={isTracking} />
          </MapContainer>
        </main>
      </div>
    </div>
  );
}
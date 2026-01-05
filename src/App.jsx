import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Target, Activity, Zap, Footprints, ShieldAlert, 
  Map as MapIcon, ChevronRight, Navigation
} from 'lucide-react';

// --- ESTILOS TÁCTICOS INTEGRADOS ---
const injectTacticalStyles = () => {
  if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      
      :root {
        --yellow: #facc15;
        --blue-neon: #2563eb;
        --bg: #000000;
      }

      body { 
        margin: 0; 
        font-family: 'JetBrains Mono', monospace; 
        background: var(--bg); 
        color: white; 
        overflow: hidden; 
      }

      /* Filtro Táctico para el Mapa */
      .leaflet-container { 
        height: 100% !important; 
        width: 100% !important; 
        background: #000 !important;
        filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
      }

      .sniper-btn { 
        position: absolute; bottom: 30px; right: 20px; z-index: 2000;
        width: 65px; height: 65px; border-radius: 50%; border: 3px solid #000;
        display: flex; justify-content: center; align-items: center;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
        transition: transform 0.1s;
      }
      .sniper-btn:active { transform: scale(0.9); }

      .scope-ui { position: relative; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; }
      .scope-center { width: 6px; height: 6px; background: #ff0000; border-radius: 50%; box-shadow: 0 0 10px #ff0000; z-index: 10; }
      .scope-cross-h { position: absolute; width: 100%; height: 1px; background: rgba(255,0,0,0.6); }
      .scope-cross-v { position: absolute; width: 1px; height: 100%; background: rgba(255,0,0,0.6); }
      
      @keyframes pulse-ring {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .pulse {
        position: absolute; width: 30px; height: 30px;
        border: 2px solid #ff0000; border-radius: 50%;
        animation: pulse-ring 1.5s infinite;
      }

      .stage-card {
        border-left: 4px solid transparent;
        background: rgba(255,255,255,0.03);
        margin-bottom: 2px;
        transition: all 0.2s;
      }
      .stage-card.active {
        background: rgba(37, 99, 235, 0.2);
        border-left: 4px solid var(--blue-neon);
      }

      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--blue-neon); }
    `;
    document.head.appendChild(styleTag);
  }
};
injectTacticalStyles();

// --- LAS 33 ETAPAS DEL CAMINO FRANCÉS ---
const STAGES = [
  { id: 1, name: "St-Jean-Pied-de-Port", dist: "START", coords: [43.1635, -1.2394] },
  { id: 2, name: "Roncesvalles", dist: "24.2 km", coords: [43.0092, -1.3194] },
  { id: 3, name: "Zubiri", dist: "21.4 km", coords: [42.9306, -1.5039] },
  { id: 4, name: "Pamplona", dist: "20.4 km", coords: [42.8125, -1.6458] },
  { id: 5, name: "Puente la Reina", dist: "24.0 km", coords: [42.6719, -1.8139] },
  { id: 6, name: "Estella", dist: "22.0 km", coords: [42.6715, -2.0315] },
  { id: 7, name: "Los Arcos", dist: "21.0 km", coords: [42.5684, -2.1917] },
  { id: 8, name: "Logroño", dist: "28.0 km", coords: [42.4627, -2.4450] },
  { id: 9, name: "Nájera", dist: "29.0 km", coords: [42.4162, -2.7303] },
  { id: 10, name: "Sto. Domingo de la Calzada", dist: "21.0 km", coords: [42.4411, -2.9535] },
  { id: 11, name: "Belorado", dist: "22.0 km", coords: [42.4194, -3.1904] },
  { id: 12, name: "Agés", dist: "27.0 km", coords: [42.3664, -3.4503] },
  { id: 13, name: "Burgos", dist: "23.0 km", coords: [42.3440, -3.6969] },
  { id: 14, name: "Hontanas", dist: "31.1 km", coords: [42.3120, -4.0450] },
  { id: 15, name: "Frómista", dist: "34.5 km", coords: [42.2668, -4.4061] },
  { id: 16, name: "Carrión de los Condes", dist: "19.3 km", coords: [42.3389, -4.6067] },
  { id: 17, name: "Terradillos de los Templarios", dist: "26.3 km", coords: [42.3610, -4.9248] },
  { id: 18, name: "Sahagún", dist: "13.9 km", coords: [42.3719, -5.0315] },
  { id: 19, name: "El Burgo Ranero", dist: "18.0 km", coords: [42.4230, -5.2215] },
  { id: 20, name: "León", dist: "37.1 km", coords: [42.5987, -5.5671] },
  { id: 21, name: "San Martín del Camino", dist: "25.9 km", coords: [42.5200, -5.8100] },
  { id: 22, name: "Astorga", dist: "24.2 km", coords: [42.4544, -6.0560] },
  { id: 23, name: "Foncebadón", dist: "25.8 km", coords: [42.4385, -6.3450] },
  { id: 24, name: "Ponferrada", dist: "26.8 km", coords: [42.5455, -6.5936] },
  { id: 25, name: "Villafranca del Bierzo", dist: "24.2 km", coords: [42.6074, -6.8115] },
  { id: 26, name: "O Cebreiro", dist: "27.8 km", coords: [42.7077, -7.0423] },
  { id: 27, name: "Triacastela", dist: "20.8 km", coords: [42.7565, -7.2403] },
  { id: 28, name: "Sarria", dist: "18.4 km", coords: [42.7770, -7.4160] },
  { id: 29, name: "Portomarín", dist: "22.2 km", coords: [42.8075, -7.6160] },
  { id: 30, name: "Palas de Rei", dist: "24.8 km", coords: [42.8732, -7.8687] },
  { id: 31, name: "Arzúa", dist: "28.5 km", coords: [42.9265, -8.1634] },
  { id: 32, name: "O Pedrouzo", dist: "19.3 km", coords: [42.9100, -8.3600] },
  { id: 33, name: "Santiago de Compostela", dist: "META", coords: [42.8806, -8.5464] }
];

function MapController({ targetCoords, userPos, tracking }) {
  const map = useMap();
  useEffect(() => {
    if (tracking && userPos) {
      map.flyTo(userPos, 16, { animate: true, duration: 1.5 });
    } else if (targetCoords) {
      map.flyTo(targetCoords, 13, { animate: true, duration: 1.5 });
    }
  }, [targetCoords, userPos, tracking, map]);
  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(STAGES[0]);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const lastPosRef = useRef(null);

  // GPS y Distancia Acumulada
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((p) => {
      const newPos = [p.coords.latitude, p.coords.longitude];
      if (lastPosRef.current) {
        const d = L.latLng(lastPosRef.current).distanceTo(L.latLng(newPos));
        if (d > 5) setDistance(prev => prev + d);
      }
      lastPosRef.current = newPos;
      setUserPos(newPos);
    }, null, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Sensor de Podómetro
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
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      
      {/* HEADER TÁCTICO */}
      <header className="h-16 bg-black border-b-2 border-yellow-500 flex items-center justify-between px-4 z-[2000]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500 rounded-lg">
            <Zap className="text-black" size={20} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-yellow-500 font-black text-xs leading-none">BUEN CAMINO</span>
            <span className="text-[7px] text-yellow-500/50 font-bold tracking-[0.3em]">TACTICAL HUD v6.0</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-500 font-bold uppercase">KM Día</span>
            <span className="text-blue-500 font-black text-xs">{(distance/1000).toFixed(2)}</span>
          </div>
          <button onClick={() => window.location.href="tel:112"} className="bg-red-600 p-2 rounded-md animate-pulse border border-red-400">
            <ShieldAlert size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* COLUMNA DE ETAPAS (42%) */}
        <aside className="w-[42%] bg-black border-r border-white/10 flex flex-col">
          <div className="p-3 bg-blue-600/10 text-blue-500 text-[9px] font-black uppercase flex justify-between border-b border-blue-600/20">
            <span>Ruta Logística</span>
            <span>33 PHASES</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {STAGES.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setActiveStage(s)}
                className={`stage-card p-4 cursor-pointer ${activeStage.id === s.id ? 'active' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[8px] font-black ${activeStage.id === s.id ? 'text-blue-400' : 'text-gray-600'}`}>ID: 0{s.id}</span>
                  <Activity size={12} className={activeStage.id === s.id ? 'text-blue-400' : 'text-gray-800'} />
                </div>
                <h4 className={`text-[11px] font-black uppercase ${activeStage.id === s.id ? 'text-white' : 'text-gray-400'}`}>{s.name}</h4>
                <p className="text-[8px] font-bold text-gray-600 mt-1 italic">ETA: {s.dist}</p>
              </div>
            ))}
          </div>
          
          {/* PANEL DE PODÓMETRO INFERIOR */}
          <div className="p-4 bg-gray-900/50 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="text-yellow-500" size={16}/>
              <span className="text-xs font-black">{steps}</span>
            </div>
            <span className="text-[8px] font-bold text-gray-500">SENSORS ACTIVE</span>
          </div>
        </aside>

        {/* ÁREA DE MAPA OPERATIVO (58%) */}
        <main className="flex-1 relative">
          
          {/* BOTÓN MIRA TELESCÓPICA (ABAJO DERECHA) */}
          <button 
            onClick={() => setIsTracking(!isTracking)}
            className={`sniper-btn ${isTracking ? 'bg-red-600' : 'bg-yellow-500'}`}
          >
            <div className="scope-ui">
              <div className="scope-cross-h"></div>
              <div className="scope-cross-v"></div>
              <div className="scope-center"></div>
              {isTracking && <div className="pulse"></div>}
            </div>
          </button>

          <MapContainer center={activeStage.coords} zoom={13} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* LÍNEA AZUL DEL CAMINO (UNE TODAS LAS ETAPAS) */}
            <Polyline 
              positions={STAGES.map(s => s.coords)} 
              color="#2563eb" 
              weight={4} 
              opacity={0.8}
              dashArray="2, 6"
            />
            
            {/* MARCADORES DE ETAPAS (PUNTOS EN EL MAPA) */}
            {STAGES.map(s => (
              <Marker key={s.id} position={s.coords} icon={new L.DivIcon({
                html: `<div style="width:10px; height:10px; background:${s.id === activeStage.id ? '#2563eb' : '#333'}; border:2px solid white; border-radius:50%; box-shadow: 0 0 10px rgba(37,99,235,0.5);"></div>`,
                className: 'stage-dot', iconSize: [10, 10]
              })} />
            ))}

            {/* MARCADOR DE USUARIO (MIRA TELESCÓPICA) */}
            {userPos && (
              <Marker position={userPos} icon={new L.DivIcon({
                html: `<div class="scope-ui"><div class="scope-center"></div><div class="pulse"></div></div>`,
                className: 'user-marker', iconSize: [40, 40], iconAnchor: [20, 20]
              })} />
            )}

            <MapController targetCoords={activeStage.coords} userPos={userPos} tracking={isTracking} />
          </MapContainer>
        </main>
      </div>
    </div>
  );
}
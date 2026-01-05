import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Zap, Footprints, ShieldAlert, Activity, Compass, 
  MessageCircle, TrendingUp, ChevronUp, ChevronDown, Crosshair
} from 'lucide-react';

// --- ESTILOS REFORZADOS PARA EVITAR EL FONDO BLANCO ---
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
  
  :root { 
    --yellow: #facc15; 
    --red: #ff0000; 
    --green: #22c55e; 
    --black: #000000;
    --gray: #1a1a1a;
  }

  body, html, #root { 
    margin: 0; padding: 0; height: 100vh; width: 100vw;
    background: var(--black) !important; 
    font-family: 'JetBrains Mono', monospace; 
    color: white; 
    overflow: hidden; 
  }

  /* PANEL LATERAL (EL QUE SALÍA BLANCO EN TU CAPTURA) */
  .sidebar-tactical {
    width: 45%;
    background: var(--black) !important;
    border-right: 2px solid var(--gray);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  .stage-card { 
    border-left: 6px solid #333; 
    background: #0a0a0a !important; 
    border-bottom: 1px solid #222; 
    padding: 15px; 
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .stage-card.active { 
    border-left: 6px solid var(--yellow); 
    background: #151515 !important; 
  }

  .text-main { color: var(--yellow) !important; font-weight: 800; text-transform: uppercase; }
  .text-sub { color: #ffffff !important; opacity: 0.8; font-size: 11px; }
  .text-dim { color: #666 !important; font-size: 9px; }

  /* MIRA TELESCÓPICA ROJA */
  .sniper-scope-marker { position: relative; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; }
  .scope-cross-h { position: absolute; width: 100%; height: 2px; background: var(--red); box-shadow: 0 0 8px var(--red); }
  .scope-cross-v { position: absolute; width: 2px; height: 100%; background: var(--red); box-shadow: 0 0 8px var(--red); }
  .scope-circle { position: absolute; width: 35px; height: 35px; border: 2px solid var(--red); border-radius: 50%; }
  
  @keyframes scan { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
  .scope-pulse { position: absolute; width: 40px; height: 40px; border: 2px solid var(--red); border-radius: 50%; animation: scan 2s infinite; }

  /* MAPA */
  .leaflet-container { background: #000 !important; filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); }

  .whatsapp-btn { 
    background: #25D366 !important; 
    color: black !important; 
    font-weight: 800; 
    font-size: 10px; 
    padding: 6px 12px; 
    border-radius: 4px; 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    margin-top: 10px; 
    border: none;
    cursor: pointer;
  }
  
  .badge { padding: 2px 6px; font-size: 9px; font-weight: 900; border-radius: 3px; }
  .bg-hard { background: var(--red); color: white; }
  .bg-med { background: var(--yellow); color: black; }
  .bg-easy { background: var(--green); color: black; }

  /* BOTÓN GPS */
  .gps-trigger {
    position: absolute; bottom: 30px; right: 20px; z-index: 2000;
    width: 60px; height: 60px; border-radius: 50%;
    background: var(--yellow); border: 3px solid black;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(0,0,0,1); cursor: pointer;
  }
`;

const STAGES = [
  { id: 1, name: "St-Jean - Roncesvalles", dist: "24.2 km", diff: "ALTA", up: "+1250m", down: "-480m", coords: [43.0125, -1.3148] },
  { id: 2, name: "Roncesvalles - Zubiri", dist: "21.4 km", diff: "MEDIA", up: "+250m", down: "-780m", coords: [42.9298, -1.5042] },
  { id: 3, name: "Zubiri - Pamplona", dist: "20.4 km", diff: "BAJA", up: "+150m", down: "-280m", coords: [42.8125, -1.6458] },
  { id: 4, name: "Pamplona - Puente la Reina", dist: "24.0 km", diff: "MEDIA", up: "+450m", down: "-510m", coords: [42.6719, -1.8139] },
  { id: 5, name: "Puente la Reina - Estella", dist: "22.0 km", diff: "BAJA", up: "+320m", down: "-250m", coords: [42.6715, -2.0315] },
  { id: 6, name: "Estella - Los Arcos", dist: "21.0 km", diff: "BAJA", up: "+200m", down: "-180m", coords: [42.5684, -2.1917] },
  { id: 7, name: "Los Arcos - Logroño", dist: "28.0 km", diff: "MEDIA", up: "+220m", down: "-250m", coords: [42.4627, -2.4450] },
  { id: 8, name: "Logroño - Nájera", dist: "29.0 km", diff: "ALTA", up: "+380m", down: "-200m", coords: [42.4162, -2.7303] },
  { id: 9, name: "Nájera - Sto. Domingo", dist: "21.0 km", diff: "BAJA", up: "+280m", down: "-100m", coords: [42.4411, -2.9535] },
  { id: 10, name: "Sto. Domingo - Belorado", dist: "22.0 km", diff: "BAJA", up: "+160m", down: "-120m", coords: [42.4194, -3.1904] },
  { id: 11, name: "Belorado - Agés", dist: "27.0 km", diff: "MEDIA", up: "+420m", down: "-150m", coords: [42.3664, -3.4503] },
  { id: 12, name: "Agés - Burgos", dist: "23.0 km", diff: "BAJA", up: "+100m", down: "-250m", coords: [42.3440, -3.6969] },
  { id: 13, name: "Burgos - Hontanas", dist: "31.1 km", diff: "ALTA", up: "+350m", down: "-280m", coords: [42.3120, -4.0450] },
  { id: 14, name: "Hontanas - Frómista", dist: "34.5 km", diff: "ALTA", up: "+120m", down: "-200m", coords: [42.2668, -4.4061] },
  { id: 15, name: "Frómista - Carrión", dist: "19.3 km", diff: "BAJA", up: "+50m", down: "-30m", coords: [42.3389, -4.6067] },
  { id: 16, name: "Carrión - Terradillos", dist: "26.3 km", diff: "MEDIA", up: "+150m", down: "-100m", coords: [42.3610, -4.9248] },
  { id: 17, name: "Terradillos - Sahagún", dist: "13.9 km", diff: "BAJA", up: "+40m", down: "-80m", coords: [42.3719, -5.0315] },
  { id: 18, name: "Sahagún - Burgo Ranero", dist: "18.0 km", diff: "BAJA", up: "+30m", down: "-20m", coords: [42.4230, -5.2215] },
  { id: 19, name: "Burgo Ranero - León", dist: "37.1 km", diff: "ALTA", up: "+150m", down: "-120m", coords: [42.5987, -5.5671] },
  { id: 20, name: "León - San Martín", dist: "25.9 km", diff: "BAJA", up: "+60m", down: "-100m", coords: [42.5200, -5.8100] },
  { id: 21, name: "San Martín - Astorga", dist: "24.2 km", diff: "BAJA", up: "+120m", down: "-80m", coords: [42.4544, -6.0560] },
  { id: 22, name: "Astorga - Foncebadón", dist: "25.8 km", diff: "ALTA", up: "+650m", down: "-50m", coords: [42.4385, -6.3450] },
  { id: 23, name: "Foncebadón - Ponferrada", dist: "26.8 km", diff: "ALTA", up: "+150m", down: "-950m", coords: [42.5455, -6.5936] },
  { id: 24, name: "Ponferrada - Villafranca", dist: "24.2 km", diff: "BAJA", up: "+180m", down: "-150m", coords: [42.6074, -6.8115] },
  { id: 25, name: "Villafranca - O Cebreiro", dist: "27.8 km", diff: "ALTA", up: "+1100m", down: "-150m", coords: [42.7077, -7.0423] },
  { id: 26, name: "O Cebreiro - Triacastela", dist: "20.8 km", diff: "MEDIA", up: "+150m", down: "-850m", coords: [42.7565, -7.2403] },
  { id: 27, name: "Triacastela - Sarria", dist: "18.4 km", diff: "BAJA", up: "+250m", down: "-450m", coords: [42.7770, -7.4160] },
  { id: 28, name: "Sarria - Portomarín", dist: "22.2 km", diff: "MEDIA", up: "+350m", down: "-400m", coords: [42.8075, -7.6160] },
  { id: 29, name: "Portomarín - Palas de Rei", dist: "24.8 km", diff: "MEDIA", up: "+450m", down: "-320m", coords: [42.8732, -7.8687] },
  { id: 30, name: "Palas de Rei - Arzúa", dist: "28.5 km", diff: "MEDIA", up: "+400m", down: "-550m", coords: [42.9265, -8.1634] },
  { id: 31, name: "Arzúa - O Pedrouzo", dist: "19.3 km", diff: "BAJA", up: "+180m", down: "-250m", coords: [42.9100, -8.3600] },
  { id: 32, name: "O Pedrouzo - Santiago", dist: "19.4 km", diff: "BAJA", up: "+280m", down: "-250m", coords: [42.8870, -8.5100] },
  { id: 33, name: "Santiago", dist: "META", diff: "META", up: "0m", down: "0m", coords: [42.8806, -8.5464] }
];

function MapController({ targetCoords, userPos, tracking }) {
  const map = useMap();
  useEffect(() => {
    if (tracking && userPos) map.flyTo(userPos, 16);
    else if (targetCoords) map.flyTo(targetCoords, 14);
  }, [targetCoords, userPos, tracking, map]);
  return null;
}

export default function App() {
  const [activeStage, setActiveStage] = useState(STAGES[0]);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = STYLES;
    document.head.appendChild(styleTag);
    const watchId = navigator.geolocation.watchPosition((p) => {
      setUserPos([p.coords.latitude, p.coords.longitude]);
    }, null, { enableHighAccuracy: true });
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (document.head.contains(styleTag)) document.head.removeChild(styleTag);
    };
  }, []);

  const shareWA = (s) => {
    const msg = `📍 GPS CAMINO: Etapa ${s.id} (${s.name}). Dificultad: ${s.diff}. Desnivel: ${s.up}/${s.down}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
      
      {/* HEADER TÁCTICO */}
      <header className="h-16 bg-black border-b-2 border-yellow-500 flex items-center justify-between px-4 z-[3000]">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" size={24} fill="currentColor" />
          <div>
            <h1 className="text-yellow-500 font-black text-xs m-0">OPERATIVO CAMINO v9.0</h1>
            <p className="text-[8px] text-white/40 m-0 uppercase font-bold tracking-widest">Digital Battle Map</p>
          </div>
        </div>
        <button onClick={() => window.location.href="tel:112"} className="bg-red-600 p-2 rounded border-2 border-red-400">
          <ShieldAlert size={20} color="white" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* PANEL IZQUIERDO: AHORA FORZADO A NEGRO CON TEXTO AMARILLO */}
        <aside className="sidebar-tactical">
          <div className="p-2 bg-yellow-500 text-black text-[9px] font-black uppercase text-center">
            Briefing de Etapas (33)
          </div>
          {STAGES.map((s) => (
            <div 
              key={s.id} 
              onClick={() => setActiveStage(s)}
              className={`stage-card ${activeStage.id === s.id ? 'active' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-black text-white/30">OBJ-{String(s.id).padStart(2,'0')}</span>
                <span className={`badge ${s.diff === 'ALTA' ? 'bg-hard' : s.diff === 'MEDIA' ? 'bg-med' : 'bg-easy'}`}>
                  {s.diff}
                </span>
              </div>
              <h3 className={`text-[11px] font-black uppercase m-0 ${activeStage.id === s.id ? 'text-yellow-500' : 'text-white'}`}>
                {s.name}
              </h3>
              
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1 text-[9px] font-bold text-white/60">
                  <ChevronUp size={10} className="text-red-500"/> {s.up}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-white/60">
                  <ChevronDown size={10} className="text-green-500"/> {s.down}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500">
                  <TrendingUp size={10}/> {s.dist}
                </div>
              </div>

              <button onClick={(e) => { e.stopPropagation(); shareWA(s); }} className="whatsapp-btn">
                <MessageCircle size={12} fill="black"/> COMPARTIR
              </button>
            </div>
          ))}
        </aside>

        {/* MAPA CON MIRA ROJA */}
        <main className="flex-1 relative bg-black">
          <button onClick={() => setIsTracking(!isTracking)} className="gps-trigger">
            <Crosshair size={24} color="black" />
          </button>

          <MapContainer center={activeStage.coords} zoom={13} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={STAGES.map(s => s.coords)} color="#2563eb" weight={4} dashArray="5, 15" opacity={0.6}/>
            
            {STAGES.map(s => (
              <Marker key={s.id} position={s.coords} icon={new L.DivIcon({
                html: `<div style="width:10px; height:10px; background:${s.id === activeStage.id ? '#facc15' : '#444'}; border:2px solid white; border-radius:50%;"></div>`,
                className: 'stage-dot', iconSize: [10, 10]
              })} />
            ))}

            {userPos && (
              <Marker position={userPos} icon={new L.DivIcon({
                html: `
                  <div class="sniper-scope-marker">
                    <div class="scope-cross-h"></div>
                    <div class="scope-cross-v"></div>
                    <div class="scope-circle"></div>
                    <div class="scope-pulse"></div>
                    <div style="width:6px; height:6px; background:white; border-radius:50%; z-index:10; border:1px solid red;"></div>
                  </div>
                `,
                className: 'user-sniper', iconSize: [60, 60], iconAnchor: [30, 30]
              })} />
            )}

            <MapController targetCoords={activeStage.coords} userPos={userPos} tracking={isTracking} />
          </MapContainer>
        </main>
      </div>
    </div>
  );
}
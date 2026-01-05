import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Zap, Footprints, ShieldAlert, Activity, 
  MessageCircle, TrendingUp, ChevronUp, ChevronDown, Crosshair,
  Lightbulb, PhoneCall, AlertTriangle
} from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
  :root { --yellow: #facc15; --red-emergency: #ff0000; --black: #000000; --gray: #1a1a1a; }
  body, html, #root { margin: 0; padding: 0; height: 100vh; width: 100vw; background: var(--black) !important; font-family: 'JetBrains Mono', monospace; color: white; overflow: hidden; }
  
  .sidebar-tactical { width: 45%; background: var(--black) !important; border-right: 2px solid var(--gray); display: flex; flex-direction: column; height: 100%; position: relative; }
  .stage-list-container { flex: 1; overflow-y: auto; padding-bottom: 120px; }
  
  .stage-card { border-left: 6px solid #333; background: #0a0a0a !important; border-bottom: 1px solid #222; padding: 15px; cursor: pointer; }
  .stage-card.active { border-left: 6px solid var(--yellow); background: #151515 !important; }

  /* MARCADOR SNIPER */
  .sniper-scope-marker { position: relative; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; }
  .scope-cross-h { position: absolute; width: 100%; height: 2px; background: var(--red-emergency); box-shadow: 0 0 8px var(--red-emergency); }
  .scope-cross-v { position: absolute; width: 2px; height: 100%; background: var(--red-emergency); box-shadow: 0 0 8px var(--red-emergency); }
  .scope-circle { position: absolute; width: 35px; height: 35px; border: 2px solid var(--red-emergency); border-radius: 50%; }
  @keyframes scan { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
  .scope-pulse { position: absolute; width: 40px; height: 40px; border: 2px solid var(--red-emergency); border-radius: 50%; animation: scan 2s infinite; }

  .leaflet-container { background: #000 !important; filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); }
  .gps-trigger { position: absolute; bottom: 30px; right: 20px; z-index: 2000; width: 60px; height: 60px; border-radius: 50%; background: var(--yellow); border: 3px solid black; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(0,0,0,1); }

  /* PANEL SOS REFORZADO - ROJO TOTAL */
  .sos-emergency-panel { 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    width: 100%; 
    background: #000; 
    border-top: 3px solid var(--red-emergency); 
    padding: 10px; 
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
    z-index: 1000;
    box-shadow: 0 -10px 20px rgba(255,0,0,0.2);
  }
  
  .sos-button { 
    width: 100%; 
    padding: 14px; 
    border-radius: 6px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    gap: 12px; 
    text-decoration: none; 
    font-weight: 900; 
    font-size: 14px; 
    text-transform: uppercase;
    transition: transform 0.1s;
  }
  .sos-button:active { transform: scale(0.95); }
  
  .btn-112 { background: var(--red-emergency); color: white; border: none; }
  .btn-062 { border: 2px solid var(--red-emergency); color: var(--red-emergency); background: rgba(255,0,0,0.1); }

  .pedometer-box { background: #0f0f0f; border-bottom: 1px solid #222; padding: 12px; display: flex; align-items: center; gap: 10px; }
  .suggestion-box { margin-top: 10px; padding: 8px; background: rgba(250, 204, 21, 0.1); border: 1px dashed var(--yellow); }
`;

const STAGES = [
  { id: 1, name: "St-Jean - Roncesvalles", dist: "24.2 km", diff: "ALTA", up: "+1250m", down: "-480m", coords: [43.0125, -1.3148], tips: "Atención: Ruta de montaña expuesta. Niebla frecuente." },
  { id: 2, name: "Roncesvalles - Zubiri", dist: "21.4 km", diff: "MEDIA", up: "+250m", down: "-780m", coords: [42.9298, -1.5042], tips: "Descenso peligroso en Erro si llueve." },
  { id: 3, name: "Zubiri - Pamplona", dist: "20.4 km", diff: "BAJA", up: "+150m", down: "-280m", coords: [42.8125, -1.6458], tips: "Camino cómodo junto al río Arga." },
  { id: 4, name: "Pamplona - Puente la Reina", dist: "24.0 km", diff: "MEDIA", up: "+450m", down: "-510m", coords: [42.6719, -1.8139], tips: "Subida al Perdón: Viento fuerte." },
  { id: 5, name: "Puente la Reina - Estella", dist: "22.0 km", diff: "BAJA", up: "+320m", down: "-250m", coords: [42.6715, -2.0315], tips: "Paso por calzada romana." },
  { id: 6, name: "Estella - Los Arcos", dist: "21.0 km", diff: "BAJA", up: "+200m", down: "-180m", coords: [42.5684, -2.1917], tips: "Bodegas Irache: Fuente del vino." },
  { id: 7, name: "Los Arcos - Logroño", dist: "28.0 km", diff: "MEDIA", up: "+220m", down: "-250m", coords: [42.4627, -2.4450], tips: "Etapa larga sin mucha sombra." },
  { id: 8, name: "Logroño - Nájera", dist: "29.0 km", diff: "ALTA", up: "+380m", down: "-200m", coords: [42.4162, -2.7303], tips: "Salida por el pantano de La Grajera." },
  { id: 9, name: "Nájera - Sto. Domingo", dist: "21.0 km", diff: "BAJA", up: "+280m", down: "-100m", coords: [42.4411, -2.9535], tips: "Terreno suave entre viñedos." },
  { id: 10, name: "Sto. Domingo - Belorado", dist: "22.0 km", diff: "BAJA", up: "+160m", down: "-120m", coords: [42.4194, -3.1904], tips: "Entrada en la provincia de Burgos." },
  { id: 11, name: "Belorado - Agés", dist: "27.0 km", diff: "MEDIA", up: "+420m", down: "-150m", coords: [42.3664, -3.4503], tips: "Cruce de los Montes de Oca." },
  { id: 12, name: "Agés - Burgos", dist: "23.0 km", diff: "BAJA", up: "+100m", down: "-250m", coords: [42.3440, -3.6969], tips: "Pasando por el yacimiento de Atapuerca." },
  { id: 13, name: "Burgos - Hontanas", dist: "31.1 km", diff: "ALTA", up: "+350m", down: "-280m", coords: [42.3120, -4.0450], tips: "Meseta pura. Protección solar extrema." },
  { id: 14, name: "Hontanas - Frómista", dist: "34.5 km", diff: "ALTA", up: "+120m", down: "-200m", coords: [42.2668, -4.4061], tips: "Cruce de San Antón y el Canal." },
  { id: 15, name: "Frómista - Carrión", dist: "19.3 km", diff: "BAJA", up: "+50m", down: "-30m", coords: [42.3389, -4.6067], tips: "Andadero llano junto a la carretera." },
  { id: 16, name: "Carrión - Terradillos", dist: "26.3 km", diff: "MEDIA", up: "+150m", down: "-100m", coords: [42.3610, -4.9248], tips: "17km sin ningún servicio intermedio." },
  { id: 17, name: "Terradillos - Sahagún", dist: "13.9 km", diff: "BAJA", up: "+40m", down: "-80m", coords: [42.3719, -5.0315], tips: "Mitad exacta del camino." },
  { id: 18, name: "Sahagún - Burgo Ranero", dist: "18.0 km", diff: "BAJA", up: "+30m", down: "-20m", coords: [42.4230, -5.2215], tips: "Pista arbolada infinita." },
  { id: 19, name: "Burgo Ranero - León", dist: "37.1 km", diff: "ALTA", up: "+150m", down: "-120m", coords: [42.5987, -5.5671], tips: "Etapa de resistencia mental." },
  { id: 20, name: "León - San Martín", dist: "25.9 km", diff: "BAJA", up: "+60m", down: "-100m", coords: [42.5200, -5.8100], tips: "Salida monótona por polígonos." },
  { id: 21, name: "San Martín - Astorga", dist: "24.2 km", diff: "BAJA", up: "+120m", down: "-80m", coords: [42.4544, -6.0560], tips: "Hospital de Órbigo y su puente." },
  { id: 22, name: "Astorga - Foncebadón", dist: "25.8 km", diff: "ALTA", up: "+650m", down: "-50m", coords: [42.4385, -6.3450], tips: "Subida progresiva a la montaña." },
  { id: 23, name: "Foncebadón - Ponferrada", dist: "26.8 km", diff: "ALTA", up: "+150m", down: "-950m", coords: [42.5455, -6.5936], tips: "Cruz de Ferro. Bajada rompe-rodillas." },
  { id: 24, name: "Ponferrada - Villafranca", dist: "24.2 km", diff: "BAJA", up: "+180m", down: "-150m", coords: [42.6074, -6.8115], tips: "Atravesando los viñedos del Bierzo." },
  { id: 25, name: "Villafranca - O Cebreiro", dist: "27.8 km", diff: "ALTA", up: "+1100m", down: "-150m", coords: [42.7077, -7.0423], tips: "Ascenso épico a Galicia." },
  { id: 26, name: "O Cebreiro - Triacastela", dist: "20.8 km", diff: "MEDIA", up: "+150m", down: "-850m", coords: [42.7565, -7.2403], tips: "Paisajes espectaculares de altura." },
  { id: 27, name: "Triacastela - Sarria", dist: "18.4 km", diff: "BAJA", up: "+250m", down: "-450m", coords: [42.7770, -7.4160], tips: "Ruta arbolada y húmeda." },
  { id: 28, name: "Sarria - Portomarín", dist: "22.2 km", diff: "MEDIA", up: "+350m", down: "-400m", coords: [42.8075, -7.6160], tips: "Inicio de los últimos 100km." },
  { id: 29, name: "Portomarín - Palas de Rei", dist: "24.8 km", diff: "MEDIA", up: "+450m", down: "-320m", coords: [42.8732, -7.8687], tips: "Sube y baja constante por Galicia." },
  { id: 30, name: "Palas de Rei - Arzúa", dist: "28.5 km", diff: "MEDIA", up: "+400m", down: "-550m", coords: [42.9265, -8.1634], tips: "Etapa de los quesos. Exigente." },
  { id: 31, name: "Arzúa - O Pedrouzo", dist: "19.3 km", diff: "BAJA", up: "+180m", down: "-250m", coords: [42.9100, -8.3600], tips: "Eucaliptos y cercanía al aeropuerto." },
  { id: 32, name: "O Pedrouzo - Santiago", dist: "19.4 km", diff: "BAJA", up: "+280m", down: "-250m", coords: [42.8870, -8.5100], tips: "Monte do Gozo. Objetivo a la vista." },
  { id: 33, name: "Santiago", dist: "META", diff: "META", up: "0", down: "0", coords: [42.8806, -8.5464], tips: "Catedral de Santiago. ¡Buen Camino!" }
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
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = STYLES;
    document.head.appendChild(styleTag);
    const watchId = navigator.geolocation.watchPosition((p) => {
      setUserPos([p.coords.latitude, p.coords.longitude]);
    }, null, { enableHighAccuracy: true });

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
      if (total > 12) setSteps(s => s + 1);
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('devicemotion', handleMotion);
      if (document.head.contains(styleTag)) document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
      <header className="h-16 bg-black border-b-2 border-yellow-500 flex items-center justify-between px-4 z-[3000]">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" size={24} fill="currentColor" />
          <div>
            <h1 className="text-yellow-500 font-black text-xs m-0 uppercase italic">Tactical Santiago v13.0</h1>
            <p className="text-[8px] text-white/40 m-0 font-bold uppercase">Emergency & Surveillance Ready</p>
          </div>
        </div>
        <div className="bg-red-600/20 px-3 py-1 border border-red-600 rounded flex items-center gap-2">
           <Activity size={12} className="text-red-600 animate-pulse" />
           <span className="text-red-600 text-[9px] font-black">ENLACE SOS ACTIVO</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="sidebar-tactical">
          <div className="pedometer-box">
            <Footprints className="text-yellow-500" size={18} />
            <div className="flex flex-col">
              <span className="text-[7px] text-white/40 font-black uppercase">Sensor de Movimiento</span>
              <span className="text-xs font-black text-white">{steps} PASOS REALIZADOS</span>
            </div>
          </div>

          <div className="stage-list-container">
            {STAGES.map((s) => (
              <div key={s.id} onClick={() => setActiveStage(s)} className={`stage-card ${activeStage.id === s.id ? 'active' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black text-white/30 tracking-widest">OBJ-{s.id}</span>
                  <span className="text-[9px] font-black text-yellow-500">{s.diff}</span>
                </div>
                <h3 className={`text-[11px] font-black uppercase m-0 ${activeStage.id === s.id ? 'text-yellow-500' : 'text-white'}`}>{s.name}</h3>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/60"><ChevronUp size={10} className="text-red-600"/> {s.up}</div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500"><TrendingUp size={10}/> {s.dist}</div>
                </div>
                {activeStage.id === s.id && (
                  <div className="suggestion-box">
                    <p className="text-[9px] text-white/80 leading-tight m-0 uppercase font-bold tracking-tighter">
                      <Lightbulb size={10} className="inline mr-1 text-yellow-500"/> {s.tips}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SECCIÓN SOS - EXPLÍCITA Y ROJA */}
          <div className="sos-emergency-panel">
            <a href="tel:112" className="sos-button btn-112">
              <ShieldAlert size={20} />
              <span>SOS EMERGENCIA 112</span>
            </a>
            <a href="tel:062" className="sos-button btn-062">
              <PhoneCall size={20} />
              <span>GUARDIA CIVIL 062</span>
            </a>
          </div>
        </aside>

        <main className="flex-1 relative bg-black">
          <button onClick={() => setIsTracking(!isTracking)} className="gps-trigger">
            <Crosshair size={24} color="black" />
          </button>
          <MapContainer center={activeStage.coords} zoom={13} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={STAGES.map(s => s.coords)} color="#facc15" weight={2} dashArray="5, 10" opacity={0.3}/>
            {userPos && (
              <Marker position={userPos} icon={new L.DivIcon({
                html: `<div class="sniper-scope-marker"><div class="scope-cross-h"></div><div class="scope-cross-v"></div><div class="scope-circle"></div><div class="scope-pulse"></div></div>`,
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
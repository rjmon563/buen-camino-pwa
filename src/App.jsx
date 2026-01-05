import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Zap, Footprints, ShieldAlert, Activity, 
  MessageCircle, TrendingUp, ChevronUp, ChevronDown, Crosshair,
  Lightbulb, PhoneCall, Navigation, Clock, Map as MapIcon
} from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
  :root { --yellow: #facc15; --red: #ff0000; --green: #22c55e; --black: #000; --gray: #1a1a1a; }
  
  body, html, #root { 
    margin: 0; padding: 0; height: 100vh; width: 100vw; 
    background: var(--black) !important; 
    font-family: 'JetBrains Mono', monospace; 
    color: white; overflow: hidden; 
  }
  
  .sidebar-tactical { width: 45%; background: var(--black); border-right: 2px solid var(--gray); display: flex; flex-direction: column; height: 100%; }
  
  .pedometer-dashboard {
    background: linear-gradient(180deg, #111 0%, #000 100%);
    padding: 15px;
    border-bottom: 2px solid var(--yellow);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stage-list-container { flex: 1; overflow-y: auto; padding-bottom: 20px; }
  
  .stage-card { border-left: 4px solid #333; background: #0a0a0a; border-bottom: 1px solid #222; padding: 12px; cursor: pointer; }
  .stage-card.active { border-left: 4px solid var(--yellow); background: #111; }

  .leaflet-container { background: #000 !important; filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(120%); }
  
  /* MARCADOR SNIPER MEJORADO */
  .sniper-scope-marker { position: relative; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; }
  .scope-cross-h { position: absolute; width: 100%; height: 2px; background: var(--red); box-shadow: 0 0 10px var(--red); }
  .scope-cross-v { position: absolute; width: 2px; height: 100%; background: var(--red); box-shadow: 0 0 10px var(--red); }
  .scope-circle { position: absolute; width: 30px; height: 30px; border: 2px solid var(--red); border-radius: 50%; }
  .scope-pulse { position: absolute; width: 30px; height: 30px; border: 2px solid var(--red); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

  /* SOS COMPACTO ESQUINA INFERIOR DERECHA */
  .floating-controls { 
    position: absolute; bottom: 20px; right: 20px; z-index: 5000; 
    display: flex; flex-direction: column; gap: 10px; align-items: flex-end;
  }
  
  .btn-tactical {
    width: 55px; height: 55px; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(0,0,0,0.8); cursor: pointer; border: none;
    transition: transform 0.2s;
  }
  .btn-tactical:active { transform: scale(0.9); }

  .btn-gps-wa {
    background: #25D366; color: black; padding: 10px 15px; border-radius: 30px; 
    font-size: 10px; font-weight: 900; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 0 15px rgba(37, 211, 102, 0.4);
  }

  .distance-tag {
    background: rgba(37, 99, 235, 0.2);
    border: 1px solid #2563eb;
    color: #60a5fa;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    margin-top: 5px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
`;

const STAGES = [
  { id: 1, name: "St-Jean - Roncesvalles", dist: "24.2", up: "+1250m", coords: [43.0125, -1.3148], tips: "Ruta Napoleón: Dureza extrema inicial." },
  { id: 2, name: "Roncesvalles - Zubiri", dist: "21.4", up: "+250m", coords: [42.9298, -1.5042], tips: "Cuidado rodillas en bajada de Erro." },
  { id: 3, name: "Zubiri - Pamplona", dist: "20.4", up: "+150m", coords: [42.8125, -1.6458], tips: "Paseo fluvial agradable." },
  { id: 4, name: "Pamplona - P. la Reina", dist: "24.0", up: "+450m", coords: [42.6719, -1.8139], tips: "Viento en Alto del Perdón." },
  { id: 5, name: "P. la Reina - Estella", dist: "22.0", up: "+320m", coords: [42.6715, -2.0315], tips: "Calzada romana en Cirauqui." },
  { id: 6, name: "Estella - Los Arcos", dist: "21.0", up: "+200m", coords: [42.5684, -2.1917], tips: "Fuente del Vino Irache." },
  { id: 7, name: "Los Arcos - Logroño", dist: "28.0", up: "+220m", coords: [42.4627, -2.4450], tips: "Etapa larga, poca sombra." },
  { id: 8, name: "Logroño - Nájera", dist: "29.0", up: "+380m", coords: [42.4162, -2.7303], tips: "Cuidado con calor en arcillas." },
  { id: 9, name: "Nájera - Sto. Domingo", dist: "21.0", up: "+280m", coords: [42.4411, -2.9535], tips: "Visita Catedral del Gallo." },
  { id: 10, name: "Sto. Domingo - Belorado", dist: "22.0", up: "+160m", coords: [42.4194, -3.1904], tips: "Pistas agrícolas cómodas." },
  { id: 11, name: "Belorado - Agés", dist: "27.0", up: "+420m", coords: [42.3664, -3.4503], tips: "Montes de Oca: Zona boscosa." },
  { id: 12, name: "Agés - Burgos", dist: "23.0", up: "+100m", coords: [42.3440, -3.6969], tips: "Paso por Atapuerca." },
  { id: 13, name: "Burgos - Hontanas", dist: "31.1", up: "+350m", coords: [42.3120, -4.0450], tips: "Inicio de la Meseta castellana." },
  { id: 14, name: "Hontanas - Frómista", dist: "34.5", up: "+120m", coords: [42.2668, -4.4061], tips: "Cruce San Antón y Canal." },
  { id: 15, name: "Frómista - Carrión", dist: "19.3", up: "+50m", coords: [42.3389, -4.6067], tips: "Pista de sirga muy llana." },
  { id: 16, name: "Carrión - Terradillos", dist: "26.3", up: "+150m", coords: [42.3610, -4.9248], tips: "Despoblado de 17km. Agua vital." },
  { id: 17, name: "Terradillos - Sahagún", dist: "13.9", up: "+40m", coords: [42.3719, -5.0315], tips: "Centro geográfico del Camino." },
  { id: 18, name: "Sahagún - B. Ranero", dist: "18.0", up: "+30m", coords: [42.4230, -5.2215], tips: "Andadero arbolado infinito." },
  { id: 19, name: "B. Ranero - León", dist: "37.1", up: "+150m", coords: [42.5987, -5.5671], tips: "Dureza por kilometraje." },
  { id: 20, name: "León - San Martín", dist: "25.9", up: "+60m", coords: [42.5200, -5.8100], tips: "Salida urbana de León." },
  { id: 21, name: "San Martín - Astorga", dist: "24.2", up: "+120m", coords: [42.4544, -6.0560], tips: "Puente Paso Honroso." },
  { id: 22, name: "Astorga - Foncebadón", dist: "25.8", up: "+650m", coords: [42.4385, -6.3450], tips: "Ascenso a Montes de León." },
  { id: 23, name: "Foncebadón - Ponferrada", dist: "26.8", up: "+150m", coords: [42.5455, -6.5936], tips: "Hito Cruz de Ferro." },
  { id: 24, name: "Ponferrada - Villafranca", dist: "24.2", up: "+180m", coords: [42.6074, -6.8115], tips: "Entrada al Bierzo." },
  { id: 25, name: "Villafranca - O Cebreiro", dist: "27.8", up: "+1100m", coords: [42.7077, -7.0423], tips: "Muralla de Galicia. Muy duro." },
  { id: 26, name: "O Cebreiro - Triacastela", dist: "20.8", up: "+150m", coords: [42.7565, -7.2403], tips: "Descenso hacia el valle." },
  { id: 27, name: "Triacastela - Sarria", dist: "18.4", up: "+250m", coords: [42.7770, -7.4160], tips: "Ruta por Monasterio Samos." },
  { id: 28, name: "Sarria - Portomarín", dist: "22.2", up: "+350m", coords: [42.8075, -7.6160], tips: "Hito del KM 100." },
  { id: 29, name: "Portomarín - Palas Rei", dist: "24.8", up: "+450m", coords: [42.8732, -7.8687], tips: "Galicia rural y verde." },
  { id: 30, name: "Palas Rei - Arzúa", dist: "28.5", up: "+400m", coords: [42.9265, -8.1634], tips: "Etapa de sube y baja." },
  { id: 31, name: "Arzúa - O Pedrouzo", dist: "19.3", up: "+180m", coords: [42.9100, -8.3600], tips: "Bosques de eucaliptos." },
  { id: 32, name: "O Pedrouzo - Santiago", dist: "19.4", up: "+280m", coords: [42.8870, -8.5100], tips: "Monte do Gozo: Meta a la vista." },
  { id: 33, name: "Santiago", dist: "META", up: "0", coords: [42.8806, -8.5464], tips: "Catedral: Operación completada." }
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
  const lastAcc = useRef({ x: 0, y: 0, z: 0 });

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
      const delta = Math.abs(acc.x + acc.y + acc.z - lastAcc.current.x - lastAcc.current.y - lastAcc.current.z);
      if (delta > 14) setSteps(s => s + 1);
      lastAcc.current = { x: acc.x, y: acc.y, z: acc.z };
    };
    
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  const calculateDistance = () => {
    if (!userPos) return "--";
    const rad = (x) => x * Math.PI / 180;
    const R = 6371;
    const dLat = rad(activeStage.coords[0] - userPos[0]);
    const dLong = rad(activeStage.coords[1] - userPos[1]);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rad(userPos[0])) * Math.cos(rad(activeStage.coords[0])) * Math.sin(dLong/2) * Math.sin(dLong/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const sendEmergencyWhatsApp = () => {
    if (!userPos) return alert("Buscando señal GPS...");
    const msg = `🚨 EMERGENCIA CAMINO: Necesito ayuda. Mi ubicación: https://www.google.com/maps?q=${userPos[0]},${userPos[1]}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
      <header className="h-16 bg-black border-b-2 border-yellow-500 flex items-center justify-between px-4 z-[3000]">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" size={24} fill="currentColor" />
          <div>
            <h1 className="text-yellow-500 font-black text-xs m-0 uppercase italic">Tactical Santiago v15.0</h1>
            <p className="text-[8px] text-white/40 m-0 font-bold uppercase tracking-widest">Full Operational Status</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-red-600/10 px-3 py-1 border border-red-600/30 rounded">
          <Activity size={12} className="text-red-600 animate-pulse" />
          <span className="text-red-600 text-[9px] font-black uppercase">GPS Live Feed</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="sidebar-tactical">
          <div className="pedometer-dashboard">
            <div className="flex items-center gap-3">
              <Footprints className="text-yellow-500" size={24} />
              <div className="flex flex-col">
                <span className="text-[8px] text-white/40 font-black uppercase">Pedometer Sensor</span>
                <span className="text-lg font-black text-white leading-none">{steps.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-8 w-1 bg-yellow-500/20 rounded"></div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-white/40 font-black uppercase">Total Est.</span>
              <span className="text-xs font-black text-white">{(steps * 0.0007).toFixed(2)} KM</span>
            </div>
          </div>

          <div className="p-2 bg-yellow-500 text-black text-[9px] font-black uppercase text-center flex items-center justify-center gap-2">
            <MapIcon size={12} /> 33 Objetivos de Etapa
          </div>

          <div className="stage-list-container">
            {STAGES.map((s) => (
              <div key={s.id} onClick={() => setActiveStage(s)} className
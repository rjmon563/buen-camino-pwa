import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Map as MapIcon, BookOpen, Stamp, Navigation, ChevronRight, 
  CheckCircle2, Crosshair, CloudRain, ShieldAlert, 
  TrendingUp, MessageCircle, Footprints, WifiOff, Calendar, Sun
} from 'lucide-react';

// --- CONFIGURACIÓN DE ICONOS ---
const createCustomIcon = (color) => new L.DivIcon({
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker-icon', iconSize: [14, 14], iconAnchor: [7, 7]
});

const userIcon = new L.DivIcon({
  html: `<div class="gps-pulse"></div><style>
    .gps-pulse { width: 18px; height: 18px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8); animation: pulse-gps 2s infinite; }
    @keyframes pulse-gps { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
  </style>`,
  className: 'user-icon', iconSize: [18, 18], iconAnchor: [9, 9]
});

// --- BASE DE DATOS COMPLETA CON DESNIVELES ---
const stages = [
  { id: 1, name: "SJ Pied de Port - Roncesvalles", coords: [43.1635, -1.2358], dist: "24.2 km", up: "+1250m", down: "-450m", temp: "14°C" },
  { id: 2, name: "Roncesvalles - Zubiri", coords: [42.9886, -1.3201], dist: "21.4 km", up: "+250m", down: "-800m", temp: "16°C" },
  { id: 3, name: "Zubiri - Pamplona", coords: [42.8125, -1.6458], dist: "20.4 km", up: "+350m", down: "-400m", temp: "19°C" },
  { id: 4, name: "Pamplona - Puente la Reina", coords: [42.6719, -1.8136], dist: "23.9 km", up: "+450m", down: "-500m", temp: "21°C" },
  { id: 5, name: "Puente la Reina - Estella", coords: [42.6711, -2.0311], dist: "21.6 km", up: "+300m", down: "-250m", temp: "22°C" },
  { id: 6, name: "Estella - Los Arcos", coords: [42.5667, -2.1917], dist: "21.3 km", up: "+250m", down: "-300m", temp: "23°C" },
  { id: 7, name: "Los Arcos - Logroño", coords: [42.4667, -2.4500], dist: "27.6 km", up: "+200m", down: "-250m", temp: "24°C" },
  { id: 8, name: "Logroño - Nájera", coords: [42.4167, -2.7333], dist: "29.0 km", up: "+350m", down: "-200m", temp: "22°C" },
  { id: 9, name: "Nájera - Sto. Domingo", coords: [42.4414, -2.9531], dist: "21.0 km", up: "+250m", down: "-150m", temp: "20°C" },
  { id: 10, name: "Sto. Domingo - Belorado", coords: [42.4201, -3.1903], dist: "22.0 km", up: "+150m", down: "-100m", temp: "19°C" },
  { id: 11, name: "Belorado - Agés", coords: [42.3744, -3.4511], dist: "27.4 km", up: "+400m", down: "-150m", temp: "18°C" },
  { id: 12, name: "Agés - Burgos", coords: [42.3439, -3.6969], dist: "23.0 km", up: "+100m", down: "-250m", temp: "17°C" },
  { id: 13, name: "Burgos - Hontanas", coords: [42.3122, -3.9458], dist: "31.1 km", up: "+150m", down: "-150m", temp: "22°C" },
  { id: 14, name: "Hontanas - Frómista", coords: [42.2667, -4.4061], dist: "34.5 km", up: "+100m", down: "-150m", temp: "25°C" },
  { id: 15, name: "Frómista - Carrión", coords: [42.3389, -4.6031], dist: "18.8 km", up: "+50m", down: "-50m", temp: "26°C" },
  { id: 16, name: "Carrión - Terradillos", coords: [42.3644, -4.9211], dist: "26.3 km", up: "+100m", down: "-50m", temp: "24°C" },
  { id: 17, name: "Terradillos - Sahagún", coords: [42.3714, -5.0311], dist: "13.9 km", up: "+50m", down: "-100m", temp: "23°C" },
  { id: 18, name: "Sahagún - Burgo Ranero", coords: [42.4222, -5.2211], dist: "17.6 km", up: "+50m", down: "-50m", temp: "22°C" },
  { id: 19, name: "Burgo Ranero - Mansilla", coords: [42.5000, -5.4167], dist: "18.8 km", up: "+50m", down: "-100m", temp: "21°C" },
  { id: 20, name: "Mansilla - León", coords: [42.5989, -5.5669], dist: "18.5 km", up: "+100m", down: "-100m", temp: "20°C" },
  { id: 21, name: "León - San Martín", coords: [42.5611, -5.8111], dist: "24.6 km", up: "+100m", down: "-100m", temp: "19°C" },
  { id: 22, name: "San Martín - Astorga", coords: [42.4589, -6.0561], dist: "23.7 km", up: "+200m", down: "-150m", temp: "18°C" },
  { id: 23, name: "Astorga - Foncebadón", coords: [42.4439, -6.3411], dist: "25.8 km", up: "+600m", down: "-100m", temp: "15°C" },
  { id: 24, name: "Foncebadón - Ponferrada", coords: [42.5467, -6.5961], dist: "26.8 km", up: "+150m", down: "-950m", temp: "18°C" },
  { id: 25, name: "Ponferrada - Villafranca", coords: [42.6072, -6.8111], dist: "24.2 km", up: "+200m", down: "-150m", temp: "20°C" },
  { id: 26, name: "Villafranca - O Cebreiro", coords: [42.7011, -7.0411], dist: "27.8 km", up: "+1000m", down: "-150m", temp: "12°C" },
  { id: 27, name: "O Cebreiro - Triacastela", coords: [42.7567, -7.2411], dist: "20.8 km", up: "+150m", down: "-750m", temp: "14°C" },
  { id: 28, name: "Triacastela - Sarria", coords: [42.7769, -7.4167], dist: "18.4 km", up: "+300m", down: "-450m", temp: "16°C" },
  { id: 29, name: "Sarria - Portomarín", coords: [42.8075, -7.6161], dist: "22.2 km", up: "+350m", down: "-400m", temp: "17°C" },
  { id: 30, name: "Portomarín - Palas de Rei", coords: [42.8733, -7.8686], dist: "24.8 km", up: "+450m", down: "-350m", temp: "18°C" },
  { id: 31, name: "Palas de Rei - Arzúa", coords: [42.9269, -8.1639], dist: "28.5 km", up: "+400m", down: "-500m", temp: "19°C" },
  { id: 32, name: "Arzúa - O Pedrouzo", coords: [42.9111, -8.3611], dist: "19.3 km", up: "+150m", down: "-200m", temp: "18°C" },
  { id: 33, name: "O Pedrouzo - Santiago", coords: [42.8806, -8.5444], dist: "19.4 km", up: "+150m", down: "-200m", temp: "17°C" },
  { id: 34, name: "Santiago de Compostela", coords: [42.8806, -8.5464], dist: "Meta", up: "0m", down: "0m", temp: "16°C" }
];

function MapController({ center, userPos, isTracking }) {
  const map = useMap();
  useEffect(() => {
    if (isTracking && userPos) map.flyTo(userPos, 16, { animate: true });
    else if (center) map.flyTo(center, 14, { animate: true });
  }, [center, userPos, isTracking, map]);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('mapa');
  const [currentStage, setCurrentStage] = useState(stages[0]);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [stamps, setStamps] = useState(() => JSON.parse(localStorage.getItem('caminostamps') || '[]'));
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    localStorage.setItem('caminostamps', JSON.stringify(stamps));
  }, [stamps]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let lastAccel = 0;
    const handleMotion = (e) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;
      const total = Math.sqrt(accel.x**2 + accel.y**2 + accel.z**2);
      if (total > 12 && (Date.now() - lastAccel > 300)) {
        setSteps(prev => prev + 1);
        lastAccel = Date.now();
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const sendWhatsApp = () => {
    const msg = `SOS: Estoy en el Camino de Santiago. Mi ubicación: https://www.google.com/maps?q=${userPos ? userPos[0]+','+userPos[1] : currentStage.coords[0]+','+currentStage.coords[1]}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* HEADER INTEGRADO */}
      <header className="bg-blue-800 text-white p-4 shadow-lg z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Navigation className="text-yellow-400 rotate-45" size={28} />
          <div>
            <h1 className="text-lg font-black leading-none tracking-tight flex items-center gap-2">
              BUEN CAMINO {isOffline && <WifiOff size={14} className="text-red-400 animate-pulse" />}
            </h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase mt-1 italic">
              Etapa {currentStage.id} • {steps} PASOS
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-blue-900/50 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-700">
                <CloudRain size={14} className="text-blue-300" /> {currentStage.temp}
            </div>
            <button onClick={() => window.location.href="tel:112"} className="bg-red-500 px-3 py-1 rounded-xl shadow-md font-black text-xs active:scale-95 transition-transform flex items-center gap-1 uppercase">
                <ShieldAlert size={18} /> SOS
            </button>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        
        {/* NAV LATERAL */}
        <nav className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-40 shadow-xl">
          <button onClick={() => setActiveTab('mapa')} className={`p-3 rounded-2xl transition-all ${activeTab === 'mapa' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><MapIcon size={24} /></button>
          <button onClick={() => setActiveTab('guia')} className={`p-3 rounded-2xl transition-all ${activeTab === 'guia' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><TrendingUp size={24} /></button>
          <button onClick={() => setActiveTab('sellos')} className={`p-3 rounded-2xl transition-all ${activeTab === 'sellos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><Stamp size={24} /></button>
          <button onClick={sendWhatsApp} className="mt-auto p-3 bg-green-500 rounded-2xl text-white shadow-lg active:scale-90 transition-all"><MessageCircle size={24} /></button>
        </nav>

        <div className="flex-1 relative">
          
          {activeTab === 'mapa' && (
            <>
              {/* SELECTOR DE ETAPAS */}
              <div className="absolute top-4 left-4 right-4 z-[1000] max-w-sm mx-auto">
                <select 
                  className="w-full p-4 bg-white/95 backdrop-blur shadow-2xl rounded-2xl border-2 border-blue-50 text-slate-700 font-bold text-sm outline-none"
                  value={currentStage.id}
                  onChange={(e) => {
                    setCurrentStage(stages.find(s => s.id === parseInt(e.target.value)));
                    setIsTracking(false);
                  }}
                >
                  {stages.map(s => <option key={s.id} value={s.id}>Etapa {s.id}: {s.name}</option>)}
                </select>
              </div>

              {/* BOTÓN FRANCOTIRADOR */}
              <button 
                onClick={() => setIsTracking(!isTracking)}
                className={`absolute bottom-10 right-6 z-[1000] p-5 rounded-full shadow-2xl transition-all ${isTracking ? 'bg-blue-600 text-white animate-pulse border-white border-2' : 'bg-white text-slate-400'}`}
              >
                <Crosshair size={30} />
              </button>

              <MapContainer center={currentStage.coords} zoom={13} className="h-full w-full" zoomControl={false}>
                <ZoomControl position="topright" />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={stages.map(s => s.coords)} color="#2563eb" weight={5} opacity={0.4} />
                {stages.map((s) => (
                  <Marker key={s.id} position={s.coords} icon={createCustomIcon(s.id === currentStage.id ? '#f59e0b' : '#3b82f6')} />
                ))}
                {userPos && <Marker position={userPos} icon={userIcon} />}
                <MapController center={currentStage.coords} userPos={userPos} isTracking={isTracking} />
              </MapContainer>
            </>
          )}

          {activeTab === 'guia' && (
            <div className="h-full overflow-y-auto p-6 bg-slate-50 pb-24">
              <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="text-blue-600" /> Perfil Técnico
              </h2>
              <div className="grid gap-4">
                {stages.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setCurrentStage(s); setActiveTab('mapa'); setIsTracking(false); }}
                    className={`p-5 rounded-3xl bg-white border-2 transition-all flex items-center justify-between ${s.id === currentStage.id ? 'border-blue-500 shadow-md' : 'border-transparent shadow-sm'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${s.id === currentStage.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s.id}</div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{s.name}</p>
                        <div className="flex gap-3 mt-1">
                            <span className="text-[10px] font-black text-blue-500 uppercase">{s.dist}</span>
                            <span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1">{s.up} ↑</span>
                            <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">{s.down} ↓</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sellos' && (
            <div className="h-full overflow-y-auto p-8 bg-white text-center">
              <div className="bg-blue-50 rounded-[40px] p-10 border-2 border-dashed border-blue-200 mb-8 shadow-inner">
                <Stamp size={60} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-2xl font-black text-slate-800 mb-2">Credencial Digital</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8 italic">Funciona Offline</p>
                <button 
                  onClick={() => !stamps.includes(currentStage.id) && setStamps([...stamps, currentStage.id])}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all uppercase text-sm"
                >
                  Sellar Etapa {currentStage.id}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {stages.map(s => (
                  <div key={s.id} className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all border-2 ${stamps.includes(s.id) ? 'bg-yellow-400 border-yellow-500 text-blue-900 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                    {stamps.includes(s.id) ? <CheckCircle2 size={24} /> : s.id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
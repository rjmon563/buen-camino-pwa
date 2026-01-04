import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { 
  ShieldAlert, Map as MapIcon, TrendingUp, Navigation, 
  ListFilter, MessageCircle, Phone, Heart, Crosshair, BookOpen, Sun, 
  Lightbulb, Award, Info, CloudRain, Camera, ChevronRight, Compass, AlertTriangle
} from 'lucide-react';
import L from 'leaflet';

// --- FIX DE ICONOS PARA VERCEL ---
const createCustomIcon = (color) => new L.DivIcon({
  html: `<div style="background: ${color}; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// --- ESTILOS GLOBALES INYECTADOS ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    :root { --sat: env(safe-area-inset-top); --sab: env(safe-area-inset-bottom); }
    body, html, #root { 
      margin: 0; padding: 0; width: 100%; height: 100%; 
      overflow: hidden; position: fixed; font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
    }
    .leaflet-container { width: 100% !important; height: 100% !important; background: #e5e7eb !important; }
    .glass { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes pulse-red { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); } 100% { transform: scale(1); } }
    .animate-sos { animation: pulse-red 2s infinite; }
    .pulse-user { width: 22px; height: 22px; background: #3b82f6; border: 4px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
  `}</style>
);

const MapController = ({ userPos, isTracking, center }) => {
  const map = useMap();
  useEffect(() => {
    if (userPos && isTracking) {
      map.flyTo(userPos, map.getZoom(), { animate: true });
    } else if (center && !isTracking) {
      map.setView(center, map.getZoom());
    }
  }, [userPos, isTracking, center, map]);
  return null;
};

const App = () => {
  const [view, setView] = useState('map');
  const [selectedEtapa, setSelectedEtapa] = useState(1);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  
  const [stamps, setStamps] = useState(() => JSON.parse(localStorage.getItem('camino_stamps_v3') || '[]'));
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('camino_notes_v3') || '{}'));

  const etapas = useMemo(() => [
    { id: 1, n: "SJ Pied de Port - Roncesvalles", dist: "24.2 km", coords: [43.1635, -1.2358], c: "Cruce de Pirineos." },
    { id: 2, n: "Roncesvalles - Zubiri", dist: "21.4 km", coords: [43.0092, -1.3194], c: "Bajada técnica de Erro." },
    { id: 3, n: "Zubiri - Pamplona", dist: "20.4 km", coords: [42.9311, -1.5052], c: "Entrada por el puente Magdalena." },
    { id: 4, n: "Pamplona - Puente la Reina", dist: "23.9 km", coords: [42.8169, -1.6432], c: "Vistas del Alto del Perdón." },
    { id: 5, n: "Puente la Reina - Estella", dist: "21.6 km", coords: [42.6742, -1.7745], c: "Puente románico famoso." },
    { id: 6, n: "Estella - Los Arcos", dist: "21.3 km", coords: [42.6711, -2.0303], c: "Fuente del vino en Irache." },
    { id: 7, n: "Los Arcos - Logroño", dist: "27.6 km", coords: [42.5684, -2.1895], c: "Entrada a La Rioja." },
    { id: 8, n: "Logroño - Nájera", dist: "29.0 km", coords: [42.4650, -2.4450], c: "Panteón Real de Nájera." },
    { id: 9, n: "Nájera - Sto. Domingo", dist: "20.7 km", coords: [42.4164, -2.7330], c: "El milagro del gallo." },
    { id: 10, n: "Sto. Domingo - Belorado", dist: "22.0 km", coords: [42.4406, -2.9531], c: "Caminos de Castilla." },
    { id: 11, n: "Belorado - Agés", dist: "27.2 km", coords: [42.4194, -3.1906], c: "Montes de Oca." },
    { id: 12, n: "Agés - Burgos", dist: "22.5 km", coords: [42.3739, -3.5042], c: "Llegada a la Catedral." },
    { id: 13, n: "Burgos - Hornillos", dist: "21.4 km", coords: [42.3439, -3.6969], c: "Inmensidad de la Meseta." },
    { id: 14, n: "Hornillos - Castrojeriz", dist: "20.1 km", coords: [42.3667, -3.9281], c: "Ruinas de San Antón." },
    { id: 15, n: "Castrojeriz - Frómista", dist: "25.2 km", coords: [42.2892, -4.1389], c: "Subida a Mostelares." },
    { id: 16, n: "Frómista - Carrión", dist: "19.3 km", coords: [42.3386, -4.6042], c: "Canal de Castilla." },
    { id: 17, n: "Carrión - Terradillos", dist: "26.6 km", coords: [42.3553, -4.9228], c: "Etapa de introspección." },
    { id: 18, n: "Terradillos - Sahagún", dist: "13.9 km", coords: [42.3719, -5.0311], c: "Centro geográfico." },
    { id: 19, n: "Sahagún - El Burgo Ranero", dist: "17.6 km", coords: [42.4239, -5.2217], c: "Caminos de chopos." },
    { id: 20, n: "El Burgo Ranero - Mansilla", dist: "18.8 km", coords: [42.4983, -5.4150], c: "Vía Trajana." },
    { id: 21, n: "Mansilla - León", dist: "18.1 km", coords: [42.5989, -5.5669], c: "Vidrieras de la Catedral." },
    { id: 22, n: "León - San Martín del C.", dist: "24.6 km", coords: [42.4936, -5.8058], c: "Hospital de Órbigo." },
    { id: 23, n: "San Martín - Astorga", dist: "23.7 km", coords: [42.4589, -6.0561], c: "Murallas y chocolate." },
    { id: 24, n: "Astorga - Foncebadón", dist: "25.8 km", coords: [42.4914, -6.3442], c: "Cruz de Hierro." },
    { id: 25, n: "Foncebadón - Ponferrada", dist: "26.8 km", coords: [42.5461, -6.5911], c: "Bajada de El Acebo." },
    { id: 26, n: "Ponferrada - Villafranca", dist: "24.1 km", coords: [42.6067, -6.8111], c: "Corazón del Bierzo." },
    { id: 27, n: "Villafranca - O Cebreiro", dist: "27.8 km", coords: [42.7078, -7.0422], c: "Entrada a Galicia." },
    { id: 28, n: "O Cebreiro - Triacastela", dist: "20.8 km", coords: [42.7556, -7.2411], c: "Vistas espectaculares." },
    { id: 29, n: "Triacastela - Sarria", dist: "18.4 km", coords: [42.7761, -7.4111], c: "Monasterio de Samos opcional." },
    { id: 30, n: "Sarria - Portomarín", dist: "22.2 km", coords: [42.8075, -7.6167], c: "Hito de los 100 km." },
    { id: 31, n: "Portomarín - Palas de Rei", dist: "24.8 km", coords: [42.8733, -7.8681], c: "Interior de Lugo." },
    { id: 32, n: "Palas de Rei - Arzúa", dist: "28.5 km", coords: [42.9272, -8.1633], c: "Etapa de los quesos." },
    { id: 33, n: "Arzúa - O Pedrouzo", dist: "19.3 km", coords: [42.9125, -8.3614], c: "Cerca de la meta." },
    { id: 34, n: "O Pedrouzo - Santiago", dist: "20.0 km", coords: [42.8806, -8.5444], c: "¡LLEGADA A LA CATEDRAL!" }
  ], []);

  const etapaActual = useMemo(() => etapas.find(e => e.id === selectedEtapa) || etapas[0], [selectedEtapa, etapas]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (p) => setUserPos([p.coords.latitude, p.coords.longitude]),
      (e) => console.error(e),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const addStamp = (id) => {
    if (!stamps.includes(id)) {
      const newS = [...stamps, id];
      setStamps(newS);
      localStorage.setItem('camino_stamps_v3', JSON.stringify(newS));
    }
  };

  return (
    <div id="root">
      <GlobalStyles />
      
      {/* HEADER DINÁMICO */}
      <div className="absolute top-0 left-0 right-0 z-[5000] p-4 pt-[calc(1rem+var(--sat))] pointer-events-none flex justify-between items-start">
        <div className="glass p-3 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Navigation size={20}/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Distancia</p>
            <p className="text-lg font-black text-slate-800 leading-none">{etapaActual.dist}</p>
          </div>
        </div>
        
        <button onClick={() => setShowSelector(true)} className="glass p-3 rounded-2xl pointer-events-auto flex items-center gap-2 shadow-lg">
          <div className="text-right">
            <p className="text-[10px] font-bold text-blue-600 uppercase leading-none">Etapa {selectedEtapa}</p>
            <p className="font-bold text-slate-800 text-sm leading-none truncate max-w-[80px]">
              {etapaActual.n.split('-')[1] || etapaActual.n}
            </p>
          </div>
          <ListFilter size={18} className="text-slate-400" />
        </button>
      </div>

      <main className="w-full h-full relative">
        {view === 'map' ? (
          <div className="w-full h-full">
            <MapContainer center={etapaActual.coords} zoom={13} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <Polyline positions={etapas.map(e => e.coords)} color="#3b82f6" weight={5} opacity={0.3} />
              
              {etapas.map(e => (
                <Marker 
                  key={e.id} 
                  position={e.coords} 
                  icon={createCustomIcon(selectedEtapa === e.id ? '#3b82f6' : '#cbd5e1')} 
                  eventHandlers={{ click: () => setSelectedEtapa(e.id) }}
                />
              ))}

              {userPos && (
                <Marker position={userPos} icon={new L.DivIcon({ 
                  html: `<div class="pulse-user"></div>`, className: '' 
                })} />
              )}
              <MapController userPos={userPos} isTracking={isTracking} center={etapaActual.coords} />
            </MapContainer>

            {/* BOTONES SOS Y TRACKING */}
            <div className="absolute bottom-32 right-4 z-[4000] flex flex-col gap-3">
              <a href="tel:112" className="bg-red-600 text-white p-4 rounded-full shadow-2xl animate-sos">
                <ShieldAlert size={28}/>
              </a>
              <button 
                onClick={() => setIsTracking(!isTracking)} 
                className={`p-4 rounded-full shadow-2xl border-2 border-white transition-all ${isTracking ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}
              >
                <Crosshair size={28}/>
              </button>
            </div>
          </div>
        ) : view === 'awards' ? (
          <div className="w-full h-full overflow-y-auto pt-24 pb-36 px-6 bg-white hide-scrollbar">
            <h2 className="text-4xl font-black text-slate-800 mb-2">Credencial</h2>
            <p className="text-slate-400 mb-8 italic">Colecciona los sellos del Camino</p>
            <div className="grid grid-cols-3 gap-4">
              {etapas.map(e => (
                <button 
                  key={e.id} 
                  onClick={() => addStamp(e.id)} 
                  className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${stamps.includes(e.id) ? 'border-blue-500 bg-blue-50' : 'border-dashed border-slate-200 opacity-60'}`}
                >
                  {stamps.includes(e.id) ? (
                    <Heart size={30} className="text-red-500" fill="currentColor"/>
                  ) : (
                    <span className="text-xl font-black text-slate-300">{e.id}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full pt-24 pb-36 px-6 bg-slate-50 overflow-y-auto hide-scrollbar">
             <div className="bg-white p-6 rounded-[35px] shadow-sm mb-6 border border-slate-100">
               <h3 className="font-black text-2xl text-slate-800 mb-2">{etapaActual.n}</h3>
               <div className="bg-amber-50 p-4 rounded-2xl flex items-center gap-3">
                 <Lightbulb className="text-amber-500" size={20}/>
                 <p className="text-sm text-amber-900 font-medium italic">"{etapaActual.c}"</p>
               </div>
             </div>
             
             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
               <h4 className="font-bold text-slate-400 text-xs uppercase mb-4 flex items-center gap-2">
                 <BookOpen size={16}/> Mi Diario
               </h4>
               <textarea 
                value={notes[selectedEtapa] || ''}
                onChange={(e) => {
                  const newNotes = {...notes, [selectedEtapa]: e.target.value};
                  setNotes(newNotes);
                  localStorage.setItem('camino_notes_v3', JSON.stringify(newNotes));
                }}
                className="w-full h-48 p-2 text-slate-700 bg-transparent border-none focus:ring-0 text-lg" 
                placeholder="¿Cómo te sientes hoy?"
               />
               <button className="w-full mt-4 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                 <Camera size={20}/> Guardar Recuerdo
               </button>
             </div>
          </div>
        )}
      </main>

      {/* NAVEGACIÓN INFERIOR */}
      <nav className="absolute bottom-6 left-6 right-6 h-20 glass rounded-[35px] flex justify-around items-center z-[5000] shadow-2xl border border-white/50">
        <button onClick={() => setView('map')} className={`flex flex-col items-center gap-1 transition-all ${view === 'map' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <MapIcon size={28}/><span className="text-[10px] font-black uppercase">Mapa</span>
        </button>
        <button onClick={() => setView('info')} className={`flex flex-col items-center gap-1 transition-all ${view === 'info' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <Info size={28}/><span className="text-[10px] font-black uppercase">Guía</span>
        </button>
        <button onClick={() => setView('awards')} className={`flex flex-col items-center gap-1 transition-all ${view === 'awards' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
          <Award size={28}/><span className="text-[10px] font-black uppercase">Sellos</span>
        </button>
      </nav>

      {/* MODAL SELECTOR DE ETAPAS */}
      {showSelector && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end" onClick={() => setShowSelector(false)}>
          <div className="w-full bg-white rounded-t-[45px] p-6 max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-black text-slate-800 mb-6 px-2">Seleccionar Etapa</h3>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2 pb-10">
              {etapas.map(e => (
                <button 
                  key={e.id} 
                  onClick={() => { setSelectedEtapa(e.id); setShowSelector(false); setIsTracking(false); }} 
                  className={`w-full p-5 rounded-3xl flex justify-between items-center transition-all ${selectedEtapa === e.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <span className="font-black opacity-40">#{e.id}</span>
                    <span className="font-bold">{e.n}</span>
                  </div>
                  <ChevronRight size={18}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
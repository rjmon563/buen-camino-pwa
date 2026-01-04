import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { 
  ShieldAlert, Map as MapIcon, TrendingUp, Navigation, 
  ListFilter, MessageCircle, Phone, Heart, Crosshair, BookOpen, Sun, 
  Lightbulb, Award, Info, CloudRain, Camera, ChevronRight, Compass, AlertTriangle
} from 'lucide-react';
import L from 'leaflet';

// --- ESTILOS GLOBALES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    
    :root {
      --sat: env(safe-area-inset-top);
      --sab: env(safe-area-inset-bottom);
    }

    body { 
      font-family: 'Inter', sans-serif; 
      background-color: #f8fafc; 
      margin: 0; 
      padding: 0;
      overflow: hidden; 
      position: fixed;
      width: 100%;
      height: 100%;
      -webkit-tap-highlight-color: transparent;
    }

    .leaflet-container { height: 100%; width: 100%; z-index: 1; }
    
    .glass { 
      background: rgba(255, 255, 255, 0.85); 
      backdrop-filter: blur(12px); 
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3); 
    }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    @keyframes pulse-red { 
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 
      70% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); } 
      100% { transform: scale(1); } 
    }
    .animate-sos { animation: pulse-red 2s infinite; }
    
    .stamp-active { animation: stamp-effect 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes stamp-effect { 0% { transform: scale(3) rotate(-20deg); opacity: 0; } 100% { transform: scale(1) rotate(2deg); opacity: 1; } }
    
    .compass-transition { transition: transform 0.2s linear; }

    #root { height: 100%; width: 100%; overflow: hidden; }

    .pulse-user {
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
      animation: pulse-user-anim 2s infinite;
    }
    @keyframes pulse-user-anim {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
  `}</style>
);

// --- CONTROLADOR DE MAPA ---
const MapController = ({ userPos, isTracking }) => {
  const map = useMap();
  useEffect(() => {
    if (userPos && isTracking) {
      map.flyTo(userPos, map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [userPos, isTracking, map]);
  return null;
};

const App = () => {
  const [view, setView] = useState('map');
  const [selectedEtapa, setSelectedEtapa] = useState(1);
  const [userPos, setUserPos] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [heading, setHeading] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [isSecure] = useState(window.location.protocol === 'https:');
  
  // Persistencia de datos
  const [stamps, setStamps] = useState(() => JSON.parse(localStorage.getItem('camino_stamps_final') || '[]'));
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('camino_notes_final') || '{}'));

  // DATA: 34 ETAPAS COMPLETAS
  const etapas = useMemo(() => [
    { id: 1, n: "SJ Pied de Port - Roncesvalles", dist: "24.2 km", desnivel: "+1250m", diff: "Muy Alta", coords: [43.1635, -1.2358], c: "Cruce de Pirineos por la Ruta de Napoleón.", temp: "14°C", clima: "Nubes" },
    { id: 2, n: "Roncesvalles - Zubiri", dist: "21.4 km", desnivel: "-800m", diff: "Media", coords: [43.0092, -1.3194], c: "Bajada técnica de Erro y Mezkiritz.", temp: "18°C", clima: "Sol" },
    { id: 3, n: "Zubiri - Pamplona", dist: "20.4 km", desnivel: "+350m", diff: "Baja", coords: [42.9311, -1.5052], c: "Entrada por el puente de la Magdalena.", temp: "21°C", clima: "Sol" },
    { id: 4, n: "Pamplona - Puente la Reina", dist: "23.9 km", desnivel: "+450m", diff: "Media", coords: [42.8169, -1.6432], c: "Vistas desde el Alto del Perdón.", temp: "19°C", clima: "Viento" },
    { id: 5, n: "Puente la Reina - Estella", dist: "21.6 km", desnivel: "+400m", diff: "Media", coords: [42.6742, -1.7745], c: "Puente románico a la salida.", temp: "22°C", clima: "Sol" },
    { id: 6, n: "Estella - Los Arcos", dist: "21.3 km", desnivel: "+300m", diff: "Baja", coords: [42.6711, -2.0303], c: "Fuente del vino en Irache.", temp: "24°C", clima: "Sol" },
    { id: 7, n: "Los Arcos - Logroño", dist: "27.6 km", desnivel: "+200m", diff: "Media", coords: [42.5684, -2.1895], c: "Entrada a La Rioja.", temp: "23°C", clima: "Sol" },
    { id: 8, n: "Logroño - Nájera", dist: "29.0 km", desnivel: "+400m", diff: "Alta", coords: [42.4650, -2.4450], c: "Panteón Real de Nájera.", temp: "25°C", clima: "Sol" },
    { id: 9, n: "Nájera - Sto. Domingo", dist: "20.7 km", desnivel: "+300m", diff: "Baja", coords: [42.4164, -2.7330], c: "El milagro del gallo.", temp: "22°C", clima: "Nubes" },
    { id: 10, n: "Sto. Domingo - Belorado", dist: "22.0 km", desnivel: "+250m", diff: "Baja", coords: [42.4406, -2.9531], c: "Pistas largas castellanas.", temp: "20°C", clima: "Lluvia" },
    { id: 11, n: "Belorado - Agés", dist: "27.2 km", desnivel: "+500m", diff: "Alta", coords: [42.4194, -3.1906], c: "Montes de Oca.", temp: "16°C", clima: "Nubes" },
    { id: 12, n: "Agés - Burgos", dist: "22.5 km", desnivel: "+200m", diff: "Baja", coords: [42.3739, -3.5042], c: "La Catedral te espera.", temp: "18°C", clima: "Sol" },
    { id: 13, n: "Burgos - Hornillos", dist: "21.4 km", desnivel: "+250m", diff: "Media", coords: [42.3439, -3.6969], c: "Inmensidad de la Meseta.", temp: "26°C", clima: "Sol" },
    { id: 14, n: "Hornillos - Castrojeriz", dist: "20.1 km", desnivel: "+200m", diff: "Baja", coords: [42.3667, -3.9281], c: "Ruinas de San Antón.", temp: "28°C", clima: "Sol" },
    { id: 15, n: "Castrojeriz - Frómista", dist: "25.2 km", desnivel: "+350m", diff: "Media", coords: [42.2892, -4.1389], c: "Subida a Mostelares.", temp: "27°C", clima: "Sol" },
    { id: 16, n: "Frómista - Carrión", dist: "19.3 km", desnivel: "+100m", diff: "Baja", coords: [42.3386, -4.6042], c: "Canal de Castilla.", temp: "28°C", clima: "Sol" },
    { id: 17, n: "Carrión - Terradillos", dist: "26.6 km", desnivel: "+150m", diff: "Media", coords: [42.3553, -4.9228], c: "Etapa de introspección.", temp: "29°C", clima: "Sol" },
    { id: 18, n: "Terradillos - Sahagún", dist: "13.9 km", desnivel: "+50m", diff: "Baja", coords: [42.3719, -5.0311], c: "Centro geográfico.", temp: "27°C", clima: "Nubes" },
    { id: 19, n: "Sahagún - El Burgo Ranero", dist: "17.6 km", desnivel: "+100m", diff: "Baja", coords: [42.4239, -5.2217], c: "Caminos de chopos.", temp: "26°C", clima: "Sol" },
    { id: 20, n: "El Burgo Ranero - Mansilla", dist: "18.8 km", desnivel: "+50m", diff: "Baja", coords: [42.4983, -5.4150], c: "Vía Trajana.", temp: "25°C", clima: "Sol" },
    { id: 21, n: "Mansilla - León", dist: "18.1 km", desnivel: "+100m", diff: "Baja", coords: [42.5989, -5.5669], c: "Las vidrieras de la Catedral.", temp: "22°C", clima: "Nubes" },
    { id: 22, n: "León - San Martín del C.", dist: "24.6 km", desnivel: "+150m", diff: "Baja", coords: [42.4936, -5.8058], c: "Hospital de Órbigo.", temp: "24°C", clima: "Sol" },
    { id: 23, n: "San Martín - Astorga", dist: "23.7 km", desnivel: "+250m", diff: "Media", coords: [42.4589, -6.0561], c: "Murallas y chocolate.", temp: "23°C", clima: "Sol" },
    { id: 24, n: "Astorga - Foncebadón", dist: "25.8 km", desnivel: "+600m", diff: "Alta", coords: [42.4914, -6.3442], c: "Subida a la Cruz de Hierro.", temp: "15°C", clima: "Nubes" },
    { id: 25, n: "Foncebadón - Ponferrada", dist: "26.8 km", desnivel: "-1000m", diff: "Media", coords: [42.5461, -6.5911], c: "Bajada de El Acebo.", temp: "19°C", clima: "Sol" },
    { id: 26, n: "Ponferrada - Villafranca", dist: "24.1 km", desnivel: "+250m", diff: "Baja", coords: [42.6067, -6.8111], c: "El Bierzo.", temp: "22°C", clima: "Nubes" },
    { id: 27, n: "Villafranca - O Cebreiro", dist: "27.8 km", desnivel: "+1100m", diff: "Muy Alta", coords: [42.7078, -7.0422], c: "Entrada mágica a Galicia.", temp: "12°C", clima: "Niebla" },
    { id: 28, n: "O Cebreiro - Triacastela", dist: "20.8 km", desnivel: "-600m", diff: "Media", coords: [42.7556, -7.2411], c: "Vistas de los valles gallegos.", temp: "14°C", clima: "Lluvia" },
    { id: 29, n: "Triacastela - Sarria", dist: "18.4 km", desnivel: "+300m", diff: "Baja", coords: [42.7761, -7.4111], c: "Bosques de castaños.", temp: "16°C", clima: "Nubes" },
    { id: 30, n: "Sarria - Portomarín", dist: "22.2 km", desnivel: "+450m", diff: "Media", coords: [42.8075, -7.6167], c: "Hito de los 100 km.", temp: "17°C", clima: "Sol" },
    { id: 31, n: "Portomarín - Palas de Rei", dist: "24.8 km", desnivel: "+400m", diff: "Media", coords: [42.8733, -7.8681], c: "Tierras del interior.", temp: "18°C", clima: "Nubes" },
    { id: 32, n: "Palas de Rei - Arzúa", dist: "28.5 km", desnivel: "+350m", diff: "Media", coords: [42.9272, -8.1633], c: "Etapa de los quesos.", temp: "17°C", clima: "Sol" },
    { id: 33, n: "Arzúa - O Pedrouzo", dist: "19.3 km", desnivel: "+150m", diff: "Baja", coords: [42.9125, -8.3614], c: "Último descanso antes de la meta.", temp: "19°C", clima: "Sol" },
    { id: 34, n: "O Pedrouzo - Santiago", dist: "20.0 km", desnivel: "+150m", diff: "Baja", coords: [42.8806, -8.5444], c: "¡LLEGADA A LA CATEDRAL!", temp: "16°C", clima: "Sol" }
  ], []);

  const etapaActual = useMemo(() => etapas.find(e => e.id === selectedEtapa) || etapas[0], [selectedEtapa, etapas]);

  // GPS y Orientación
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => setUserPos([p.coords.latitude, p.coords.longitude]),
      (err) => console.log("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    const handleOrientation = (e) => {
      let h = e.webkitCompassHeading || (360 - e.alpha) || 0;
      setHeading(h);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const addStamp = (id) => {
    if (!stamps.includes(id)) {
      const newS = [...stamps, id];
      setStamps(newS);
      localStorage.setItem('camino_stamps_final', JSON.stringify(newS));
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden">
      <GlobalStyles />
      
      {!isSecure && (
        <div className="absolute top-[var(--sat)] left-0 right-0 z-[7000] bg-amber-500 text-white text-[10px] font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <AlertTriangle size={14} /> MODO TEST: EL GPS REQUIERE HTTPS PARA SER PRECISO
        </div>
      )}

      {/* HEADER DINÁMICO */}
      <div className="absolute top-0 left-0 right-0 z-[5000] p-6 pt-[calc(1.5rem+var(--sat))] pointer-events-none flex justify-between items-start">
        <div className="glass p-4 rounded-[28px] shadow-2xl pointer-events-auto flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200"><Navigation size={22}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Próxima Distancia</p>
            <p className="text-xl font-black text-slate-800 leading-none tracking-tighter">{etapaActual.dist}</p>
          </div>
        </div>
        
        <button onClick={() => setShowSelector(true)} className="glass px-6 py-4 rounded-[28px] shadow-2xl pointer-events-auto flex items-center gap-3 active:scale-95 transition-all">
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-600 uppercase">Etapa {selectedEtapa}</p>
            <p className="font-black text-slate-800 italic leading-none truncate max-w-[90px]">{etapaActual.n.split('-')[1] || etapaActual.n}</p>
          </div>
          <ListFilter size={20} className="text-slate-400" />
        </button>
      </div>

      <main className="flex-1 relative">
        {view === 'map' ? (
          <div className="w-full h-full">
            <MapContainer center={etapaActual.coords} zoom={13} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <Polyline positions={etapas.map(e => e.coords)} color="#3b82f6" weight={6} opacity={0.2} />
              
              {etapas.map(e => (
                <Marker key={e.id} position={e.coords} icon={new L.DivIcon({ 
                  html: `<div style="background: ${selectedEtapa === e.id ? '#3b82f6' : '#cbd5e1'}; width: 16px; height: 16px; border: 4px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.15);"></div>` 
                })} />
              ))}

              {userPos && (
                <Marker position={userPos} icon={new L.DivIcon({ 
                  html: `<div class="compass-transition" style="transform: rotate(${heading}deg);">
                           <div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 26px solid #3b82f6; filter: drop-shadow(0 0 8px rgba(59,130,246,0.6));"></div>
                           <div class="pulse-user" style="margin-top: -14px;"></div>
                         </div>` 
                })} />
              )}
              <MapController userPos={userPos} isTracking={isTracking} />
            </MapContainer>
            
            <div className="absolute bottom-44 right-6 z-[4000] flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <a href="tel:112" className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl animate-sos border-2 border-white/50 flex flex-col items-center"><ShieldAlert size={26} /><span className="text-[8px] font-black mt-1">112</span></a>
                <a href="tel:062" className="bg-emerald-800 text-white p-4 rounded-2xl shadow-2xl border-2 border-white/50 flex flex-col items-center"><Phone size={26} /><span className="text-[8px] font-black mt-1">062</span></a>
              </div>
              
              <a href={`https://wa.me/?text=¡Hola! Estoy en el Camino de Santiago. Ubicación: https://www.google.com/maps?q=${userPos ? userPos[0] : ''},${userPos ? userPos[1] : ''}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white p-5 rounded-full shadow-2xl border-4 border-white active:scale-90 flex items-center justify-center">
                <MessageCircle size={32} />
              </a>
              
              <div className="flex flex-col gap-3">
                <button onClick={() => setIsTracking(!isTracking)} className={`p-6 rounded-full shadow-2xl border-4 border-white transition-all ${isTracking ? 'bg-blue-600 text-white scale-110 shadow-blue-300' : 'bg-white text-slate-300'}`}><Crosshair size={30} /></button>
                <div className="bg-white/95 p-4 rounded-full shadow-xl border-2 border-slate-50 flex items-center justify-center">
                  <Compass size={26} className="text-slate-800 compass-transition" style={{ transform: `rotate(${-heading}deg)` }} />
                </div>
              </div>
            </div>
          </div>
        ) : view === 'info' ? (
          <div className="w-full h-full overflow-y-auto pt-40 pb-52 px-6 hide-scrollbar bg-slate-50">
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 mb-6">
              <h2 className="text-3xl font-black text-slate-800 leading-tight mb-8 tracking-tighter">{etapaActual.n}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><TrendingUp className="text-blue-500 mb-3" size={26}/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desnivel</p><p className="font-black text-slate-700 text-lg">{etapaActual.desnivel}</p></div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {etapaActual.clima === 'Sol' ? <Sun className="text-orange-500 mb-3" size={26}/> : <CloudRain className="text-blue-500 mb-3" size={26}/>}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clima</p><p className="font-black text-slate-700 text-lg">{etapaActual.temp}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex gap-6 mb-6 shadow-sm">
              <Lightbulb className="text-amber-500 shrink-0" size={28}/>
              <p className="text-base font-medium text-amber-900 italic leading-relaxed">"{etapaActual.c}"</p>
            </div>

            <div className="bg-white rounded-[50px] p-8 shadow-sm border border-slate-100">
              <h3 className="font-black text-xs uppercase text-slate-400 mb-6 flex items-center gap-3"><BookOpen size={24} className="text-blue-600"/> Mi Diario Personal</h3>
              <textarea 
                value={notes[selectedEtapa] || ''} 
                onChange={(e) => { 
                  const n = {...notes, [selectedEtapa]: e.target.value}; 
                  setNotes(n); 
                  localStorage.setItem('camino_notes_final', JSON.stringify(n)); 
                }} 
                className="w-full bg-slate-50 border-none rounded-[35px] p-8 text-base h-48 outline-none focus:ring-2 focus:ring-blue-100" 
                placeholder="Escribe algo inolvidable sobre esta etapa..."/>
              <button className="w-full mt-6 py-6 rounded-[30px] bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl"><Camera size={22} /> Capturar Momento</button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto pt-40 pb-52 px-8 hide-scrollbar bg-white">
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-3">Credencial</h2>
            <p className="text-slate-400 text-base mb-12 italic">Marca tus hitos y colecciona los sellos del Camino.</p>
            <div className="grid grid-cols-3 gap-6 pb-24">
              {etapas.map(e => (
                <button key={e.id} onClick={() => addStamp(e.id)} className={`aspect-square rounded-[40px] flex flex-col items-center justify-center border-4 transition-all ${stamps.includes(e.id) ? 'bg-white border-blue-500 shadow-2xl rotate-3 stamp-active' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}>
                  {stamps.includes(e.id) ? (
                    <><Heart size={38} className="text-red-500 mb-1" fill="currentColor"/><span className="text-[11px] font-black text-slate-800 tracking-tighter">ETAPA {e.id}</span></>
                  ) : (
                    <span className="text-slate-300 text-lg font-black">{e.id}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="absolute bottom-[calc(1.5rem+var(--sab))] left-8 right-8 h-24 glass rounded-[45px] shadow-2xl flex justify-around items-center z-[5000] border border-white/50">
        <button onClick={() => setView('map')} className={`flex flex-col items-center gap-1 transition-all ${view === 'map' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}><MapIcon size={32} /><span className="text-[10px] font-black uppercase tracking-tighter">Mapa</span></button>
        <button onClick={() => setView('info')} className={`flex flex-col items-center gap-1 transition-all ${view === 'info' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}><Info size={32} /><span className="text-[10px] font-black uppercase tracking-tighter">Guía</span></button>
        <button onClick={() => setView('awards')} className={`flex flex-col items-center gap-1 transition-all ${view === 'awards' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}><Award size={32} /><span className="text-[10px] font-black uppercase tracking-tighter">Sellos</span></button>
      </nav>

      {showSelector && (
        <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-end" onClick={() => setShowSelector(false)}>
          <div className="w-full bg-white rounded-t-[60px] p-10 max-h-[85vh] flex flex-col shadow-2xl pb-[calc(2rem+var(--sab))]" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
            <h3 className="text-3xl font-black mb-8 text-slate-800 tracking-tighter">Elegir Etapa</h3>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-10">
              {etapas.map(e => (
                <button key={e.id} onClick={() => { setSelectedEtapa(e.id); setShowSelector(false); setIsTracking(false); }} className={`w-full p-7 rounded-[40px] flex justify-between items-center transition-all ${selectedEtapa === e.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200' : 'bg-slate-50 text-slate-600'}`}>
                  <div className="text-left flex items-center gap-5">
                    <span className={`text-sm font-black ${selectedEtapa === e.id ? 'text-blue-200' : 'text-slate-300'}`}>#{e.id}</span>
                    <span className="font-bold text-base tracking-tight">{e.n}</span>
                  </div>
                  <ChevronRight size={20} className={selectedEtapa === e.id ? 'text-white' : 'text-slate-400'} />
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
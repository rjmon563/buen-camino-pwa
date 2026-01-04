import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, BookOpen, Stamp, Info, ChevronRight, Navigation } from 'lucide-react';

// --- CONFIGURACIÓN DE ICONOS ---
const createCustomIcon = (color) => new L.DivIcon({
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// --- DATOS DE LAS 34 ETAPAS (CAMINO FRANCÉS) ---
const stages = [
  { id: 1, name: "Saint-Jean-Pied-de-Port - Roncesvalles", coords: [43.1635, -1.2348], dist: "24.2 km" },
  { id: 2, name: "Roncesvalles - Zubiri", coords: [42.9886, -1.3201], dist: "21.4 km" },
  { id: 3, name: "Zubiri - Pamplona", coords: [42.8125, -1.6458], dist: "20.4 km" },
  { id: 4, name: "Pamplona - Puente la Reina", coords: [42.6719, -1.8136], dist: "23.9 km" },
  { id: 5, name: "Puente la Reina - Estella", coords: [42.6711, -2.0311], dist: "21.6 km" },
  { id: 6, name: "Estella - Los Arcos", coords: [42.5667, -2.1917], dist: "21.3 km" },
  { id: 7, name: "Los Arcos - Logroño", coords: [42.4667, -2.4500], dist: "27.6 km" },
  { id: 8, name: "Logroño - Nájera", coords: [42.4167, -2.7333], dist: "29.0 km" },
  { id: 9, name: "Nájera - Santo Domingo de la Calzada", coords: [42.4414, -2.9531], dist: "21.0 km" },
  { id: 10, name: "Sto. Domingo - Belorado", coords: [42.4201, -3.1903], dist: "22.0 km" },
  { id: 11, name: "Belorado - Agés", coords: [42.3744, -3.4511], dist: "27.4 km" },
  { id: 12, name: "Agés - Burgos", coords: [42.3439, -3.6969], dist: "23.0 km" },
  { id: 13, name: "Burgos - Hontanas", coords: [42.3122, -3.9458], dist: "31.1 km" },
  { id: 14, name: "Hontanas - Frómista", coords: [42.2667, -4.4061], dist: "34.5 km" },
  { id: 15, name: "Frómista - Carrión de los Condes", coords: [42.3389, -4.6031], dist: "18.8 km" },
  { id: 16, name: "Carrión de los Condes - Terradillos", coords: [42.3644, -4.9211], dist: "26.3 km" },
  { id: 17, name: "Terradillos - Sahagún", coords: [42.3714, -5.0311], dist: "13.9 km" },
  { id: 18, name: "Sahagún - El Burgo Ranero", coords: [42.4222, -5.2211], dist: "17.6 km" },
  { id: 19, name: "El Burgo Ranero - Mansilla de las Mulas", coords: [42.5000, -5.4167], dist: "18.8 km" },
  { id: 20, name: "Mansilla - León", coords: [42.5989, -5.5669], dist: "18.5 km" },
  { id: 21, name: "León - San Martín del Camino", coords: [42.5611, -5.8111], dist: "24.6 km" },
  { id: 22, name: "San Martín - Astorga", coords: [42.4589, -6.0561], dist: "23.7 km" },
  { id: 23, name: "Astorga - Foncebadón", coords: [42.4439, -6.3411], dist: "25.8 km" },
  { id: 24, name: "Foncebadón - Ponferrada", coords: [42.5467, -6.5961], dist: "26.8 km" },
  { id: 25, name: "Ponferrada - Villafranca del Bierzo", coords: [42.6072, -6.8111], dist: "24.2 km" },
  { id: 26, name: "Villafranca - O Cebreiro", coords: [42.7011, -7.0411], dist: "27.8 km" },
  { id: 27, name: "O Cebreiro - Triacastela", coords: [42.7567, -7.2411], dist: "20.8 km" },
  { id: 28, name: "Triacastela - Sarria", coords: [42.7769, -7.4167], dist: "18.4 km" },
  { id: 29, name: "Sarria - Portomarín", coords: [42.8075, -7.6161], dist: "22.2 km" },
  { id: 30, name: "Portomarín - Palas de Rei", coords: [42.8733, -7.8686], dist: "24.8 km" },
  { id: 31, name: "Palas de Rei - Arzúa", coords: [42.9269, -8.1639], dist: "28.5 km" },
  { id: 32, name: "Arzúa - O Pedrouzo", coords: [42.9111, -8.3611], dist: "19.3 km" },
  { id: 33, name: "O Pedrouzo - Santiago de Compostela", coords: [42.8806, -8.5444], dist: "19.4 km" },
  { id: 34, name: "Santiago de Compostela (Catedral)", coords: [42.8806, -8.5464], dist: "Meta" }
];

const polylineRoute = stages.map(s => s.coords);

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('mapa');
  const [currentStage, setCurrentStage] = useState(stages[0]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* CABECERA DINÁMICA - No tapa el mapa */}
      <header className="bg-blue-700 text-white p-4 shadow-lg z-20">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Navigation size={24} className="text-yellow-400" />
              Buen Camino PWA
            </h1>
            <p className="text-xs text-blue-100 opacity-80">Camino Francés • {currentStage.dist} a la meta</p>
          </div>
          <div className="bg-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-500">
            Etapa {currentStage.id}
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* BOTONES DE NAVEGACIÓN FLOTANTES (CORREGIDOS) */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('mapa')}
            className={`p-3 rounded-xl shadow-xl transition-all ${activeTab === 'mapa' ? 'bg-blue-600 text-white scale-110' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <MapIcon size={24} />
            <span className="text-[10px] block font-bold mt-1">MAPA</span>
          </button>
          <button 
            onClick={() => setActiveTab('guia')}
            className={`p-3 rounded-xl shadow-xl transition-all ${activeTab === 'guia' ? 'bg-blue-600 text-white scale-110' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <BookOpen size={24} />
            <span className="text-[10px] block font-bold mt-1">GUÍA</span>
          </button>
          <button 
            onClick={() => setActiveTab('sellos')}
            className={`p-3 rounded-xl shadow-xl transition-all ${activeTab === 'sellos' ? 'bg-blue-600 text-white scale-110' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Stamp size={24} />
            <span className="text-[10px] block font-bold mt-1">SELLOS</span>
          </button>
        </div>

        {/* CONTENIDO SEGÚN PESTAÑA */}
        {activeTab === 'mapa' && (
          <div className="h-full w-full">
            <MapContainer center={currentStage.coords} zoom={8} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={polylineRoute} color="#2563eb" weight={4} opacity={0.7} dashArray="10, 10" />
              {stages.map((stage) => (
                <Marker 
                  key={stage.id} 
                  position={stage.coords} 
                  icon={createCustomIcon(stage.id === currentStage.id ? '#f59e0b' : '#3b82f6')}
                  eventHandlers={{ click: () => setCurrentStage(stage) }}
                >
                  <Popup>
                    <div className="font-sans">
                      <strong className="text-blue-700">Etapa {stage.id}</strong><br/>
                      {stage.name}<br/>
                      <span className="text-slate-500 text-xs">{stage.dist}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <ChangeView center={currentStage.coords} />
            </MapContainer>

            {/* SELECTOR DE ETAPAS INFERIOR */}
            <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4">
              <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seleccionar Etapa</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{currentStage.id} / 34</span>
                </div>
                <select 
                  className="w-full p-3 bg-slate-100 rounded-xl border-none text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  value={currentStage.id}
                  onChange={(e) => setCurrentStage(stages.find(s => s.id === parseInt(e.target.value)))}
                >
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>Etapa {s.id}: {s.name.substring(0, 30)}...</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guia' && (
          <div className="h-full overflow-y-auto p-6 bg-white">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BookOpen className="text-blue-600" /> Guía de Etapas
            </h2>
            <div className="space-y-4">
              {stages.map(s => (
                <div 
                  key={s.id}
                  onClick={() => { setCurrentStage(s); setActiveTab('mapa'); }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${s.id === currentStage.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s.id === currentStage.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {s.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700">{s.name}</h3>
                      <p className="text-sm text-slate-500">{s.dist} de recorrido</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sellos' && (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-slate-50">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Stamp size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Credencial Digital</h2>
            <p className="text-slate-500 max-w-xs">Aquí podrás coleccionar los sellos de los albergues escaneando códigos QR.</p>
            <button className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-colors">
              Escanear Sello
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
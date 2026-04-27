/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Info, 
  History, 
  ShieldCheck, 
  Globe, 
  Wifi, 
  Phone, 
  MapPin, 
  Clock, 
  Network,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Fingerprint,
  Cpu,
  Share2,
  Activity,
  Terminal,
  ExternalLink,
  Target,
  Rss,
  Zap,
  Lock,
  UserSearch,
  BookOpen,
  Scale,
  Smartphone,
  Laptop,
  MoreVertical,
  WifiOff,
  Database,
  Camera,
  Video,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  analyzePhoneNumber, 
  searchSocialByQuery, 
  scanCurrentNetwork, 
  analyzeNfcTag, 
  searchPublicRecords,
  discoverNetworkDevices 
} from './services/intelligenceService';
import { PhoneIntelligence, SocialProfile, NetworkScan, NFCScan, PublicRecord, NetworkDevice, ViewState } from './types';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [inputQuery, setInputQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [dobQuery, setDobQuery] = useState('');
  const [stateQuery, setStateQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PhoneIntelligence | null>(null);
  const [socialResults, setSocialResults] = useState<SocialProfile[]>([]);
  const [networkData, setNetworkData] = useState<NetworkScan | null>(null);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [nfcData, setNfcData] = useState<NFCScan | null>(null);
  const [recordsData, setRecordsData] = useState<PublicRecord | null>(null);
  const [selectedCameraDevice, setSelectedCameraDevice] = useState<NetworkDevice | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PhoneIntelligence[]>([]);
  const [savedNfcTags, setSavedNfcTags] = useState<NFCScan[]>([]);
  const [broadcastingTag, setBroadcastingTag] = useState<string | null>(null);

  const saveNfcTag = (tag: NFCScan) => {
    if (!savedNfcTags.find(t => t.tagId === tag.tagId)) {
      setSavedNfcTags([...savedNfcTags, tag]);
    }
  };

  const broadcastNfcTag = (tagId: string) => {
    setBroadcastingTag(tagId);
    setTimeout(() => setBroadcastingTag(null), 3000);
  };

  const handlePhoneSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await analyzePhoneNumber(inputQuery);
      setReport(data);
      setHistory(prev => [data, ...prev].slice(0, 10));
      setView('report');
    } catch (err) {
      setError('Intelligence retrieval failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputQuery.trim()) return;
    setLoading(true);
    setView('social');
    setError(null);
    try {
      const results = await searchSocialByQuery(inputQuery);
      setSocialResults(results);
    } catch (err) {
      setError('Social crawler failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordsSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nameQuery.trim() || !dobQuery.trim()) return;
    setLoading(true);
    setView('records');
    setError(null);
    try {
      const data = await searchPublicRecords(nameQuery, dobQuery, stateQuery);
      setRecordsData(data);
    } catch (err) {
      setError('Public record retrieval failed.');
    } finally {
      setLoading(false);
    }
  };

  const startNetworkScan = async () => {
    setLoading(true);
    setView('network');
    setError(null);
    try {
      const [data, devices] = await Promise.all([
        scanCurrentNetwork(),
        discoverNetworkDevices()
      ]);
      setNetworkData(data);
      setNetworkDevices(devices);
    } catch (err) {
      setError('Scan interrupted.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceStatus = (mac: string) => {
    setNetworkDevices(prev => prev.map(dev => 
      dev.mac === mac ? { ...dev, status: dev.status === 'online' ? 'blocked' : 'online' } : dev
    ));
  };

  const startNfcScan = async () => {
    setLoading(true);
    setView('nfc');
    setNfcData(null);
    setError(null);

    // Check if running in a native environment with NFC support
    const isNative = (window as any).nfc !== undefined;

    if (isNative) {
      try {
        const nfc = (window as any).nfc;
        
        // On iOS, we need to begin the session
        if ((window as any).device?.platform === 'iOS') {
          nfc.beginSession(
            () => console.log('NFC session started'),
            (err: any) => setError(`NFC session failed: ${err}`)
          );
        }

        // Add a listener for the next tag
        nfc.addTagDiscoveredListener(
          async (nfcEvent: any) => {
            try {
              const tag = nfcEvent.tag;
              const tagId = nfc.bytesToHexString(tag.id);
              const data = await analyzeNfcTag(`Decoded Tag ID: ${tagId}`);
              setNfcData({ ...data, tagId });
              setLoading(false);
              // Remove listener after capture to prevent duplicate triggers
              nfc.removeTagDiscoveredListener();
            } catch (err) {
              setError("Failed to analyze detected tag.");
              setLoading(false);
            }
          },
          () => console.log("Listening for NFC tags..."),
          (err: any) => {
            setError(`NFC Hardware Error: ${err}`);
            setLoading(false);
          }
        );

        // Timeout fallback for native if no tag is tapped
        setTimeout(() => {
          if (loading && view === 'nfc' && !nfcData) {
            setError("Scan timed out. Ensure NFC is enabled and tag is close.");
            setLoading(false);
          }
        }, 15000);

      } catch (err) {
        setError('NFC initialization failed.');
        setLoading(false);
      }
    } else {
      // Browser Simulation
      try {
        await new Promise(resolve => setTimeout(resolve, 2500));
        const data = await analyzeNfcTag();
        setNfcData(data);
      } catch (err) {
        setError('Intelligence simulation failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const initiateCameraBreach = async (device: NetworkDevice) => {
    setLoading(true);
    setSelectedCameraDevice(device);
    setView('camera');
    setCameraActive(false);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setError("FIRMWARE LOCKOUT: Camera access denied or hardware not found.");
    } finally {
      setLoading(false);
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  function renderCameraBreach() {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase">Remote Visual Access</h2>
              <p className="text-xs text-slate-500 font-mono">Bypassing local firmware security protocols...</p>
           </div>
           <button 
             onClick={() => { stopCameraStream(); setView('network'); }}
             className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
           >
              <ChevronLeft size={16} /> BACK TO NETWORK
           </button>
        </div>

        <div className="grid grid-cols-12 gap-4 sm:gap-6">
           <div className="col-span-12 lg:col-span-8">
              <div className="bg-black aspect-video sm:aspect-video rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden relative group">
                 <div className="absolute inset-0 z-0">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      playsInline 
                      className={`w-full h-full object-cover grayscale opacity-60 scale-110 blur-[0.5px] transition-opacity duration-1000 ${cameraActive ? 'opacity-60' : 'opacity-0'}`}
                    />
                 </div>
                 {cameraActive ? (
                   <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-10"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#000_150%)] opacity-50 z-10"></div>
                      
                      {/* Scanlines Effect */}
                      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                         <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,160,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                      </div>

                      {/* HUD Overlays */}
                      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-pulse"></div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-widest">LIVE // REC</span>
                         </div>
                         <p className="text-[9px] sm:text-[10px] font-mono text-white/60 uppercase">{selectedCameraDevice?.hostname || 'Unknown Device'}</p>
                         <p className="text-[7px] sm:text-[8px] font-mono text-white/40 uppercase truncate max-w-[100px] sm:max-w-none">UID: {selectedCameraDevice?.mac || '00:00:00:00:00'}</p>
                      </div>

                      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 text-right">
                         <p className="text-[9px] sm:text-[10px] font-mono text-white/60">IP: {selectedCameraDevice?.ip || '0.0.0.0'}</p>
                         <p className="hidden sm:block text-[10px] font-mono text-white/60 tracking-wider">ISO 1600 // 1/60s</p>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-30 flex justify-between items-end">
                         <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                               <span className="text-[8px] font-mono text-white/40 uppercase">Signal Strength</span>
                               <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i <= 3 ? 'bg-green-500' : 'bg-white/10'}`}></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                               <Video size={16} />
                            </button>
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                               <Smartphone size={16} />
                            </button>
                         </div>
                      </div>

                      {/* Motion Detection Brackets */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/20 rounded-lg pointer-events-none z-20">
                         <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                         <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                         <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                         <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
                      </div>
                   </>
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0d]">
                      {loading ? (
                        <div className="text-center">
                           <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                           <p className="text-xs font-mono text-blue-500 uppercase animate-pulse">Establishing Tunnel...</p>
                        </div>
                      ) : (
                        <div className="text-center max-w-sm px-6">
                           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                              <EyeOff className="text-slate-600" size={32} />
                           </div>
                           <h3 className="text-white font-bold mb-2 uppercase">Camera Interface Locked</h3>
                           <p className="text-[10px] text-slate-500 font-mono mb-8 uppercase leading-relaxed">
                              Remote hardware requires session initialization. Select a target device from the network scanner to begin visual intercept.
                           </p>
                           <button 
                             onClick={() => setView('network')}
                             className="px-6 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-700 transition-all"
                           >
                              Browse Network
                           </button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           </div>

           <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="intelligence-panel">
                 <div className="panel-header">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Stream Metadata</h3>
                 </div>
                 <div className="p-6 space-y-4">
                    <div>
                       <label className="label-mono block mb-1">Target Identity</label>
                       <p className="text-sm text-white font-bold">{selectedCameraDevice?.hostname || 'PENDING SELECTION'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="label-mono block mb-1">Internal IP</label>
                          <p className="text-xs font-mono text-blue-400 uppercase">{selectedCameraDevice?.ip || 'N/A'}</p>
                       </div>
                       <div>
                          <label className="label-mono block mb-1">MAC Address</label>
                          <p className="text-xs font-mono text-blue-400 uppercase">{selectedCameraDevice?.mac || 'N/A'}</p>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Encryption Bypass</span>
                          <span className="text-[10px] font-mono text-green-500 uppercase">ACTIVE</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Buffer Saturation</span>
                          <span className="text-[10px] font-mono text-blue-500 uppercase">94%</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-red-500" size={20} />
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-tight">Detection Risk</h3>
                 </div>
                 <p className="text-[10px] text-slate-500 font-mono uppercase leading-relaxed mb-6">
                   Active visual streams generate significant uplink traffic. Local IDS may flag unusual port activity. Session timeout recommended in 04:59.
                 </p>
                 <button 
                   onClick={() => { stopCameraStream(); setView('network'); }}
                   className="w-full py-2 bg-red-600 text-white text-[10px] font-bold uppercase rounded hover:bg-red-700 transition-colors"
                 >
                    TERMINATE SESSION
                 </button>
              </div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-brand-bg text-slate-300">
      {/* Header - Fixed at top */}
      <header className="h-14 sm:h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#111114] shrink-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white uppercase text-xs sm:text-sm">TracePro</span>
        </div>
        
        <div className="hidden sm:flex flex-1 max-w-xl px-4 lg:px-10">
          <form onSubmit={view === 'social' ? handleSocialSearch : handlePhoneSearch} className="relative flex items-center w-full">
            <input 
              type="text" 
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={view === 'social' ? "Name, Handle, or Email..." : "Phone Number..."}
              className="w-full bg-black border border-white/20 rounded-md py-1.5 px-4 text-xs focus:outline-none focus:border-blue-500 font-mono text-white placeholder:text-slate-600"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-2 bg-blue-600 text-white text-[9px] px-2 py-1 rounded font-bold hover:bg-blue-700 transition-colors"
            >
              SEARCH
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 text-[9px] font-bold">
          <span className="text-green-500 hidden xs:flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div> ONLINE
          </span>
          <div className="hidden xs:block w-px h-3 bg-white/10"></div>
          <span className="text-slate-500 uppercase">L: 42ms</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex w-64 border-r border-white/10 bg-[#0F0F12] flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h2 className="label-mono mb-3 uppercase flex items-center gap-2">
              <History size={12} /> Access Logs
            </h2>
            <div className="space-y-1">
              {history.length > 0 ? history.map((h, i) => (
                <button 
                  key={i} 
                  onClick={() => { setReport(h); setView('report'); }}
                  className="w-full p-2 rounded text-left hover:bg-white/5 group transition-colors"
                >
                  <div className="text-blue-400 font-mono text-xs group-hover:text-blue-300">{h.formattedNumber}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">{h.carrier} • {h.location}</div>
                </button>
              )) : (
                <div className="text-[9px] text-slate-600 italic p-2 text-center">No cached records</div>
              )}
            </div>
          </div>

          <div className="p-4">
            <h2 className="label-mono mb-3">Core Modules</h2>
            <nav className="space-y-0.5">
              <SidebarLink active={view === 'home' || view === 'report'} onClick={() => setView('home')} icon={<ShieldCheck size={14}/>} label="OSINT Lookup" />
              <SidebarLink active={view === 'social'} onClick={() => setView('social')} icon={<Share2 size={14}/>} label="Social Crawler" />
              <SidebarLink active={view === 'records'} onClick={() => setView('records')} icon={<UserSearch size={14}/>} label="Public Records" />
              <SidebarLink active={view === 'network'} onClick={startNetworkScan} icon={<Wifi size={14}/>} label="Network Scanner" />
              <SidebarLink active={view === 'nfc'} onClick={startNfcScan} icon={<Rss size={14}/>} label="RFID/NFC Scan" />
              <SidebarLink active={view === 'camera'} onClick={() => { setView('camera'); setCameraActive(false); }} icon={<Camera size={14}/>} label="Remote Visuals" />
            </nav>
          </div>
          
          <div className="mt-auto p-4 border-t border-white/10 bg-black/20">
             <div className="bg-blue-600/5 border border-blue-500/10 rounded p-3">
                <p className="text-[9px] uppercase font-bold text-blue-400/60 mb-1">Station metadata</p>
                <div className="font-mono text-[8px] leading-relaxed text-blue-300/40">
                   ID: AIS-PRO-7712<br/>
                   LVL: L3 ACCESS<br/>
                   GEO: {navigator.language}
                </div>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-brand-bg relative scroll-smooth p-4 sm:p-6 pb-24 md:pb-6">
          {/* Mobile Search - Visible only on small screens */}
          <div className="md:hidden mb-6">
            <form onSubmit={view === 'social' ? handleSocialSearch : handlePhoneSearch} className="relative flex items-center w-full">
              <input 
                type="text" 
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={view === 'social' ? "Name or handle..." : "Phone search..."}
                className="w-full bg-black border border-white/20 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500 font-mono text-white placeholder:text-slate-600 shadow-lg"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="absolute right-3 bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run'}
              </button>
            </form>
          </div>

          <AnimatePresence mode="wait">
            {view === 'home' && renderWelcome()}
            {view === 'report' && renderPhoneReport()}
            {view === 'social' && renderSocialSearch()}
            {view === 'network' && renderNetworkScan()}
            {view === 'nfc' && renderNfcScan()}
            {view === 'records' && renderRecords()}
            {view === 'camera' && renderCameraBreach()}
            {view === 'history' && renderHistory()}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation - Only visible on mobile */}
      <nav className="md:hidden h-16 border-t border-white/10 bg-[#0F0F12]/95 backdrop-blur-md flex items-center justify-around px-2 pb-safe shrink-0 z-50">
        <MobileNavLink active={view === 'home' || view === 'report'} onClick={() => setView('home')} icon={<ShieldCheck size={18}/>} label="Scan" />
        <MobileNavLink active={view === 'social'} onClick={() => setView('social')} icon={<Share2 size={18}/>} label="Social" />
        <MobileNavLink active={view === 'network'} onClick={startNetworkScan} icon={<Wifi size={18}/>} label="Network" />
        <MobileNavLink active={view === 'nfc'} onClick={startNfcScan} icon={<Rss size={18}/>} label="NFC" />
        <MobileNavLink active={view === 'camera'} onClick={() => setView('camera')} icon={<Camera size={18}/>} label="Visuals" />
      </nav>

      {/* Footer - Hidden on mobile */}
      <footer className="hidden md:flex h-8 border-t border-white/10 bg-[#0F0F12] items-center px-6 text-[9px] text-slate-500 gap-6 uppercase tracking-widest shrink-0">
        <span>Station: TRACE-PRO</span>
        <span>SSL: SECURE</span>
        <div className="flex-1"></div>
        <span className="text-blue-600/50">© 2024 TracePro</span>
      </footer>
    </div>
  );

   function renderWelcome() {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto py-12 px-6"
      >
        <div className="intelligence-panel p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
           <div className="w-24 h-24 border-2 border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
              <ShieldCheck className="text-blue-500" size={48} />
           </div>
           
           <h1 className="text-3xl font-bold text-white mb-4 tracking-tighter uppercase">TracePro <span className="text-blue-500">v4.0.1</span></h1>
           <p className="text-slate-400 font-mono text-sm max-w-lg mx-auto leading-relaxed mb-10">
              FIELD ENCRYPTION & SIGNALS INTELLIGENCE SUITE
              <br/>
              <span className="text-[10px] text-slate-600">AUTHORIZED PERSONNEL ONLY // LOCAL STORAGE ACTIVE</span>
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-blue-500/50 transition-all cursor-pointer group" onClick={() => setView('network')}>
                 <Wifi className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={20} />
                 <h3 className="text-white font-bold text-sm mb-1 uppercase">Network Discovery</h3>
                 <p className="text-[10px] text-slate-500 font-mono uppercase">Scan local 802.11 & Ethernet peripherals</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-blue-500/50 transition-all cursor-pointer group" onClick={() => setView('nfc')}>
                 <Rss className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={20} />
                 <h3 className="text-white font-bold text-sm mb-1 uppercase">Signal Intercept</h3>
                 <p className="text-[10px] text-slate-500 font-mono uppercase">NFC/RFID cloning & decryption buffer</p>
              </div>
           </div>

           <div className="bg-blue-600/5 rounded-xl p-4 border border-blue-500/10 inline-block">
              <div className="flex items-center gap-3 text-xs font-mono text-blue-400">
                 <Smartphone size={14} />
                 <span>MOBILE DEPLOYMENT: READY</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              </div>
           </div>
        </div>

        <div className="mt-8 text-center text-slate-600 font-mono text-[8px] uppercase tracking-[0.2em] space-y-1">
           <p>Hardware Architecture: {navigator.platform} // Engine: V8 / WebKit</p>
           <p className="text-blue-500/40">Secure Session ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
      </motion.div>
    );
  }

  function renderPhoneReport() {
    if (!report) return null;
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="grid grid-cols-12 gap-6 pb-12"
      >
        {/* Profile Info */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="intelligence-panel">
            <div className="panel-header">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Identity Profile</h3>
              <span className={`status-badge ${report.riskScore > 50 ? 'status-alert' : 'status-online'}`}>
                RISK: {report.riskScore}%
              </span>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-8">
              <div><label className="label-mono block mb-1">Target Number</label><p className="text-sm text-white font-medium font-mono">{report.formattedNumber}</p></div>
              <div><label className="label-mono block mb-1">Provider</label><p className="text-sm text-white font-medium">{report.carrier}</p></div>
              <div><label className="label-mono block mb-1">Location</label><p className="text-sm text-white font-medium">{report.location}, {report.country}</p></div>
              <div><label className="label-mono block mb-1">Line Type</label><p className="text-sm text-blue-400 font-medium">{report.lineType}</p></div>
              <div className="col-span-2 pt-2 border-t border-white/5">
                <label className="label-mono block mb-2">Executive Summary</label>
                <p className="text-xs italic text-slate-400 leading-relaxed">"{report.summary}"</p>
              </div>
            </div>
          </div>

          <div className="intelligence-panel">
            <div className="panel-header">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Platform Linkages</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
               {report.socialFootprint && report.socialFootprint.length > 0 ? (
                 report.socialFootprint.map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-lg group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold text-[10px] uppercase">{s.platform}</span>
                        {s.isVerified && <ShieldCheck size={10} className="text-blue-500" />}
                      </div>
                      <a href={s.url} target="_blank" className="text-slate-500 hover:text-white transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <p className="text-white font-bold text-xs mb-1">@{s.username}</p>
                    {s.bio && <p className="text-[9px] text-slate-500 line-clamp-2 italic mb-2 leading-tight">"{s.bio}"</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto pt-2 border-t border-white/5">
                       {s.followers && <span className="text-[9px] text-slate-400 font-mono">Foll: {s.followers}</span>}
                       {s.activityLevel && (
                         <span className={`text-[9px] font-bold ${
                           s.activityLevel === 'high' ? 'text-green-500' : s.activityLevel === 'medium' ? 'text-yellow-500' : 'text-slate-500'
                         } uppercase`}>Act: {s.activityLevel}</span>
                       )}
                    </div>
                  </div>
                ))
               ) : (
                 <p className="text-[10px] text-slate-500 italic p-2 col-span-2">No direct linkages detected in this pass.</p>
               )}
            </div>
          </div>

          <div className="intelligence-panel">
            <div className="panel-header">
               <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Network Topology</h3>
            </div>
            <div className="p-6">
               <div className="bg-black/40 p-4 border border-white/5 rounded-md mb-4 flex items-center justify-between">
                  <div>
                    <span className="label-mono block mb-1">Associated Node Info</span>
                    <span className="data-mono text-lg">DYNAMIC-GATEWAY-IP</span>
                  </div>
                  <Cpu className="text-slate-700" size={24} />
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                  {report.technicalDetails.ipExplanation}
               </p>
            </div>
          </div>
        </div>

        {/* Visualization area */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
           <div className="intelligence-panel aspect-square relative group bg-black">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              {/* Radar Effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-4/5 h-4/5 border border-blue-500/20 rounded-full flex items-center justify-center">
                    <div className="w-3/5 h-3/5 border border-blue-500/40 rounded-full flex items-center justify-center">
                       <div className="relative">
                          <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute"></div>
                          <div className="w-4 h-4 bg-blue-500 rounded-full relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                       </div>
                    </div>
                 </div>
                 {/* Scanning Line */}
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                   className="absolute w-1/2 h-1 bg-gradient-to-r from-transparent to-blue-500/50 origin-left left-1/2 -top-1"
                 />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                 <div className="flex justify-between items-end">
                    <div>
                       <span className="text-[10px] uppercase text-blue-400 font-bold block mb-1 underline decoration-blue-500/30">Location Overlay</span>
                       <span className="text-xs text-white font-mono">{report.location} TRACE</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">PRECISION: HIGH</span>
                 </div>
              </div>
           </div>

           <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-5">
              <h4 className="label-mono mb-3 text-blue-400">Metadata Dump</h4>
              <pre className="text-[9px] font-mono leading-relaxed text-blue-300/60 whitespace-pre-wrap">
                TZ: {report.timeZone}{"\n"}
                CARRIER_ID: {report.technicalDetails.mcc || 'NULL'}{report.technicalDetails.mnc || 'NULL'}{"\n"}
                QUERY_SIG: {Math.random().toString(36).substring(7).toUpperCase()}{"\n"}
                TIMESTAMP: {new Date().toISOString()}
              </pre>
           </div>
        </div>
      </motion.div>
    );
  }

  function renderSocialSearch() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Share2 className="text-blue-500" />
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Social Crawler v2.0</h2>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="label-mono animate-pulse">Scanning global handles & metadata streams...</p>
          </div>
        ) : socialResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialResults.map((s, i) => (
              <div key={i} className="intelligence-panel hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col">
                <div className="panel-header bg-white/5 flex justify-between items-center px-4 py-2">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center">
                         <span className="text-blue-400 font-bold text-[10px]">{s.platform[0]}</span>
                      </div>
                      <span className="text-blue-400 font-bold text-xs uppercase">{s.platform}</span>
                      {s.isVerified && <ShieldCheck size={12} className="text-blue-500" />}
                   </div>
                   <div className="text-[10px] text-slate-500 font-mono tracking-tighter">SIG_STRENGTH: {s.relevance}%</div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                     <p className="text-lg text-white font-bold tracking-tight">@{s.username}</p>
                     <a href={s.url} target="_blank" className="p-1.5 hover:bg-white/10 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
                     </a>
                  </div>

                  {s.bio && (
                    <div className="mb-4 bg-black/30 p-3 rounded border border-white/5 italic text-slate-400 text-xs leading-relaxed">
                      "{s.bio}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div>
                      <label className="label-mono block mb-1">Followers</label>
                      <p className="text-white font-mono text-xs">{s.followers || 'UNREACHABLE'}</p>
                    </div>
                    <div>
                      <label className="label-mono block mb-1">Activity</label>
                      <p className={`text-xs font-bold uppercase ${
                        s.activityLevel === 'high' ? 'text-green-500' : s.activityLevel === 'medium' ? 'text-yellow-500' : 'text-slate-500'
                      }`}>
                        {s.activityLevel || 'STAGNANT'}
                      </p>
                    </div>
                    <div className="col-span-2 pt-3 border-t border-white/5 flex justify-between items-center">
                       <span className="label-mono">Last Signal Detect</span>
                       <span className="text-[10px] text-slate-500 uppercase">{s.lastPosted || 'LONG_TERM_OFFLINE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl py-24 text-center">
            <p className="text-slate-500 italic text-sm">Enter name or handle in search bar to begin cross-platform crawl.</p>
          </div>
        )}
      </motion.div>
    );
  }

  function renderNetworkScan() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Wifi className="text-blue-500" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Network Node Explorer</h2>
          </div>
          {loading && <div className="status-badge status-online animate-pulse">SCANNING...</div>}
        </div>

        {networkData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataBox label="Public IP" value={networkData.publicIp} />
              <DataBox label="ISP/Provider" value={networkData.isp} />
              <DataBox label="Threat Assessment" value={networkData.threatLevel.toUpperCase()} alert={networkData.threatLevel === 'high'} />
            </div>

            <div className="intelligence-panel">
              <div className="panel-header">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Analyzed Port Range</h3>
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 label-mono">Port</th>
                      <th className="px-6 py-3 label-mono">Service</th>
                      <th className="px-6 py-3 label-mono">Actionable Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {networkData.ports.map((p, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-3 font-mono text-blue-300">{p.port}</td>
                        <td className="px-6 py-3 text-white uppercase font-semibold">{p.service}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            p.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            p.status === 'filtered' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="intelligence-panel pb-2">
              <div className="panel-header flex justify-between items-center">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Network Command Center (ARP Discovery)</h3>
                 <span className="text-[10px] font-mono text-slate-500">{networkDevices.length} TARGETS IDENTIFIED</span>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 border-b border-white/5">
                       <tr>
                          <th className="px-6 py-3 label-mono">Device / Host</th>
                          <th className="px-6 py-3 label-mono">Physical Address</th>
                          <th className="px-6 py-3 label-mono">Network Identity</th>
                          <th className="px-6 py-3 label-mono text-right">Command</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {networkDevices.map((dev, i) => (
                         <tr key={i} className={`hover:bg-white/[0.02] transition-colors ${dev.status === 'blocked' ? 'opacity-50' : ''}`}>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded ${dev.status === 'blocked' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                     {dev.type === 'Mobile' ? <Smartphone size={14} className={dev.status === 'blocked' ? 'text-red-400' : 'text-blue-400'} /> : 
                                      dev.type === 'Workstation' ? <Laptop size={14} className={dev.status === 'blocked' ? 'text-red-400' : 'text-blue-400'} /> :
                                      <Cpu size={14} className={dev.status === 'blocked' ? 'text-red-400' : 'text-blue-400'} />}
                                  </div>
                                  <div>
                                     <p className="text-white font-bold leading-none mb-1">{dev.hostname}</p>
                                     <p className="text-[10px] text-slate-500 font-mono">{dev.vendor}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{dev.mac}</td>
                            <td className="px-6 py-4">
                               <p className="text-blue-300 font-mono">{dev.ip}</p>
                               <div className="flex items-center gap-1 mt-1">
                                  <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-500" style={{ width: `${dev.signalStrength}%` }}></div>
                                  </div>
                                  <span className="text-[8px] text-slate-600">-{100 - (dev.signalStrength || 0)} dBm</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <button 
                                   onClick={() => initiateCameraBreach(dev)}
                                   className="px-3 py-1.5 rounded font-bold uppercase text-[9px] bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                                 >
                                    <Camera size={10} /> ACCESS LENS
                                 </button>
                                 <button 
                                   onClick={() => toggleDeviceStatus(dev.mac)}
                                   className={`px-3 py-1.5 rounded font-bold uppercase text-[9px] transition-all flex items-center gap-2 ${
                                     dev.status === 'blocked' 
                                       ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                       : 'bg-white/5 text-slate-400 hover:bg-red-600/20 hover:text-red-400'
                                   }`}
                                 >
                                    {dev.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                                    {dev.status === 'online' ? 'KILL' : 'RESTORE'}
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
             <div className="h-10 bg-white/5 rounded animate-pulse"></div>
             <div className="h-64 bg-white/5 rounded animate-pulse"></div>
          </div>
        )}
      </motion.div>
    );
  }

  function renderNfcScan() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Rss className="text-blue-500" />
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Proximal RFID/NFC Analysis</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
            <div className="relative">
               <motion.div 
                 animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-blue-500 rounded-full"
               />
               <Zap className="w-12 h-12 text-blue-500 relative z-10" />
            </div>
            <p className="label-mono animate-pulse tracking-[0.3em] text-blue-400">POLLING FOR TARGETS...</p>
            <p className="text-[10px] text-slate-500 uppercase">Hold device near object</p>
          </div>
             ) : (
          <div className="grid grid-cols-12 gap-6">
             <div className="col-span-12 md:col-span-8 space-y-6">
                {nfcData ? (
                  <>
                    <div className="intelligence-panel">
                      <div className="panel-header">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Tag Inventory</h3>
                        <div className="flex gap-2">
                           <span className="status-badge status-online">ACTIVE</span>
                           <span className="status-badge bg-blue-500/10 text-blue-400 border-blue-500/30">{nfcData.type}</span>
                        </div>
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-6">
                        <div><label className="label-mono block mb-1">UID / Serial</label><p className="data-mono uppercase tracking-widest">{nfcData.tagId}</p></div>
                        <div><label className="label-mono block mb-1">Encryption Mode</label><p className="text-sm text-white font-bold">{nfcData.technology.join(', ')}</p></div>
                        <div><label className="label-mono block mb-1">Payload Size</label><p className="text-sm text-white font-bold">{nfcData.capacity} Bytes</p></div>
                        <div><label className="label-mono block mb-1">Write Status</label><p className={`text-sm font-bold ${nfcData.isWritable ? 'text-green-500' : 'text-red-500'}`}>{nfcData.isWritable ? 'OPEN' : 'READ-ONLY'}</p></div>
                        <div className="col-span-2 pt-4 border-t border-white/5">
                           <label className="label-mono block mb-2">Hex Dump</label>
                           <div className="bg-black p-3 rounded font-mono text-[9px] text-slate-500 break-all leading-tight">
                              {nfcData.rawPayload}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="intelligence-panel">
                       <div className="panel-header">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Decrypted Content</h3>
                       </div>
                       <div className="p-6">
                          {nfcData.decryptedData ? (
                            <div className="grid grid-cols-2 gap-4">
                               <DataBox label="Object Identity" value={nfcData.decryptedData.objectType || 'UNKNOWN'} />
                               <DataBox label="Attributed Owner" value={nfcData.decryptedData.owner || 'CLASSIFIED'} />
                               <DataBox label="Security Clearance" value={nfcData.decryptedData.securityLevel || 'N/A'} />
                               <DataBox label="Last Intercept" value={nfcData.decryptedData.lastAccessed || 'NEVER'} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-red-400">
                               <Lock size={16} />
                               <p className="text-xs font-mono">ENCRYPTION LAYER BREACH FAILED. PAYLOAD OBFUSCATED.</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl py-32 text-center h-full flex flex-col justify-center">
                     <div className="w-12 h-12 border-2 border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="text-slate-700" size={20} />
                     </div>
                     <p className="text-slate-600 font-mono text-sm mb-6 uppercase tracking-widest">NFC_interface_ready</p>
                     <div className="max-w-[200px] mx-auto">
                        <button onClick={startNfcScan} className="w-full px-6 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-700 transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                           Initialize Scan
                        </button>
                     </div>
                  </div>
                )}
             </div>

             <div className="col-span-12 md:col-span-4 space-y-6">
                <div className="intelligence-panel p-6 flex flex-col items-center text-center">
                   <div className="w-16 h-16 border border-blue-500/30 rounded-full flex items-center justify-center mb-4">
                      <Rss className={`text-blue-500 ${loading ? 'animate-pulse' : ''}`} size={32} />
                   </div>
                   <h4 className="text-sm font-bold text-white mb-2 uppercase">{nfcData ? 'Scan Complete' : 'Hardware Active'}</h4>
                   <p className="text-[10px] text-slate-500 mb-6 font-mono leading-relaxed">
                      {nfcData ? 'Captured 10.4MHz carrier signal. Decryption performed via local neural buffer.' : 'Awaiting proximal carrier detection. Signal buffer ready.'}
                   </p>
                   <div className="w-full space-y-2">
                     <button onClick={startNfcScan} className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-700 transition-colors">
                        {nfcData ? 'New Scan' : 'Initialize Scan'}
                     </button>
                     {nfcData && (
                       <button 
                         onClick={() => saveNfcTag(nfcData)} 
                         disabled={savedNfcTags.some(t => t.tagId === nfcData.tagId)}
                         className="w-full py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase rounded hover:bg-white/10 disabled:opacity-50"
                       >
                          {savedNfcTags.some(t => t.tagId === nfcData.tagId) ? 'TAG SECURED' : 'SAVE TO VAULT'}
                       </button>
                     )}
                   </div>
                </div>

                {savedNfcTags.length > 0 && (
                   <div className="intelligence-panel">
                      <div className="panel-header">
                         <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Secure Key Vault</h3>
                      </div>
                      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                         {savedNfcTags.map((tag, i) => (
                           <div key={i} className="bg-black/40 border border-white/5 p-3 rounded flex justify-between items-center group">
                              <div className="overflow-hidden pr-2">
                                 <p className="text-[10px] text-white font-bold truncate">{tag.decryptedData?.objectType || 'Generic Tag'}</p>
                                 <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest truncate">{tag.tagId}</p>
                              </div>
                              <button 
                                onClick={() => broadcastNfcTag(tag.tagId)}
                                disabled={broadcastingTag === tag.tagId}
                                className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all shrink-0 ${
                                  broadcastingTag === tag.tagId 
                                    ? 'bg-green-500 text-white animate-pulse' 
                                    : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white'
                                }`}
                              >
                                 {broadcastingTag === tag.tagId ? 'TX ACTIVE' : 'EMULATE'}
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}
      </motion.div>
    );
  }

  function renderRecords() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="text-blue-500" />
          <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Public Records Database</h2>
        </div>

        <div className="intelligence-panel p-8 mb-8 border-dashed border-2 border-white/10">
           <form onSubmit={handleRecordsSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="label-mono block">Full Legal Name</label>
                 <div className="relative">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      value={nameQuery}
                      onChange={(e) => setNameQuery(e.target.value)}
                      placeholder="e.g. JOHN DOE"
                      className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm uppercase focus:border-blue-500 outline-none"
                    />
                 </div>
              </div>
              <div className="space-y-4">
                <label className="label-mono block">Date of Birth</label>
                <div className="relative">
                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                   <input 
                     type="text" 
                     value={dobQuery}
                     onChange={(e) => setDobQuery(e.target.value)}
                     placeholder="MM/DD/YYYY"
                     className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm focus:border-blue-500 outline-none"
                   />
                </div>
              </div>
              <div className="col-span-full space-y-4">
                <label className="label-mono block">Jurisdiction Filter (State)</label>
                <div className="relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                   <input 
                     type="text" 
                     value={stateQuery}
                     onChange={(e) => setStateQuery(e.target.value)}
                     placeholder="e.g. CALIFORNIA, NEW YORK (LEAVE BLANK FOR FEDERAL)"
                     className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm uppercase focus:border-blue-500 outline-none"
                   />
                </div>
              </div>
              <div className="col-span-full">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  {loading ? 'QUERYING PUBLIC ARCHIVES...' : 'EXECUTE ARCHIVE SEARCH'}
                </button>
              </div>
           </form>
        </div>

        {recordsData && (
          <div className="grid grid-cols-12 gap-6">
             <div className="col-span-12 md:col-span-4 space-y-6">
                <div className="intelligence-panel p-6 text-center">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
                     recordsData.riskLevel === 'high' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                     recordsData.riskLevel === 'elevated' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                     'bg-green-500/10 border-green-500 text-green-500'
                   }`}>
                      <Scale size={32} />
                   </div>
                   <h3 className="text-xs font-mono uppercase text-slate-500 mb-1">Threat Assessment</h3>
                   <p className={`text-xl font-bold uppercase tracking-wider ${
                     recordsData.riskLevel === 'high' ? 'text-red-500' :
                     recordsData.riskLevel === 'elevated' ? 'text-yellow-500' :
                     'text-green-500'
                   }`}>{recordsData.riskLevel}</p>
                </div>

                <div className="intelligence-panel">
                   <div className="panel-header">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Current Residence</h3>
                   </div>
                   <div className="p-6">
                      <p className="text-white font-bold leading-relaxed">{recordsData.currentAddress}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase tracking-tighter">Verified via USPS/Property Records</p>
                   </div>
                </div>

                <div className="intelligence-panel">
                   <div className="panel-header">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Address History</h3>
                   </div>
                   <div className="p-4 space-y-3">
                      {recordsData.pastAddresses.map((addr, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                           <MapPin size={14} className="shrink-0 text-slate-600" />
                           <span className="text-slate-400">{addr}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="col-span-12 md:col-span-8 space-y-6">
                <div className="intelligence-panel">
                   <div className="panel-header">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Criminal History & Litigation</h3>
                   </div>
                   <div className="p-0">
                      {recordsData.criminalHistory.length > 0 ? (
                        <div className="divide-y divide-white/5">
                           {recordsData.criminalHistory.map((h, i) => (
                             <div key={i} className="p-5 flex gap-4">
                                <div className="bg-red-600/10 p-2 rounded shrink-0 h-fit">
                                   <AlertTriangle size={16} className="text-red-400" />
                                </div>
                                <div className="flex-1">
                                   <div className="flex justify-between items-start mb-1">
                                      <h4 className="text-white font-bold text-sm uppercase">{h.incident}</h4>
                                      <span className="text-[10px] font-mono text-slate-500">{h.date}</span>
                                   </div>
                                   <p className="text-xs text-slate-400 mb-2">{h.location}</p>
                                   <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">{h.status}</span>
                                </div>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                           <ShieldCheck size={48} className="text-green-500/20 mx-auto mb-4" />
                           <p className="text-slate-500 font-mono text-sm">NO CONVICTIONS DETECTED IN PRIMARY DATABASES</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="intelligence-panel">
                   <div className="panel-header">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Archival Summary</h3>
                   </div>
                   <div className="p-6">
                      <p className="text-slate-400 text-sm leading-relaxed italic">
                        "{recordsData.summary}"
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </motion.div>
    );
  }

  function renderHistory() {
    return (
       <div className="max-w-4xl mx-auto py-8">
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="text-blue-500" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Access Logs</h2>
          </div>
          <div className="space-y-2">
             {history.length > 0 ? history.map((h, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded flex justify-between items-center font-mono text-xs">
                   <div className="flex gap-4">
                      <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                      <span className="text-blue-400">{h.formattedNumber}</span>
                      <span className="text-slate-300">SEARCH_HIT</span>
                   </div>
                   <button onClick={() => {setReport(h); setView('report');}} className="text-blue-600 hover:underline">VIEW_DATA</button>
                </div>
             )) : (
                <div className="text-center py-20 text-slate-600 font-mono text-xs">LOGFILE_EMPTY</div>
             )}
          </div>
       </div>
    );
  }
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="uppercase tracking-wider">{label}</span>
      {active && <div className="ml-auto w-1 h-1 bg-white rounded-full"></div>}
    </button>
  );
}

function MobileNavLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 flex-1 transition-all ${
        active ? 'text-blue-500' : 'text-slate-500'
      }`}
    >
      <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-500/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}

function DataBox({ label, value, alert }: { label: string, value: string, alert?: boolean }) {
  return (
    <div className={`p-4 bg-white/5 border rounded ${alert ? 'border-red-500/30' : 'border-white/10'}`}>
      <span className="label-mono block mb-1">{label}</span>
      <span className={`text-sm font-bold font-mono ${alert ? 'text-red-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

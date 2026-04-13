import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Map as MapIcon, Navigation, Camera, AlertCircle, Activity, Bell, X, Check, Loader2, Upload } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

const OfficerTacticalView: React.FC = () => {
    const { socket } = useWebSocket();
    const [activePatrol, setActivePatrol] = useState(false);
    const [lastIncident, setLastIncident] = useState<string | null>(null);
    const [stats, setStats] = useState({ shifts: 0, violations: 0, distance: 0.0 });
    const [activeMission, setActiveMission] = useState<any>(null);

    // 1. Notifications State
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    // 2. Shift Tracker State
    const [shiftIntervalId, setShiftIntervalId] = useState<number | null>(null);
    const [geoWatchId, setGeoWatchId] = useState<number | null>(null);
    const prevLocation = useRef<{ lat: number; lng: number } | null>(null);

    // 3. Obstruction Modal State
    const [showObstructionModal, setShowObstructionModal] = useState(false);
    const [obstructionDesc, setObstructionDesc] = useState('');
    const [obstructionSending, setObstructionSending] = useState(false);

    // 4. Emergency Action State
    const [emergencyHoldProgress, setEmergencyHoldProgress] = useState(0);
    const holdTimerRef = useRef<number | null>(null);
    const [dispatchNotified, setDispatchNotified] = useState(false);

    // 5. OCR Scanner State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrResult, setOcrResult] = useState<any | null>(null);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('dispatch_order', (msg: any) => {
            console.log('Received Dispatch Order:', msg);
            setActiveMission(msg);
            
            // Add to notifications
            const newNotif = { id: Date.now(), title: 'Priority Dispatch', msg: `Deploy to ${msg.zone_id}` };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Text to speech alert
            const utterance = new SpeechSynthesisUtterance(`New dispatch order for zone ${msg.zone_id}`);
            window.speechSynthesis.speak(utterance);
        });

        return () => {
            socket.off('dispatch_order');
        };
    }, [socket]);

    // -------- SHIFT LOGIC --------
    const togglePatrol = () => {
        const nextState = !activePatrol;
        setActivePatrol(nextState);
        
        if (nextState) {
            socket?.emit('officer_status', { id: 'OFF-77', status: 'patrolling' });
            
            // Start Timer (simulate hours per second for demo)
            const interval = window.setInterval(() => {
                setStats(s => ({ ...s, shifts: Number((s.shifts + 0.01).toFixed(2)) }));
            }, 1000);
            setShiftIntervalId(interval);

            // Start GPS tracking
            if ('geolocation' in navigator) {
                const watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        if (prevLocation.current) {
                            // Rough distance calc simulation (add 0.1km for demo)
                            setStats(s => ({ ...s, distance: Number((s.distance + 0.1).toFixed(1)) }));
                        }
                        prevLocation.current = { lat: latitude, lng: longitude };
                    },
                    (err) => console.error("GPS Error:", err),
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
                setGeoWatchId(watchId);
            }

        } else {
            socket?.emit('officer_status', { id: 'OFF-77', status: 'standby' });
            if (shiftIntervalId) clearInterval(shiftIntervalId);
            if (geoWatchId && 'geolocation' in navigator) {
                navigator.geolocation.clearWatch(geoWatchId);
            }
            setShiftIntervalId(null);
            setGeoWatchId(null);
            prevLocation.current = null;
        }
    };

    // -------- OBSTRUCTION LOGIC --------
    const submitObstruction = () => {
        setObstructionSending(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const incident = {
                id: `INC-${Date.now()}`,
                type: 'Obstruction',
                desc: obstructionDesc,
                location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                officer_id: 'OFF-77',
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            socket?.emit('report_incident', incident);
            setTimeout(() => {
                setObstructionSending(false);
                setShowObstructionModal(false);
                setObstructionDesc('');
                setLastIncident(`Reported: Obstruction at ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                setTimeout(() => setLastIncident(null), 3000);
            }, 1000);
        }, () => {
            // Fallback if no GPS
            setObstructionSending(false);
            setShowObstructionModal(false);
        });
    };

    // -------- EMERGENCY LOGIC --------
    const handleEmergencyStart = () => {
        if (dispatchNotified) return;
        setEmergencyHoldProgress(0);
        holdTimerRef.current = window.setInterval(() => {
            setEmergencyHoldProgress(prev => {
                if (prev >= 100) {
                    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
                    triggerEmergency();
                    return 100;
                }
                return prev + 5; // 20 ticks of 50ms = 1 second hold
            });
        }, 50);
    };

    const handleEmergencyStop = () => {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        if (emergencyHoldProgress < 100) setEmergencyHoldProgress(0);
    };

    const triggerEmergency = () => {
        setDispatchNotified(true);
        // Fire high priority request
        navigator.geolocation.getCurrentPosition((pos) => {
            const emergency = {
                id: `EMG-${Date.now()}`,
                type: 'Emergency',
                priority: 'CRITICAL',
                officer_id: 'OFF-77',
                location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                timestamp: new Date().toISOString()
            };
            socket?.emit('report_incident', emergency);
            
            // Notification UI
            setLastIncident('🚨 EMERGENCY DISPATCH NOTIFIED 🚨');
            const alertAudio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
            alertAudio.play().catch(() => {});
            setTimeout(() => {
                setDispatchNotified(false);
                setEmergencyHoldProgress(0);
                setLastIncident(null);
            }, 4000);
        }, () => {
            setLastIncident('🚨 GPS FAILED - DISPATCH ALERTED 🚨');
            setTimeout(() => {
                setDispatchNotified(false);
                setEmergencyHoldProgress(0);
                setLastIncident(null);
            }, 4000);
        });
    };

    // -------- OCR LOGIC --------
    const handleOcrCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOcrProcessing(true);
        // Simulate API Processing Delay
        setTimeout(() => {
            setIsOcrProcessing(false);
            setOcrResult({
                plate: `XYZ-${Math.floor(Math.random() * 9999)}`,
                status: 'Unregistered',
                fines: '$240.00',
                owner: 'REDACTED'
            });
            // Increment violation stat
            setStats(s => ({ ...s, violations: s.violations + 1 }));
        }, 2000);
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[#0a0f18] text-gray-100 font-inter relative shadow-2xl overflow-hidden sm:border-x sm:border-blue-900/30">
            {/* Tactical HUD Header */}
            <header className="p-4 border-b border-blue-900/30 bg-[#0d1420] flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-wider uppercase">Officer Portal</h1>
                        <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Field HQ-Active-Beta</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Badge #77</p>
                        <p className="text-xs text-emerald-400 font-black">ONLINE</p>
                    </div>
                    <div className="relative">
                        <button onClick={() => { setShowNotifications(!showNotifications); setUnreadCount(0); }}>
                            <Bell className={`w-6 h-6 transition-colors ${unreadCount > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                        </button>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-[#0d1420] animate-pulse"></span>
                        )}
                        
                        {/* Dropdown Notifs */}
                        {showNotifications && (
                            <div className="absolute top-10 right-0 w-64 bg-[#121b2b] border border-blue-900/30 rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="p-3 bg-[#0d1420] border-b border-blue-900/30 font-bold text-xs uppercase flex justify-between">
                                    <span>Comms</span>
                                    <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <p className="p-4 text-xs text-center text-gray-500 font-medium">No new comms</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className="p-3 border-b border-gray-800/50 hover:bg-gray-800/20">
                                                <p className="text-rose-400 text-[10px] uppercase font-bold">{n.title}</p>
                                                <p className="text-xs text-gray-300">{n.msg}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Operational Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Shift (h)', val: stats.shifts, icon: Activity, color: 'text-emerald-400' },
                        { label: 'Fines', val: stats.violations, icon: AlertCircle, color: 'text-amber-400' },
                        { label: 'KM', val: stats.distance, icon: Navigation, color: 'text-purple-400' }
                    ].map((s, i) => (
                        <div key={i} className="bg-[#121b2b] p-3 rounded-xl border border-blue-900/20 shadow-xl relative overflow-hidden">
                            {(isShiftActive || activePatrol) && i === 0 && <span className="absolute right-2 top-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                            <s.icon className={`w-4 h-4 mb-1 ${s.color}`} />
                            <p className="text-[10px] text-gray-500 font-bold uppercase">{s.label}</p>
                            <p className="text-xl font-black">{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Tactical Actions */}
                <div className="space-y-3">
                    <button 
                        onClick={togglePatrol}
                        className={`w-full p-6 rounded-2xl flex items-center justify-between transition-all font-black text-sm uppercase tracking-widest border-2 ${
                            activePatrol 
                            ? 'bg-rose-900/30 border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' 
                            : 'bg-emerald-900/30 border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${activePatrol ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                <Navigation className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xs opacity-60">Status</span>
                                {activePatrol ? 'End Patrol Shift' : 'Start Patrol Shift'}
                            </div>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${activePatrol ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                    </button>

                    {/* ACTIVE MISSION FLASH ALERT */}
                    {activeMission && (
                        <div className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                    <h3 className="font-black tracking-widest text-amber-500 uppercase">Deploy Order</h3>
                                </div>
                                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/20 px-2 py-1 rounded">PRIORITY 1</span>
                            </div>
                            <p className="text-white font-medium mb-1">Target Zone: <span className="font-black text-amber-400">{activeMission.zone_id}</span></p>
                            <p className="text-sm text-gray-300 mb-4">Vehicle: <span className="font-mono text-white">{activeMission.vehicle_number || 'Unknown'}</span></p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeMission.zone_id + ' Parking Zone')}`, '_blank')}
                                    className="flex-1 bg-amber-500 text-black font-black uppercase text-[10px] py-3 rounded-xl hover:bg-amber-400"
                                >
                                    Map Route
                                </button>
                                <button onClick={() => setActiveMission(null)} className="flex-1 bg-slate-800 text-white font-black uppercase text-[10px] py-3 rounded-xl border border-slate-700 hover:bg-slate-700">Clear</button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setShowObstructionModal(true)}
                            className="bg-[#121b2b] p-8 rounded-2xl border border-blue-900/20 flex flex-col items-center gap-3 active:scale-95 transition-all group"
                        >
                            <div className="p-4 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-all">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">Report Obstruction</span>
                        </button>
                        
                        <div 
                            onPointerDown={handleEmergencyStart}
                            onPointerUp={handleEmergencyStop}
                            onPointerLeave={handleEmergencyStop}
                            className={`p-8 rounded-2xl border flex flex-col items-center gap-3 transition-all relative overflow-hidden select-none touch-none ${
                                dispatchNotified ? 'bg-rose-900 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)]' : 'bg-[#121b2b] border-blue-900/20'
                            }`}
                        >
                            {/* Progress Fill */}
                            <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-75" style={{ width: `${emergencyHoldProgress}%` }}></div>
                            
                            <div className={`p-4 rounded-xl transition-all ${dispatchNotified ? 'bg-white text-rose-600' : 'bg-rose-500/20 group-hover:bg-rose-500/30'}`}>
                                <AlertCircle className={`w-8 h-8 ${dispatchNotified ? 'text-rose-600' : 'text-rose-500'}`} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest text-center ${dispatchNotified ? 'text-white' : 'text-rose-500'}`}>
                                {dispatchNotified ? 'DISPATCHED' : 'HOLD 1S EMGY'}
                            </span>
                        </div>
                    </div>

                    <div className="relative">
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden"
                            onChange={handleOcrCapture}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isOcrProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-500 p-6 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 disabled:bg-blue-800"
                        >
                            {isOcrProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                            <span>{isOcrProcessing ? 'Processing OCR...' : 'OCR Plate Scanner'}</span>
                        </button>
                    </div>
                </div>

                {/* Feed Overlay (Toasts) */}
                {lastIncident && (
                    <div className="fixed bottom-24 left-4 right-4 bg-emerald-600 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom flex items-center justify-center gap-3 z-50">
                        <Check className="w-5 h-5 font-bold" />
                        <p className="text-sm font-black uppercase tracking-tight text-center">{lastIncident}</p>
                    </div>
                )}
            </div>

            {/* Tactical Nav */}
            <nav className="p-4 pb-8 bg-[#0d1420] border-t border-blue-900/30 grid grid-cols-3 gap-2 relative z-10">
                <button className="flex flex-col items-center gap-1 text-blue-500 font-bold">
                    <MapIcon className="w-5 h-5" />
                    <span className="text-[9px] uppercase tracking-tighter">Tactical Map</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-500 font-bold opacity-50">
                    <Activity className="w-5 h-5" />
                    <span className="text-[9px] uppercase tracking-tighter">My Stats</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-500 font-bold opacity-50">
                    <Navigation className="w-5 h-5" />
                    <span className="text-[9px] uppercase tracking-tighter">Routes</span>
                </button>
            </nav>

            {/* MODALS */}
            
            {/* Obstruction Modal */}
            {showObstructionModal && (
                <div className="absolute inset-0 z-50 bg-[#0a0f18]/90 backdrop-blur-sm flex flex-col p-4 animate-in fade-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-6 pt-4">
                        <h2 className="text-xl font-black uppercase text-amber-500 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" /> Report Obstruction
                        </h2>
                        <button onClick={() => setShowObstructionModal(false)} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Description</label>
                            <textarea 
                                value={obstructionDesc}
                                onChange={e => setObstructionDesc(e.target.value)}
                                className="w-full bg-[#121b2b] border border-blue-900/30 rounded-xl p-4 text-white text-sm min-h-[120px] focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="E.g., Vehicle blocking fire hydrant..."
                            />
                        </div>

                        <button className="w-full p-4 rounded-xl border border-dashed border-gray-600 flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:border-gray-400 transition-colors">
                            <Camera className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase">Attach Photo Evidence</span>
                        </button>
                    </div>
                    
                    <button 
                        onClick={submitObstruction}
                        disabled={obstructionSending}
                        className="mt-4 w-full bg-amber-500 text-black font-black uppercase text-base p-5 rounded-2xl flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                    >
                        {obstructionSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        {obstructionSending ? 'Sending GPS to Dispatch...' : 'Submit Report'}
                    </button>
                </div>
            )}

            {/* OCR Result Modal */}
            {ocrResult && (
                <div className="absolute inset-0 z-50 bg-[#0a0f18]/90 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-[#121b2b] border border-blue-900/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-blue-600 flex justify-between items-center p-4">
                            <h3 className="font-black uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-5 h-5" /> Plate Result
                            </h3>
                            <button onClick={() => setOcrResult(null)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-[#0a0f18] border border-gray-800 p-4 rounded-xl text-center">
                                <p className="text-xs text-gray-500 uppercase font-black mb-1">Detected Plate</p>
                                <p className="text-3xl font-mono text-white tracking-widest">{ocrResult.plate}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 font-medium">Status</span>
                                    <span className="font-bold text-rose-400">{ocrResult.status}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 font-medium">Registered Owner</span>
                                    <span className="font-bold">{ocrResult.owner}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-500 font-medium">Outstanding Fines</span>
                                    <span className="font-black text-rose-500">{ocrResult.fines}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setOcrResult(null); handleReportIncident('Citation Issued'); }}
                                className="w-full bg-rose-600 text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-rose-900/20"
                            >
                                Issue Citation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficerTacticalView;

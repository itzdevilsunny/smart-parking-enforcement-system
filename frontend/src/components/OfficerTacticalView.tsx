import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Map as MapIcon, Navigation, Camera, AlertCircle, Activity, Bell } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

const OfficerTacticalView: React.FC = () => {
    const { socket } = useWebSocket();
    const [activePatrol, setActivePatrol] = useState(false);
    const [lastIncident, setLastIncident] = useState<string | null>(null);
    const [stats, setStats] = useState({ shifts: 12, violations: 145, distance: 4.2 });

    const handleReportIncident = (type: string) => {
        const incident = {
            id: `INC-${Date.now()}`,
            type,
            officer_id: 'OFF-77',
            timestamp: new Date().toISOString(),
            status: 'active'
        };
        
        // Broadcast to Admin Dashboard instantly
        socket?.emit('report_incident', incident);
        setLastIncident(`Reported: ${type}`);
        setTimeout(() => setLastIncident(null), 3000);
    };

    const togglePatrol = () => {
        setActivePatrol(!activePatrol);
        if (!activePatrol) {
            socket?.emit('officer_status', { id: 'OFF-77', status: 'patrolling' });
        } else {
            socket?.emit('officer_status', { id: 'OFF-77', status: 'standby' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f18] text-gray-100 font-inter">
            {/* Tactical HUD Header */}
            <header className="p-4 border-b border-blue-900/30 bg-[#0d1420] flex justify-between items-center">
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
                        <Bell className="w-5 h-5 text-gray-400" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                    </div>
                </div>
            </header>

            {/* Main Operational Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Shift (h)', val: stats.shifts, icon: Activity, color: 'text-blue-400' },
                        { label: 'Fines', val: stats.violations, icon: AlertCircle, color: 'text-amber-400' },
                        { label: 'KM', val: stats.distance, icon: Navigation, color: 'text-purple-400' }
                    ].map((s, i) => (
                        <div key={i} className="bg-[#121b2b] p-3 rounded-xl border border-blue-900/20 shadow-xl">
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

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleReportIncident('Obstruction')}
                            className="bg-[#121b2b] p-8 rounded-2xl border border-blue-900/20 flex flex-col items-center gap-3 active:scale-95 transition-all group"
                        >
                            <div className="p-4 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-all">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Report Obstruction</span>
                        </button>
                        <button 
                            onClick={() => handleReportIncident('Emergency')}
                            className="bg-[#121b2b] p-8 rounded-2xl border border-blue-900/20 flex flex-col items-center gap-3 active:scale-95 transition-all group"
                        >
                            <div className="p-4 bg-rose-500/20 rounded-xl group-hover:bg-rose-500/30 transition-all">
                                <AlertCircle className="w-8 h-8 text-rose-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Emergency Alert</span>
                        </button>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-500 p-6 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20">
                        <Camera className="w-6 h-6" />
                        <span>OCR License Plate Scannner</span>
                    </button>
                </div>

                {/* Feed Overlay */}
                {lastIncident && (
                    <div className="fixed bottom-24 left-4 right-4 bg-blue-600 p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom flex items-center gap-3">
                        <Activity className="w-5 h-5 animate-pulse" />
                        <p className="text-sm font-bold uppercase tracking-tight">{lastIncident}</p>
                    </div>
                )}
            </div>

            {/* Tactical Nav */}
            <nav className="p-4 bg-[#0d1420] border-t border-blue-900/30 grid grid-cols-3 gap-2">
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
        </div>
    );
};

export default OfficerTacticalView;

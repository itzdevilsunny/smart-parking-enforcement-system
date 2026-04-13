import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, AlertTriangle, Car, IndianRupee, Activity, Clock } from 'lucide-react';
import type { DashboardKPIs, ParkingZone, Violation } from '../types';

interface DashboardProps {
    kpis: DashboardKPIs;
    zones: ParkingZone[];
    violations: Violation[];
    onBack?: () => void;
    onNext?: () => void;
}

import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard({ kpis, zones, violations, onBack, onNext }: DashboardProps) {
    const { socket } = useWebSocket();
    const [incidents, setIncidents] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_incident', (data: any) => {
            setIncidents(prev => [data, ...prev].slice(0, 10));
        });
        return () => { socket.off('new_incident'); };
    }, [socket]);
    const stats = [
        { label: 'Efficiency', value: `${kpis.efficiency || 92}%`, change: '+4.2%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Active Flow', value: kpis.total_vehicles, change: '+124', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Breaches', value: kpis.active_breaches, change: '-2', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Revenue Today', value: `₹${(kpis.revenue_today || 0).toLocaleString()}`, change: '+18%', icon: IndianRupee, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Uptime', value: `${kpis.system_uptime || 99.9}%`, change: '0%', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' }
    ];

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-tactical-card border border-tactical-border rounded-xl p-4 hover:border-blue-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Real-time Load Chart */}
                <div className="col-span-12 lg:col-span-8 bg-tactical-card border border-tactical-border rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity size={20} className="text-blue-500" />
                            Infrastructure Load
                        </h3>
                        <div className="flex gap-2">
                            <select className="bg-slate-900 border border-tactical-border text-xs text-gray-300 rounded px-2 py-1">
                                <option>Last 24 Hours</option>
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={zones.map(z => ({ name: z.name.split(' ')[0], value: z.current_count }))}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Zones Panel */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    {/* Incidents Feed */}
                    <div className="bg-tactical-card border border-tactical-border rounded-xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-rose-500 animate-pulse" />
                            Tactical Flares
                        </h3>
                        <div className="space-y-3">
                            {incidents.length === 0 && <p className="text-xs text-gray-600 italic">No active tactical flares...</p>}
                            {incidents.map((inc, i) => (
                                <div key={i} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in fade-in slide-in-from-right">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-rose-500 uppercase">{inc.type}</span>
                                        <span className="text-[9px] text-gray-500 font-mono">{new Date(inc.server_time).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 font-medium">Field Alert from Officer #77</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Original Live Zones */}
                    <div className="bg-tactical-card border border-tactical-border rounded-xl p-6 overflow-hidden flex flex-col h-64">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapIcon size={20} className="text-emerald-500" />
                            Live Zones
                        </h3>
                        {/* ... zonelist ... */}
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none">
                            {zones.map(zone => (
                                <div key={zone.id} className="bg-slate-900/50 p-3 rounded-lg border border-tactical-border">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-white truncate">{zone.name}</span>
                                        <span className="text-[9px] text-gray-500">{zone.current_count}/{zone.max_capacity}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: `${(zone.current_count/zone.max_capacity)*100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Violations */}
            <div className="bg-tactical-card border border-tactical-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Violations</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 text-left border-b border-tactical-border">
                                <th className="pb-3 font-medium">ZONE</th>
                                <th className="pb-3 font-medium">SEVERITY</th>
                                <th className="pb-3 font-medium">EXCESS</th>
                                <th className="pb-3 font-medium">E-CHALLAN</th>
                                <th className="pb-3 font-medium">TIME</th>
                                <th className="pb-3 font-medium text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {violations.slice(0, 5).map(v => (
                                <tr key={v.id} className="text-gray-300">
                                    <td className="py-3 font-medium">{v.zone_name || v.zone_id}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.severity === 'critical' ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
                                            }`}>
                                            {v.severity}
                                        </span>
                                    </td>
                                    <td className="py-3 text-red-400 font-mono">+{v.excess_count}</td>
                                    <td className="py-3 font-mono text-gray-400">#{v.id.slice(0, 8)}</td>
                                    <td className="py-3 text-gray-500">2 min ago</td>
                                    <td className="py-3 text-right">
                                        <button 
                                            onClick={() => {
                                                socket?.emit('deploy_response_team', {
                                                    violation_id: v.id,
                                                    zone_id: v.zone_id,
                                                    vehicle_number: v.vehicle_number
                                                });
                                                // Local instant feedback placeholder
                                                v.status = 'dispatched';
                                            }}
                                            className={`text-[10px] ${v.status === 'dispatched' ? 'bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1 rounded transition-colors`}
                                            disabled={v.status === 'dispatched'}
                                        >
                                            {v.status === 'dispatched' ? 'DISPATCHED' : 'DEPLOY TEAM'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
// Helper component for map icon
function MapIcon({ size, className }: { size?: number, className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
    );
}

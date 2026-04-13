import { useState } from 'react';
import { Shield, Lock, ChevronRight, ScanLine, Activity, Globe, User, Briefcase, AlertCircle, BadgeCheck, Smartphone } from 'lucide-react';
import { authAPI } from '../services/api';
import type { User as UserType } from '../types';

interface LoginPageProps {
    onLogin: (user: UserType, role: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('admin'); // admin, officer, contractor, user
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Bypass auth for public guest users
        if (role === 'user') {
            setLoading(true);
            setTimeout(() => {
                onLogin({ id: 'guest-1', username: 'Guest', email: 'guest@public', role: 'user', department: 'Public' }, role);
                setLoading(false);
            }, 800);
            return;
        }

        try {
            // Call actual backend API
            const response = await authAPI.login(email, password);

            // Store token
            localStorage.setItem('token', response.token);

            // Pass user and selected role back to App
            onLogin(response.user, role);
        } catch (err: any) {
            console.error('Login failed:', err);
            // Fallback for demo if backend is offline/mock
            if ((email === 'admin' && password === 'admin') || (email === 'officer' && password === 'officer') || (email === 'contractor' && password === 'contractor')) {
                onLogin({ id: `mock-${role}`, username: role, email: `${role}@mcd.gov.in`, role: role, department: 'Operations' }, role);
            } else {
                setError(`Invalid credentials or server offline. Try ${role}/${role} for demo.`);
            }
        } finally {
            if (role !== 'user') setLoading(false);
        }
    };

    const roles = [
        { id: 'admin', label: 'Admin', icon: Shield },
        { id: 'officer', label: 'Officer', icon: BadgeCheck },
        { id: 'contractor', label: 'Vendor', icon: Briefcase },
        { id: 'user', label: 'Citizen', icon: Smartphone },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex overflow-hidden relative font-inter">
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* Left Side: Impact Visuals */}
            <div className="hidden lg:flex lg:w-3/5 relative z-10 flex-col justify-between p-12 lg:p-16">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">MCD</div>
                        <span className="font-bold text-2xl tracking-tight text-blue-100">SMART ENFORCEMENT</span>
                    </div>

                    <h1 className="text-6xl font-black leading-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
                        NEXT GEN <br />
                        <span className="text-blue-500">CITY PARKING</span> <br />
                        CONTROL SYSTEM
                    </h1>

                    <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                        Advanced capacity management, automated violation detection, and real-time response coordination for New Delhi's parking infrastructure.
                    </p>
                </div>

                {/* Live System Stats Widget */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl max-w-md shadow-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">SYSTEM STATUS</p>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="font-mono text-emerald-400 text-sm">OPERATIONAL</span>
                            </div>
                        </div>
                        <Activity className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Active Sensors</span>
                            <span className="font-mono text-white">4,821</span>
                        </div>
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[92%] relative">
                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-white animate-pulse" />
                            </div>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">AI Detection Accuracy</span>
                            <span className="font-mono text-white">99.4%</span>
                        </div>
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[99%]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 lg:px-24 relative z-10 bg-slate-900/80 backdrop-blur-xl border-l border-slate-800 shadow-2xl">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-900/20 rounded-xl mb-6 ring-1 ring-blue-500/20">
                            <Shield className="w-8 h-8 text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2 text-white">Secure Access</h2>
                        <p className="text-slate-400">Authenticate via MCD credential login.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 group">
                        {/* Role Tab Selection */}
                        <div className="grid grid-cols-4 gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        setRole(r.id);
                                        setError(null);
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all ${role === r.id
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <r.icon size={16} />
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        {role !== 'user' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide ml-1">{role} ID / Email</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                            placeholder={role === 'admin' ? "admin" : `${role}@mcd.gov.in`}
                                        />
                                        <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide ml-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 font-mono tracking-widest"
                                            placeholder="••••••••"
                                        />
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                                    </div>
                                </div>
                            </>
                        )}

                        {role === 'user' && (
                            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-200 mb-2">Public Access Mode</p>
                                <p className="text-xs text-slate-400">
                                    You are entering the system as a Guest. You will have access to real-time parking availability and navigation features.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group-invalid:opacity-50 group-invalid:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.7)] ${loading ? 'opacity-80' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying Credentials...</span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        {role === 'user' ? 'Enter as Guest' : 'Initialize Dashboard'}
                                    </span>
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">
                            Authorized Personnel Only. All access is monitored and logged in the Security Ledger.
                            <br />System ID: <span className="font-mono text-slate-400">MCD-PROD-Alpha-01</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

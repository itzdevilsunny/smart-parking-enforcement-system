import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CityMap from './components/CityMap';
import AuditLedger from './components/AuditLedger';
import CitizenApp from './components/CitizenApp';
import LoginPage from './components/LoginPage';
import ZoneWizard from './components/ZoneWizard';
import ResponseTeam from './components/ResponseTeam';
import Enforcement from './components/Enforcement';
import VendorDashboard from './components/VendorDashboard';
import VoiceAssistant from './components/VoiceAssistant';
import OfficerTacticalView from './components/OfficerTacticalView';
import { useWebSocket } from './hooks/useWebSocket';
import { dashboardAPI } from './services/api';
import type { DashboardKPIs, ParkingZone, Violation, User, ParkingSession } from './types';

function App() {
    // Navigation History State
    const [history, setHistory] = useState<string[]>(['dashboard']); // Initial view
    const [currentIndex, setCurrentIndex] = useState(0);
    const view = history[currentIndex];

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string>('guest');

    // Data State
    const [zones, setZones] = useState<ParkingZone[]>([]);
    const [kpis, setKpis] = useState<DashboardKPIs | undefined>(undefined);
    const [violations, setViolations] = useState<Violation[]>([]);

    const { connected, subscribe } = useWebSocket();

    // Custom View Navigation Handler
    const handleViewChange = (newView: string) => {
        if (newView === view) return;

        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newView);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };

    const goBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const goForward = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    // Mock Data Constants (Aligned with Types)
    const MOCK_KPI_DATA: DashboardKPIs = {
        total_zones: 6,
        total_spots: 1250,
        occupied_spots: 840,
        avg_occupancy: 67,
        active_breaches: 5,
        ai_status: 'online',
        system_health: 'healthy',
        active_zones: 6,
        revenue_today: 45000,
        total_vehicles: 840,
        system_uptime: 99.9,
    };

    const MOCK_ZONES_DATA: ParkingZone[] = [
        { id: 'z1', name: 'Connaught Place', max_capacity: 150, current_count: 120, status: 'active', capacity_status: 'over_capacity', location_name: 'Central', location_lat: 28.6328, location_lng: 77.2197, reserved_slots: 5, grace_threshold: 10, fine_per_excess: 500 },
        { id: 'z2', name: 'Khan Market', max_capacity: 80, current_count: 75, status: 'active', capacity_status: 'near_capacity', location_name: 'South', location_lat: 28.6001, location_lng: 77.2270, reserved_slots: 2, grace_threshold: 5, fine_per_excess: 1000 },
        { id: 'z3', name: 'Lajpat Nagar', max_capacity: 200, current_count: 110, status: 'active', capacity_status: 'normal', location_name: 'South East', location_lat: 28.5677, location_lng: 77.2433, reserved_slots: 10, grace_threshold: 15, fine_per_excess: 300 },
        { id: 'z4', name: 'Karol Bagh', max_capacity: 120, current_count: 95, status: 'active', capacity_status: 'near_capacity', location_name: 'West', location_lat: 28.6441, location_lng: 77.1884, reserved_slots: 0, grace_threshold: 0, fine_per_excess: 0 },
        { id: 'z5', name: 'Chandni Chowk', max_capacity: 300, current_count: 280, status: 'active', capacity_status: 'over_capacity', location_name: 'North', location_lat: 28.6562, location_lng: 77.2300, reserved_slots: 0, grace_threshold: 0, fine_per_excess: 0 },
        { id: 'z6', name: 'Saket', max_capacity: 400, current_count: 150, status: 'active', capacity_status: 'normal', location_name: 'South', location_lat: 28.5285, location_lng: 77.2218, reserved_slots: 0, grace_threshold: 0, fine_per_excess: 0 },
    ];

    const MOCK_VIOLATIONS_DATA: Violation[] = [
        { id: 'v1', zone_id: 'z2', zone_name: 'Khan Market', vehicle_number: 'DL-3C-AB-1234', violation_type: 'Overstay', status: 'pending', severity: 'medium', excess_count: 1, fine_amount: 500, detected_at: new Date().toISOString() },
        { id: 'v2', zone_id: 'z1', zone_name: 'Connaught Place', vehicle_number: 'UP-16-Z-1002', violation_type: 'No Parking', status: 'pending', severity: 'high', excess_count: 0, fine_amount: 1000, detected_at: new Date(Date.now() - 900000).toISOString() }
    ];

    // Mock User History (For Citizen App)
    const MOCK_USER_HISTORY: ParkingSession[] = [
        { id: 's1', zone_id: 'z1', zone_name: 'Connaught Place', vehicle_number: 'DL-3C-AB-1234', start_time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), cost: 45, status: 'active' },
        { id: 's2', zone_id: 'z3', zone_name: 'Lajpat Nagar', vehicle_number: 'DL-3C-AB-1234', start_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), end_time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), cost: 120, status: 'completed' },
        { id: 's3', zone_id: 'z2', zone_name: 'Khan Market', vehicle_number: 'DL-3C-AB-1234', start_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), end_time: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(), cost: 80, status: 'completed' }
    ];

    // Load initial data on login
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            try {
                const [liveZones, liveKPIs, activeViolations] = await Promise.all([
                    dashboardAPI.getZonesLive().catch(() => null), // Catch individual failures
                    dashboardAPI.getKPIs().catch(() => null),
                    dashboardAPI.getActiveViolations().catch(() => [])
                ]);

                // Apply Live Data OR Fallback
                if (liveZones && liveZones.length > 0) {
                    setZones(liveZones);
                } else {
                    console.warn('Using Mock Zones (API empty)');
                    setZones(MOCK_ZONES_DATA);
                }

                if (liveKPIs) {
                    setKpis(liveKPIs);
                } else {
                    console.warn('Using Mock KPIs (API empty)');
                    setKpis(MOCK_KPI_DATA);
                }

                if (activeViolations && activeViolations.length > 0) {
                    setViolations(activeViolations);
                } else {
                    setViolations(MOCK_VIOLATIONS_DATA);
                }
            } catch (err) {
                console.warn('Backend Critical Failure, using absolute fallback');
                setKpis(MOCK_KPI_DATA);
                setZones(MOCK_ZONES_DATA);
                setViolations(MOCK_VIOLATIONS_DATA);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    // Handle Real-time Updates
    useEffect(() => {
        if (!connected || !isAuthenticated) return;

        const unsubOccupancy = subscribe('occupancy_update', (data) => {
            setZones(prev => prev.map(z =>
                z.id === data.zone_id
                    ? { ...z, current_count: data.current_count, last_updated: data.timestamp }
                    : z
            ));

            // Update Total Vehicles KPI locally
            if (kpis) {
                setKpis(prev => prev ? ({
                    ...prev,
                    total_vehicles: zones.reduce((acc, z) =>
                        z.id === data.zone_id ? acc + data.current_count : acc + (z.current_count || 0), 0)
                }) : undefined);
            }
        });

        const unsubViolation = subscribe('violation_detected', (data) => {
            setViolations(prev => [data, ...prev]);
            if (kpis) {
                setKpis(prev => prev ? ({ ...prev, active_breaches: prev.active_breaches + 1 }) : undefined);
            }

            // Play alert sound
            new Audio('/alert.mp3').play().catch(() => { });
        });

        return () => {
            unsubOccupancy();
            unsubViolation();
        };
    }, [connected, subscribe, zones, isAuthenticated, kpis]);

    const handleLoginSuccess = (user: User, role: string) => {
        setUser(user);
        setUserRole(role);
        setIsAuthenticated(true);

        // Redirect based on role and reset history
        if (role === 'user') {
            setHistory(['citizen']);
            setCurrentIndex(0);
        } else if (role === 'officer' || role === 'police') {
            setHistory(['tactical']);
            setCurrentIndex(0);
        } else {
            setHistory(['dashboard']);
            setCurrentIndex(0);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole('guest');
        setHistory(['dashboard']);
        setCurrentIndex(0);
        localStorage.removeItem('token');
    };

    // Handle Wizard Completion
    const handleZoneCreated = (newZone: ParkingZone) => {
        setZones(prev => [...prev, newZone]);

        // Return to dashboard
        setHistory(prev => [...prev, 'dashboard']);
        setCurrentIndex(prev => prev + 1);

        // Show simulated alert (in a real app, uses toast)
        console.log(`Zone created: ${newZone.name}`);
    };

    // Handle Dispatch from Enforcement to Response Team
    const handleEnforcementDispatch = (violation: Violation) => {
        handleViewChange('response');
    };

    const handleVoiceAction = (command: string, details: string) => {
        console.log('Voice Command Received:', command, details);
        
        switch (command) {
            case 'REPORT_VIOLATION':
                handleViewChange('violations');
                // Auto-fill would happen here in a real scenario
                break;
            case 'GET_STATUS':
                handleViewChange('dashboard');
                break;
            case 'SHOW_MAP':
                handleViewChange('map');
                break;
            case 'SHOW_LEDGER':
                handleViewChange('ledger');
                break;
            case 'SHOW_CITIZEN':
                handleViewChange('citizen');
                break;
            case 'SHOW_RESPONSE':
            case 'SHOW_ENFORCEMENT':
                handleViewChange('tactical');
                break;
            case 'SHOW_WIZARD':
                handleViewChange('wizard');
                break;
            case 'LOGOUT':
                handleLogout();
                break;
            case 'NAVIGATE_NEAREST':
                handleViewChange('map'); // Switch to map and focus nearest
                break;
            case 'PROCESS_PAYMENT':
                console.log('Voice Payment Verified');
                handleViewChange('citizen');
                break;
            case 'REFRESH':
                setIsAuthenticated(false);
                setTimeout(() => setIsAuthenticated(true), 100);
                break;
        }
    };

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLoginSuccess} />;
    }

    // Render UI
    const renderContent = () => {
        if (view === 'citizen' && userRole === 'user') {
            return <CitizenApp zones={zones} user={user} history={MOCK_USER_HISTORY} />;
        }

        if (view === 'tactical' && (userRole === 'officer' || userRole === 'police')) {
            return <OfficerTacticalView />;
        }

        return (
            <div className="flex h-screen bg-tactical-bg text-gray-100 overflow-hidden font-inter">
                <Sidebar currentView={view} setView={handleViewChange} onLogout={handleLogout} />

                <main className="flex-1 flex flex-col min-w-0">
                    <Header
                        kpis={kpis}
                        onBack={goBack}
                        onForward={goForward}
                        canBack={currentIndex > 0}
                        canForward={currentIndex < history.length - 1}
                    >
                        {userRole !== 'user' && view === 'dashboard' && (
                            <button
                                onClick={() => handleViewChange('wizard')}
                                className="ml-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                            >
                                <span>+ Create Zone</span>
                            </button>
                        )}
                    </Header>

                    <div className="flex-1 overflow-auto p-6 scrollbar-thin">
                        {view === 'dashboard' && kpis && (
                            <Dashboard
                                kpis={kpis}
                                zones={zones}
                                violations={violations}
                                onBack={goBack}
                                onNext={goForward}
                            />
                        )}
                        {view === 'wizard' && (
                            <ZoneWizard
                                onCancel={() => goBack()}
                                onComplete={handleZoneCreated}
                            />
                        )}
                        {view === 'map' && <CityMap zones={zones} />}
                        {view === 'ledger' && <AuditLedger />}
                        {view === 'citizen' && (
                            <div className="h-full border border-tactical-border rounded-xl overflow-hidden shadow-2xl relative">
                                <CitizenApp zones={zones} user={user || { id: 'admin-sim', username: 'Admin Simulator', email: 'admin@mcd.gov.in', role: 'admin' }} history={MOCK_USER_HISTORY} />
                            </div>
                        )}
                        {view === 'violations' && (
                            <Enforcement
                                violations={violations}
                                zones={zones}
                                onDispatch={handleEnforcementDispatch}
                            />
                        )}
                        {view === 'response' && (
                            <ResponseTeam violations={violations} zones={zones} />
                        )}
                        {view === 'tactical' && <OfficerTacticalView />}
                    </div>
                </main>
            </div>
        );
    };

    return (
        <>
            {renderContent()}
            <VoiceAssistant
                onCommand={handleVoiceAction}
                kpis={kpis}
                zones={zones}
                userHistory={MOCK_USER_HISTORY}
                userRole={userRole}
                currentView={view}
            />
        </>
    );
}

export default App;

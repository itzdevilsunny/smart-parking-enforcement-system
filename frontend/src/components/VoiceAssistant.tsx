import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Zap, ShieldAlert, Loader2 } from 'lucide-react';
import type { DashboardKPIs, ParkingZone } from '../types';

interface VoiceAssistantProps {
    onCommand?: (command: string, details: string) => void;
    kpis?: DashboardKPIs;
    zones?: ParkingZone[];
    userHistory?: any[];
    userRole?: string;
    currentView?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
    onCommand, kpis, zones, userHistory, userRole, currentView 
}) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [paymentPending, setPaymentPending] = useState(false);
    const [permError, setPermError] = useState(false);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = useRef<any>(null);

    if (!recognition.current && SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = 'en-US';
    }

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = /[\u0900-\u097F]/.test(message) ? 'hi-IN' : 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const isAdminAction = (text: string) => {
        const adminKeywords = ['revenue', 'paisa', 'kamayi', 'collection', 'team', 'dispatch', 'response', 'wizard', 'add zone', 'naya zone'];
        return adminKeywords.some(key => text.toLowerCase().includes(key));
    };

    const processCommandTurbo = async (text: string) => {
        const lower = text.toLowerCase().trim();
        
        // --- SECURITY GATE ---
        if (userRole === 'user' && isAdminAction(lower)) {
            speak("Access Denied. You do not have permission to access management features.");
            setPermError(true);
            setTimeout(() => setPermError(false), 3000);
            return;
        }

        // --- CITIZEN PORTAL COMMANDS ---
        if (lower.includes('my history') || lower.includes('parking history')) {
            speak("Showing your parking records.");
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (lower.includes('where is my car') || lower.includes('meri gadi')) {
            speak("Tracing your active session. Displaying your vehicle details now.");
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (lower.includes('pay') || lower.includes('checkout')) {
            speak("Opening your current bill for payment.");
            onCommand?.('SHOW_CITIZEN', '');
            setPaymentPending(true);
            return;
        }

        if (paymentPending && (lower.includes('confirm') || lower.includes('yes'))) {
            speak("Payment confirmed. FastTag transaction successful.");
            setPaymentPending(false);
            onCommand?.('PROCESS_PAYMENT', '');
            return;
        }

        // --- GLOBAL COMMANDS ---
        if (lower.includes('map') || lower.includes('navigate') || lower.includes('location')) {
            speak("Opening live parking map.");
            onCommand?.('SHOW_MAP', '');
            return;
        }

        if (lower.includes('logout') || lower.includes('exit')) {
            speak("Signing you out of the portal.");
            onCommand?.('LOGOUT', '');
            return;
        }

        // --- ADMIN ONLY COMMANDS (Gated already above) ---
        if (userRole !== 'user') {
            if (lower.includes('revenue') || lower.includes('kamayi')) {
                speak(`Total collection is ${kpis?.revenue_today || 0} rupees.`);
                onCommand?.('GET_STATUS', '');
                return;
            }
            if (lower.includes('response') || lower.includes('team')) {
                speak("Opening enforcement dispatch center.");
                onCommand?.('SHOW_RESPONSE', '');
                return;
            }
            if (lower.includes('add zone') || lower.includes('new zone')) {
                speak("Launching zone creation wizard.");
                onCommand?.('SHOW_WIZARD', '');
                return;
            }
        }

        // AI FALLBACK (Also Gates by Role)
        setIsProcessing(true);
        try {
            const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://smart-parking-backend-1p4n.onrender.com';
            const response = await fetch(`${apiBase}/api/voice/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, role: userRole })
            });
            const data = await response.json();
            if (data.feedback) speak(data.feedback);
            if (data.command && data.command !== 'UNKNOWN') onCommand?.(data.command, '');
        } catch (e) {
            speak("Unknown command for this portal. Say help for options.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!recognition.current) return;
        recognition.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setLastTranscript(transcript);
            processCommandTurbo(transcript);
        };
        recognition.current.onend = () => setIsListening(false);
    }, [userRole, currentView, paymentPending, userHistory]);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end space-y-4">
            {permError && (
                <div className="bg-rose-600 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Restricted Action</span>
                </div>
            )}
            
            {lastTranscript && (
                <div className="bg-white p-4 rounded-2xl shadow-2xl border-b-4 border-indigo-600">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">
                        {userRole === 'user' ? 'Citizen Voice' : 'Admin Voice'}
                    </p>
                    <p className="text-sm font-bold text-slate-800">"{lastTranscript}"</p>
                </div>
            )}

            <button
                onClick={isListening ? () => recognition.current?.stop() : () => recognition.current?.start()}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-rose-500 ring-8 ring-rose-500/10' : 'bg-indigo-600 ring-8 ring-indigo-600/10'
                } text-white`}
            >
                {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
            </button>
        </div>
    );
};

export default VoiceAssistant;

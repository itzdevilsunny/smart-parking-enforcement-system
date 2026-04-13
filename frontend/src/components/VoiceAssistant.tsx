import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Zap, BrainCircuit, Loader2 } from 'lucide-react';
import type { DashboardKPIs, ParkingZone } from '../types';

interface VoiceAssistantProps {
    onCommand?: (command: string, details: string) => void;
    kpis?: DashboardKPIs;
    zones?: ParkingZone[];
    userHistory?: any[];
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, kpis, zones, userHistory }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [paymentPending, setPaymentPending] = useState(false);

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

    const processCommandTurbo = async (text: string) => {
        const lower = text.toLowerCase().trim();
        console.log('Turbo Brain Input:', lower);

        // 🟢 1. INSTANT LOCAL NLU (Highest Accuracy + Speed)
        
        // Navigation & Home
        if (lower.includes('home') || lower.includes('dashboard') || lower.includes('back home') || lower.includes('wapas jao')) {
            speak("Going to home dashboard.");
            onCommand?.('GET_STATUS', '');
            return;
        }

        if (lower.includes('map') || lower.includes('navigate') || lower.includes('rasta') || lower.includes('dikhao') || lower.includes('location')) {
            speak("Opening map navigation.");
            onCommand?.('SHOW_MAP', '');
            return;
        }

        if (lower.includes('next') || lower.includes('aage')) {
            speak("Moving to next screen.");
            onCommand?.('REFRESH', ''); // Or specialized next logic
            return;
        }

        // Enforcement & Dispatch
        if (lower.includes('response team') || lower.includes('dispatch') || lower.includes('police') || lower.includes('team')) {
            speak("Opening response team dispatch.");
            onCommand?.('SHOW_RESPONSE', '');
            return;
        }

        if (lower.includes('new zone') || lower.includes('add zone') || lower.includes('naya zone') || lower.includes('wizard')) {
            speak("Opening zone creation wizard.");
            onCommand?.('SHOW_WIZARD', '');
            return;
        }

        // History & Challan
        if (lower.includes('parking history') || lower.includes('my history') || lower.includes('purana parking') || lower.includes('beeta hua')) {
            const sessions = userHistory?.length || 0;
            speak(`Showing your history of ${sessions} trips.`);
            onCommand?.('SHOW_CITIZEN', ''); // Switch to History View
            return;
        }

        if (lower.includes('system history') || lower.includes('challan') || lower.includes('ledger') || lower.includes('records')) {
            speak("Opening all challan and penalty records.");
            onCommand?.('SHOW_LEDGER', ''); // Switch to Ledger View
            return;
        }

        // Citizen Specific
        if (lower.includes('where is my car') || lower.includes('meri gadi') || lower.includes('vehicle status')) {
            speak("Your vehicle is in Zone Alpha. Switching to your live dashboard.");
            onCommand?.('SHOW_CITIZEN', ''); // Switch to Citizen View
            return;
        }

        // Payments
        if (paymentPending) {
            if (lower.includes('yes') || lower.includes('confirm') || lower.includes('haan') || lower.includes('pay')) {
                speak("Payment successful. Drive safely!");
                setPaymentPending(false);
                onCommand?.('PROCESS_PAYMENT', ''); // Execute Payment
            } else {
                speak("Payment cancelled.");
                setPaymentPending(false);
            }
            return;
        }

        if (lower.includes('pay') || lower.includes('paisa') || lower.includes('checkout') || lower.includes('bhugtan')) {
            speak("Your bill is ready. Opening payment portal.");
            onCommand?.('SHOW_CITIZEN', ''); // Switch to Payment context
            setPaymentPending(true);
            return;
        }

        // System Queries (Admin/Officer)
        if (lower.includes('revenue') || lower.includes('kamayi') || lower.includes('collection')) {
            speak(`Total collection is ${kpis?.revenue_today || 0} rupees. Showing financial summary.`);
            onCommand?.('GET_STATUS', ''); // Switch to Dashboard View
            return;
        }

        // 🟡 2. AI FALLBACK (Only for complex sentences)
        setIsProcessing(true);
        try {
            const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://smart-parking-backend-1p4n.onrender.com';
            const response = await fetch(`${apiBase}/api/voice/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            if (data.feedback) speak(data.feedback);
            if (data.command && data.command !== 'UNKNOWN') onCommand?.(data.command, '');
        } catch (e) {
            speak("I heard you, but I'm having trouble connecting to the cloud. Try simplified commands.");
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
    }, [userHistory, kpis, zones, paymentPending]);

    const startListening = () => {
        recognition.current?.start();
        setIsListening(true);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end space-y-4">
            {lastTranscript && (
                <div className="bg-white p-4 rounded-2xl shadow-2xl border-b-4 border-indigo-600 animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instant Voice</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">"{lastTranscript}"</p>
                </div>
            )}

            <button
                onClick={isListening ? () => recognition.current?.stop() : startListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                    isListening ? 'bg-rose-500 ring-8 ring-rose-500/20' : 'bg-indigo-600 ring-8 ring-indigo-600/20'
                } text-white`}
            >
                {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
        </div>
    );
};

export default VoiceAssistant;

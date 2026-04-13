import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, CheckCircle, CreditCard, Languages } from 'lucide-react';
import type { DashboardKPIs, ParkingZone } from '../types';

interface VoiceAssistantProps {
    onCommand?: (command: string, details: string) => void;
    kpis?: DashboardKPIs;
    zones?: ParkingZone[];
    userHistory?: any[];
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, kpis, zones, userHistory }) => {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [paymentPending, setPaymentPending] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // Supports mixed speech usually
    }

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        // Auto-detect language for voice output
        if (/[\u0900-\u097F]/.test(message)) {
            utterance.lang = 'hi-IN';
        } else {
            utterance.lang = 'en-US';
        }
        window.speechSynthesis.speak(utterance);
    };

    const startListening = useCallback(() => {
        if (!recognition) return;
        try {
            recognition.start();
            setIsListening(true);
        } catch (err) {
            console.error('Speech recognition error:', err);
        }
    }, [recognition]);

    const stopListening = useCallback(() => {
        if (!recognition) return;
        recognition.stop();
        setIsListening(false);
    }, [recognition]);

    const processCommand = (text: string) => {
        console.log('Multilingual Logic:', text);

        // 💳 PAYMENT FLOW (Hindi/English)
        if (paymentPending) {
            if (text.includes('confirm') || text.includes('yes') || text.includes('haan') || text.includes('pay')) {
                speak("Payment received. Done. Shukriya!");
                setPaymentPending(false);
                onCommand?.('PROCESS_PAYMENT', '');
            } else {
                speak("Payment cancelled.");
                setPaymentPending(false);
            }
            return;
        }

        // 💰 REVENUE (English/Hindi)
        if (text.includes('revenue') || text.includes('collection') || text.includes('paisa') || text.includes('kamaya')) {
            const rev = kpis?.revenue_today || 0;
            speak(`Today's collection is ${rev} rupees. Aaj ki kamayi ${rev} rupaye hai.`);
            return;
        }

        // 🗺️ MAP (English/Hindi)
        if (text.includes('map') || text.includes('dikhao') || text.includes('location')) {
            speak('Opening Map. Map khul raha hai.');
            onCommand?.('SHOW_MAP', '');
            return;
        }

        // 🚗 HISTORY & VEHICLES (English/Hindi)
        if (text.includes('history') || text.includes('purana') || text.includes('pehle')) {
            speak("Opening your parking history. Aapka parking history khul raha hai.");
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (text.includes('gadi') || text.includes('car') || text.includes('vehicle')) {
            speak("Your vehicle is parked in Zone A. Aapki gadi Zone A mein hai.");
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        // ⚖️ VIOLATIONS (English/Hindi)
        if (text.includes('violation') || text.includes('fine') || text.includes('challan') || text.includes('galti')) {
            speak("Opening violations. Challan history khul rahi hai.");
            onCommand?.('SHOW_LEDGER', '');
            return;
        }

        // 🔓 LOGOUT
        if (text.includes('logout') || text.includes('band karo')) {
            speak("Logging out. Alvida!");
            onCommand?.('LOGOUT', '');
            return;
        }

        if (text.includes('help') || text.includes('madad')) {
            speak("I can help with revenue, map, history, and payments. Mein revenue, map, aur payment mein madad kar sakta hoon.");
            return;
        }

        speak("I didn't understand. Phirse koshish karein.");
    };

    useEffect(() => {
        if (!recognition) return;
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            processCommand(transcript);
        };
        recognition.onend = () => setIsListening(false);
    }, [recognition, zones, userHistory, paymentPending]);

    if (!recognition) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end space-y-4">
            {lastTranscript && (
                <div className="bg-slate-9 border-t-4 border-indigo-500 bg-white p-4 rounded-xl shadow-2xl max-w-xs animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-1">
                        <Languages className="w-3 h-3 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-tighter">Voice Processing</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">"{lastTranscript}"</p>
                </div>
            )}

            <button
                onClick={isListening ? stopListening : startListening}
                className={`group flex items-center justify-center w-16 h-16 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all duration-500 hover:scale-110 active:scale-90 ${
                    isListening ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'
                } text-white`}
            >
                <div className="relative">
                    {isListening ? (
                        <MicOff className="w-7 h-7" />
                    ) : (
                        <Mic className="w-7 h-7 transition-transform group-hover:rotate-12" />
                    )}
                    {paymentPending && (
                        <div className="absolute -top-10 -left-10 bg-yellow-400 text-black p-2 rounded-lg text-[10px] font-black shadow-xl animate-bounce">
                            CONFIRM?
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
};

export default VoiceAssistant;

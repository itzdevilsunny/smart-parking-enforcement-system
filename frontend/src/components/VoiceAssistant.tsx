import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, CheckCircle, CreditCard } from 'lucide-react';
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
        recognition.lang = 'en-US';
    }

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
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
        console.log('Voice Payment Logic:', text);

        // 💳 PAYMENT CONFIRMATION STATE
        if (paymentPending) {
            if (text.includes('confirm') || text.includes('yes') || text.includes('pay')) {
                speak("Payment received. Processing with FastTag. You are all set.");
                setPaymentPending(false);
                setStatusMessage("Payment Complete! ✅");
                onCommand?.('PROCESS_PAYMENT', '');
                setTimeout(() => setStatusMessage(null), 3000);
            } else {
                speak("Payment cancelled. You can pay manually later.");
                setPaymentPending(false);
            }
            return;
        }

        // 💰 INITIATE PAYMENT
        if (text.includes('pay') || text.includes('checkout') || text.includes('clear dues')) {
            const amount = 60; // Mock amount
            speak(`Your current bill is ${amount} rupees. Say Confirm to pay now using your wallet.`);
            setPaymentPending(true);
            setStatusMessage("Waiting for Confirmation...");
            return;
        }

        // 🚗 CITIZEN QUERIES
        if (text.includes('history') || text.includes('trips')) {
            const count = userHistory?.length || 0;
            speak(`You have ${count} previous sessions. Your last trip was to CP Block A.`);
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (text.includes('where is my car') || text.includes('my vehicle')) {
            speak("Your vehicle DL-5C-4321 is currently in CP Block A. Session active for 45 minutes.");
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        // 🗺️ NAVIGATION
        if (text.includes('nearest') || text.includes('find parking') || text.includes('navigate')) {
            speak('Searching for nearest available parking via GPS.');
            onCommand?.('NAVIGATE_NEAREST', '');
            return;
        }

        // 📊 SYSTEM (Admin/Officer)
        if (text.includes('revenue') || text.includes('money')) {
            speak(`Total revenue is ${kpis?.revenue_today || 0} rupees.`);
            return;
        }

        if (text.includes('map') || text.includes('show map')) {
            speak('Opening city map.');
            onCommand?.('SHOW_MAP', '');
            return;
        }

        if (text.includes('dashboard') || text.includes('home')) {
            speak('Going to main dashboard.');
            onCommand?.('GET_STATUS', '');
            return;
        }

        if (text.includes('logout')) {
            speak('Logging out. Drive safely.');
            onCommand?.('LOGOUT', '');
            return;
        }

        if (text.includes('help')) {
            speak('You can say: Pay for my parking, Show my history, Find nearest parking, or Check revenue.');
            return;
        }

        speak("I heard you, but I don't have a command for that. Say help for options.");
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
        <div className="fixed bottom-6 right-6 z-[9999]">
            <div className="flex flex-col items-end space-y-3">
                {statusMessage && (
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-2xl animate-bounce flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">{statusMessage}</span>
                    </div>
                )}
                
                {lastTranscript && (
                    <div className="bg-white/95 border-l-4 border-indigo-500 px-4 py-3 rounded-xl shadow-2xl max-w-xs transition-all">
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">Live Transcript</p>
                        <p className="text-sm font-bold text-gray-800">"{lastTranscript}"</p>
                    </div>
                )}

                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`relative p-5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
                        isListening ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'
                    } text-white`}
                    title="Voice Assistant & Payment"
                >
                    {isListening ? (
                        <MicOff className="w-8 h-8" />
                    ) : (
                        <>
                            {paymentPending && <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-1 rounded-full animate-ping"><CreditCard className="w-4 h-4" /></div>}
                            <Mic className="w-8 h-8" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;

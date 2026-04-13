import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { DashboardKPIs, ParkingZone } from '../types';

interface VoiceAssistantProps {
    onCommand?: (command: string, details: string) => void;
    kpis?: DashboardKPIs;
    zones?: ParkingZone[];
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, kpis, zones }) => {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    }

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

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            processCommand(transcript);
        };

        recognition.onend = () => setIsListening(false);
    }, [recognition]);

    const processCommand = (text: string) => {
        console.log('Voice Command:', text);

        // DATA QUERY COMMANDS (Reading from live state)
        if (text.includes('revenue') || text.includes('earn') || text.includes('money')) {
            const amount = kpis?.revenue_today || 0;
            speak(`Today's total revenue is ${amount} rupees.`);
            return;
        }

        if (text.includes('much occupancy') || text.includes('busy')) {
            const occ = kpis?.avg_occupancy || 0;
            speak(`Current occupancy across all zones is ${occ} percent.`);
            return;
        }

        if (text.includes('health') || text.includes('online')) {
            const status = kpis?.system_health || 'unknown';
            speak(`System health is currently ${status}. All modules are operational.`);
            return;
        }

        if (text.includes('many violations') || text.includes('breaches')) {
            const count = kpis?.active_breaches || 0;
            speak(`There are currently ${count} active parking violations requiring attention.`);
            return;
        }

        // NAVIGATION COMMANDS
        if (text.includes('dashboard') || text.includes('home') || text.includes('summary')) {
            speak('Navigating to dashboard.');
            onCommand?.('GET_STATUS', '');
            return;
        }

        if (text.includes('map') || text.includes('show location') || text.includes('where is')) {
            speak('Opening live parking map.');
            onCommand?.('SHOW_MAP', '');
            return;
        }

        if (text.includes('response') || text.includes('dispatch') || text.includes('team')) {
            speak('Opening response team dispatch.');
            onCommand?.('SHOW_RESPONSE', '');
            return;
        }

        if (text.includes('wizard') || text.includes('create zone') || text.includes('add zone')) {
            speak('Opening zone creation wizard.');
            onCommand?.('SHOW_WIZARD', '');
            return;
        }

        if (text.includes('enforce') || text.includes('report') || text.includes('violation')) {
            speak('Opening enforcement overview.');
            onCommand?.('REPORT_VIOLATION', '');
            return;
        }

        if (text.includes('ledger') || text.includes('audit') || text.includes('history')) {
            speak('Opening audit ledger logs.');
            onCommand?.('SHOW_LEDGER', '');
            return;
        }

        if (text.includes('logout') || text.includes('sign out')) {
            speak('Logging you out of the system. Drive safely.');
            onCommand?.('LOGOUT', '');
            return;
        }

        if (text.includes('refresh') || text.includes('update')) {
            speak('Refreshing live data.');
            onCommand?.('REFRESH', '');
            return;
        }

        // Catch-all
        speak("I heard your request, but that feature is not yet mapped to a voice command.");
    };

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    };

    if (!recognition) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="flex flex-col items-end space-y-3">
                {lastTranscript && (
                    <div className="bg-white/90 backdrop-blur-md border border-indigo-100 px-4 py-2 rounded-2xl shadow-xl max-w-xs transition-opacity duration-300">
                        <p className="text-sm font-medium text-indigo-600 italic">"{lastTranscript}"</p>
                    </div>
                )}
                
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
                        isListening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600'
                    } text-white`}
                >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;

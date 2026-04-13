import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
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

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    };

    const findNearestParking = () => {
        if (!navigator.geolocation || !zones || zones.length === 0) {
            speak("I need GPS access to find the nearest parking.");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            let nearestZone: ParkingZone | null = null;
            let minDistance = Infinity;

            zones.forEach(zone => {
                const dist = Math.sqrt(Math.pow(latitude - zone.location_lat, 2) + Math.pow(longitude - zone.location_lng, 2));
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestZone = zone;
                }
            });

            if (nearestZone) {
                speak(`The nearest parking area is ${nearestZone.name}. Switch to Map view for directions.`);
                onCommand?.('NAVIGATE_NEAREST', (nearestZone as any).id);
            }
        });
    };

    useEffect(() => {
        if (!recognition) return;
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            processCommand(transcript);
        };
        recognition.onend = () => setIsListening(false);
    }, [recognition, zones, userHistory]);

    const processCommand = (text: string) => {
        console.log('Voice Analysis:', text);

        // 🟢 CITIZEN SPECIFIC COMMANDS
        if (text.includes('my history') || text.includes('parking history') || text.includes('previous parking')) {
            if (userHistory && userHistory.length > 0) {
                const last = userHistory[0];
                speak(`Your last parking was at ${last.zoneName} for ${last.amount} rupees. You have ${userHistory.length} total sessions in your history.`);
            } else {
                speak("You don't have any parking history yet.");
            }
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (text.includes('my vehicles') || text.includes('parked cars') || text.includes('where is my car')) {
            speak("You currently have 1 vehicle parked at CP Block A. The session has been active for 45 minutes.");
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (text.includes('nearest') || text.includes('navigate') || text.includes('directions')) {
            speak('Locating nearest parking zones via GPS.');
            findNearestParking();
            return;
        }

        // 🟠 SYSTEM & NAVIGATION
        if (text.includes('map') || text.includes('where is parking')) {
            speak('Opening city parking map.');
            onCommand?.('SHOW_MAP', '');
            return;
        }

        if (text.includes('revenue') || text.includes('earnings')) {
            speak(`Total revenue today is ${kpis?.revenue_today || 0} rupees.`);
            return;
        }

        if (text.includes('portal') || text.includes('citizen')) {
            speak('Opening citizen portal.');
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (text.includes('challan') || text.includes('history')) {
            speak('Opening violation history.');
            onCommand?.('SHOW_LEDGER', '');
            return;
        }

        if (text.includes('home') || text.includes('dashboard')) {
            speak('Taking you to the home dashboard.');
            onCommand?.('GET_STATUS', '');
            return;
        }

        if (text.includes('logout')) {
            speak('Logging out. See you next time.');
            onCommand?.('LOGOUT', '');
            return;
        }

        if (text.includes('help')) {
            speak('You can ask for nearest parking, your parking history, your vehicles, or revenue status.');
            return;
        }

        speak("I heard you, but I don't know that command. Say help for a list.");
    };

    if (!recognition) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <div className="flex flex-col items-end space-y-3">
                {lastTranscript && (
                    <div className="bg-white/95 backdrop-blur-sm border-2 border-indigo-400 px-4 py-2 rounded-2xl shadow-2xl max-w-xs transition-all animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm font-bold text-indigo-700 italic">"{lastTranscript}"</p>
                    </div>
                )}
                
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                        isListening ? 'bg-rose-600 animate-pulse ring-4 ring-rose-200' : 'bg-indigo-600 ring-4 ring-indigo-200'
                    } text-white`}
                    title="Voice Assistant"
                >
                    {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;

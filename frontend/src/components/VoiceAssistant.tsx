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

    // Helpers
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
    };

    const findNearestParking = () => {
        if (!navigator.geolocation || !zones || zones.length === 0) {
            speak("I need GPS access to find the nearest parking. Please check your permissions.");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            let nearestZone: ParkingZone | null = null;
            let minDistance = Infinity;

            zones.forEach(zone => {
                const dist = calculateDistance(latitude, longitude, zone.location_lat, zone.location_lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestZone = zone;
                }
            });

            if (nearestZone) {
                speak(`The nearest parking area is ${(nearestZone as any).name}. It is now highlighted on your map.`);
                onCommand?.('NAVIGATE_NEAREST', (nearestZone as any).id);
            }
        });
    };

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (!recognition) return;
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            processCommand(transcript);
        };
        recognition.onend = () => setIsListening(false);
    }, [recognition, zones]);

    const processCommand = (text: string) => {
        console.log('Voice Assist:', text);

        // NAVIGATION & GPS
        if (text.includes('nearest') || text.includes('nearest parking') || text.includes('where can i park') || text.includes('directions')) {
            speak('Calculating your GPS position to find the nearest zone.');
            findNearestParking();
            return;
        }

        // PORTAL COMMANDS
        if (text.includes('citizen app') || text.includes('citizen portal') || text.includes('open portal')) {
            speak('Opening the citizen parking portal.');
            onCommand?.('SHOW_CITIZEN', '');
            return;
        }

        if (text.includes('challan') || text.includes('fine') || text.includes('penalty') || text.includes('receipt')) {
            speak('Opening challan and violation history.');
            onCommand?.('SHOW_LEDGER', '');
            return;
        }

        if (text.includes('dispatch') || text.includes('send team') || text.includes('response')) {
            speak('Opening response team management.');
            onCommand?.('SHOW_RESPONSE', '');
            return;
        }

        // SYSTEM DATA
        if (text.includes('revenue') || text.includes('money') || text.includes('collection')) {
            speak(`Total collection today is ${kpis?.revenue_today || 0} rupees.`);
            return;
        }

        if (text.includes('active violations') || text.includes('violations')) {
            speak(`There are ${kpis?.active_breaches || 0} active violations right now.`);
            onCommand?.('REPORT_VIOLATION', '');
            return;
        }

        // GENERAL NAV
        if (text.includes('map')) {
            speak('Opening city map view.');
            onCommand?.('SHOW_MAP', '');
            return;
        }

        if (text.includes('home') || text.includes('dashboard')) {
            speak('Returning to main dashboard.');
            onCommand?.('GET_STATUS', '');
            return;
        }

        if (text.includes('wizard') || text.includes('add zone') || text.includes('create')) {
            speak('Opening zone creator wizard.');
            onCommand?.('SHOW_WIZARD', '');
            return;
        }

        if (text.includes('logout')) {
            speak('Securely logging out. Drive safe.');
            onCommand?.('LOGOUT', '');
            return;
        }

        // HELP
        if (text.includes('help') || text.includes('what can you do')) {
            speak('I can find the nearest parking, check revenue, open challan history, or navigate the dashboard for you. Just ask.');
            return;
        }

        speak("Command not recognized. Say help for a list of things I can do.");
    };

    if (!recognition) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 group">
            <div className="flex flex-col items-end space-y-3">
                {lastTranscript && (
                    <div className="bg-white px-4 py-2 rounded-2xl shadow-xl transition-all duration-300 transform scale-100 origin-bottom-right">
                        <p className="text-sm font-semibold text-indigo-600">"{lastTranscript}"</p>
                    </div>
                )}
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-5 rounded-full shadow-2xl transition-all duration-300 transform hover:rotate-12 ${
                        isListening ? 'bg-rose-600 animate-pulse scale-110' : 'bg-indigo-700'
                    } text-white`}
                    title="Voice Assistant (Hands-Free)"
                >
                    {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;

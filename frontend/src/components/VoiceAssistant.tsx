import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, BrainCircuit, Loader2 } from 'lucide-react';
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    }

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        // Language detection for output
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

    const processCommandAI = async (text: string) => {
        setIsProcessing(true);
        try {
            const apiBase = (import.meta as any).env?.VITE_API_BASE || 'https://smart-parking-backend-1p4n.onrender.com';
            const response = await fetch(`${apiBase}/api/voice/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('AI Brain unreachable');
            const data = await response.json();

            console.log('AI Decision:', data);

            if (data.feedback) speak(data.feedback);
            
            if (data.command !== 'UNKNOWN') {
                onCommand?.(data.command, '');
            }
        } catch (error) {
            console.error('AI Error:', error);
            speak("System brain is offline. Trying basic mode.");
            // Fallback to basic keywords if AI fails
            if (text.includes('map')) onCommand?.('SHOW_MAP', '');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!recognition) return;
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setLastTranscript(transcript);
            processCommandAI(transcript);
        };
        recognition.onend = () => setIsListening(false);
    }, [recognition, zones, userHistory]);

    if (!recognition) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <div className="flex flex-col items-end space-y-3">
                {lastTranscript && (
                    <div className="bg-white/95 border-r-4 border-indigo-600 px-4 py-3 rounded-xl shadow-2xl max-w-xs transition-all animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-1">
                            <BrainCircuit className="w-3 h-3 text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">AI Processing</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800">"{lastTranscript}"</p>
                    </div>
                )}
                
                <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                    className={`p-6 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                        isListening ? 'bg-rose-500 animate-pulse' : 
                        isProcessing ? 'bg-indigo-400 rotate-180' : 'bg-indigo-600'
                    } text-white`}
                    title="Smart AI Voice Assistant"
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : isListening ? (
                        <MicOff className="w-8 h-8" />
                    ) : (
                        <Mic className="w-8 h-8" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;

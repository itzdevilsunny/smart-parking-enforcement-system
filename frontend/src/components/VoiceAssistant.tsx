import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, ShieldAlert } from 'lucide-react';

interface VoiceAssistantProps {
    onCommand?: (command: string, details: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand }) => {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');

    // Initialize Speech Recognition
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
            setStatus('listening');
        } catch (err) {
            console.error('Speech recognition error:', err);
        }
    }, [recognition]);

    const stopListening = useCallback(() => {
        if (!recognition) return;
        recognition.stop();
        setIsListening(false);
        setStatus('idle');
    }, [recognition]);

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            processCommand(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
            setStatus('idle');
        };

        recognition.onerror = (event: any) => {
            console.error('Recognition Error:', event.error);
            setIsListening(false);
            setStatus('idle');
        };
    }, [recognition]);

    const processCommand = (text: string) => {
        console.log('Voice Analysis:', text);
        
        // 1. Dashboard / Status Commands
        if (text.includes('status') || text.includes('dashboard') || text.includes('home') || text.includes('summary')) {
            const msg = 'Opening dashboard status';
            speak(msg);
            onCommand?.('GET_STATUS', '');
            return;
        }

        // 2. Map / Location Commands
        if (text.includes('map') || text.includes('location') || text.includes('show') || text.includes('where')) {
            const msg = 'Displaying live parking map';
            speak(msg);
            onCommand?.('SHOW_MAP', '');
            return;
        }

        // 3. Violation / Enforcement Commands
        if (text.includes('report') || text.includes('violation') || text.includes('enforce') || text.includes('plate') || text.includes('check')) {
            // Try to extract a plate number if mentioned
            const plateMatch = text.match(/[a-z0-9]{3,}/g);
            const plate = plateMatch ? plateMatch[plateMatch.length - 1].toUpperCase() : '';
            
            const msg = plate 
                ? `Checking violation record for plate ${plate}` 
                : 'Opening enforcement view';
            
            speak(msg);
            onCommand?.('REPORT_VIOLATION', plate);
            return;
        }

        // 4. Ledger / Audit Commands
        if (text.includes('ledger') || text.includes('history') || text.includes('audit') || text.includes('logs')) {
            speak('Opening audit logs');
            onCommand?.('SHOW_LEDGER', '');
            return;
        }

        // Fallback for unrecognized commands
        speak("I heard you, but I don't have a command for that yet.");
    };

    const speak = (message: string) => {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    if (!recognition) {
        return null; // Don't show if browser doesn't support it
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="flex flex-col items-end space-y-3">
                {lastTranscript && (
                    <div className="bg-white/90 backdrop-blur-md border border-indigo-100 px-4 py-2 rounded-2xl shadow-xl max-w-xs animate-in slide-in-from-bottom-2 duration-300">
                        <p className="text-sm font-medium text-indigo-600 italic">"{lastTranscript}"</p>
                    </div>
                )}
                
                <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                        isListening 
                        ? 'bg-rose-500 text-white animate-pulse shadow-rose-200' 
                        : 'bg-indigo-600 text-white shadow-indigo-200'
                    }`}
                >
                    {isListening ? (
                        <MicOff className="w-6 h-6" />
                    ) : (
                        <Mic className="w-6 h-6" />
                    )}
                </button>
            </div>
            
            {isListening && (
                <div className="fixed inset-0 bg-indigo-900/10 backdrop-blur-[2px] pointer-events-none flex items-center justify-center z-[-1]">
                    <div className="w-32 h-32 bg-indigo-500/20 rounded-full animate-ping" />
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;

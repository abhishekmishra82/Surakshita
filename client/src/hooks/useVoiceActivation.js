import { useEffect, useRef, useCallback } from 'react';

const useVoiceActivation = ({ keyword = 'help me', onTrigger, enabled = false }) => {
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);

  const start = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !enabled) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        if (transcript.includes(keyword.toLowerCase())) {
          onTrigger?.();
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('Speech recognition error:', e.error);
    };

    recognition.onend = () => {
      // Restart if still active
      if (activeRef.current && enabled) recognition.start();
    };

    recognitionRef.current = recognition;
    activeRef.current = true;
    recognition.start();
  }, [keyword, onTrigger, enabled]);

  const stop = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (enabled) start();
    else stop();
    return stop;
  }, [enabled, start, stop]);

  return { start, stop };
};

export default useVoiceActivation;

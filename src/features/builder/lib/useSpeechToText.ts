import { useEffect, useRef, useState } from 'react';

// The Web Speech API's SpeechRecognition isn't part of TypeScript's DOM lib
// (no @types package ships it either), so this is just the minimal shape
// this hook actually touches — not a full spec typing.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorLike extends Event {
  error?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

// Permission/hardware errors that restarting won't fix — anything else
// (e.g. 'no-speech', or 'aborted' from our own deliberate restart below) is
// treated as recoverable.
const FATAL_ERRORS = new Set(['not-allowed', 'audio-capture', 'service-not-allowed']);

/**
 * Browser-native speech-to-text ($0.00, no backend call — Chrome/Edge
 * support it well; Firefox doesn't implement it at all and Safari's support
 * is inconsistent, hence `supported` below rather than assuming it works).
 *
 * Internally restarts the underlying SpeechRecognition session every time a
 * phrase finalizes, rather than running one long continuous session for the
 * whole dictation. Chrome's implementation resends the *entire* buffered
 * audio for a session on every recognition pass — in one long session that
 * buffer only grows, so latency climbs the longer you keep talking
 * (eventually multiple seconds, even after you stop). Restarting on each
 * finalized chunk keeps every session's buffer down to just the most recent
 * phrase, so latency stays flat instead of creeping up. `onResult` still
 * sees one continuous dictation from the caller's side — `final` is the
 * accumulated text across every restart, not just the current session's.
 */
export function useSpeechToText(onResult: (final: string, interim: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const accumulatedFinalRef = useRef('');
  // true once the user (or unmount) has asked to stop for real — onend
  // checks this to decide "restart automatically" vs. "actually done".
  const manualStopRef = useRef(false);

  const SpeechRecognitionCtor = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : undefined;
  const supported = !!SpeechRecognitionCtor;

  const runSession = () => {
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event) => {
      let sessionFinal = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) sessionFinal += result[0].transcript;
        else interim += result[0].transcript;
      }

      const base = accumulatedFinalRef.current;
      const sep = base && sessionFinal && !/\s$/.test(base) ? ' ' : '';
      onResultRef.current(base + sep + sessionFinal, interim);

      if (sessionFinal) {
        accumulatedFinalRef.current = base + sep + sessionFinal;
        // Ends this session now that it has a finalized phrase, before its
        // buffer has a chance to grow further — onend below restarts a
        // fresh, empty-buffer session immediately.
        recognition.stop();
      }
    };
    recognition.onerror = (event) => {
      if (event.error && FATAL_ERRORS.has(event.error)) manualStopRef.current = true;
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (manualStopRef.current) { setListening(false); return; }
      runSession();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const start = () => {
    if (!SpeechRecognitionCtor || recognitionRef.current) return;
    accumulatedFinalRef.current = '';
    manualStopRef.current = false;
    runSession();
  };

  const stop = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
  };

  // Don't leave the mic hot if the composer unmounts mid-dictation (e.g.
  // navigating away from the project).
  useEffect(() => () => { manualStopRef.current = true; recognitionRef.current?.stop(); }, []);

  return { supported, listening, start, stop };
}

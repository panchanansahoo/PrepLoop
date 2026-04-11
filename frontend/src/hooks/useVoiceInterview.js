import { useCallback, useMemo, useRef, useState } from 'react';

// Sanitize text for speech: strip code blocks, markdown, collapse whitespace
function sanitizeForSpeech(rawText) {
	const text = String(rawText || '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/[`*_#]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (!text) return '';
	return text
		.replace(/([.,!?;:])(\s+|$)/g, '$1 ')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

export function useVoiceInterview(options = {}) {
	const {
		speakerMuted = false,
		getBrowserVoice,
		splitTextForTTS,
		getAuthHeaders,
		interviewerGender,
	} = options;

	const [aiSpeaking, setAiSpeaking] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscriptState] = useState('');
	const [silenceCountdown, setSilenceCountdown] = useState(0);

	const silenceTimerRef = useRef(null);
	const countdownIntervalRef = useRef(null);
	const onAutoSendRef = useRef(options.onAutoSend);

	// Keep options.onAutoSend up to date
	useMemo(() => {
		onAutoSendRef.current = options.onAutoSend;
	}, [options.onAutoSend]);

	const stopSilenceDetection = useCallback(() => {
		if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
		if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
		setSilenceCountdown(0);
	}, []);

	const isListeningRef = useRef(false);
	const isSendingRef = useRef(false);
	const ttsAudioRef = useRef(null);
	const recognitionRef = useRef(null);
	const finalTranscriptRef = useRef('');

	const setTranscript = useCallback((val) => {
		if (typeof val === 'function') {
			setTranscriptState((prev) => {
				const nextVal = val(prev);
				if (!nextVal) finalTranscriptRef.current = '';
				else finalTranscriptRef.current = nextVal;
				return nextVal;
			});
		} else {
			if (!val) finalTranscriptRef.current = '';
			else finalTranscriptRef.current = val;
			setTranscriptState(val);
		}
	}, []);

	const stopVoiceRecording = useCallback(() => {
		if (recognitionRef.current) {
			try {
				recognitionRef.current.stop();
			} catch {
				// no-op
			}
		}
		isListeningRef.current = false;
		setIsListening(false);
		stopSilenceDetection();
	}, [stopSilenceDetection]);

	const startVoiceRecording = useCallback(() => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) return false;
		if (isListeningRef.current) return true;

		if (!recognitionRef.current) {
			const recognition = new SpeechRecognition();
			recognition.lang = 'en-US';
			recognition.continuous = true;
			recognition.interimResults = true;

			recognition.onstart = () => {
				isListeningRef.current = true;
				setIsListening(true);
			};

			recognition.onresult = (event) => {
				let finalStr = '';
				let interimStr = '';
				for (let i = event.resultIndex; i < event.results.length; i += 1) {
					if (event.results[i].isFinal) {
						finalStr += event.results[i][0].transcript + ' ';
					} else {
						interimStr += event.results[i][0].transcript;
					}
				}
				
				let currentTotalText = '';
				if (finalStr) {
					finalTranscriptRef.current += finalStr;
					let next = (finalTranscriptRef.current + interimStr).trim();
					if (next.length > 3000) {
						next = next.slice(-3000);
						finalTranscriptRef.current = finalTranscriptRef.current.slice(-3000);
					}
					setTranscriptState(next);
					currentTotalText = next;
				} else if (interimStr) {
					let next = (finalTranscriptRef.current + interimStr).trim();
					if (next.length > 3000) {
						next = next.slice(-3000);
					}
					setTranscriptState(next);
					currentTotalText = next;
				}

				stopSilenceDetection();
				if (currentTotalText.trim().length > 0) {
					silenceTimerRef.current = setTimeout(() => {
						let count = 4;
						setSilenceCountdown(count);
						countdownIntervalRef.current = setInterval(() => {
							count -= 1;
							if (count > 0) {
								setSilenceCountdown(count);
							} else {
								stopSilenceDetection();
								if (onAutoSendRef.current) {
									onAutoSendRef.current();
								}
							}
						}, 1000);
					}, 2000);
				}
			};

			recognition.onend = () => {
				isListeningRef.current = false;
				setIsListening(false);
				stopSilenceDetection();
			};

			recognition.onerror = () => {
				isListeningRef.current = false;
				setIsListening(false);
				stopSilenceDetection();
			};

			recognitionRef.current = recognition;
		}

		try {
			recognitionRef.current.start();
			return true;
		} catch {
			return false;
		}
	}, []);

	const speakInterviewerText = useCallback(async (text) => {
		if (!text || !String(text).trim()) return;
		if (speakerMuted) return;

		const spokenText = sanitizeForSpeech(text);
		if (!spokenText) return;

		// Cancel any ongoing speech
		if ('speechSynthesis' in window) window.speechSynthesis.cancel();
		if (ttsAudioRef.current) {
			try { ttsAudioRef.current.pause(); } catch { /* no-op */ }
			ttsAudioRef.current = null;
		}
		setAiSpeaking(true);

		// ── Primary: Try premium backend TTS (Groq Orpheus) ──
		try {
			const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};
			if (headers && (headers.Authorization || headers.authorization)) {
				const res = await fetch('/api/voice/tts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', ...headers },
					body: JSON.stringify({
						text: spokenText,
						persona: 'friendly',
						provider: 'groq-orpheus',
						gender: interviewerGender || 'female',
					}),
				});

				if (res.ok) {
					const contentType = res.headers.get('content-type');
					// If backend returned JSON with fallback flag, skip to browser TTS
					if (contentType && contentType.includes('application/json')) {
						const data = await res.json();
						if (data.fallback) throw new Error('Backend requested fallback');
					} else {
						const blob = await res.blob();
						if (blob.size > 100) {
							const audioUrl = URL.createObjectURL(blob);
							const audio = new Audio(audioUrl);
							ttsAudioRef.current = audio;

							await new Promise((resolve) => {
								audio.onended = () => {
									URL.revokeObjectURL(audioUrl);
									ttsAudioRef.current = null;
									resolve();
								};
								audio.onerror = () => {
									URL.revokeObjectURL(audioUrl);
									ttsAudioRef.current = null;
									resolve();
								};
								audio.play().catch(() => resolve());
							});
							setAiSpeaking(false);
							return; // Success — premium voice played
						}
					}
				}
			}
		} catch (err) {
			// Backend TTS failed — fall back to browser TTS silently
			console.warn('[VoiceHook] Backend TTS unavailable, using browser fallback:', err.message);
		}

		// ── Fallback: Browser speechSynthesis ──
		if (!('speechSynthesis' in window)) {
			setAiSpeaking(false);
			return;
		}

		const chunks = typeof splitTextForTTS === 'function'
			? splitTextForTTS(spokenText)
			: [spokenText];

		const voiceCfg = typeof getBrowserVoice === 'function' ? getBrowserVoice() : null;

		try {
			for (const chunk of chunks) {
				if (!chunk || !chunk.trim()) continue;
				await new Promise((resolve) => {
					const utter = new SpeechSynthesisUtterance(chunk);
					if (voiceCfg?.rate) utter.rate = voiceCfg.rate;
					if (voiceCfg?.pitch) utter.pitch = voiceCfg.pitch;
					utter.onend = () => resolve();
					utter.onerror = () => resolve();
					window.speechSynthesis.speak(utter);
				});
			}
		} finally {
			setAiSpeaking(false);
		}
	}, [getBrowserVoice, speakerMuted, splitTextForTTS, getAuthHeaders, interviewerGender]);

	const cleanup = useCallback(() => {
		stopVoiceRecording();
		if ('speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}
		if (ttsAudioRef.current) {
			try {
				ttsAudioRef.current.pause();
			} catch {
				// no-op
			}
			ttsAudioRef.current = null;
		}
		recognitionRef.current = null;
		stopSilenceDetection();
	}, [stopVoiceRecording, stopSilenceDetection]);

	return useMemo(() => ({
		aiSpeaking,
		setAiSpeaking,
		isListening,
		transcript,
		    setTranscript,
		silenceCountdown,
		speakInterviewerText,
		startVoiceRecording,
		stopVoiceRecording,
		isListeningRef,
		isSendingRef,
		ttsAudioRef,
		cleanup,
	}), [
		aiSpeaking,
		isListening,
		transcript,
		silenceCountdown,
		speakInterviewerText,
		startVoiceRecording,
		stopVoiceRecording,
		cleanup,
	]);
}

export default useVoiceInterview;

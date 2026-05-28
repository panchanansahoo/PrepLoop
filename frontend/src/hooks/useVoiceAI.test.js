import { describe, it, expect } from "vitest";
import {
  buildVoiceApiUrl,
  getAdaptiveSilenceMs,
  getPostSpeechAutoSubmitMs,
  isAudioContentType,
  shouldTreatTtsResponseAsFallback,
} from "./useVoiceAI";

describe("useVoiceAI helpers", () => {
  it("uses longer silence windows for shorter answers", () => {
    expect(getAdaptiveSilenceMs(20)).toBe(6000);
    expect(getAdaptiveSilenceMs(80)).toBe(5000);
    expect(getAdaptiveSilenceMs(260)).toBe(4000);
  });

  it("gives candidates a natural pause before auto-submit", () => {
    expect(getPostSpeechAutoSubmitMs(20)).toBe(6000);
    expect(getPostSpeechAutoSubmitMs(80)).toBe(5000);
    expect(getPostSpeechAutoSubmitMs(260)).toBe(4000);
  });

  it("builds voice api urls from the configured backend origin", () => {
    expect(buildVoiceApiUrl("/voice/tts-stream", "http://localhost:5000")).toBe(
      "http://localhost:5000/api/voice/tts-stream",
    );
    expect(
      buildVoiceApiUrl("/voice/tts-stream", "http://localhost:5000/api"),
    ).toBe("http://localhost:5000/api/voice/tts-stream");
  });

  it("detects valid audio content types for TTS playback", () => {
    expect(isAudioContentType("audio/wav")).toBe(true);
    expect(isAudioContentType("audio/mpeg")).toBe(true);
    expect(isAudioContentType("application/json")).toBe(false);
    expect(isAudioContentType("")).toBe(false);
  });

  it("treats non-audio or tiny blobs as fallback responses", () => {
    expect(
      shouldTreatTtsResponseAsFallback({
        contentType: "application/json; charset=utf-8",
        blobSize: 210,
      }),
    ).toBe(true);

    expect(
      shouldTreatTtsResponseAsFallback({
        contentType: "audio/wav",
        blobSize: 40,
      }),
    ).toBe(true);

    expect(
      shouldTreatTtsResponseAsFallback({
        contentType: "audio/wav",
        blobSize: 1024,
      }),
    ).toBe(false);
  });
});

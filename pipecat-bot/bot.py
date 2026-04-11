"""
PrepLoop AI Interview Bot — Pipecat Real-Time Voice Agent

This bot runs a real-time voice pipeline:
  Mic Audio → Deepgram STT → Groq LLM → Groq TTS → Speaker Audio

It is spawned by the Node.js backend per interview session and
communicates with the React frontend via WebSocket transport.

Usage:
  python bot.py --port 7860 --session-id <uuid> [--config <json>]
"""

import asyncio
import json
import logging
import os
import signal
import sys
import argparse
from pathlib import Path

from dotenv import load_dotenv

# ── Load .env from backend directory (shared API keys) ──
backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()  # fallback to local .env

from pipecat.frames.frames import LLMMessagesFrame, EndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.services.deepgram.stt import DeepgramSTTService, LiveOptions
from pipecat.services.groq.llm import GroqLLMService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.transports.websocket.server import (
    WebsocketServerTransport,
    WebsocketServerParams,
)
from pipecat.processors.aggregators.openai_llm_context import (
    OpenAILLMContext,
    OpenAILLMContextFrame,
)
from pipecat.serializers.base_serializer import FrameSerializer
from pipecat.frames.frames import (
    AudioRawFrame, TextFrame, TranscriptionFrame,
    TTSStartedFrame, TTSStoppedFrame, ErrorFrame
)
import struct

logger = logging.getLogger("preploop-pipecat-bot")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")


# ══════════════════════════════════════════════════════════
#  System Prompt Builder
# ══════════════════════════════════════════════════════════

def build_system_prompt(config: dict) -> str:
    """Build the LLM system prompt for the AI interviewer."""
    company = config.get("company", "Google")
    role = config.get("role", "Software Engineer")
    stage = config.get("stage", "Technical")
    interviewer_name = config.get("interviewerName", "Ryan Mitchell")
    interviewer_role = config.get("interviewerRole", "Senior Software Engineer")
    difficulty = config.get("difficulty", "medium")
    experience_level = config.get("experienceLevel", "mid")
    total_questions = config.get("totalQuestions", 6)
    persona = config.get("interviewerPersona", "auto")

    # Persona-specific instructions
    persona_instructions = ""
    if persona == "encouraging":
        persona_instructions = "Your tone should be exceptionally encouraging, supportive, and kind. Help the candidate feel at ease."
    elif persona == "challenging":
        persona_instructions = "Your tone should be rigorous, demanding, and slightly critical. Push the candidate to explain their depth."
    elif persona == "friendly":
        persona_instructions = "Your tone should be professional yet warm and approachable, like a helpful colleague."
    elif persona == "analytical":
        persona_instructions = "Your tone should be precise, logical, and focused on technical data and evidence."
    elif persona == "formal":
        persona_instructions = "Your tone should be strictly professional, traditional, and structured."
    elif persona == "casual":
        persona_instructions = "Your tone should be relaxed and conversational, as if chatting over coffee."
    elif persona == "behavioral":
        persona_instructions = "Focus on behavioral aspects, soft skills, and past experiences. Look for cultural fit and leadership qualities."
    elif persona == "technical":
        persona_instructions = "Focus strictly on technical accuracy, problem-solving skills, and architectural knowledge."


    # Pre-loaded questions (if supplied by the backend)
    questions_block = ""
    questions = config.get("questions", [])
    if questions:
        q_list = "\n".join(f"  {i+1}. {q}" for i, q in enumerate(questions))
        questions_block = f"""

Here are the interview questions you must ask, IN ORDER:
{q_list}

Ask them one at a time. After the candidate answers, provide brief feedback,
then move to the next question. After the last question, wrap up the interview
with a summary of how they did."""

    return f"""You are {interviewer_name}, a {interviewer_role} at {company}.
You are conducting a {stage} interview for the {role} position.
Difficulty level: {difficulty}. Candidate experience: {experience_level}.

INTERVIEW RULES:
1. Be professional, warm, and encouraging — like a real interviewer on a video call.
2. Keep responses concise (2-4 sentences typically). This is a VOICE conversation.
3. Ask ONE question at a time and wait for the candidate's response.
4. After each answer, give brief constructive feedback before the next question.
5. Use natural conversational fillers occasionally ("Great question...", "That's interesting...").
6. If the candidate is silent for too long, gently prompt them.
7. Total questions for this interview: {total_questions}.
8. Do NOT use markdown, code blocks, bullet points, or formatting — speak naturally.
9. Do NOT mention that you are an AI. Stay in character as {interviewer_name}.
10. Persona Tone: {persona_instructions if persona_instructions else 'Be a balanced, professional interviewer.'}
{questions_block}


Start by greeting the candidate warmly and asking the first question."""


# ══════════════════════════════════════════════════════════
#  Voice Configuration
# ══════════════════════════════════════════════════════════

def get_tts_voice(config: dict) -> str:
    """Get the premium ElevenLabs voice ID based on interviewer gender."""
    gender = config.get("gender", "male")
    if gender == "female":
        return "21m00Tcm4TlvDq8ikWAM"  # Rachel (Friendly & Professional, matching voiceService.js)
    return "ErXwobaYiN019PkySvjV"      # Antoni (Professional male, matching voiceService.js)



class CustomReactSerializer(FrameSerializer):
    def __init__(self, sample_rate=16000):
        super().__init__()
        self.sample_rate = sample_rate

    def _add_wav_header(self, pcm_data: bytes) -> bytes:
        num_channels = 1
        byte_rate = self.sample_rate * num_channels * 2
        block_align = num_channels * 2
        header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF",
            36 + len(pcm_data),
            b"WAVE",
            b"fmt ",
            16,
            1,
            num_channels,
            self.sample_rate,
            byte_rate,
            block_align,
            16,
            b"data",
            len(pcm_data)
        )
        return header + pcm_data

    def serialize(self, frame) -> str | bytes | None:
        if isinstance(frame, AudioRawFrame):
            # The frontend expects each binary message to be a playable WAV file
            return self._add_wav_header(frame.audio)
        elif isinstance(frame, TextFrame):
            return json.dumps({"type": "bot_transcript", "text": frame.text})
        elif isinstance(frame, TranscriptionFrame):
            return json.dumps({"type": "user_transcript", "text": frame.text, "final": not frame.interim})
        elif isinstance(frame, TTSStartedFrame):
            return json.dumps({"type": "bot_started_speaking"})
        elif isinstance(frame, TTSStoppedFrame):
            return json.dumps({"type": "bot_stopped_speaking"})
        elif isinstance(frame, ErrorFrame):
            return json.dumps({"type": "error", "message": str(frame.error)})
        return None

    def deserialize(self, data: str | bytes):
        if isinstance(data, bytes):
            # Frontend sends raw PCM Int16 buffer
            return AudioRawFrame(audio=data, sample_rate=16000, num_channels=1)
        return None

# ══════════════════════════════════════════════════════════
#  Main Bot
# ══════════════════════════════════════════════════════════

async def run_bot(port: int, session_id: str, config: dict):
    """Start the Pipecat pipeline and serve via WebSocket."""

    logger.info(f"Starting bot for session {session_id} on port {port}")
    logger.info(f"Config: company={config.get('company')}, stage={config.get('stage')}, gender={config.get('gender')}")

    # ── Validate API Keys ──
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    if not deepgram_key:
        logger.error("DEEPGRAM_API_KEY not set")
        sys.exit(1)
    if not groq_key:
        logger.error("GROQ_API_KEY not set")
        sys.exit(1)

    # ── Create Transport (WebSocket Server) ──
    transport = WebsocketServerTransport(
        params=WebsocketServerParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=True,
            session_timeout=1800,  # 30 minutes
            serializer=CustomReactSerializer(sample_rate=16000),
        ),
        host="0.0.0.0",
        port=port,
    )

    # ── Create AI Services ──
    stt = DeepgramSTTService(
        api_key=deepgram_key,
        live_options=LiveOptions(
            language="en",
            model="nova-2",
        ),
    )

    llm = GroqLLMService(
        api_key=groq_key,
        model="llama-3.3-70b-versatile",
    )

    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id=get_tts_voice(config),
        sample_rate=16000,
    )


    # ── Build Context with System Prompt ──
    system_prompt = build_system_prompt(config)
    messages = [{"role": "system", "content": system_prompt}]

    context = OpenAILLMContext(messages)
    context_aggregator = llm.create_context_aggregator(context)

    # ── Build Pipeline ──
    pipeline = Pipeline(
        [
            transport.input(),               # Receive audio from browser
            stt,                             # Speech-to-text (Deepgram)
            context_aggregator.user(),       # Add user message to context
            llm,                             # Language model (Groq)
            tts,                             # Text-to-speech (Groq)
            transport.output(),              # Send audio back to browser
            context_aggregator.assistant(),  # Add bot response to context
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    # ── Event Handlers ──
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected to session {session_id}")
        # Greet the candidate by triggering the LLM
        await task.queue_frames(
            [LLMMessagesFrame(context.get_messages())]
        )

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected from session {session_id}")
        await task.queue_frames([EndFrame()])

    # ── Run Pipeline ──
    runner = PipelineRunner(handle_sigint=True)

    logger.info(f"[BOT READY] WebSocket server on ws://localhost:{port}/ws")
    await runner.run(task)
    logger.info(f"Bot for session {session_id} has stopped.")


# ══════════════════════════════════════════════════════════
#  Entry Point
# ══════════════════════════════════════════════════════════

def parse_args():
    parser = argparse.ArgumentParser(description="PrepLoop Pipecat Interview Bot")
    parser.add_argument("--port", type=int, default=7860, help="WebSocket server port")
    parser.add_argument("--session-id", type=str, default="local-dev", help="Session ID")
    parser.add_argument("--config", type=str, default="{}", help="JSON config string")
    parser.add_argument("--test", action="store_true", help="Test mode: validate setup and exit")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    config = {}
    try:
        config = json.loads(args.config)
    except json.JSONDecodeError:
        logger.warning("Invalid --config JSON, using defaults")

    if args.test:
        # Test mode: just validate environment and exit
        print("[OK] Python environment OK")
        print(f"  Python: {sys.version}")
        print(f"  DEEPGRAM_API_KEY: {'set' if os.getenv('DEEPGRAM_API_KEY') else 'MISSING'}")
        print(f"  GROQ_API_KEY: {'set' if os.getenv('GROQ_API_KEY') else 'MISSING'}")
        try:
            import pipecat
            print(f"  pipecat-ai: {pipecat.__version__}")
        except Exception:
            print("  pipecat-ai: installed (version unknown)")
        print(f"  System prompt length: {len(build_system_prompt(config))} chars")
        print("[OK] Bot ready to run")
        sys.exit(0)

    asyncio.run(run_bot(args.port, args.session_id, config))

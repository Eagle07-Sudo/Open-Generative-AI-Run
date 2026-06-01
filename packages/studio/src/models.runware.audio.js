/** Runware audio catalog — fork-owned; see ADR-003 / ADR-004. */

import { liveCatalogEntries, rwAudioEntry, rwReleaseMeta } from './models.runware.shared.js';

const _all = [
  rwAudioEntry({
    id: 'rw-gemini-3-1-flash-tts',
    name: 'Gemini 3.1 Flash TTS',
    runwareModel: 'runware:gemini@3.1-flash-tts',
    ...rwReleaseMeta('gemini-3-1-flash-tts', '2026-03-01'),
  }),
  rwAudioEntry({
    id: 'rw-inworld-realtime-tts-2',
    name: 'Inworld Realtime TTS-2',
    runwareModel: 'runware:inworld@realtime-tts-2',
    ...rwReleaseMeta('inworld-realtime-tts-2', '2025-11-01'),
  }),
  rwAudioEntry({
    id: 'rw-eleven-v3',
    name: 'Eleven v3',
    runwareModel: 'runware:eleven@v3',
    ...rwReleaseMeta('eleven-v3', '2025-10-01'),
  }),
  rwAudioEntry({
    id: 'rw-eleven-turbo-v2-5',
    name: 'Eleven Turbo v2.5',
    runwareModel: 'runware:eleven@turbo-v2.5',
    ...rwReleaseMeta('eleven-turbo-v2-5', '2025-09-01'),
  }),
  rwAudioEntry({
    id: 'rw-minimax-speech-2-8',
    name: 'MiniMax Speech 2.8',
    runwareModel: 'runware:minimax@speech-2.8',
    ...rwReleaseMeta('minimax-speech-2-8', '2025-08-15'),
  }),
  rwAudioEntry({
    id: 'rw-minimax-music-2-6',
    name: 'MiniMax Music 2.6',
    runwareModel: 'runware:minimax@music-2.6',
    ...rwReleaseMeta('minimax-music-2-6', '2025-08-01'),
  }),
  rwAudioEntry({
    id: 'rw-fish-audio-s2-pro',
    name: 'Fish Audio S2.1 Pro',
    runwareModel: 'runware:fish-audio@s2.1-pro',
    ...rwReleaseMeta('fish-audio-s2-1-pro', '2025-07-01'),
  }),
  rwAudioEntry({
    id: 'rw-qwen3-tts-voice-design',
    name: 'Qwen3-TTS 1.7B VoiceDesign',
    runwareModel: 'runware:qwen3@tts-1.7b-voicedesign',
    ...rwReleaseMeta('qwen3-tts-1-7b-voicedesign', '2025-06-15'),
  }),
  rwAudioEntry({
    id: 'rw-qwen3-tts-custom-voice',
    name: 'Qwen3-TTS 1.7B CustomVoice',
    runwareModel: 'runware:qwen3@tts-1.7b-customvoice',
    ...rwReleaseMeta('qwen3-tts-1-7b-customvoice', '2025-06-15'),
  }),
  rwAudioEntry({
    id: 'rw-qwen3-tts-base',
    name: 'Qwen3-TTS 1.7B Base',
    runwareModel: 'runware:qwen3@tts-1.7b-base',
    ...rwReleaseMeta('qwen3-tts-1-7b-base', '2025-06-01'),
  }),
  rwAudioEntry({
    id: 'rw-ace-step-v1-5-turbo',
    name: 'ACE-Step v1.5 Turbo',
    runwareModel: 'runware:ace-step@v1.5-turbo',
    ...rwReleaseMeta('ace-step-v1-5-turbo', '2025-05-15'),
  }),
  rwAudioEntry({
    id: 'rw-ace-step-v1-5-base',
    name: 'ACE-Step v1.5 Base',
    runwareModel: 'runware:ace-step@v1.5-base',
    ...rwReleaseMeta('ace-step-v1-5-base', '2025-05-01'),
  }),
  rwAudioEntry({
    id: 'rw-inworld-tts-1-5-max',
    name: 'Inworld TTS-1.5 Max',
    runwareModel: 'runware:inworld@tts-1.5-max',
    ...rwReleaseMeta('inworld-tts-1-5-max', '2025-04-01'),
  }),
  rwAudioEntry({
    id: 'rw-eleven-music-v1',
    name: 'Eleven Music v1',
    runwareModel: 'runware:eleven@music-v1',
    ...rwReleaseMeta('eleven-music-v1', '2025-03-01'),
  }),
  rwAudioEntry({
    id: 'rw-xai-tts',
    name: 'xAI Text-to-Speech',
    runwareModel: 'runware:xai@tts',
    ...rwReleaseMeta('xai-text-to-speech', '2025-02-15'),
  }),
];

export const runwareAudioModels = liveCatalogEntries(_all);

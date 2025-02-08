"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModel = void 0;
var AIModel;
(function (AIModel) {
    // GPT
    // https://platform.openai.com/docs/models
    AIModel["gpt_default"] = "gpt-4o-mini";
    AIModel["gpt_latest"] = "gpt-4o";
    AIModel["gpt_small_latest"] = "gpt-4o-mini";
    AIModel["gpt_4"] = "gpt-4";
    AIModel["gpt_4_turbo"] = "gpt-4-turbo";
    AIModel["gpt_4o"] = "gpt-4o";
    AIModel["gpt_4o_mini"] = "gpt-4o-mini";
    AIModel["chatgpt_4o_latest"] = "chatgpt-4o-latest";
    AIModel["gpt_4o_realtime"] = "gpt-4o-realtime-preview";
    AIModel["gpt_4o_mini_realtime"] = "gpt-4o-mini-realtime-preview";
    AIModel["gpt_4o_audio"] = "gpt-4o-audio-preview";
    AIModel["o1"] = "o1";
    AIModel["o1_preview"] = "o1-preview";
    AIModel["o1_mini"] = "o1-mini";
    AIModel["o3_mini"] = "o3-mini";
    AIModel["tts"] = "tts-1";
    AIModel["tts_hd"] = "tts-1-hd";
    AIModel["wisper"] = "whisper-1";
    AIModel["text_embedding_3_large"] = "text-embedding-3-large";
    AIModel["text_embedding_3_small"] = "text-embedding-3-small";
    // Claude
    // https://docs.anthropic.com/en/docs/about-claude/models
    AIModel["claude_default"] = "claude-3-5-sonnet-20241022";
    AIModel["claude_latest"] = "claude-3-5-sonnet-20241022";
    AIModel["claude_small_latest"] = "claude-3-5-haiku-20241022";
    AIModel["claude_3_opus"] = "claude-3-opus-20240229";
    AIModel["claude_3_sonnet"] = "claude-3-sonnet-20240229";
    AIModel["claude_3_haiku"] = "claude-3-haiku-20240307";
    AIModel["claude_3_5_haiku"] = "claude-3-5-haiku-20241022";
    AIModel["claude_3_5_sonnet"] = "claude-3-5-sonnet-20241022";
    // Gemini
    // https://ai.google.dev/gemini-api/docs/models/gemini?hl=ja
    AIModel["gemini_default"] = "gemini-1.5-pro";
    AIModel["gemini_pro_latest"] = "gemini-1.5-pro";
    AIModel["gemini_small_latest"] = "gemini-1.5-flash";
    AIModel["gemini_exp_1114"] = "gemini-exp-1114";
    AIModel["gemini_exp_1206"] = "gemini-exp-1206";
    AIModel["gemini_exp_latest"] = "gemini-exp-1206";
    AIModel["gemini_flash_thinking_exp_1219"] = "gemini-2.0-flash-thinking-exp-1219";
    AIModel["gemini_learnlm_1_5_pro_experimental"] = "learnlm-1.5-pro-experimental";
    AIModel["gemini_2_0_flash_exp"] = "gemini-2.0-flash-exp";
    AIModel["gemini_1_5_flash"] = "gemini-1.5-flash";
    AIModel["gemini_1_5_flash_latest"] = "gemini-1.5-flash-latest";
    AIModel["gemini_1_5_flash_8b"] = "gemini-1.5-flash-8b";
    AIModel["gemini_1_5_flash_8b_latest"] = "gemini-1.5-flash-8b-latest";
    AIModel["gemini_1_5_pro"] = "gemini-1.5-pro";
    AIModel["gemini_1_5_pro_latest"] = "gemini-1.5-pro-latest";
    AIModel["text_embedding_004"] = "text-embedding-004";
    AIModel["AQA"] = "aqa";
    // Ollama
    AIModel["ollama_default"] = "llama3";
    AIModel["llama3"] = "llama3";
    AIModel["llama3_8b"] = "llama3-8b";
    AIModel["llama3_70b"] = "llama3-70b";
    AIModel["llama3_8x7b"] = "llama3-8x7b";
    AIModel["deepseek_r1"] = "deepseek-r1:32b";
})(AIModel || (exports.AIModel = AIModel = {}));

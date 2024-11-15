export var AIModel;
(function (AIModel) {
    // GPT
    AIModel["gpt_default"] = "gpt-4o-mini";
    AIModel["gpt_latest"] = "chatgpt-4o-latest";
    AIModel["gpt_small_latest"] = "gpt-4o-mini";
    AIModel["gpt_4"] = "gpt-4";
    AIModel["gpt_4_turbo"] = "gpt-4-turbo";
    AIModel["gpt_4o"] = "gpt-4o";
    AIModel["gpt_4o_mini"] = "gpt-4o-mini";
    AIModel["chatgpt_4o_latest"] = "chatgpt-4o-latest";
    AIModel["gpt_4o_realtime"] = "gpt-4o-realtime-preview";
    AIModel["o1"] = "o1-preview";
    AIModel["o1_mini"] = "o1-mini";
    AIModel["tts_1"] = "tts-1";
    AIModel["tts_1_hd"] = "tts-1-hd";
    AIModel["text_embedding_3_large"] = "text-embedding-3-large";
    AIModel["text_embedding_3_small"] = "text-embedding-3-small";
    // Claude
    AIModel["claude_default"] = "claude-3-5-sonnet-20241022";
    AIModel["claude_latest"] = "claude-3-5-sonnet-20241022";
    AIModel["claude_small_latest"] = "claude-3-5-sonnet-20241022";
    AIModel["claude_3_opus"] = "claude-3-opus-20240229";
    AIModel["claude_3_sonnet"] = "claude-3-sonnet-20240229";
    AIModel["claude_3_haiku"] = "claude-3-haiku-20240307";
    AIModel["claude_3_5_sonnet"] = "claude-3-5-sonnet-20241022";
    // Gemini
    AIModel["gemini_default"] = "gemini-1.5-flash-8b";
    AIModel["gemini_latest"] = "gemini-exp-1114";
    AIModel["gemini_small_latest"] = "gemini-1.5-flash-8b";
    AIModel["gemini_1_5_pro"] = "gemini-1.5-pro";
    AIModel["gemini_1_5_pro_002"] = "gemini-1.5-pro-002";
    AIModel["gemini_exp_1114"] = "gemini-exp-1114";
    AIModel["gemini_1_5_flash"] = "gemini-1.5-flash";
    AIModel["gemini_1_5_flash_002"] = "gemini-1.5-flash-002";
    AIModel["gemini_1_5_flash_8b"] = "gemini-1.5-flash-8b";
    // Ollama
    AIModel["ollama_default"] = "llama3";
    AIModel["llama3"] = "llama3";
    AIModel["llama3_8b"] = "llama3-8b";
    AIModel["llama3_70b"] = "llama3-70b";
    AIModel["llama3_8x7b"] = "llama3-8x7b";
})(AIModel || (AIModel = {}));

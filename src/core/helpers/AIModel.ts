
export enum AIModel {
  // GPT
  // https://platform.openai.com/docs/models
  gpt_default = "gpt-4o-mini",
  gpt_latest = "gpt-4o",
  gpt_small_latest = "gpt-4o-mini",
  gpt_4 = "gpt-4",
  gpt_4_turbo = "gpt-4-turbo",
  gpt_4o = "gpt-4o",
  gpt_4o_mini = "gpt-4o-mini",
  chatgpt_4o_latest = "chatgpt-4o-latest",
  gpt_4o_realtime = "gpt-4o-realtime-preview",
  gpt_4o_mini_realtime = "gpt-4o-mini-realtime-preview",
  gpt_4o_audio = "gpt-4o-audio-preview",
  o1 = "o1",
  o1_preview = "o1-preview",
  o1_mini = "o1-mini",
  o3_mini = "o3-mini",
  tts = "tts-1",
  tts_hd = "tts-1-hd",
  wisper = "whisper-1",
  text_embedding_3_large = "text-embedding-3-large",
  text_embedding_3_small = "text-embedding-3-small",

  // Claude
  // https://docs.anthropic.com/en/docs/about-claude/models
  claude_default = "claude-3-5-sonnet-20241022",
  claude_latest = "claude-3-5-sonnet-20241022",
  claude_small_latest = "claude-3-5-haiku-20241022",
  claude_3_opus = "claude-3-opus-20240229",
  claude_3_sonnet = "claude-3-sonnet-20240229",
  claude_3_haiku = "claude-3-haiku-20240307",
  claude_3_5_haiku = "claude-3-5-haiku-20241022",
  claude_3_5_sonnet = "claude-3-5-sonnet-20241022",

  // Gemini
  // https://ai.google.dev/gemini-api/docs/models/gemini?hl=ja
  gemini_default = "gemini-1.5-pro",
  gemini_pro_latest = "gemini-1.5-pro",
  gemini_small_latest = "gemini-1.5-flash",
  gemini_exp_1114 = "gemini-exp-1114",
  gemini_exp_1206 = "gemini-exp-1206",
  gemini_exp_latest = "gemini-exp-1206",
  gemini_flash_thinking_exp_1219 = "gemini-2.0-flash-thinking-exp-1219",
  gemini_learnlm_1_5_pro_experimental = "learnlm-1.5-pro-experimental",
  gemini_2_0_flash_exp = "gemini-2.0-flash-exp",
  gemini_1_5_flash = "gemini-1.5-flash",
  gemini_1_5_flash_latest = "gemini-1.5-flash-latest",
  gemini_1_5_flash_8b = "gemini-1.5-flash-8b",
  gemini_1_5_flash_8b_latest = "gemini-1.5-flash-8b-latest",
  gemini_1_5_pro = "gemini-1.5-pro",
  gemini_1_5_pro_latest = "gemini-1.5-pro-latest",
  text_embedding_004 = "text-embedding-004",
  AQA = "aqa",
  
  // Ollama
  ollama_default = "llama3",
  llama3 = "llama3",
  llama3_8b = "llama3-8b",
  llama3_70b = "llama3-70b",
  llama3_8x7b = "llama3-8x7b",
  deepseek_r1 = "deepseek-r1:32b",
}

// import { ChatHelper, IChatHelper } from '../src/core';
import { ChatHelper, AIModel } from '../dist/esm/core';

export async function gemini_test() {
  const chat = ChatHelper.Gemini({
    model: AIModel.gemini_exp_1114,
    max_tokens: 128000,
    systemPrompt: 'You are helpful assistant.',
  });
  const result = await chat.send('こんにちは');
  console.log(result);
}


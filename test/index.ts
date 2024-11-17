// import { ChatHelper, IChatHelper } from '../src/core';
import { ChatHelper } from '../dist/esm/core';
import { gemini_test } from './gemini.test';

async function main() {
  // const chat = ChatHelper.ChatGPT();
  // const result = await chat.send('こんにちは');
  // console.log(result);
  gemini_test();
}

main();

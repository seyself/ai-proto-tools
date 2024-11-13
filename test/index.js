// import { ChatHelper, IChatHelper } from '../src/core';
// import { ChatHelper } from '../dist/core/index';
// import { ChatHelper } from '../dist/core/index.js';
const { ChatHelper } = require('../dist/cjs/core/index.js');
// import { ChatHelper } from '../dist/esm/core';

async function main() {
  
  const chat = ChatHelper.ChatGPT();
  const result = await chat.send('こんにちは');
  console.log(result);
}

main();

// import { ChatHelper, IChatHelper } from '../src/core';
// import { ChatHelper } from '../dist/core/index';
// import { ChatHelper } from '../dist/core/index.js';
// const { ChatHelper } = require('../dist/core/index.js');
// import { ChatHelper } from '../dist/esm/core/index.js';  // 完全なパスを指定
import { ChatHelper } from '../dist/esm/core/index.js';

async function main() {
  
  const chat = ChatHelper.ChatGPT();
  const result = await chat.send('こんにちは');
  console.log(result);
}

main();

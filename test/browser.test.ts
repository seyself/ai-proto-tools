import WebBrowser, { WebPageContent } from '../src/core/utils/WebBrowser.js';
import ChatHelper from '../src/core/helpers/ChatHelper.js';

async function test11() {
  const browser = new WebBrowser();
  // const url = 'https://zenn.dev/tokushun109/articles/afd6c5c569fcd2';
  // const url = 'https://tokyonode.jp/';
  const url = 'https://gigazine.net/news/20241109-coffee-hearing-loss/';
  const options: any = {
    screenshot: true,
    // screenshot: './test/screenshot.png',
    textOnly: false,
    width: 1280,
    height: 800,
  }
  const page = await browser.open(url, options) as WebPageContent;
  const systemPrompt = 'あなたはWebページの解析機能を画像スキャナとして振る舞ってください。添付された画像はWebページのスクリーンショットです。続くユーザーの要求に答えてください。';
  // const chat = ChatHelper.ChatGPT({ systemPrompt });
  // const chat = ChatHelper.Gemini({ systemPrompt });
  const chat = ChatHelper.Ollama({ systemPrompt, model: 'llama3.2-vision' });
  const prompt = '添付のWebページのスクリーンショット画像に含まれるメインのコンテンツの内容を漏れなくテキスト化して出力。内容を説明する図や写真がある場合は、その内容を説明するテキストも含めること。';
  const result = await chat.vision(prompt, [page.base64 as string]);
  // const result = await chat.vision(prompt, [page.screenshot as string]);
  console.log(page.title);
  console.log(page.url);
  console.log(result);
}

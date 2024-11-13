import { type CheerioAPI, load } from 'cheerio';
import puppeteer, { Browser, Page, type LaunchOptions } from 'puppeteer';
import { setTimeout as _setTimeout } from 'timers/promises';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * ウェブページの内容を表すインターフェースです。
 * このインターフェースは、ウェブサイトの特定のページから抽出された情報を保持します。
 *
 * @interface WebPageContent
 * @property {string} title - ページのタイトル。
 * @property {string} content - ページの主なコンテンツのテキスト。
 * @property {string} url - ページのURL。
 */
export interface WebPageContent {
  title?: string;
  content?: string;
  url?: string;
  data?: Buffer;
  base64?: string;
  mimeType?: string;
  fileName?: string;
  length?: number;
  screenshot?: boolean | string;
}

/**
 * WebBrowser クラスは、指定した URL のウェブページを読み込み、
 * ページのタイトルやメインコンテンツを抽出するための機能を提供します。
 * このクラスは Puppeteer を使用して、ヘッドレスブラウザを操作し、
 * Cheerio を使って HTML を解析します。
 *
 * @remarks
 * ページを読み込む際には、クローリングと認識されないように
 * 一般的なユーザーエージェントが設定されています。
 * また、不要な要素を取り除いた上でメインコンテンツを整形して返します。
 *
 * @example
 * const browsing = new WebBrowser();
 * const content = await browsing.open('https://example.com');
 *
 * @param url - 読み込むウェブページの URL。
 * @param textOnly - true の場合、メインコンテンツのテキストのみを返却。
 *                     false の場合、ページタイトル、コンテンツ、URLを含むオブジェクトを返却。
 * @returns メインコンテンツのテキストまたはページに関する詳細情報を含んだオブジェクト。
 *          読み込みに失敗した場合やコンテンツが存在しない場合は null を返します。
 */
export default class WebBrowser {
  constructor() {}
  
  /**
   * 与えられたURLを開き、ページコンテンツを取得します。
   * このメソッドは、ページをクローリングし、指定された内容を抽出します。
   *
   * @param {string} url - 取得するページのURL
   * @param {boolean} [textOnly=true] - テキストのみを返すか、ページタイトルやURLも含めるかのフラグ。デフォルトは`true`
   * @returns {Promise<string | WebPageContent | null>} ページの内容またはnull
   *   - string: テキスト形式のコンテンツ（`textOnly`がtrueの場合）
   *   - WebPageContent: タイトル、コンテンツ、URLを含むオブジェクト（`textOnly`がfalseの場合）
   *   - null: コンテンツが取得できなかった場合
   * @throws {Error} エラーが発生した場合はコンソールにエラーログを出力
   * @remarks このメソッドはPuppeteerを使用してブラウジングを行い、Cheerioを使用してHTMLを解析します。イヤラシーなページ要素を除去し、整形したコンテンツを返します。
   */
  open = async (url: string, options?: { 
    textOnly?: boolean,
    width?: number,
    height?: number,
    timeout?: number,
    waitTime?: number,
    userAgent?: string,
    screenshot?: boolean | string,
    waitForSelector?: string,
  }): Promise<string | WebPageContent | null> => {
    try {
      const textOnly = options?.textOnly || false;
      const width = options?.width || 750;
      const height = options?.height || 1334;
      const timeout = options?.timeout || 30000;
      const userAgent = options?.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const waitForSelector = options?.waitForSelector || '';
      const waitTime = options?.waitTime || 3000;
      
      const result: string | WebPageContent | Buffer | null = {};
      const launchOptions: any = {
        headless: true,
      }
      const browser: Browser = await puppeteer.launch(launchOptions);
      let content: string | null = null;
      try {
        const page: Page = await browser.newPage();
        page.setUserAgent(userAgent);
        await page.setViewport({ width, height });
        if (waitForSelector)
        {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          await page.waitForSelector(waitForSelector);
        }
        else
        {
          await page.goto(url, { waitUntil: 'networkidle2', timeout });
        }
        if (options?.screenshot) {
          await page.evaluate(() => {
            window.scrollTo({
              top: document.body.scrollHeight,
              left: 0,
              behavior: 'smooth'
            });
          });
          await _setTimeout(waitTime);
          await page.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await _setTimeout(1000);
          if (typeof options.screenshot === 'string')
          {
            await page.screenshot({ path: options.screenshot, fullPage: true });
            result.screenshot = options.screenshot;
            result.mimeType = 'image/png';
          }
          else
          {
            const screenshot: any = await page.screenshot({ fullPage: true, encoding: 'binary' });
            const buffer: Buffer = Buffer.from(screenshot);
            result.data = buffer;
            result.base64 = `data:image/png;base64,${buffer.toString('base64')}`;
            result.mimeType = 'image/png';
            result.fileName = '';
            result.length = buffer.length;
            result.screenshot = true;
          }
        }
        content = await page.content();
      } catch (e) {
        // エラーが発生した場合はコンソールにログを出力
        console.error(e);
      } finally {
        // メモリリーク防止のため、必ずブラウザを終了
        await browser.close();
      }
      if (!content) return null;

      const webPage: CheerioAPI = load(content);
      // ページタイトルを複数の要素から優先順位をつけて取得
      const headTitle: string = webPage('head title').text();
      const h1Title: string = webPage('h1').text();
      const h2Title: string = webPage('h2').text();
      const pageTitle: string = h1Title || headTitle || h2Title || '';
      // 不要なナビゲーションやスクリプト要素を削除し、主にメインコンテンツに焦点を当てるため
      ['header', 'footer', 'nav', 'style', 'script', 'noscript', 'iframe', '#menu'].forEach((selector) => {
        webPage(selector).remove();
      });
      // メインコンテンツを優先順位をつけて取得
      let html: string | null = webPage('main').html() || webPage('#content').html() || webPage('#main').html() || webPage('body').html();
      if (html) {
        // HTMLの可読性を向上させるための整形処理
        html = html
          .replace(/<\/div>/gm, '\n</div>') // div終了タグの後に改行を追加
          .replace(/<\/p>/gm, '\n</p>') // p終了タグの後に改行を追加
          .replace(/<br([ \/])?>/gm, '\n') // brタグを改行に変換
          .replace(/<li[^>]*>/gm, '\n- ') // リスト項目をマークダウン形式に変換
          .replace(/<\/li>/gm, ''); // li終了タグを削除
        // 整形したHTMLを再度パースしてテキスト抽出
        const processedHtml: CheerioAPI = load(`<html>${html}</html>`);
        let text: string = processedHtml('html').text();
        // 連続する改行を2つに制限して整形
        if (text) {
          text = text.replace(/\n(\n)+/gm, '\n\n');
          text = text.replace(/[ ]+/gm, ' ');
          text = text.replace(/^\s+$/gm, '');
          text = text.replace(/^[ ]+/gm, '');
        }
        // 要求に応じてテキストのみ、または付加情報も含めて返却
        if (textOnly) {
          return text;
        }

        result.title = pageTitle;
        result.content = text;
        result.url = url;
        return result;
      }
      return null;
    } catch (e) {
      // 例外が発生した場合はログに出力
      console.error(e);
      return null;
    }
  };
}

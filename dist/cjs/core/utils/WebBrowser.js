"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const puppeteer_1 = __importDefault(require("puppeteer"));
const promises_1 = require("timers/promises");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
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
class WebBrowser {
    constructor() {
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
        this.open = async (url, options) => {
            try {
                const textOnly = options?.textOnly || false;
                const width = options?.width || 750;
                const height = options?.height || 1334;
                const timeout = options?.timeout || 30000;
                const userAgent = options?.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
                const waitForSelector = options?.waitForSelector || '';
                const waitTime = options?.waitTime || 3000;
                const result = {};
                const launchOptions = {
                    headless: true,
                };
                const browser = await puppeteer_1.default.launch(launchOptions);
                let content = null;
                try {
                    const page = await browser.newPage();
                    page.setUserAgent(userAgent);
                    await page.setViewport({ width, height });
                    if (waitForSelector) {
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
                        await page.waitForSelector(waitForSelector);
                    }
                    else {
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
                        await (0, promises_1.setTimeout)(waitTime);
                        await page.evaluate(() => {
                            window.scrollTo(0, 0);
                        });
                        await (0, promises_1.setTimeout)(1000);
                        if (typeof options.screenshot === 'string') {
                            await page.screenshot({ path: options.screenshot, fullPage: true });
                            result.screenshot = options.screenshot;
                            result.mimeType = 'image/png';
                        }
                        else {
                            const screenshot = await page.screenshot({ fullPage: true, encoding: 'binary' });
                            const buffer = Buffer.from(screenshot);
                            result.data = buffer;
                            result.base64 = `data:image/png;base64,${buffer.toString('base64')}`;
                            result.mimeType = 'image/png';
                            result.fileName = '';
                            result.length = buffer.length;
                            result.screenshot = true;
                        }
                    }
                    content = await page.content();
                }
                catch (e) {
                    // エラーが発生した場合はコンソールにログを出力
                    console.error(e);
                }
                finally {
                    // メモリリーク防止のため、必ずブラウザを終了
                    await browser.close();
                }
                if (!content)
                    return null;
                const webPage = (0, cheerio_1.load)(content);
                // ページタイトルを複数の要素から優先順位をつけて取得
                const headTitle = webPage('head title').text();
                const h1Title = webPage('h1').text();
                const h2Title = webPage('h2').text();
                const pageTitle = h1Title || headTitle || h2Title || '';
                // 不要なナビゲーションやスクリプト要素を削除し、主にメインコンテンツに焦点を当てるため
                ['header', 'footer', 'nav', 'style', 'script', 'noscript', 'iframe', '#menu'].forEach((selector) => {
                    webPage(selector).remove();
                });
                // メインコンテンツを優先順位をつけて取得
                let html = webPage('main').html() || webPage('#content').html() || webPage('#main').html() || webPage('body').html();
                if (html) {
                    // HTMLの可読性を向上させるための整形処理
                    html = html
                        .replace(/<\/div>/gm, '\n</div>') // div終了タグの後に改行を追加
                        .replace(/<\/p>/gm, '\n</p>') // p終了タグの後に改行を追加
                        .replace(/<br([ \/])?>/gm, '\n') // brタグを改行に変換
                        .replace(/<li[^>]*>/gm, '\n- ') // リスト項目をマークダウン形式に変換
                        .replace(/<\/li>/gm, ''); // li終了タグを削除
                    // 整形したHTMLを再度パースしてテキスト抽出
                    const processedHtml = (0, cheerio_1.load)(`<html>${html}</html>`);
                    let text = processedHtml('html').text();
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
                    result.html = content;
                    result.htmlParser = webPage;
                    result.url = url;
                    return result;
                }
                return null;
            }
            catch (e) {
                // 例外が発生した場合はログに出力
                console.error(e);
                return null;
            }
        };
    }
}
exports.default = WebBrowser;

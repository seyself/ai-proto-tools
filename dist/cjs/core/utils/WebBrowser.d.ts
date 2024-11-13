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
    constructor();
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
    open: (url: string, options?: {
        textOnly?: boolean;
        width?: number;
        height?: number;
        timeout?: number;
        waitTime?: number;
        userAgent?: string;
        screenshot?: boolean | string;
        waitForSelector?: string;
    }) => Promise<string | WebPageContent | null>;
}
//# sourceMappingURL=WebBrowser.d.ts.map
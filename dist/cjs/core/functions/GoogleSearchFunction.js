"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebBrowser_js_1 = __importDefault(require("../utils/WebBrowser.js"));
const GoogleSearch_js_1 = __importDefault(require("../services/GoogleSearch.js"));
const ToolsFunction_js_1 = __importDefault(require("../functions/ToolsFunction.js"));
class GoogleSearchFunction extends ToolsFunction_js_1.default {
    constructor(enableResultLinks = false) {
        super('google_search');
        this.enableResultLinks = enableResultLinks;
        this.description = 'Google search, fetch real-time data';
        this.properties = {
            query: {
                type: "string",
                description: "The search query",
            },
        };
        this.required = ['query'];
        this.strict = false;
        this.google = new GoogleSearch_js_1.default();
        this.browse = new WebBrowser_js_1.default();
    }
    async callFunction({ thread_id, run_id, call_id, args, onProgress, onCanceled }) {
        console.log('Google Search >>>');
        const searchResult = await this.google.search(args.query);
        console.log('searchResult >>>');
        const MAX_REFERENCE = 5;
        let searchItems = [];
        if (typeof searchResult === 'object' && searchResult !== null && 'data' in searchResult) {
            searchItems = searchResult.data?.items ?? [];
        }
        const len2 = Math.min(searchItems.length, MAX_REFERENCE);
        const links = [];
        let searchResultText = '';
        for (let j = 0; j < len2; j++) {
            const item = searchItems[j];
            const snippet = item?.snippet ?? '';
            const link = item?.link ?? '';
            const title = item?.title ?? '';
            console.log('check web page >>>', link);
            try {
                if (onProgress) {
                    await onProgress(`:thinking_face: Googleで検索中... ${j + 1}/${len2}`);
                }
            }
            catch (error) {
                console.error('Progress update failed:', error);
            }
            try {
                const webText = await this.browse.open(link);
                if (webText) {
                    const webInfo = `# ${title}\nurl: ${link}\n\n${webText}`;
                    searchResultText += `${webInfo}\n\n----------\n\n`;
                    if (this.enableResultLinks) {
                        links.push({ title, link });
                    }
                }
            }
            catch (error) {
                console.error('Failed to fetch web page:', error);
            }
        }
        try {
            if (onProgress) {
                await onProgress(':thinking_face: 検索結果をまとめ中...（情報が多いと5分くらいかかるかも）');
            }
        }
        catch (error) {
            console.error('Final progress update failed:', error);
        }
        if (!searchResultText) {
            searchResultText = '指定されたキーワードで検索できませんでした。';
        }
        return {
            thread_id,
            run_id,
            call_id,
            args: args,
            result: searchResultText,
            link: links,
        };
    }
}
exports.default = GoogleSearchFunction;

"use strict";
// API Docs
// https://developer.feedly.com/v3/streams/#get-the-content-of-a-stream
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Access Token
// https://feedly.com/v3/auth/dev
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const refreshToken = process.env.FEEDLY_REFRESH_TOKEN;
const streamId = process.env.FEEDLY_STREAM_ID;
const _fingerprintFile = './fingerprint.txt';
const _tokenFile = './feedly_access_token.txt';
class FeedlyUtility {
}
_a = FeedlyUtility;
FeedlyUtility.fingerprints = [];
FeedlyUtility.accessToken = process.env.FEEDLY_ACCESS_TOKEN;
FeedlyUtility._initialized = false;
FeedlyUtility.init = () => {
    if (_a._initialized)
        return;
    _a._initialized = true;
    if (fs_1.default.existsSync(_fingerprintFile) === false) {
        fs_1.default.writeFileSync(_fingerprintFile, '', 'utf8');
    }
    _a.fingerprints = (fs_1.default.readFileSync(_fingerprintFile, 'utf8') || '').split('\n');
    if (fs_1.default.existsSync(_tokenFile)) {
        _a.accessToken = fs_1.default.readFileSync(_tokenFile, 'utf8');
    }
    else {
        fs_1.default.writeFileSync(_tokenFile, _a.accessToken || '', 'utf8');
    }
};
FeedlyUtility.updateToken = async (newToken) => {
    fs_1.default.writeFileSync(_tokenFile, newToken, 'utf8');
    _a.accessToken = newToken;
};
class Feedly {
    constructor() {
        this.tokenRefresh = async () => {
            this.hasError = false;
            this.error = null;
            const apiUrl = `https://cloud.feedly.com/v3/auth/token`;
            const params = {
                refresh_token: refreshToken,
                client_id: 'feedlydev', // 固定値
                client_secret: 'feedlydev', // 固定値
                grant_type: 'refresh_token', // 固定値
            };
            const headers = {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${FeedlyUtility.accessToken}`
            };
            try {
                const response = await axios_1.default.post(apiUrl, params, { headers });
                // フィードのデータを表示
                console.log(JSON.stringify(response.data, null, '  '));
                const newToken = response.data.access_token;
                console.log('Feedly:: Redresh Access Token:: ' + newToken);
                if (newToken) {
                    FeedlyUtility.updateToken(newToken);
                }
            }
            catch (error) {
                this.hasError = true;
                this.error = error;
                console.error('Feedly:: Token Refresh Failed');
                console.log('Error fetching data:', error.message);
            }
        };
        this.getLatestFeed = async (count = 10, newerThanMinutes = 60) => {
            this.hasError = false;
            this.error = null;
            const newerThan = newerThanMinutes * 60 * 1000;
            // フィードを取得したいカテゴリーまたはフィードID
            const params = `streamId=${streamId}&unreadOnly=true&count=${count}&ranked=newest&newerThan=${newerThan}`;
            // Feedly APIのエンドポイント
            const apiUrl = `https://cloud.feedly.com/v3/streams/contents?${params}`;
            try {
                const response = await axios_1.default.get(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${FeedlyUtility.accessToken}`
                    }
                });
                this.response = response;
                // フィードのデータを表示
                const items = response.data.items;
                const markIds = [];
                const entries = [];
                for (const item of items) {
                    const summary = cheerio.load(item.summary?.content || '');
                    const content = cheerio.load(item.fullContent || item.content?.content || '');
                    let url = (item.alternate || [])[0]?.href;
                    if (!url)
                        url = item.canonicalUrl;
                    if (!url)
                        url = item.originId;
                    if (url.indexOf('http') != 0) {
                        markIds.push(item.id);
                        continue;
                    }
                    if (url.indexOf('https://trends.google.co.jp/trends') >= 0) {
                        // console.log(JSON.stringify(item, null, '  '));
                        markIds.push(item.id);
                        continue;
                    }
                    if (FeedlyUtility.fingerprints.indexOf(item.fingerprint) >= 0) {
                        markIds.push(item.id);
                        continue;
                    }
                    FeedlyUtility.fingerprints.push(item.fingerprint);
                    const data = {
                        id: item.id,
                        fingerprint: item.fingerprint,
                        title: item.title,
                        url: url,
                        published: item.published,
                        published_string: new Date(item.published).toLocaleString(),
                        keywords: item.keywords || [],
                        summary: summary.text(),
                        content: content.text(),
                        contentText: '',
                    };
                    let text = '';
                    // text += `fingerprint: ${data.fingerprint}` + '\n';
                    text += `title: ${data.title}` + '\n';
                    // text += `url: ${data.url}` + '\n';
                    // text += `published: ${data.published_string}` + '\n';
                    text += `keywords: ${data.keywords?.join(', ') || ''}` + '\n';
                    if (data.content) {
                        if (data.summary) {
                            if (data.content.length > data.summary.length) {
                                text += `content: ${data.content}` + '\n';
                            }
                            else {
                                text += `content: ${data.summary}` + '\n';
                            }
                        }
                        else {
                            text += `content: ${data.content}` + '\n';
                        }
                    }
                    else {
                        if (data.summary) {
                            text += `content: ${data.summary}` + '\n';
                        }
                    }
                    data.contentText = text;
                    // console.log(`---------------------------------`);
                    // console.log(text);
                    // console.log(JSON.stringify(item, null, '  '));
                    markIds.push(item.id);
                    entries.push(data);
                    this.markIds = markIds;
                    this.entries = entries;
                }
                // console.log(JSON.stringify(response.data, null, '  '));
            }
            catch (error) {
                this.hasError = true;
                this.error = error;
                console.log('Error fetching data:', error.message);
            }
            if (this.hasError) {
                await this.tokenRefresh();
            }
            fs_1.default.writeFileSync(_fingerprintFile, FeedlyUtility.fingerprints.join('\n'), 'utf8');
        };
        this.markAsRead = async (entryIds) => {
            this.hasError = false;
            this.error = null;
            const apiUrl = `https://cloud.feedly.com/v3/markers`;
            const headers = {
                'Authorization': `Bearer ${FeedlyUtility.accessToken}`
            };
            const params = {
                action: 'markAsRead',
                type: 'entries',
                entryIds: entryIds,
            };
            try {
                const response = await axios_1.default.post(apiUrl, params, { headers });
                // フィードのデータを表示
                console.log(JSON.stringify(response.data, null, '  '));
                // const items = response.data.items;
                // for (const item of items) 
                // {
                // }
            }
            catch (error) {
                this.hasError = true;
                this.error = error;
                console.log('Error fetching data:', error.message);
            }
        };
        FeedlyUtility.init();
        this.hasError = false;
        this.error = null;
        this.markIds = [];
        this.entries = [];
        this.response = null;
    }
}
exports.default = Feedly;

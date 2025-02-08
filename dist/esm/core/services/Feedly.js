// API Docs
// https://developer.feedly.com/v3/streams/#get-the-content-of-a-stream
var _a;
// Access Token
// https://feedly.com/v3/auth/dev
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();
const refreshToken = process.env.FEEDLY_REFRESH_TOKEN;
const streamId = process.env.FEEDLY_STREAM_ID;
const _fingerprintFile = './feedly/fingerprint.txt';
const _tokenFile = './feedly/feedly_access_token.txt';
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
    if (fs.existsSync(_fingerprintFile) === false) {
        fs.writeFileSync(_fingerprintFile, '', 'utf8');
    }
    _a.fingerprints = (fs.readFileSync(_fingerprintFile, 'utf8') || '').split('\n');
    if (fs.existsSync(_tokenFile)) {
        _a.accessToken = fs.readFileSync(_tokenFile, 'utf8');
    }
    else {
        fs.writeFileSync(_tokenFile, _a.accessToken || '', 'utf8');
    }
};
FeedlyUtility.updateToken = async (newToken) => {
    fs.writeFileSync(_tokenFile, newToken, 'utf8');
    _a.accessToken = newToken;
};
export default class Feedly {
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
                const response = await axios.post(apiUrl, params, { headers });
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
                const response = await axios.get(apiUrl, {
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
            fs.writeFileSync(_fingerprintFile, FeedlyUtility.fingerprints.join('\n'), 'utf8');
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
                const response = await axios.post(apiUrl, params, { headers });
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

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const customSearch = googleapis_1.google.customsearch("v1");
const googleApiKey = process.env.GOOGLE_API_KEY;
const searchEngineID = process.env.GOOGLE_SEARCH_ENGINE_ID;
class GoogleSearch {
    async search(keyword, len = 5, startIndex = 1) {
        try {
            if (!keyword)
                return 'no keyword';
            const searchParams = {
                auth: googleApiKey,
                cx: searchEngineID,
                q: keyword,
                num: len,
                dateRestrict: 'y1',
                start: startIndex,
            };
            const result = await customSearch.cse.list(searchParams);
            return result;
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }
}
exports.default = GoogleSearch;

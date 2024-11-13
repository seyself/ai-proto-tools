import { google } from 'googleapis';
import { type GaxiosResponse } from 'googleapis-common';
import dotenv from 'dotenv';

dotenv.config();

const customSearch = google.customsearch("v1");

const googleApiKey = process.env.GOOGLE_API_KEY;
const searchEngineID = process.env.GOOGLE_SEARCH_ENGINE_ID;

export default class GoogleSearch {
  public async search(keyword: string): Promise<GaxiosResponse | string | null> {
    try {
      if (!keyword) return 'no keyword';
      const result = await customSearch.cse.list({
        auth: googleApiKey,
        cx: searchEngineID,
        q: keyword,
        num: 5,
        dateRestrict: 'y1',
      });
      return result;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

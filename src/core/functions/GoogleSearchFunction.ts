import { setTimeout } from 'timers/promises';
import WebBrowser from '../utils/WebBrowser.js';
import GoogleSearch from '../services/GoogleSearch.js';
import ToolsFunction, { type CallFunctionArgs, type CallFunctionResult } from '../functions/ToolsFunction.js';


export default class GoogleSearchFunction extends ToolsFunction {
  private readonly enableResultLinks: boolean;
  public readonly description: string;
  public readonly properties: {
    query: {
      type: string;
      description: string;
    };
  };
  public readonly required: string[];
  public readonly strict: boolean;
  private readonly google: GoogleSearch;
  private readonly browse: WebBrowser;

  constructor(enableResultLinks: boolean = false) {
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
    this.google = new GoogleSearch();
    this.browse = new WebBrowser();
  }

  override async callFunction({
    thread_id,
    run_id,
    call_id,
    args,
    onProgress,
    onCanceled
  }: CallFunctionArgs): Promise<CallFunctionResult> {
    console.log('Google Search >>>');
    const searchResult = await this.google.search(args.query);

    console.log('searchResult >>>');
    const MAX_REFERENCE = 5;
    let searchItems: any[] = [];
    if (typeof searchResult === 'object' && searchResult !== null && 'data' in searchResult) {
      searchItems = searchResult.data?.items ?? [];
    }
    const len2 = Math.min(searchItems.length, MAX_REFERENCE);
    const links: { title: string; link: string }[] = [];
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
      } catch (error: unknown) {
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
      } catch (error: unknown) {
        console.error('Failed to fetch web page:', error);
      }
    }

    try {
      if (onProgress) {
        await onProgress(':thinking_face: 検索結果をまとめ中...（情報が多いと5分くらいかかるかも）');
      }
    } catch (error: unknown) {
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
      text: searchResultText,
      link: links,
    };
  }
}

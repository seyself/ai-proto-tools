export interface FeedlyEntry {
    id: string;
    fingerprint: string;
    title: string;
    url: string;
    published: number;
    published_string: string;
    keywords: string[];
    summary: string;
    content: string;
    contentText: string;
}
export interface FeedlyResponse {
    items: {
        id: string;
        fingerprint: string;
        title: string;
        summary?: {
            content: string;
        };
        fullContent?: string;
        content?: {
            content: string;
        };
        alternate?: Array<{
            href: string;
        }>;
        canonicalUrl?: string;
        originId?: string;
        published: number;
        keywords?: string[];
    }[];
}
export default class Feedly {
    hasError: boolean;
    error: Error | null;
    private markIds;
    entries: FeedlyEntry[];
    response: any;
    constructor();
    tokenRefresh: () => Promise<void>;
    getLatestFeed: (count?: number, newerThanMinutes?: number) => Promise<void>;
    markAsRead: (entryIds: string[]) => Promise<void>;
}
//# sourceMappingURL=Feedly.d.ts.map
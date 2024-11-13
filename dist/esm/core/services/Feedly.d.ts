interface FeedlyEntry {
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
export {};
//# sourceMappingURL=Feedly.d.ts.map
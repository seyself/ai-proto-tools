import { type IChatHelper, type ChatHelperOptions } from '../IChatHelper.js';
export default class GeminiChat implements IChatHelper {
    private systemPrompt;
    readonly useModel: string;
    private maxTokens;
    private tools;
    private json;
    private history;
    constructor(options?: ChatHelperOptions);
    clearHistory(): void;
    addUserMessage: (content: string) => void;
    addAssistantMessage: (content: string) => void;
    send: (userPrompt: string, options?: ChatHelperOptions) => Promise<string | object | null>;
    vision: (text: string, files: string[], options?: ChatHelperOptions) => Promise<string | null>;
}
//# sourceMappingURL=GeminiChat.d.ts.map
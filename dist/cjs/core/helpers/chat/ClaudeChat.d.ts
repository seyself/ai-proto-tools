import { type IChatHelper, type ChatHelperOptions } from '../IChatHelper.js';
export default class ClaudeChat implements IChatHelper {
    private systemPrompt;
    private useModel;
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
//# sourceMappingURL=ClaudeChat.d.ts.map
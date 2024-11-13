import { IChatHelper, ChatHelperOptions } from './IChatHelper.js';
export default class MultiAgent {
    private director;
    private agentList;
    private agentDict;
    constructor(director: IChatHelper);
    addAgent(name: string, agent: IChatHelper): void;
    removeAgent(name: string): void;
    hasAgent(name: string): boolean;
    getAgent(name: string): IChatHelper;
    send(message: string, options?: ChatHelperOptions): Promise<string | object | null>;
}
//# sourceMappingURL=MultiAgent.d.ts.map
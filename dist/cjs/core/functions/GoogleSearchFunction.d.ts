import ToolsFunction, { type CallFunctionArgs, type CallFunctionResult } from '../functions/ToolsFunction.js';
export default class GoogleSearchFunction extends ToolsFunction {
    private readonly enableResultLinks;
    readonly description: string;
    readonly properties: {
        query: {
            type: string;
            description: string;
        };
    };
    readonly required: string[];
    readonly strict: boolean;
    private readonly google;
    private readonly browse;
    constructor(enableResultLinks?: boolean);
    callFunction({ thread_id, run_id, call_id, args, onProgress, onCanceled }: CallFunctionArgs): Promise<CallFunctionResult>;
}
//# sourceMappingURL=GoogleSearchFunction.d.ts.map
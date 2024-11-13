import { IChatHelper, ChatHelperOptions } from './IChatHelper.js';

export default class MultiAgent {
  private director: IChatHelper;
  private agentList: { name: string; agent: IChatHelper }[] = [];
  private agentDict: Record<string, IChatHelper> = {};

  constructor(director: IChatHelper) {
    this.director = director;
  }

  addAgent(name: string, agent: IChatHelper) {
    if (this.agentDict[name]) {
      throw new Error(`Agent with name ${name} already exists`);
    }
    this.agentList.push({ name, agent });
    this.agentDict[name] = agent;
  }

  removeAgent(name: string) {
    const index = this.agentList.findIndex((agent) => agent.name === name);
    if (index !== -1) {
      this.agentList.splice(index, 1);
      delete this.agentDict[name];
    }
  }

  hasAgent(name: string) {
    return this.agentDict[name] !== undefined;
  }

  getAgent(name: string) {
    return this.agentDict[name];
  }

  async send(message: string, options?: ChatHelperOptions) {
    const result = await this.director.send(message, options);
    return result;
  }


}

export default class MultiAgent {
    constructor(director) {
        this.agentList = [];
        this.agentDict = {};
        this.director = director;
    }
    addAgent(name, agent) {
        if (this.agentDict[name]) {
            throw new Error(`Agent with name ${name} already exists`);
        }
        this.agentList.push({ name, agent });
        this.agentDict[name] = agent;
    }
    removeAgent(name) {
        const index = this.agentList.findIndex((agent) => agent.name === name);
        if (index !== -1) {
            this.agentList.splice(index, 1);
            delete this.agentDict[name];
        }
    }
    hasAgent(name) {
        return this.agentDict[name] !== undefined;
    }
    getAgent(name) {
        return this.agentDict[name];
    }
    async send(message, options) {
        const result = await this.director.send(message, options);
        return result;
    }
}

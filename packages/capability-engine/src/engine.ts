import { AgentRegistry, AgentProfile } from '@atlas/agent-registry';

export class CapabilityEngine {
  constructor(private registry: AgentRegistry) {}

  /**
   * Returns all enabled agents that have the specified capability.
   */
  public async findAgentsByCapability(capability: string): Promise<AgentProfile[]> {
    const all = await this.registry.listAgents();
    return all.filter(agent => 
      agent.status === 'enabled' && 
      agent.capabilities.some(cap => cap.toLowerCase() === capability.toLowerCase())
    );
  }

  /**
   * Scores and returns the best matching agent for a list of requirements.
   */
  public async findBestAgentForTask(taskRequirements: string[]): Promise<AgentProfile | null> {
    const all = await this.registry.listAgents();
    const enabledAgents = all.filter(a => a.status === 'enabled');

    let bestAgent: AgentProfile | null = null;
    let highestScore = -1;

    for (const agent of enabledAgents) {
      let score = 0;
      for (const req of taskRequirements) {
        const hasCap = agent.capabilities.some(c => c.toLowerCase() === req.toLowerCase());
        const hasPref = agent.preferredTasks.some(t => t.toLowerCase() === req.toLowerCase());

        if (hasCap) {
          score += 10; // High score for matching capability
        }
        if (hasPref) {
          score += 3; // Preference match
        }
      }

      if (score > 0) {
        // Include a subtle reliability modifier
        score += agent.statistics.successRate * 2;

        if (score > highestScore) {
          highestScore = score;
          bestAgent = agent;
        }
      }
    }

    // If no specific match, fallback to the template database
    if (!bestAgent) {
      const templates = await this.registry.listTemplates();
      for (const tmpl of templates) {
        let score = 0;
        for (const req of taskRequirements) {
          if (tmpl.capabilities.some(c => c.toLowerCase() === req.toLowerCase())) {
            score += 10;
          }
        }
        if (score > highestScore && score > 0) {
          highestScore = score;
          // Dynamically instantiate this template in the registry
          const id = `agent_${tmpl.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
          bestAgent = await this.registry.createFromTemplate(tmpl.id, id);
        }
      }
    }

    return bestAgent;
  }
}

export interface MergedContext {
  promptText: string;
  tokenEstimate: number;
}

export interface SharedContext {
  conversationHistory: string[];
  timelineEvents: string[];
  keyDecisions: string[];
  outputs: Record<string, string>; // stepId -> output string
  files: Record<string, string>; // filePath -> content
}

export class ContextEngine {
  /**
   * Instantiates a new blank shared workspace context.
   */
  public createSharedContext(): SharedContext {
    return {
      conversationHistory: [],
      timelineEvents: [],
      keyDecisions: [],
      outputs: {},
      files: {}
    };
  }

  /**
   * Merges all memory tiers and shared states into a unified context prompt text.
   */
  public mergeContext(
    systemPrompt: string,
    agentMemory: string[],
    sharedContext: SharedContext,
    additionalFiles?: Record<string, string>
  ): MergedContext {
    const segments: string[] = [];

    // 1. Core Instruction
    segments.push(`## System Prompt / Core Directive:\n${systemPrompt}`);

    // 2. Agent Memory
    if (agentMemory.length > 0) {
      segments.push(`## Agent Specialized Memory:\n${agentMemory.join('\n')}`);
    }

    // 3. Shared Context History
    if (sharedContext.conversationHistory.length > 0) {
      segments.push(`## Shared Conversation Logs:\n${sharedContext.conversationHistory.join('\n')}`);
    }

    // 4. Decided Path / Milestones
    if (sharedContext.keyDecisions.length > 0) {
      segments.push(`## Core Decisions & Milestones:\n${sharedContext.keyDecisions.map(d => `- ${d}`).join('\n')}`);
    }

    // 5. Merged Outputs from prior tasks
    const priorOutputs = Object.entries(sharedContext.outputs);
    if (priorOutputs.length > 0) {
      segments.push(`## Output Results from Prior Task Steps:`);
      for (const [stepId, output] of priorOutputs) {
        segments.push(`### Step [${stepId}] Output:\n\`\`\`\n${output}\n\`\`\``);
      }
    }

    // 6. Merged Files
    const allFiles = { ...sharedContext.files, ...additionalFiles };
    const filesList = Object.entries(allFiles);
    if (filesList.length > 0) {
      segments.push(`## Relevant Files & Content:`);
      for (const [filePath, content] of filesList) {
        segments.push(`### File: ${filePath}\n\`\`\`\n${content}\n\`\`\``);
      }
    }

    const mergedText = segments.join('\n\n');
    
    return {
      promptText: mergedText,
      // Rough estimate of tokens
      tokenEstimate: Math.ceil(mergedText.split(/\s+/).length * 1.3)
    };
  }
}

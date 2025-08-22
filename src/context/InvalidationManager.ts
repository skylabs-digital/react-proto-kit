// Invalidation rules and management
export interface InvalidationRule {
  entity: string;
  invalidates: string[];
  condition?: (data: any) => boolean;
}

export class InvalidationManager {
  private rules: Map<string, InvalidationRule> = new Map();
  private subscribers: Map<string, Set<() => void>> = new Map();

  addRule(rule: InvalidationRule) {
    this.rules.set(rule.entity, rule);
  }

  subscribe(entity: string, callback: () => void) {
    if (!this.subscribers.has(entity)) {
      this.subscribers.set(entity, new Set());
    }
    this.subscribers.get(entity)!.add(callback);

    return () => {
      this.subscribers.get(entity)?.delete(callback);
    };
  }

  invalidate(entity: string, data?: any) {
    // Always invalidate the entity itself, even without rules
    const rule = this.rules.get(entity);
    const shouldInvalidate = !rule?.condition || rule.condition(data);

    let invalidatedEntities = [entity];

    // Add related entities if rule exists and condition passes
    if (rule && shouldInvalidate) {
      invalidatedEntities = [entity, ...rule.invalidates];
    }

    // Notify subscribers of all entities to invalidate
    invalidatedEntities.forEach(entityToInvalidate => {
      const callbacks = this.subscribers.get(entityToInvalidate);
      if (callbacks) {
        callbacks.forEach(callback => callback());
      }
    });

    return invalidatedEntities;
  }

  getInvalidationTargets(entity: string): string[] {
    const rule = this.rules.get(entity);
    return rule ? [entity, ...rule.invalidates] : [entity];
  }
}

// Global instance
export const globalInvalidationManager = new InvalidationManager();

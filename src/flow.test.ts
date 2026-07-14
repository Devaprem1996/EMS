import { describe, it, expect } from 'vitest';

// Function containing the transition rules implemented in the APIs
function getAutomaticStageTransition(status: string, assignmentType: string): { stage: string; status: string } {
  if (status === "Assign For Service") {
    return { stage: "SERVICES", status: "Pending Service" };
  } else if (status === "Completed") {
    if (assignmentType === "REFILLING") {
      return { stage: "COMPLETED", status: "Order Delivered" };
    } else if (assignmentType === "SERVICE") {
      return { stage: "COMPLETED", status: "Service Done" };
    } else {
      return { stage: "COMPLETED", status: "Completed" };
    }
  }
  return { stage: "CURRENT", status }; // no transition
}

describe('Automatic Stage Transition Flow Logic', () => {
  it('should transition a Refilling task to SERVICES if flagged with Assign For Service', () => {
    const result = getAutomaticStageTransition("Assign For Service", "REFILLING");
    expect(result.stage).toBe("SERVICES");
    expect(result.status).toBe("Pending Service");
  });

  it('should transition a Refilling task to COMPLETED if Completed is logged', () => {
    const result = getAutomaticStageTransition("Completed", "REFILLING");
    expect(result.stage).toBe("COMPLETED");
    expect(result.status).toBe("Order Delivered");
  });

  it('should transition a Service task to COMPLETED once finished', () => {
    const result = getAutomaticStageTransition("Completed", "SERVICE");
    expect(result.stage).toBe("COMPLETED");
    expect(result.status).toBe("Service Done");
  });

  it('should default to COMPLETED stage for standard dispatches marked completed', () => {
    const result = getAutomaticStageTransition("Completed", "DELIVERY");
    expect(result.stage).toBe("COMPLETED");
    expect(result.status).toBe("Completed");
  });
});

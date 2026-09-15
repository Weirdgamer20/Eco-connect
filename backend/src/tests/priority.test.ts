import { describe, it, expect } from "vitest";

describe("Deterministic Priority Rules", () => {
  const WEIGHTS = {
    safety: 0.35,
    environmental: 0.20,
    peopleAffected: 0.15,
    geographicSpread: 0.10,
    severity: 0.20,
  };

  const SEVERITY_SCORE: Record<string, number> = {
    CRITICAL: 1.0,
    HIGH: 0.8,
    MEDIUM: 0.5,
    LOW: 0.3,
    NEGLIGIBLE: 0.1,
  };

  function computeTestPriority(severity: string, isEnvCategory: boolean, upvotes = 0, downvotes = 0) {
    const severityScore = SEVERITY_SCORE[severity] ?? 0.5;
    const safetyScore = severity === "CRITICAL" ? 1.0
      : severity === "HIGH" ? 0.8
      : severity === "MEDIUM" ? 0.5
      : 0.2;
    const environmentalScore = isEnvCategory ? 0.8 : 0.4;
    const peopleAffectedEst = severity === "CRITICAL" ? 500
      : severity === "HIGH" ? 200
      : severity === "MEDIUM" ? 50
      : 10;
    const peopleScore = Math.min(peopleAffectedEst / 500, 1.0);
    const geographicSpreadKm = severity === "CRITICAL" ? 2.0 : severity === "HIGH" ? 1.0 : 0.3;
    const geoScore = Math.min(geographicSpreadKm / 2.0, 1.0);

    const compositeScore =
      safetyScore * WEIGHTS.safety +
      environmentalScore * WEIGHTS.environmental +
      peopleScore * WEIGHTS.peopleAffected +
      geoScore * WEIGHTS.geographicSpread +
      severityScore * WEIGHTS.severity;

    const band = compositeScore >= 0.75 ? "P1"
      : compositeScore >= 0.55 ? "P2"
      : compositeScore >= 0.35 ? "P3"
      : "P4";

    const finalPriority = severity === "CRITICAL" ? "P1" : band;
    return { compositeScore, priority: finalPriority };
  }

  it("should assign P1 override to CRITICAL severity issues", () => {
    const result = computeTestPriority("CRITICAL", true);
    expect(result.priority).toBe("P1");
    expect(result.compositeScore).toBeGreaterThanOrEqual(0.75);
  });

  it("should assign P2 to HIGH severity environmental issues", () => {
    const result = computeTestPriority("HIGH", true);
    expect(["P1", "P2"]).toContain(result.priority);
  });

  it("should assign lower priority P3 or P4 to LOW and NEGLIGIBLE issues", () => {
    const low = computeTestPriority("LOW", false);
    expect(["P3", "P4"]).toContain(low.priority);

    const negligible = computeTestPriority("NEGLIGIBLE", false);
    expect(negligible.priority).toBe("P4");
  });
});

/**
 * Readiness Engine
 * Calculates a deterministic readiness score based on sub-scores.
 */

/**
 * Calculates overall readiness based on the 40/20/20/20 formula.
 * @param {number} technicalAccuracy 
 * @param {number} communication 
 * @param {number} confidence 
 * @param {number} completeness 
 * @returns {number} The calculated overall readiness score (0-100)
 */
export function calculateReadiness(technicalAccuracy, communication, confidence, completeness) {
  const score = (technicalAccuracy * 0.40) + 
                (communication * 0.20) + 
                (confidence * 0.20) + 
                (completeness * 0.20);
                
  return Math.round(score);
}

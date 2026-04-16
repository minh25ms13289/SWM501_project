/**
 * AI Learning Path Recommendation Engine
 * Content-based + collaborative filtering
 */

function calculateSkillProfile(assessments, theoryResults) {
  const skills = {
    vehicleControl: 0, roadAwareness: 0, parking: 0, emergencyStops: 0, theoryScore: 0
  };

  if (assessments.length > 0) {
    skills.vehicleControl = avg(assessments.map(a => a.vehicle_control));
    skills.roadAwareness = avg(assessments.map(a => a.road_awareness));
    skills.parking = avg(assessments.map(a => a.parking));
    skills.emergencyStops = avg(assessments.map(a => a.emergency_stops));
  }

  if (theoryResults.length > 0) {
    skills.theoryScore = avg(theoryResults.map(t => t.score / t.total_questions * 5));
  }

  return skills;
}

function identifyWeakAreas(skillProfile) {
  return Object.entries(skillProfile)
    .filter(([_, score]) => score < 3.0 && score > 0)
    .sort((a, b) => a[1] - b[1])
    .map(([skill, score]) => ({ skill, score }));
}

function scoreRecommendation(slot, instructor, learnerProfile, weakAreas) {
  let score = 0;

  // Skill match (40%): instructor specialties match learner weak areas
  const instructorSpecialties = instructor.specialties || [];
  weakAreas.forEach(({ skill }) => {
    if (instructorSpecialties.includes(skill)) score += 0.4 / Math.max(1, weakAreas.length);
  });

  // Schedule match (30%): matches learner's preferred times
  const preferredTimes = learnerProfile.preferredTimes || [];
  if (preferredTimes.includes(slot.start_time)) score += 0.3;

  // Instructor rating (30%)
  score += (instructor.rating || 3) / 5 * 0.3;

  return Math.round(score * 100) / 100;
}

function recommendSessions(learnerProfile, availableSlots, instructors, limit = 3) {
  const weakAreas = identifyWeakAreas(learnerProfile.skills);

  const scored = availableSlots.map(slot => {
    const instructor = instructors.find(i => i.id === slot.instructor_id) || {};
    const score = scoreRecommendation(slot, instructor, learnerProfile, weakAreas);
    return { ...slot, instructorName: instructor.name, matchScore: score, reason: generateReason(weakAreas, instructor) };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

function generateReason(weakAreas, instructor) {
  if (weakAreas.length === 0) return 'General practice recommended';
  const top = weakAreas[0].skill.replace(/([A-Z])/g, ' $1').trim();
  const specialties = instructor.specialties || [];
  if (specialties.includes(weakAreas[0].skill)) {
    return `Strong in ${top} instruction, matches your weak area`;
  }
  return `Focus on ${top} practice`;
}

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

module.exports = { recommendSessions, calculateSkillProfile, identifyWeakAreas, scoreRecommendation };

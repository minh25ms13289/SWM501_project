/**
 * AI Demand Forecasting Engine
 * Uses simple moving average + seasonal decomposition
 */

function groupByWeek(bookings) {
  const weeks = {};
  bookings.forEach(b => {
    const week = getWeekStart(new Date(b.date));
    if (!weeks[week]) weeks[week] = [];
    weeks[week].push(b);
  });
  return Object.entries(weeks).map(([week, data]) => ({
    week, sessions: data.length,
  }));
}

function movingAverage(data, window) {
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / window);
  }
  return result;
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split('T')[0];
}

function forecastDemand(historicalBookings, weeksAhead = 4) {
  if (historicalBookings.length < 84) { // 12 weeks * 7 days
    throw new Error('Insufficient historical data. Need at least 12 weeks.');
  }

  const weeklyData = groupByWeek(historicalBookings);
  const sessions = weeklyData.map(w => w.sessions);

  // Day-of-week seasonal factors (Mon=0.8 to Fri=1.3, weekend lower)
  const dayOfWeekFactor = [0.8, 1.0, 1.1, 1.2, 1.3, 0.9, 0.6];

  // Simple Moving Average (4-week window)
  const sma = movingAverage(sessions, 4);
  const lastSMA = sma[sma.length - 1] || sessions[sessions.length - 1];
  const trend = sma.length >= 2 ? sma[sma.length - 1] - sma[sma.length - 2] : 0;

  // Generate forecast
  const forecast = [];
  for (let week = 0; week < weeksAhead; week++) {
    const baseValue = lastSMA + trend * (week + 1);
    const predictedDaily = dayOfWeekFactor.map(f => Math.max(1, Math.round(baseValue * f / 7)));
    const totalSessions = predictedDaily.reduce((a, b) => a + b, 0);

    forecast.push({
      weekOffset: week + 1,
      predictedDaily,
      totalSessions,
      recommendedInstructors: Math.ceil(totalSessions / 3 / 5), // 3 learners/session, 5 days
      recommendedVehicles: Math.ceil(totalSessions / 5),
      confidence: Math.max(0.5, 1 - week * 0.1),
    });
  }

  return forecast;
}

module.exports = { forecastDemand, groupByWeek, movingAverage };

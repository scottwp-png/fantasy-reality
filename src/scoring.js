// ─── Scoring Engine ───
export function calcContestantWeekPoints(weekScores, contestantId) {
  const cs = weekScores?.[contestantId];
  if (!cs) return 0;
  return Object.values(cs).reduce((s, v) => s + v, 0);
}

export function calcTeamWeekPoints(league, team, weekNum) {
  const weekScores = league.weeklyScores?.[weekNum] || {};
  const format = league.format;

  if (format === "standard") {
    const weekRoster = team.weeklyRosters?.[weekNum] || [];
    return weekRoster.reduce((sum, cid) => sum + calcContestantWeekPoints(weekScores, cid), 0);
  }

  if (format === "captains") {
    const savedChart = team.weeklyDepthCharts?.[weekNum];
    if (!savedChart) return 0;
    const chart = savedChart;

    // Best Ball: auto-optimize lineup from all rostered contestants
    if (league.bestBall) {
      const allRostered = [chart.captain, chart.coCaptain, ...(chart.regulars||[])].filter(Boolean);
      const scored = allRostered.map(cid => ({ cid, pts: calcContestantWeekPoints(weekScores, cid) })).sort((a,b) => b.pts - a.pts);
      let total = 0;
      if (scored[0]) total += scored[0].pts * 2;      // Best → Hero (2×)
      if (scored[1]) total += scored[1].pts * 1.5;    // 2nd → Side-Kick (1.5×)
      for (let i = 2; i < scored.length; i++) total += scored[i].pts; // Rest → Vigilante (1×)
      return Math.round(total * 100) / 100;
    }

    let total = 0;
    if (chart.captain) total += calcContestantWeekPoints(weekScores, chart.captain) * 2;
    if (chart.coCaptain) total += calcContestantWeekPoints(weekScores, chart.coCaptain) * 1.5;
    (chart.regulars || []).forEach(cid => { total += calcContestantWeekPoints(weekScores, cid); });
    return Math.round(total * 100) / 100;
  }

  if (format === "survivor_pool") {
    // Survivor pool: 1 point per week your pick is still alive
    const pick = team.survivorPoolPick;
    if (!pick) return 0;
    const contestant = (league.contestants||[]).find(c=>c.id===pick);
    if (!contestant) return 0;
    // Check if eliminated on or before this week
    if (contestant.eliminatedWeek && contestant.eliminatedWeek <= Number(weekNum)) return 0;
    return 1; // survived this week
  }

  if (format === "elimination_pool") {
    const weekPick = team.weeklyPicks?.[weekNum];
    if (!weekPick) return 0;
    const contestant = (league.contestants||[]).find(c=>c.id===weekPick);
    if (!contestant) return 0;
    // Did this contestant survive this week?
    if (contestant.status === "eliminated" && contestant.eliminatedWeek === Number(weekNum)) return -5;
    return 3; // survived
  }

  if (format === "salary_cap") {
    const roster = team.salaryCapRoster || [];
    return roster.reduce((sum, cid) => sum + calcContestantWeekPoints(weekScores, cid), 0);
  }

  if (format === "predictions") {
    // Predictions are stored per-team per-week with scores
    return team.predictionScores?.[weekNum] || 0;
  }

  return 0;
}

export function calcStandings(league) {
  if (!league.teams?.length) return [];
  const weeks = Object.keys(league.weeklyScores || {}).sort((a, b) => +a - +b);

  if (league.format === "survivor_pool") {
    return league.teams.map(team => {
      const pick = team.survivorPoolPick;
      const contestant = pick ? (league.contestants||[]).find(c=>c.id===pick) : null;
      const isAlive = contestant && contestant.status !== "eliminated";
      const weeksAlive = contestant?.eliminatedWeek ? contestant.eliminatedWeek - 1 : weeks.length;
      return { ...team, total: weeksAlive, isAlive, pick: contestant?.name || "No pick", weeklyTotals: {} };
    }).sort((a,b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      return b.total - a.total;
    });
  }

  // Calculate base weekly points for all teams
  const teamsWithPoints = league.teams.map(team => {
    let total = 0;
    const weeklyTotals = {};
    weeks.forEach(w => {
      const wPts = calcTeamWeekPoints(league, team, w);
      weeklyTotals[w] = wPts;
      total += wPts;
    });
    return { ...team, total: Math.round(total * 100) / 100, weeklyTotals };
  });

  // Categories/Roto: rank teams by scoring category
  if (league.rotoScoring && (league.scoringRules||[]).length > 0) {
    const categories = [...new Set((league.scoringRules||[]).map(r=>r.category||"Other"))];
    const catTotals = {}; // {teamId: {category: total}}

    teamsWithPoints.forEach(team => {
      catTotals[team.id] = {};
      categories.forEach(cat => {
        const catRules = (league.scoringRules||[]).filter(r=>(r.category||"Other")===cat);
        let catTotal = 0;
        weeks.forEach(w => {
          const ws = league.weeklyScores?.[w] || {};
          // Sum all contestant scores for this team's rostered players in this category
          // Simplified: sum category rule points across all contestants on the team
          if (league.format === "captains") {
            const chart = team.weeklyDepthCharts?.[w] || team.depthChart || {};
            const rostered = [chart.captain, chart.coCaptain, ...(chart.regulars||[])].filter(Boolean);
            rostered.forEach(cid => {
              catRules.forEach(r => { catTotal += (ws[cid]?.[r.id] || 0); });
            });
          } else if (league.format === "standard") {
            const roster = team.weeklyRosters?.[w] || [];
            roster.forEach(cid => {
              catRules.forEach(r => { catTotal += (ws[cid]?.[r.id] || 0); });
            });
          }
        });
        catTotals[team.id][cat] = Math.round(catTotal * 100) / 100;
      });
    });

    // Rank each category (higher is better for positive, lower is better for negative)
    const catRanks = {}; // {teamId: {category: rank}}
    teamsWithPoints.forEach(t => { catRanks[t.id] = {}; });

    categories.forEach(cat => {
      const sorted = teamsWithPoints.map(t => ({ id: t.id, val: catTotals[t.id][cat] }))
        .sort((a,b) => b.val - a.val); // highest first = rank 1
      sorted.forEach((t, i) => { catRanks[t.id][cat] = i + 1; });
    });

    return teamsWithPoints.map(team => {
      const ranks = catRanks[team.id];
      const rotoTotal = Object.values(ranks).reduce((s,v) => s + v, 0);
      return {
        ...team,
        roto: true,
        catTotals: catTotals[team.id],
        catRanks: ranks,
        rotoTotal,
        total: rotoTotal,
      };
    }).sort((a, b) => a.rotoTotal - b.rotoTotal); // Lower roto total = better
  }

  // Head-to-Head: calculate W/L record from weekly matchups
  if (league.headToHead && league.teams.length >= 2) {
    const teamIds = league.teams.map(t=>t.id);
    const records = {};
    teamIds.forEach(id => { records[id] = { wins: 0, losses: 0, ties: 0 }; });

    weeks.forEach(w => {
      // Generate matchups: rotate schedule
      const wNum = Number(w);
      const ids = [...teamIds];
      // Simple round-robin rotation
      const rotated = [...ids];
      for (let r = 0; r < (wNum - 1) % Math.max(ids.length - 1, 1); r++) {
        const last = rotated.pop();
        rotated.splice(1, 0, last);
      }
      // Pair up
      const pairs = [];
      for (let i = 0; i < Math.floor(rotated.length / 2); i++) {
        pairs.push([rotated[i], rotated[rotated.length - 1 - i]]);
      }

      pairs.forEach(([a, b]) => {
        const aTeam = teamsWithPoints.find(t=>t.id===a);
        const bTeam = teamsWithPoints.find(t=>t.id===b);
        if (!aTeam || !bTeam) return;
        const aPts = aTeam.weeklyTotals?.[w] || 0;
        const bPts = bTeam.weeklyTotals?.[w] || 0;
        if (aPts > bPts) { records[a].wins++; records[b].losses++; }
        else if (bPts > aPts) { records[b].wins++; records[a].losses++; }
        else { records[a].ties++; records[b].ties++; }
      });
    });

    return teamsWithPoints.map(team => ({
      ...team,
      h2h: records[team.id],
      h2hRecord: records[team.id].wins + "-" + records[team.id].losses + (records[team.id].ties ? "-" + records[team.id].ties : ""),
      h2hWinPct: weeks.length > 0 ? Math.round((records[team.id].wins / Math.max(records[team.id].wins + records[team.id].losses + records[team.id].ties, 1)) * 1000) / 10 : 0,
    })).sort((a, b) => {
      // Sort by wins first, then total points as tiebreaker
      if (a.h2h.wins !== b.h2h.wins) return b.h2h.wins - a.h2h.wins;
      return b.total - a.total;
    });
  }

  return teamsWithPoints.sort((a, b) => b.total - a.total);
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  Foundation_NpcBehavior_V1_Model_decideNpcIntentCode,
  Foundation_Pickups_V1_Model_computeAwardedScore,
  Foundation_Pickups_V1_Model_computePickupGrowthUnits,
} from './generatedPrismRuntime';
import {
  classifyBiomeAtPosition,
  computeUpdatedPlayerElo,
  createPrismWorldState,
  createSeedHallOfFame,
  evaluatePrismDispatch,
  PRISM_SPEC_DOCUMENT,
  recordRunToSovereignHall,
  stepGameShellState,
  stepPrismWorld,
  teleportPlayerToBiome,
  validatePilotCallsign,
  verifyAllPrismInvariants,
  verifyLeaderboardReceipt,
} from './prismEngine';

test('PrismSerpent::dispatch satisfies all 12 spec.json examples and refuses malformed inputs', () => {
  for (const ex of PRISM_SPEC_DOCUMENT.examples) {
    const actual = evaluatePrismDispatch(ex.request);
    assert.equal(actual, ex.response, `Mismatch for spec example: ${ex.request}`);
  }

  assert.equal(evaluatePrismDispatch(''), 'invalid');
  assert.equal(evaluatePrismDispatch('arena unknown none nexus-bowl cruise 12 0'), 'invalid');
  assert.equal(evaluatePrismDispatch('arena energy-orb none nexus-bowl cruise 0 0'), 'invalid');
  assert.equal(evaluatePrismDispatch('arena energy-orb none nexus-bowl cruise 250 0'), 'invalid');
  assert.equal(evaluatePrismDispatch('arena energy-orb none nexus-bowl cruise 12 105'), 'invalid');
});

test('Full 9-facet LexLean invariants, acceptance suite, and hosted Lean 4.32 receipt pass', () => {
  const report = verifyAllPrismInvariants();
  assert.equal(report.allPassed, true);
  assert.equal(report.acceptancePassed, report.acceptanceTotal);
  assert.ok(report.acceptanceTotal >= 50);
  assert.equal(report.totalModules, 15);
  assert.ok(report.hostedAttestationCount >= 1);
  for (const facet of report.facetResults) {
    assert.equal(facet.passed, true, `Facet failed: ${facet.facet} (${facet.theorem})`);
  }
});

test('OPM/UML Game Shell state machine transitions deterministically', () => {
  assert.equal(stepGameShellState('title', 'start'), 'playing');
  assert.equal(stepGameShellState('playing', 'toggle-pause'), 'paused');
  assert.equal(stepGameShellState('paused', 'toggle-pause'), 'playing');
  assert.equal(stepGameShellState('playing', 'hull-depleted'), 'gameover');
  assert.equal(stepGameShellState('gameover', 'start'), 'playing');
  assert.equal(stepGameShellState('paused', 'return-title'), 'title');
});

test('Serpent kinematics, orb collection growth, and overdrive boost mass shedding work', () => {
  const world = createPrismWorldState('arena', 'TEST-PILOT', 101);
  const initialScore = world.player.score;

  // Step forward straight north through the starter breadcrumb orb lane
  for (let i = 0; i < 45; i++) {
    stepPrismWorld(world, 1 / 30, {
      steerDelta: 0,
      targetWorldAngle: null,
      boostHeld: false,
      attunePressed: false,
    });
  }
  assert.ok(world.player.score > initialScore, 'Player should collect starter energy orbs');

  const cruiseSpeed = world.player.speed;
  // Isolate pure boost mass shedding from ambient orb pickups
  world.orbs.length = 0;
  world.relics.length = 0;
  while (world.player.segments.length < 20) {
    world.player.segments.push({ ...world.player.segments[world.player.segments.length - 1] });
  }
  const beforeBoostLen = world.player.segments.length;
  for (let i = 0; i < 75; i++) {
    stepPrismWorld(world, 1 / 30, {
      steerDelta: 0.15,
      targetWorldAngle: null,
      boostHeld: true,
      attunePressed: false,
    });
  }
  assert.ok(world.player.speed > cruiseSpeed, 'Overdrive speed must exceed cruise speed');
  assert.ok(
    world.player.segments.length < beforeBoostLen,
    'Sustained overdrive without Hyper-Core must shed tail mass',
  );
});

test('Special Relic Objects apply Chrono 2x cascade and Apex Crown shockwave takedown', () => {
  // Verify LexLean Chrono-Shard 2x score and growth amplification directly
  const baseOrbScore = Foundation_Pickups_V1_Model_computeAwardedScore(0n, false, 1n);
  const chronoOrbScore = Foundation_Pickups_V1_Model_computeAwardedScore(0n, true, 1n);
  assert.ok(chronoOrbScore > baseOrbScore);

  const baseGrowth = Foundation_Pickups_V1_Model_computePickupGrowthUnits(0n, false);
  const chronoGrowth = Foundation_Pickups_V1_Model_computePickupGrowthUnits(0n, true);
  assert.equal(chronoGrowth, baseGrowth * 2n);

  // Place player next to Apex-Crown relic and a rival within 18m blast radius
  const world = createPrismWorldState('arena', 'APEX-PILOT', 202);
  const apexRelic = world.relics.find((r) => r.kind === 'apex-crown')!;
  world.player.x = apexRelic.x;
  world.player.z = apexRelic.z + 1.0;
  world.rivals[0].x = apexRelic.x + 5.0;
  world.rivals[0].z = apexRelic.z;

  stepPrismWorld(world, 1 / 60, {
    steerDelta: 0,
    targetWorldAngle: null,
    boostHeld: false,
    attunePressed: false,
  });

  assert.equal(apexRelic.active, false);
  assert.equal(world.rivals[0].alive, false, 'Apex Crown shockwave must shatter nearby rival');
  assert.ok(world.player.eliminations >= 1);
  assert.equal(world.activeDirective, 'relic-ascension');
});

test('Four distinct NPC behavior archetypes choose distinct LexLean tactical intents', () => {
  const foragerIntent = Foundation_NpcBehavior_V1_Model_decideNpcIntentCode(
    0n,
    false,
    30n,
    20n,
    35n,
  );
  const interceptorIntent = Foundation_NpcBehavior_V1_Model_decideNpcIntentCode(
    1n,
    false,
    30n,
    20n,
    35n,
  );
  const leviathanIntent = Foundation_NpcBehavior_V1_Model_decideNpcIntentCode(
    2n,
    false,
    30n,
    20n,
    35n,
  );
  const packHunterIntent = Foundation_NpcBehavior_V1_Model_decideNpcIntentCode(
    3n,
    false,
    30n,
    20n,
    35n,
  );

  const uniqueIntents = new Set([
    foragerIntent,
    interceptorIntent,
    leviathanIntent,
    packHunterIntent,
  ]);
  assert.equal(uniqueIntents.size, 4, 'All 4 NPC archetypes must produce distinct intents');
});

test('Open-World Exploration classifies 5 biomes, attunes shrines, and teleports cleanly', () => {
  assert.equal(classifyBiomeAtPosition(0, 0).id, 'nexus-bowl');
  assert.equal(classifyBiomeAtPosition(45, -45).id, 'cobalt-dunes');
  assert.equal(classifyBiomeAtPosition(-45, -45).id, 'crystalline-spire');
  assert.equal(classifyBiomeAtPosition(-45, 45).id, 'solaris-rift');
  assert.equal(classifyBiomeAtPosition(70, 70).id, 'sanctum-ring');

  const world = createPrismWorldState('open-world', 'EXPLORER-1', 303);
  teleportPlayerToBiome(world, 'sanctum-ring');
  assert.equal(world.currentBiome.id, 'sanctum-ring');
  assert.ok(world.visitedBiomes.has('sanctum-ring'));

  // Move onto Sanctum Sovereign Shrine and trigger attunement
  const sanctumShrine = world.shrines[4];
  world.player.x = sanctumShrine.x;
  world.player.z = sanctumShrine.z;
  stepPrismWorld(world, 1 / 60, {
    steerDelta: 0,
    targetWorldAngle: null,
    boostHeld: false,
    attunePressed: true,
  });

  assert.equal(sanctumShrine.attuned, true);
  assert.ok(world.worldDiscoveryPct > 10 && world.worldDiscoveryPct <= 100);
});

test('Competitive Leaderboard Elo tiers, callsign validator, and canonical receipts verify', () => {
  assert.equal(validatePilotCallsign('NEON-7').valid, true);
  assert.equal(validatePilotCallsign('<script>').valid, false);
  assert.equal(validatePilotCallsign('A').valid, false);

  const winUpdate = computeUpdatedPlayerElo(1520, 1, 4, 2);
  assert.ok(winUpdate.eloRating > 1550);
  assert.equal(winUpdate.leagueTier, 'Diamond');
  assert.equal(winUpdate.placementBonus, 500);

  const world = createPrismWorldState('arena', 'ACE-01', 404);
  world.player.score = 2600;
  world.player.eliminations = 3;
  const seeds = createSeedHallOfFame();
  const { updatedHall, newEntry } = recordRunToSovereignHall(seeds, 1400, world, 'ACE-01');

  assert.equal(verifyLeaderboardReceipt(newEntry), true);
  assert.equal(
    verifyLeaderboardReceipt({ ...newEntry, score: newEntry.score + 9999 }),
    false,
    'Tampered score must fail canonical UOR receipt verification',
  );
  assert.ok(updatedHall[0].score >= updatedHall[updatedHall.length - 1].score);
});

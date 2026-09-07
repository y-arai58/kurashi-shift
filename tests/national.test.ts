import assert from 'node:assert/strict';
import { test } from 'node:test';
import { supportPrograms } from '../lib/programs.ts';
import {
  evaluatePrograms,
  candidateResults,
  compareProfiles,
} from '../lib/evaluate.ts';
import { initialQuestionsFor } from '../lib/questions.ts';
import {
  parseBasicProfile,
  scenarioProfile,
  updateProfile,
} from '../lib/profile.ts';
import { searchGuidance } from '../lib/official-guidance.ts';
import regions from '../data/collection/regions-latest.json' with { type: 'json' };
import type { Profile } from '../lib/domain.ts';
const today = '2026-09-07';
const profile: Profile = {
  residence: 'other',
  household: 'with-children',
  ageBand: '30-39',
  pregnancyBirth: 'yes',
  childAgeEligible: 'yes',
  incomeReduced: 'yes',
  rentBurden: 'yes',
  plannedMove: 'yes',
  preschool: 'yes',
  higherEducation: 'yes',
  manyDependents: 'yes',
  trainingInterest: 'yes',
  pensionBurden: 'yes',
  healthCoverage: 'employee',
};
await test('national catalog has ten unique national and four local programs', () => {
  assert.equal(
    supportPrograms.filter((p) => p.scope === 'national').length,
    10,
  );
  assert.equal(supportPrograms.filter((p) => p.scope === 'fukuoka').length, 4);
  const result = candidateResults(
    evaluatePrograms(supportPrograms, profile, today),
  );
  assert.equal(result.length, 10);
  assert.ok(result.every((r) => r.program.scope === 'national'));
  assert.equal(
    result.filter((r) => r.program.id === 'child-allowance').length,
    1,
  );
  assert.ok(
    result
      .filter((r) => r.program.id !== 'child-allowance')
      .every((r) => r.status === 'needs-info'),
  );
});
await test('negative relevance answers do not surface unrelated new programs', () => {
  const result = candidateResults(
    evaluatePrograms(
      supportPrograms,
      {
        residence: 'other',
        household: 'single',
        ageBand: '30-39',
        pregnancyBirth: 'no',
        rentBurden: 'no',
        trainingInterest: 'no',
        pensionBurden: 'no',
        higherEducation: 'no',
      },
      today,
    ),
  );
  assert.equal(result.length, 0);
});
await test('national initial fields are optional, validated, and conditional', () => {
  assert.deepEqual(parseBasicProfile(profile), profile);
  assert.throws(() => parseBasicProfile({ ...profile, employment: 12 }));
  assert.throws(() =>
    parseBasicProfile({ ...profile, prefecture: 'not-a-prefecture' }),
  );
  assert.ok(
    initialQuestionsFor(profile).some((q) => q.field === 'healthCoverage'),
  );
  assert.ok(
    !initialQuestionsFor({ ...profile, pregnancyBirth: 'no' }).some(
      (q) => q.field === 'healthCoverage',
    ),
  );
  assert.ok(
    !initialQuestionsFor({ ...profile, higherEducation: 'no' }).some(
      (q) => q.field === 'manyDependents',
    ),
  );
});
await test('national conditions are searchable and retain primary source URLs', () => {
  for (const program of supportPrograms.filter((p) => p.scope === 'national')) {
    assert.ok(searchGuidance('', program.id).length > 0, program.id);
  }
  assert.ok(searchGuidance('300万円', 'job-training').length > 0);
});
await test('national candidates survive leaving Fukuoka without claiming full coverage', () => {
  const before = { ...profile, residence: 'fukuoka' as const };
  const diff = compareProfiles(
    supportPrograms,
    before,
    scenarioProfile(before, 'outside'),
    today,
  );
  assert.equal(diff.comparable, false);
  assert.equal(diff.next.length, 10);
  assert.ok(diff.recheck.every((r) => r.program.scope === 'fukuoka'));
  assert.deepEqual(diff.removed, []);
});
await test('new answers invalidate dependent assumptions', () => {
  assert.equal(
    updateProfile(profile, { higherEducation: 'no' }).manyDependents,
    undefined,
  );
  assert.equal(
    updateProfile(profile, { pregnancyBirth: 'no' }).healthCoverage,
    undefined,
  );
  const baby = scenarioProfile(
    { ...profile, pregnancyBirth: 'no', preschool: 'no' },
    'baby',
  );
  assert.equal(baby.pregnancyBirth, 'yes');
  assert.equal(baby.preschool, 'yes');
  assert.equal(baby.healthCoverage, undefined);
});
await test('regional directory contains all 47 prefectures without claiming reviewed eligibility', () => {
  assert.equal(new Set(regions.regions.map((r) => r.id)).size, 47);
  assert.ok(regions.regions.every((r) => r.eligibilityReviewed === false));
  assert.ok(
    regions.regions.reduce((n, r) => n + r.municipalities.length, 0) > 1000,
  );
  assert.ok(
    regions.regions.every(
      (r) => new URL(r.directoryUrl).hostname === 'www.iju-join.jp',
    ),
  );
});

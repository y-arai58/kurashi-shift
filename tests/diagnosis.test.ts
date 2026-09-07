import assert from 'node:assert/strict';
import { test } from 'node:test';
import { supportPrograms } from '../lib/programs.ts';
import {
  applicationLabel,
  availability,
  candidateResults,
  compareProfiles,
  evaluateProgram,
  evaluatePrograms,
  todayInJapan,
} from '../lib/evaluate.ts';
import {
  parseBasicProfile,
  scenarioProfile,
  updateProfile,
} from '../lib/profile.ts';
import { questionsFor } from '../lib/questions.ts';
import type { Profile } from '../lib/domain.ts';

const date = '2026-09-07';
const parent: Profile = {
  residence: 'fukuoka',
  ageBand: '30-39',
  household: 'with-children',
};
const program = (id: string) => supportPrograms.find((item) => item.id === id)!;
const evaluate = (id: string, profile: Profile) =>
  evaluateProgram(program(id), profile, date);
const candidates = (profile: Profile, today = date) =>
  candidateResults(evaluatePrograms(supportPrograms, profile, today));

await test('a household label alone never proves the child age condition', () => {
  for (const household of ['with-children', 'single-parent'] as const) {
    const results = candidates({ ...parent, household });
    assert.equal(results.length, 4);
    assert.ok(results.every((result) => result.status === 'needs-info'));
    assert.ok(
      evaluate('child-allowance', { ...parent, household }).unknown.some(
        (item) => item.key === 'child',
      ),
    );
  }
});
await test('unknown medical insurance and exclusions remain unknown; valid answers resolve them', () => {
  const partial: Profile = {
    ...parent,
    childAgeEligible: 'yes',
    childHealthInsurance: 'yes',
    publicAssistance: 'no',
  };
  assert.equal(evaluate('child-medical', partial).status, 'needs-info');
  assert.equal(
    evaluate('child-medical', { ...partial, medicalExclusions: 'no' }).status,
    'eligible',
  );
  assert.equal(
    evaluate('child-medical', { ...partial, medicalExclusions: 'yes' }).status,
    'future',
  );
});
await test('an adult child does not create child benefit candidates', () => {
  assert.equal(
    candidates(updateProfile(parent, { childAgeEligible: 'no' })).length,
    0,
  );
});
await test('birth, school, and moving are independent conditions', () => {
  const result = candidates({
    ...parent,
    childAgeEligible: 'yes',
    schoolStage: 'other',
    moveWithinCity: 'no',
  });
  assert.deepEqual(result.map((item) => item.program.id).sort(), [
    'child-allowance',
    'child-medical',
  ]);
});
await test('unsupported municipality returns no misleading Fukuoka candidates or questions', () => {
  assert.deepEqual(candidates({ ...parent, residence: 'other' }), []);
  assert.deepEqual(questionsFor({ ...parent, residence: 'other' }), []);
});
await test('pregnancy can surface moving support but never already-born child benefits', () => {
  const result = candidates({ ...parent, household: 'expecting' });
  assert.deepEqual(
    result.map((item) => item.program.id),
    ['child-moving'],
  );
  assert.equal(result[0].status, 'needs-info');
});
await test('unanswered detailed housing requirements remain unknown', () => {
  const result = evaluate('child-moving', {
    ...parent,
    childAgeEligible: 'yes',
    moveWithinCity: 'yes',
    housingPlan: 'buying',
  });
  assert.equal(result.status, 'needs-info');
  assert.ok(result.unknown.some((item) => item.key === 'housingSpace'));
});
await test('school financial uncertainty does not exclude people needing individual review', () => {
  for (const schoolAidEligibility of [
    'likely',
    'unlikely',
    'unknown',
  ] as const) {
    assert.equal(
      evaluate('school-support', {
        ...parent,
        schoolStage: 'elementary-middle',
        schoolAidEligibility,
      }).status,
      'needs-info',
    );
  }
});
await test('senior age threshold and welfare pass exclusion are checked', () => {
  const senior: Profile = {
    residence: 'fukuoka',
    household: 'single',
    ageBand: '65plus',
    premiumStage: '1-7',
  };
  assert.equal(evaluate('senior-transport', senior).status, 'needs-info');
  assert.equal(
    evaluate('senior-transport', { ...senior, age70Plus: 'no' }).status,
    'future',
  );
  assert.equal(
    evaluate('senior-transport', {
      ...senior,
      age70Plus: 'yes',
      welfareTransport: 'no',
    }).status,
    'eligible',
  );
  assert.equal(
    evaluate('senior-transport', {
      ...senior,
      age70Plus: 'yes',
      welfareTransport: 'yes',
    }).status,
    'future',
  );
});
await test('deadline day is included; the following day removes the program from candidates', () => {
  const senior: Profile = {
    residence: 'fukuoka',
    household: 'single',
    ageBand: '65plus',
  };
  assert.equal(candidates(senior, '2026-09-30').length, 1);
  assert.equal(candidates(senior, '2026-10-01').length, 0);
  assert.equal(availability(program('child-moving'), '2027-03-01'), 'closed');
  assert.match(
    applicationLabel(program('senior-transport'), '2026-10-01'),
    /期限を経過/,
  );
});
await test('data past review date cannot be shown as confirmed eligible', () => {
  const result = evaluateProgram(
    program('child-allowance'),
    { ...parent, childAgeEligible: 'yes' },
    '2026-10-08',
  );
  assert.equal(result.status, 'needs-info');
  assert.ok(result.unknown.some((item) => item.key === 'freshness'));
});
await test('date boundary uses Japan time', () => {
  assert.equal(todayInJapan(new Date('2026-09-30T14:59:59Z')), '2026-09-30');
  assert.equal(todayInJapan(new Date('2026-09-30T15:00:00Z')), '2026-10-01');
});
await test('followups skip irrelevant dependent questions and can be scoped to one program', () => {
  const fields = questionsFor({
    ...parent,
    schoolStage: 'other',
    moveWithinCity: 'no',
  }).map((item) => item.field);
  assert.ok(!fields.includes('schoolAidEligibility'));
  assert.ok(!fields.includes('housingPlan'));
  assert.deepEqual(
    questionsFor(parent, program('child-allowance')).map((item) => item.field),
    ['childAgeEligible'],
  );
});
await test('changing parent answers clears stale child answers without losing other conditions', () => {
  const original: Profile = {
    ...parent,
    childAgeEligible: 'yes',
    childHealthInsurance: 'yes',
    schoolStage: 'elementary-middle',
    moveWithinCity: 'yes',
    housingPlan: 'renting',
  };
  const next = updateProfile(original, { household: 'couple' });
  assert.equal(next.childAgeEligible, undefined);
  assert.equal(next.childHealthInsurance, undefined);
  assert.equal(next.schoolStage, undefined);
  assert.equal(next.housingPlan, 'renting');
  assert.equal(original.childAgeEligible, 'yes');
});
await test('newborn simulation copies the base and leaves insurance unknown', () => {
  const base: Profile = {
    residence: 'fukuoka',
    ageBand: '30-39',
    household: 'couple',
    moveWithinCity: 'no',
  };
  const next = scenarioProfile(base, 'baby');
  const diff = compareProfiles(supportPrograms, base, next, date);
  assert.equal(base.household, 'couple');
  assert.equal(next.childHealthInsurance, undefined);
  assert.equal(next.schoolStage, 'other');
  assert.deepEqual(diff.added.map((item) => item.program.id).sort(), [
    'child-allowance',
    'child-medical',
  ]);
  assert.equal(
    diff.next.length,
    diff.current.length + diff.added.length - diff.removed.length,
  );
});
await test('moving simulation distinguishes newly added and improved existing candidates', () => {
  const noMove: Profile = {
    ...parent,
    childAgeEligible: 'yes',
    moveWithinCity: 'no',
  };
  const diff = compareProfiles(
    supportPrograms,
    noMove,
    scenarioProfile(noMove, 'buy'),
    date,
  );
  assert.deepEqual(
    diff.added.map((item) => item.program.id),
    ['child-moving'],
  );
  const unknownMove = compareProfiles(
    supportPrograms,
    parent,
    scenarioProfile(parent, 'rent'),
    date,
  );
  assert.ok(
    unknownMove.changed.some((item) => item.program.id === 'child-moving'),
  );
  assert.equal(unknownMove.added.length, 0);
});
await test('diff also handles benefits removed after a life change', () => {
  const diff = compareProfiles(
    supportPrograms,
    parent,
    { ...parent, household: 'couple' },
    date,
  );
  assert.equal(diff.removed.length, 4);
  assert.equal(diff.next.length, 0);
});
await test('WebMCP validates null, enum, extra fields and accepts the new household choice', () => {
  for (const invalid of [
    null,
    [],
    {},
    { ...parent, residence: 'invalid' },
    { ...parent, unexpected: true },
  ])
    assert.throws(() => parseBasicProfile(invalid));
  assert.deepEqual(parseBasicProfile({ ...parent, household: 'expecting' }), {
    ...parent,
    household: 'expecting',
  });
});
await test('all programs have specific official URLs, dated sources and next steps', () => {
  assert.equal(
    new Set(supportPrograms.map((item) => item.id)).size,
    supportPrograms.length,
  );
  for (const item of supportPrograms) {
    assert.equal(new URL(item.officialUrl).hostname, 'www.city.fukuoka.lg.jp');
    assert.ok(new URL(item.officialUrl).pathname.endsWith('.html'));
    assert.match(item.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.reviewAfter >= item.verifiedOn);
    assert.ok(item.nextSteps.length >= 2);
  }
});

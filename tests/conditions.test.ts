import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Profile } from '../lib/domain.ts';
import { supportPrograms } from '../lib/programs.ts';
import { evaluateProgram } from '../lib/evaluate.ts';
import { initialQuestionsFor, questionsFor } from '../lib/questions.ts';
import {
  parseBasicProfile,
  scenarioProfile,
  updateProfile,
} from '../lib/profile.ts';
import {
  officialGuidance,
  searchGuidance,
  requiredHousingArea,
  schoolIncomeComparison,
} from '../lib/official-guidance.ts';

const housing: Profile = {
  residence: 'fukuoka',
  ageBand: '30-39',
  household: 'with-children',
  childAgeEligible: 'yes',
  moveWithinCity: 'yes',
  housingPlan: 'buying',
  movingBenefit: 'purchase',
  publicAssistance: 'no',
  priorHousing: 'rental-clear',
  duplicateMovingAid: 'no',
  municipalTaxArrears: 'no',
  antisocialTies: 'no',
  priorMovingGrant: 'no',
  housingContract: 'yes',
  housingSpace: 'yes',
  earthquakeSafety: 'yes',
  hazardSafety: 'yes',
  newDesignatedDistrict: 'no',
  mortgageFiveYears: 'yes',
  movingDeadline: 'yes',
};
const check = (id: string, profile: Profile) =>
  evaluateProgram(
    supportPrograms.find((program) => program.id === id)!,
    profile,
    '2026-09-07',
  );

await test('all documented standard moving conditions can resolve inside the app', () => {
  assert.equal(check('child-moving', housing).status, 'eligible');
  assert.equal(
    check('child-moving', { ...housing, housingSpace: 'no' }).status,
    'future',
  );
  assert.equal(
    check('child-moving', { ...housing, earthquakeSafety: 'unknown' }).status,
    'needs-info',
  );
});
await test('designated school district excludes purchase aid but not moving costs', () => {
  assert.equal(
    check('child-moving', { ...housing, newDesignatedDistrict: 'yes' }).status,
    'future',
  );
  assert.equal(
    check('child-moving', {
      ...housing,
      newDesignatedDistrict: 'yes',
      movingBenefit: 'costs',
      mortgageFiveYears: 'no',
      movingPayment: 'yes',
    }).status,
    'eligible',
  );
});
await test('rental type and selected assistance are evaluated separately', () => {
  const renting: Profile = {
    ...housing,
    housingPlan: 'renting',
    movingBenefit: 'rent',
    rentalType: 'public-not-municipal',
  };
  assert.equal(check('child-moving', renting).status, 'future');
  assert.equal(
    check('child-moving', {
      ...renting,
      movingBenefit: 'costs',
      movingPayment: 'yes',
    }).status,
    'eligible',
  );
  assert.equal(
    check('child-moving', {
      ...renting,
      movingBenefit: 'costs',
      movingPayment: 'yes',
      rentalType: 'municipal',
    }).status,
    'future',
  );
});
await test('prior awards preserve individual review instead of a false exclusion', () => {
  const result = check('child-moving', { ...housing, priorMovingGrant: 'yes' });
  assert.equal(result.status, 'needs-info');
  assert.equal(result.unknown[0].guidanceId, 'moving-history');
});
await test('pregnancy requires maternal handbook and shared welfare status matters', () => {
  assert.equal(
    check('child-moving', {
      ...housing,
      household: 'expecting',
      maternityHandbook: 'no',
    }).status,
    'future',
  );
  assert.equal(
    check('child-moving', { ...housing, publicAssistance: 'yes' }).status,
    'future',
  );
});
const schooling: Profile = {
  residence: 'fukuoka',
  household: 'with-children',
  childAgeEligible: 'yes',
  schoolStage: 'elementary-middle',
  schoolType: 'city',
  publicAssistance: 'no',
  schoolAidBasis: 'tax-exempt',
  parentsSameBasis: 'yes',
};
await test('school type, common basis and public assistance can resolve school diagnosis', () => {
  assert.equal(check('school-support', schooling).status, 'eligible');
  assert.equal(
    check('school-support', { ...schooling, parentsSameBasis: 'unknown' })
      .status,
    'needs-info',
  );
  assert.equal(
    check('school-support', { ...schooling, schoolType: 'private' }).status,
    'future',
  );
  assert.equal(
    check('school-support', { ...schooling, publicAssistance: 'yes' }).status,
    'future',
  );
  assert.equal(
    check('school-support', {
      ...schooling,
      household: 'single-parent',
      parentsSameBasis: undefined,
    }).status,
    'eligible',
  );
});
await test('income route requires confirmation and keeps the income-drop exception open', () => {
  const profile: Profile = { ...schooling, schoolAidBasis: 'income' };
  assert.equal(check('school-support', profile).status, 'needs-info');
  assert.equal(
    check('school-support', { ...profile, schoolIncomeWithin: 'yes' }).status,
    'eligible',
  );
  assert.equal(
    check('school-support', {
      ...profile,
      schoolIncomeWithin: 'no',
      incomeDrop: 'yes',
    }).status,
    'needs-info',
  );
  assert.equal(
    check('school-support', {
      ...profile,
      schoolIncomeWithin: 'no',
      incomeDrop: 'no',
    }).status,
    'future',
  );
});
await test('area calculator follows age weights, pregnancy, and the official six-person table', () => {
  const base = { tenPlus: 2, under3: 0, threeTo5: 0, sixTo9: 0, pregnant: 0 };
  assert.equal(requiredHousingArea(base), 30);
  assert.equal(requiredHousingArea({ ...base, under3: 1 }), 32.5);
  assert.equal(requiredHousingArea({ ...base, pregnant: 1 }), 40);
  assert.equal(requiredHousingArea({ ...base, tenPlus: 5 }), 57);
  assert.equal(requiredHousingArea({ ...base, tenPlus: 6 }), 66);
  assert.equal(requiredHousingArea({ ...base, tenPlus: 6, under3: 1 }), 68.875);
  assert.equal(requiredHousingArea({ ...base, pregnant: 3 }), undefined);
  assert.equal(requiredHousingArea({ ...base, under3: -1 }), undefined);
  assert.equal(requiredHousingArea({ ...base, tenPlus: 1.5 }), undefined);
});
await test('school income calculator includes threshold equality and rejects unsupported counts', () => {
  assert.deepEqual(schoolIncomeComparison(1, 1165000), {
    threshold: 1165000,
    within: true,
  });
  assert.equal(schoolIncomeComparison(1, 1165001)?.within, false);
  assert.equal(schoolIncomeComparison(6, 3206000)?.within, true);
  assert.equal(schoolIncomeComparison(0, 0), undefined);
  assert.equal(schoolIncomeComparison(7, 0), undefined);
  assert.equal(schoolIncomeComparison(1, NaN), undefined);
});
await test('search finds official rules, school names, fullwidth amounts and can filter programs', () => {
  assert.ok(
    searchGuidance('香椎').some((entry) => entry.id === 'moving-district'),
  );
  assert.ok(
    searchGuidance('１１６５０００').some(
      (entry) => entry.id === 'school-income',
    ),
  );
  assert.ok(searchGuidance('㎡').some((entry) => entry.id === 'moving-area'));
  assert.ok(
    searchGuidance('公務員').some((entry) => entry.id === 'allowance-details'),
  );
  assert.equal(searchGuidance('公務員', 'child-moving').length, 0);
  assert.deepEqual(searchGuidance('存在しない条件abcdefghijkl'), []);
  assert.ok(searchGuidance('面積 住宅').length > 0);
});
await test('every detailed condition links to searchable explanation and an applicable question', () => {
  const guideIds = new Set(officialGuidance.map((entry) => entry.id));
  for (const program of supportPrograms)
    for (const criterion of program.criteria) {
      if (criterion.guidanceId) assert.ok(guideIds.has(criterion.guidanceId));
    }
  const fields = questionsFor(
    housing,
    supportPrograms.find((program) => program.id === 'child-moving'),
  ).map((question) => question.field);
  for (const field of [
    'housingSpace',
    'priorHousing',
    'mortgageFiveYears',
    'movingBenefit',
  ])
    assert.ok(fields.includes(field as keyof Profile));
});
await test('initial questions are relevant, optional, and accepted by WebMCP validation', () => {
  assert.deepEqual(
    initialQuestionsFor({
      residence: 'fukuoka',
      household: 'couple',
      ageBand: '30-39',
    }),
    [],
  );
  assert.ok(
    initialQuestionsFor(housing).some(
      (question) => question.field === 'childAgeEligible',
    ),
  );
  assert.ok(
    initialQuestionsFor(housing).some(
      (question) => question.field === 'publicAssistance',
    ),
  );
  assert.ok(
    !initialQuestionsFor(housing).some(
      (question) => question.field === 'mortgageFiveYears',
    ),
  );
  const profile: Profile = {
    residence: 'fukuoka',
    ageBand: '30-39',
    household: 'with-children',
    childAgeEligible: 'yes',
    publicAssistance: 'unknown',
    schoolStage: 'elementary-middle',
  };
  assert.deepEqual(parseBasicProfile(profile), profile);
  assert.throws(() =>
    parseBasicProfile({ ...profile, publicAssistance: 'maybe' }),
  );
});
await test('changing assumptions never carries confirmed dwelling or income details to a new scenario', () => {
  assert.equal(scenarioProfile(housing, 'rent').housingSpace, undefined);
  assert.equal(scenarioProfile(housing, 'buy').earthquakeSafety, undefined);
  assert.equal(scenarioProfile(housing, 'baby').housingSpace, undefined);
  assert.equal(
    updateProfile(schooling, { schoolAidBasis: 'income' }).parentsSameBasis,
    undefined,
  );
  assert.equal(
    updateProfile(housing, { housingPlan: 'renting' }).mortgageFiveYears,
    undefined,
  );
});

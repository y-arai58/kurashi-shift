import type { Profile } from './domain.ts';
import { nationalProfileSchema } from './national-profile.ts';
import regions from '../data/collection/regions-latest.json' with { type: 'json' };

export const residenceOptions = [
  { value: 'fukuoka', label: '福岡市', note: '全国制度＋福岡市独自制度' },
  {
    value: 'other',
    label: '福岡市以外（日本国内）',
    note: '全国制度を診断・独自制度は情報入口を案内',
  },
] as const;
export const ageOptions = [
  { value: 'under18', label: '18歳未満' },
  { value: '18-29', label: '18〜29歳' },
  { value: '30-39', label: '30〜39歳' },
  { value: '40-64', label: '40〜64歳' },
  { value: '65plus', label: '65歳以上' },
] as const;
export const householdOptions = [
  {
    value: 'single',
    label: 'ひとり暮らし・その他',
    note: '養育中の子ども・妊娠なし',
  },
  {
    value: 'couple',
    label: '夫婦・パートナー',
    note: '養育中の子ども・妊娠なし',
  },
  {
    value: 'with-children',
    label: '子どもを養育している',
    note: '続けて対象年齢・就学状況を確認',
  },
  {
    value: 'single-parent',
    label: 'ひとり親で子どもを養育',
    note: '続けて対象年齢・就学状況を確認',
  },
  {
    value: 'expecting',
    label: 'はじめての出産を控えている',
    note: '妊娠中・養育中の子どもなし',
  },
] as const;

export function hasChildren(profile: Profile) {
  return (
    profile.household === 'with-children' ||
    profile.household === 'single-parent'
  );
}

export function updateProfile(
  profile: Profile,
  patch: Partial<Profile>,
): Profile {
  const next = { ...profile, ...patch };
  if (patch.residence !== undefined && patch.residence !== profile.residence)
    delete next.prefecture;
  if (
    patch.higherEducation !== undefined &&
    patch.higherEducation !== profile.higherEducation
  )
    delete next.manyDependents;
  if (
    patch.pregnancyBirth !== undefined &&
    patch.pregnancyBirth !== profile.pregnancyBirth
  )
    delete next.healthCoverage;
  if (patch.household !== undefined && patch.household !== profile.household) {
    delete next.preschool;
    delete next.manyDependents;
  }
  if (patch.household !== undefined && patch.household !== profile.household) {
    for (const field of [
      'childAgeEligible',
      'childHealthInsurance',
      'medicalExclusions',
      'schoolStage',
      'schoolAidEligibility',
      'schoolType',
      'schoolAidBasis',
      'parentsSameBasis',
      'schoolIncomeWithin',
      'incomeDrop',
      'housingSpace',
      'maternityHandbook',
    ] as const)
      delete next[field];
  }
  if (patch.ageBand !== undefined && patch.ageBand !== profile.ageBand) {
    delete next.age70Plus;
    delete next.premiumStage;
    delete next.welfareTransport;
  }
  if (patch.childAgeEligible === 'no') {
    delete next.childHealthInsurance;
    delete next.medicalExclusions;
    delete next.schoolStage;
    delete next.schoolAidEligibility;
    delete next.schoolType;
    delete next.schoolAidBasis;
    delete next.schoolIncomeWithin;
    delete next.parentsSameBasis;
    delete next.incomeDrop;
  }
  if (patch.schoolStage && patch.schoolStage !== 'elementary-middle') {
    delete next.schoolAidEligibility;
    delete next.schoolType;
    delete next.schoolAidBasis;
    delete next.parentsSameBasis;
    delete next.schoolIncomeWithin;
    delete next.incomeDrop;
  }
  if (patch.schoolAidBasis && patch.schoolAidBasis !== profile.schoolAidBasis) {
    delete next.parentsSameBasis;
    delete next.schoolIncomeWithin;
    delete next.incomeDrop;
  }
  if (patch.movingBenefit && patch.movingBenefit !== profile.movingBenefit) {
    delete next.newDesignatedDistrict;
    delete next.mortgageFiveYears;
    delete next.movingPayment;
  }
  if (patch.housingPlan && patch.housingPlan !== profile.housingPlan) {
    for (const field of dwellingFields) delete next[field];
  }
  if (patch.moveWithinCity === 'no') delete next.housingPlan;
  return next;
}

export type Scenario = 'baby' | 'rent' | 'buy' | 'outside';
const dwellingFields = [
  'housingContract',
  'housingSpace',
  'earthquakeSafety',
  'hazardSafety',
  'newDesignatedDistrict',
  'mortgageFiveYears',
  'rentalType',
  'movingPayment',
  'movingDeadline',
] as const;
export const scenarios: { id: Scenario; label: string; note: string }[] = [
  { id: 'baby', label: '子どもが生まれたら', note: '子どもが1人増えた場合' },
  { id: 'rent', label: '市内で賃貸に引越したら', note: '福岡市内での住み替え' },
  { id: 'buy', label: '市内で家を買ったら', note: '購入した住宅への引越し' },
  {
    id: 'outside',
    label: '福岡市外へ引越したら',
    note: '転居に伴う確認事項を見る・転居先の制度は未収集',
  },
];
export function scenarioProfile(profile: Profile, scenario: Scenario): Profile {
  if (scenario === 'outside') {
    const next: Profile = {
      ...profile,
      residence: 'other',
      moveWithinCity: 'no',
      plannedMove: 'yes',
      prefecture: undefined,
    };
    for (const field of dwellingFields) delete next[field];
    delete next.housingPlan;
    delete next.movingBenefit;
    delete next.schoolType;
    return next;
  }
  if (scenario === 'baby')
    return {
      ...profile,
      household:
        profile.household === 'single-parent' || profile.household === 'single'
          ? 'single-parent'
          : 'with-children',
      childAgeEligible: 'yes',
      pregnancyBirth: 'yes',
      preschool: 'yes',
      healthCoverage: undefined,
      manyDependents: undefined,
      childHealthInsurance: undefined,
      medicalExclusions: undefined,
      housingSpace: undefined,
      schoolIncomeWithin: undefined,
      parentsSameBasis: undefined,
      schoolStage: hasChildren(profile) ? profile.schoolStage : 'other',
      schoolAidEligibility: hasChildren(profile)
        ? profile.schoolAidEligibility
        : undefined,
    };
  const next: Profile = {
    ...profile,
    moveWithinCity: 'yes',
    plannedMove: 'yes',
    housingPlan: scenario === 'rent' ? 'renting' : 'buying',
    movingBenefit: scenario === 'rent' ? 'rent' : 'purchase',
  };
  for (const field of dwellingFields) delete next[field];
  return next;
}

export function parseBasicProfile(input: unknown): Profile {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('基本プロフィールを確認してください。');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).some(
      (key) =>
        ![
          'residence',
          'ageBand',
          'household',
          'childAgeEligible',
          'schoolStage',
          'publicAssistance',
          'age70Plus',
          'prefecture',
          ...Object.keys(nationalProfileSchema),
        ].includes(key),
    ) ||
    !residenceOptions.some((option) => option.value === value.residence) ||
    !ageOptions.some((option) => option.value === value.ageBand) ||
    !householdOptions.some((option) => option.value === value.household)
  )
    throw new Error('居住地・年齢・世帯の選択肢を確認してください。');
  for (const field of [
    'childAgeEligible',
    'publicAssistance',
    'age70Plus',
  ] as const) {
    if (
      value[field] !== undefined &&
      !['yes', 'no', 'unknown'].some((option) => option === value[field])
    )
      throw new Error('基本情報の追加回答を確認してください。');
  }
  if (
    value.schoolStage !== undefined &&
    !['elementary-middle', 'other', 'unknown'].some(
      (option) => option === value.schoolStage,
    )
  )
    throw new Error('就学状況を確認してください。');
  for (const [field, schema] of Object.entries(nationalProfileSchema)) {
    if (
      value[field] !== undefined &&
      !schema.enum.some((option) => option === value[field])
    )
      throw new Error('追加の基本情報を確認してください。');
  }
  if (
    value.prefecture !== undefined &&
    value.prefecture !== 'unknown' &&
    !regions.regions.some((r) => r.id === value.prefecture)
  )
    throw new Error('都道府県を確認してください。');
  return {
    residence: value.residence as Profile['residence'],
    ageBand: value.ageBand as Profile['ageBand'],
    household: value.household as Profile['household'],
    ...Object.fromEntries(
      [
        'childAgeEligible',
        'schoolStage',
        'publicAssistance',
        'age70Plus',
        'prefecture',
        ...Object.keys(nationalProfileSchema),
      ]
        .filter((field) => value[field] !== undefined)
        .map((field) => [field, value[field]]),
    ),
  };
}

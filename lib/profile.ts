import type { Profile } from './domain.ts';

export const residenceOptions = [
  { value: 'fukuoka', label: '福岡市', note: '現在の掲載地域' },
  { value: 'other', label: '福岡市以外', note: '市外の制度は未掲載です' },
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
    note: '子どもの年齢は後で確認',
  },
  {
    value: 'single-parent',
    label: 'ひとり親で子どもを養育',
    note: '子どもの年齢は後で確認',
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
  if (patch.household !== undefined && patch.household !== profile.household) {
    for (const field of [
      'childAgeEligible',
      'childHealthInsurance',
      'medicalExclusions',
      'schoolStage',
      'schoolAidEligibility',
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
  }
  if (patch.schoolStage && patch.schoolStage !== 'elementary-middle')
    delete next.schoolAidEligibility;
  if (patch.moveWithinCity === 'no') delete next.housingPlan;
  return next;
}

export type Scenario = 'baby' | 'rent' | 'buy';
export const scenarios: { id: Scenario; label: string; note: string }[] = [
  { id: 'baby', label: '子どもが生まれたら', note: '子どもが1人増えた場合' },
  { id: 'rent', label: '市内で賃貸に引越したら', note: '福岡市内での住み替え' },
  { id: 'buy', label: '市内で家を買ったら', note: '購入した住宅への引越し' },
];
export function scenarioProfile(profile: Profile, scenario: Scenario): Profile {
  if (scenario === 'baby')
    return {
      ...profile,
      household:
        profile.household === 'single-parent' || profile.household === 'single'
          ? 'single-parent'
          : 'with-children',
      childAgeEligible: 'yes',
      childHealthInsurance: undefined,
      medicalExclusions: undefined,
      schoolStage: hasChildren(profile) ? profile.schoolStage : 'other',
      schoolAidEligibility: hasChildren(profile)
        ? profile.schoolAidEligibility
        : undefined,
    };
  return {
    ...profile,
    moveWithinCity: 'yes',
    housingPlan: scenario === 'rent' ? 'renting' : 'buying',
  };
}

export function parseBasicProfile(input: unknown): Profile {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('基本プロフィールを確認してください。');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).some(
      (key) => !['residence', 'ageBand', 'household'].includes(key),
    ) ||
    !residenceOptions.some((option) => option.value === value.residence) ||
    !ageOptions.some((option) => option.value === value.ageBand) ||
    !householdOptions.some((option) => option.value === value.household)
  )
    throw new Error('居住地・年齢・世帯の選択肢を確認してください。');
  return {
    residence: value.residence as Profile['residence'],
    ageBand: value.ageBand as Profile['ageBand'],
    household: value.household as Profile['household'],
  };
}

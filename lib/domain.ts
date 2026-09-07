export type Residence = 'fukuoka' | 'other';
export type AgeBand = 'under18' | '18-29' | '30-39' | '40-64' | '65plus';
export type Household = 'single' | 'couple' | 'with-children' | 'single-parent';
export type HousingPlan = 'renting' | 'buying' | 'none' | 'unknown';
export type YesNoUnknown = 'yes' | 'no' | 'unknown';
export type SchoolStage = 'elementary-middle' | 'other' | 'unknown';
export type AidEligibility = 'likely' | 'unlikely' | 'unknown';
export type PremiumStage = '1-7' | '8plus' | 'unknown';

export type Profile = {
  residence?: Residence;
  ageBand?: AgeBand;
  household?: Household;
  childHealthInsurance?: YesNoUnknown;
  schoolStage?: SchoolStage;
  schoolAidEligibility?: AidEligibility;
  housingPlan?: HousingPlan;
  moveWithinCity?: YesNoUnknown;
  age70Plus?: YesNoUnknown;
  premiumStage?: PremiumStage;
};

export type Criterion = {
  key: string;
  label: string;
  evaluate: (profile: Profile) => boolean | undefined;
};

export type SupportProgram = {
  id: string;
  benefitLabel: string;
  officialName: string;
  category: string;
  amount: string;
  summary: string;
  criteria: Criterion[];
  points: string[];
  isRelevant?: (profile: Profile) => boolean;
  officialUrl: string;
  sourceUpdatedAt: string;
  lastVerified: string;
  applicationStatus: string;
};

export type MatchStatus = 'eligible' | 'needs-info' | 'future';

export type Evaluation = {
  program: SupportProgram;
  status: MatchStatus;
  matched: Criterion[];
  unknown: Criterion[];
  unmatched: Criterion[];
  score: number;
};

export const statusMeta: Record<
  MatchStatus,
  { label: string; shortLabel: string }
> = {
  eligible: { label: '対象の可能性が高い', shortLabel: '可能性 高い' },
  'needs-info': { label: '条件の確認が必要', shortLabel: '要確認' },
  future: { label: '現在の条件では対象外', shortLabel: '対象外・今後の候補' },
};

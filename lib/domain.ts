export type Residence = 'fukuoka' | 'other';
export type AgeBand = 'under18' | '18-29' | '30-39' | '40-64' | '65plus';
export type Household = 'single' | 'couple' | 'with-children' | 'single-parent';
export type IncomeBand = 'under300' | '300-500' | 'over500' | 'unknown';
export type HousingPlan = 'renting' | 'buying' | 'none' | 'unknown';
export type Employment = 'working' | 'seeking' | 'leave' | 'unknown';

export type Profile = {
  residence?: Residence;
  ageBand?: AgeBand;
  household?: Household;
  incomeBand?: IncomeBand;
  housingPlan?: HousingPlan;
  employment?: Employment;
};

export type Criterion = {
  key: string;
  label: string;
  questionLabel?: string;
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
  officialUrl: string;
  lastVerified: string;
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
  future: { label: '今後、対象になるかも', shortLabel: '今後の候補' },
};

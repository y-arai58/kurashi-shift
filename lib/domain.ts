export type Residence = 'fukuoka' | 'other';
export type AgeBand = 'under18' | '18-29' | '30-39' | '40-64' | '65plus';
export type Household =
  | 'single'
  | 'couple'
  | 'with-children'
  | 'single-parent'
  | 'expecting';
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
  childAgeEligible?: YesNoUnknown;
  medicalExclusions?: YesNoUnknown;
  welfareTransport?: YesNoUnknown;
  publicAssistance?: YesNoUnknown;
  schoolType?:
    | 'city'
    | 'national-prefectural'
    | 'private'
    | 'other'
    | 'unknown';
  schoolAidBasis?:
    | 'ended-protection'
    | 'tax-exempt'
    | 'full-waiver'
    | 'day-labor-loan'
    | 'allowance'
    | 'income'
    | 'none'
    | 'unknown';
  parentsSameBasis?: YesNoUnknown;
  schoolIncomeWithin?: YesNoUnknown;
  incomeDrop?: YesNoUnknown;
  priorHousing?:
    | 'rental-clear'
    | 'owner-sold'
    | 'separation'
    | 'owner'
    | 'arrears'
    | 'unknown';
  duplicateMovingAid?: YesNoUnknown;
  municipalTaxArrears?: YesNoUnknown;
  antisocialTies?: YesNoUnknown;
  priorMovingGrant?: YesNoUnknown;
  housingContract?: YesNoUnknown;
  housingSpace?: YesNoUnknown;
  earthquakeSafety?: YesNoUnknown;
  hazardSafety?: YesNoUnknown;
  maternityHandbook?: YesNoUnknown;
  movingBenefit?: 'purchase' | 'rent' | 'costs' | 'unknown';
  newDesignatedDistrict?: YesNoUnknown;
  mortgageFiveYears?: YesNoUnknown;
  rentalType?: 'private' | 'public-not-municipal' | 'municipal' | 'unknown';
  movingPayment?: YesNoUnknown;
  movingDeadline?: YesNoUnknown;
};

export type Criterion = {
  key: string;
  label: string;
  field?: keyof Profile;
  guidanceId?: string;
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
  applicationDeadline?: string;
  verifiedOn: string;
  reviewAfter: string;
  nextSteps: string[];
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
  eligible: { label: '確認した主な条件に一致', shortLabel: '主な条件に一致' },
  'needs-info': { label: '条件の確認が必要', shortLabel: '要確認' },
  future: { label: '回答した条件と一致しない', shortLabel: '条件に不一致' },
};

import type { Criterion, Profile } from './domain.ts';

export const yes = (value?: string) =>
  !value || value === 'unknown' ? undefined : value === 'yes';
const not = (value?: string) =>
  yes(value) === undefined ? undefined : !yes(value);
const rule = (
  field: keyof Profile,
  label: string,
  guidanceId: string,
  evaluate: Criterion['evaluate'],
): Criterion => ({ key: field, field, label, guidanceId, evaluate });
export const assistanceRule = rule(
  'publicAssistance',
  '生活保護等を受給していない',
  'moving-household',
  (p) => not(p.publicAssistance),
);

export const movingRules: Criterion[] = [
  assistanceRule,
  rule(
    'priorHousing',
    '転居前の家賃に滞納がなく、持ち家の場合は例外条件に該当する',
    'moving-previous',
    (p) =>
      !p.priorHousing || p.priorHousing === 'unknown'
        ? undefined
        : ['rental-clear', 'owner-sold', 'separation'].includes(p.priorHousing),
  ),
  rule(
    'duplicateMovingAid',
    '同じ転居で同じ内容の他の助成を受けていない',
    'moving-household',
    (p) => not(p.duplicateMovingAid),
  ),
  rule(
    'municipalTaxArrears',
    '対象世帯・配偶者に市町村税や延滞金の滞納がない',
    'moving-household',
    (p) => not(p.municipalTaxArrears),
  ),
  rule(
    'antisocialTies',
    '暴力団員または密接な関係者がいない',
    'moving-household',
    (p) => not(p.antisocialTies),
  ),
  rule(
    'priorMovingGrant',
    '過去に対象の住替え助成を受給していない（受給歴があれば再申請の例外を個別審査）',
    'moving-history',
    (p) => (p.priorMovingGrant === 'no' ? true : undefined),
  ),
  rule(
    'housingContract',
    '扶養義務者・個人名義・親族所有でない等の契約条件を満たす',
    'moving-contract',
    (p) => yes(p.housingContract),
  ),
  rule(
    'housingSpace',
    '世帯構成に応じた住戸専用面積を満たす',
    'moving-area',
    (p) => yes(p.housingSpace),
  ),
  rule(
    'earthquakeSafety',
    '新耐震基準を満たす、または耐震性能を書面で証明できる',
    'moving-safety',
    (p) => yes(p.earthquakeSafety),
  ),
  rule(
    'hazardSafety',
    '対象の災害区域外、または区域内の安全措置と検査済証がある',
    'moving-safety',
    (p) => yes(p.hazardSafety),
  ),
  rule(
    'maternityHandbook',
    '妊娠中として申請する場合は転居日時点で母子手帳がある',
    'moving-application',
    (p) => (p.household === 'expecting' ? yes(p.maternityHandbook) : true),
  ),
  rule(
    'movingBenefit',
    '診断する助成の種類と転居先の住まいが一致する',
    'moving-benefit',
    (p) => {
      if (
        !p.movingBenefit ||
        p.movingBenefit === 'unknown' ||
        !p.housingPlan ||
        p.housingPlan === 'unknown'
      )
        return undefined;
      if (p.movingBenefit === 'purchase') return p.housingPlan === 'buying';
      if (p.movingBenefit === 'rent') return p.housingPlan === 'renting';
      return ['buying', 'renting'].includes(p.housingPlan);
    },
  ),
  rule(
    'newDesignatedDistrict',
    '取得費・家賃助成の場合は指定校区への新たな転居ではない',
    'moving-district',
    (p) =>
      p.movingBenefit === 'costs'
        ? true
        : !p.movingBenefit || p.movingBenefit === 'unknown'
          ? undefined
          : not(p.newDesignatedDistrict),
  ),
  rule(
    'mortgageFiveYears',
    '住宅取得費助成の場合は5年以上の住宅ローンを利用する',
    'moving-benefit',
    (p) =>
      p.movingBenefit === 'purchase'
        ? yes(p.mortgageFiveYears)
        : !p.movingBenefit || p.movingBenefit === 'unknown'
          ? undefined
          : true,
  ),
  rule(
    'rentalType',
    '家賃助成は民間賃貸、引越し費用は公営住宅以外の賃貸または購入住宅',
    'moving-benefit',
    (p) => {
      if (p.housingPlan === 'buying') return true;
      if (
        !p.rentalType ||
        p.rentalType === 'unknown' ||
        !p.movingBenefit ||
        p.movingBenefit === 'unknown'
      )
        return undefined;
      return p.movingBenefit === 'rent'
        ? p.rentalType === 'private'
        : p.rentalType !== 'municipal';
    },
  ),
  rule(
    'movingPayment',
    '引越し費用助成の場合は対象経費を申請時に支払済み',
    'moving-benefit',
    (p) =>
      p.movingBenefit === 'costs'
        ? yes(p.movingPayment)
        : !p.movingBenefit || p.movingBenefit === 'unknown'
          ? undefined
          : true,
  ),
  rule(
    'movingDeadline',
    '募集期間内かつ転居日から1年以内に申請する',
    'moving-application',
    (p) => yes(p.movingDeadline),
  ),
];

export const schoolRules: Criterion[] = [
  {
    ...assistanceRule,
    guidanceId: 'school-type',
    label: '生活保護受給中ではない（受給中は保護費から相当額を支給）',
  },
  rule(
    'schoolType',
    '福岡市立または国立・県立の小中学校に通学している',
    'school-type',
    (p) =>
      !p.schoolType || p.schoolType === 'unknown'
        ? undefined
        : ['city', 'national-prefectural'].includes(p.schoolType),
  ),
  rule(
    'schoolAidBasis',
    '6つの申請要件のいずれかに該当する',
    'school-basis',
    (p) => {
      if (!p.schoolAidBasis || p.schoolAidBasis === 'unknown') return undefined;
      if (p.schoolAidBasis === 'none')
        return p.incomeDrop === 'no' ? false : undefined;
      return true;
    },
  ),
  rule(
    'parentsSameBasis',
    'ひとり親等を除き、保護者双方が同じ要件を満たす',
    'school-basis',
    (p) => (p.household === 'single-parent' ? true : yes(p.parentsSameBasis)),
  ),
  rule(
    'schoolIncomeWithin',
    '所得基準で申請する場合、対象人数に応じた課税所得基準を満たす',
    'school-income',
    (p) => {
      if (
        !p.schoolAidBasis ||
        p.schoolAidBasis === 'unknown' ||
        p.schoolAidBasis === 'none'
      )
        return undefined;
      if (p.schoolAidBasis !== 'income') return true;
      if (p.schoolIncomeWithin === 'no' && p.incomeDrop !== 'no')
        return undefined;
      return yes(p.schoolIncomeWithin);
    },
  ),
  rule(
    'incomeDrop',
    '通常要件に該当しない場合、収入減少による個別審査を確認する',
    'school-special',
    (p) => {
      if (
        p.schoolAidBasis === 'none' ||
        (p.schoolAidBasis === 'income' && p.schoolIncomeWithin === 'no')
      )
        return p.incomeDrop === 'no' ? false : undefined;
      if (!p.schoolAidBasis || p.schoolAidBasis === 'unknown') return undefined;
      return true;
    },
  ),
];

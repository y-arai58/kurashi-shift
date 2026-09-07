import type { Profile, SupportProgram, YesNoUnknown } from './domain.ts';
import { assistanceRule, movingRules, schoolRules } from './detailed-rules.ts';
import { nationalPrograms } from './national-programs.ts';

const hasEligibleChild = (household?: string) =>
  household === undefined
    ? undefined
    : ['with-children', 'single-parent'].includes(household);

const livesInFukuoka = (residence?: string) =>
  residence === undefined ? undefined : residence === 'fukuoka';

const answer = (value?: YesNoUnknown) =>
  !value || value === 'unknown' ? undefined : value === 'yes';
const childAge = (p: Profile) => {
  if (hasEligibleChild(p.household) === false) return false;
  return answer(p.childAgeEligible);
};
const sourceDates = { verifiedOn: '2026-09-07', reviewAfter: '2026-10-07' };

const fukuokaPrograms: SupportProgram[] = [
  {
    id: 'child-medical',
    ...sourceDates,
    nextSteps: [
      '対象の子どもの健康保険資格が確認できるものと、届出者の本人確認書類を用意します。',
      '公式ページからオンライン申請、またはお住まいの区の保険年金担当課へ申請します。',
    ],
    benefitLabel: '子どもの通院・入院費を軽減',
    officialName: '福岡市 子ども医療費助成制度',
    category: '医療・子育て',
    amount: '保険診療の通院は1医療機関あたり月500円まで',
    summary:
      '福岡市内に住み、健康保険に加入している高校生世代までの子どもの保険診療分を助成する制度です。3歳未満の通院と、高校生世代までの入院・薬局は自己負担がありません。',
    criteria: [
      { ...assistanceRule, guidanceId: 'medical-details' },
      {
        key: 'city',
        label: '福岡市に住んでいる',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'child',
        field: 'childAgeEligible',
        label: '高校生世代までの子どもがいる',
        evaluate: childAge,
      },
      {
        key: 'insurance',
        field: 'childHealthInsurance',
        label: '対象の子どもが健康保険に加入している',
        evaluate: (p) =>
          !p.childHealthInsurance || p.childHealthInsurance === 'unknown'
            ? undefined
            : p.childHealthInsurance === 'yes',
      },
      {
        key: 'exclusions',
        field: 'medicalExclusions',
        label: '優先される他の医療費助成の対象ではない',
        guidanceId: 'medical-details',
        evaluate: (p) =>
          answer(p.medicalExclusions) === undefined
            ? undefined
            : !answer(p.medicalExclusions),
      },
    ],
    points: [
      '3歳未満の通院、および対象年齢の入院・薬局は保険診療分の自己負担がありません。食事代・個室代などは対象外です',
      '保護者の所得制限はありません',
      '助成を受けるには子ども医療証の申請が必要です',
      '生活保護や、優先される他の医療費助成に該当する場合は扱いが異なります',
    ],
    isRelevant: (p) =>
      p.household === undefined || hasEligibleChild(p.household) === true,
    officialUrl: 'https://www.city.fukuoka.lg.jp/hofuku/hokennenkin/hp/01.html',
    sourceUpdatedAt: '2025年12月2日',
    lastVerified: '2026年9月7日',
    applicationStatus: '申請受付中',
  },
  {
    id: 'child-allowance',
    ...sourceDates,
    nextSteps: [
      '公式ページの支給対象・請求手続きを確認します。',
      '出生・転入など状況に合う案内から必要書類と申請先を確認してください。',
    ],
    benefitLabel: '高校生年代までの子育てを支援',
    officialName: '児童手当',
    category: '子育て・給付',
    amount: '子ども1人あたり月10,000〜30,000円',
    summary:
      '高校生年代までの子どもを養育している人に支給される手当です。所得制限はなく、年齢と第何子かによって月額が決まります。',
    criteria: [
      {
        key: 'city',
        label: '福岡市で児童手当を申請する',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'child',
        field: 'childAgeEligible',
        label: '高校生年代までの子どもを養育している',
        evaluate: childAge,
      },
    ],
    points: [
      '対象年齢は18歳到達後の最初の3月31日まで。申請先・別居時の書類・第3子の数え方は、このページ内の条件ガイドで調べられます',
      '3歳未満の第1子・第2子は月15,000円です',
      '3歳〜高校生年代の第1子・第2子は月10,000円です',
      '第3子以降は年齢を問わず月30,000円です',
    ],
    isRelevant: (p) =>
      p.household === undefined || hasEligibleChild(p.household) === true,
    officialUrl:
      'https://www.city.fukuoka.lg.jp/kodomo-mirai/k-katei/child/kodomoteate.html',
    sourceUpdatedAt: '2025年3月25日',
    lastVerified: '2026年9月7日',
    applicationStatus: '申請受付中',
  },
  {
    id: 'child-moving',
    ...sourceDates,
    applicationDeadline: '2027-02-28',
    nextSteps: [
      '世帯・転居前後の住宅・校区の要件を公式ページで確認します。窓口相談は予約が必要です。',
      '転居後に必要書類をそろえ、募集期間内かつ転居日から1年以内に申請します。予算枠に達すると早期終了します。',
    ],
    benefitLabel: '福岡市内での住み替え費用を支援',
    officialName: '令和8年度 福岡市子育て世帯市内引越し応援事業',
    category: '住まい・引越し',
    amount: '住宅取得 最大100万円／家賃 最大50万円／引越し 最大20万円',
    summary:
      '2026年4月1日以降に福岡市内で転居する子育て世帯を対象に、住宅取得費、民間賃貸住宅の家賃、引越し費用などを助成します。',
    criteria: [
      {
        key: 'city',
        label: '転居前から福岡市内に住んでいる',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'child',
        field: 'childAgeEligible',
        label: '高校生年代までの子を扶養、または妊娠中',
        evaluate: (p) => (p.household === 'expecting' ? true : childAge(p)),
      },
      {
        key: 'move',
        field: 'moveWithinCity',
        label: '2026年4月1日以降に福岡市内で転居する',
        evaluate: (p) =>
          !p.moveWithinCity || p.moveWithinCity === 'unknown'
            ? undefined
            : p.moveWithinCity === 'yes',
      },
      {
        key: 'housing',
        field: 'housingPlan',
        label: '住宅の購入または賃貸への住み替えを予定している',
        evaluate: (p) =>
          !p.housingPlan || p.housingPlan === 'unknown'
            ? undefined
            : ['renting', 'buying'].includes(p.housingPlan),
      },
      ...movingRules,
    ],
    points: [
      '住宅取得は年20万円を最長5年、家賃は年10万円を最長5年助成します',
      '引越し費用等は対象経費の2分の1、上限15万円。多子世帯は上限20万円です',
      '転居後の住宅、指定校区、市税滞納の有無など複数の追加要件があります。妊娠中の場合は転居日時点で母子手帳の交付が必要です',
    ],
    isRelevant: (p) =>
      p.household === undefined ||
      p.household === 'expecting' ||
      hasEligibleChild(p.household) === true,
    officialUrl:
      'https://www.city.fukuoka.lg.jp/jutaku-toshi/jigyochosei/life/kosodatehikkoshi.html',
    sourceUpdatedAt: '2026年8月31日',
    lastVerified: '2026年9月7日',
    applicationStatus: '2027年2月28日まで（予算到達で早期終了）',
  },
  {
    id: 'school-support',
    ...sourceDates,
    applicationDeadline: '2027-03-31',
    nextSteps: [
      '公式ページの所得・受給要件と必要書類を確認します。',
      'オンライン、対象の通学校、教育支援課の窓口または郵送で申請します。収入減少による個別審査は教育支援課に相談してください。',
    ],
    benefitLabel: '小・中学校で必要な費用を援助',
    officialName: '令和8年度 就学援助',
    category: '教育・学校',
    amount: '学用品費・給食費・修学旅行費などを援助',
    summary:
      '小・中学校での学習に必要な費用の支払いに困っている世帯へ、学用品費、給食費、修学旅行費などを援助します。',
    criteria: [
      {
        key: 'city',
        label: '福岡市に住んでいる',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'school',
        field: 'schoolStage',
        label: '小学生または中学生の子どもがいる',
        evaluate: (p) =>
          p.childAgeEligible === 'no'
            ? false
            : !p.schoolStage || p.schoolStage === 'unknown'
              ? undefined
              : p.schoolStage === 'elementary-middle',
      },
      ...schoolRules,
    ],
    points: [
      '2026年8月以降の申請は申請月分から認定・支給されます',
      '申請は毎年度必要です',
      '収入減少など特別な事情がある場合は個別審査を相談できます',
    ],
    isRelevant: (p) =>
      p.household === undefined || hasEligibleChild(p.household) === true,
    officialUrl:
      'https://www.city.fukuoka.lg.jp/kyoiku-iinkai/gakkoshien/ed/syugakuenjo_r8.html',
    sourceUpdatedAt: '2026年7月28日',
    lastVerified: '2026年9月7日',
    applicationStatus: '2027年3月31日まで申請受付',
  },
  {
    id: 'senior-transport',
    ...sourceDates,
    applicationDeadline: '2026-09-30',
    nextSteps: [
      '令和7年度の介護保険料所得段階を通知書で確認します。',
      '公式ページで申請月の交付額と必要書類を確認し、オンライン・郵送等で申請します。乗車券の有効期限にも注意してください。',
    ],
    benefitLabel: '外出に使える交通費を助成',
    officialName: '令和7年度 高齢者乗車券',
    category: '高齢・移動',
    amount: '2026年9月申請は2,000〜3,000円相当',
    summary:
      '満70歳以上で、福岡市介護保険料の所得段階区分が1〜7の人へ、交通費の一部を年1回助成する制度です。',
    criteria: [
      {
        key: 'city',
        label: '福岡市に住民登録がある',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'age',
        field: 'age70Plus',
        label: '満70歳以上である',
        evaluate: (p) => {
          if (p.ageBand === undefined) return undefined;
          if (p.ageBand !== '65plus') return false;
          if (!p.age70Plus || p.age70Plus === 'unknown') return undefined;
          return p.age70Plus === 'yes';
        },
      },
      {
        key: 'premium',
        field: 'premiumStage',
        label: '令和7年度の介護保険料所得段階区分が1〜7である',
        evaluate: (p) =>
          !p.premiumStage || p.premiumStage === 'unknown'
            ? undefined
            : p.premiumStage === '1-7',
      },
      {
        key: 'welfare-pass',
        field: 'welfareTransport',
        label: '福祉乗車券の交付対象ではない',
        evaluate: (p) =>
          answer(p.welfareTransport) === undefined
            ? undefined
            : !answer(p.welfareTransport),
      },
    ],
    points: [
      '令和7年度分の助成期間は2026年9月30日までです',
      '2026年7〜9月の交付額は所得段階1〜5が3,000円、6・7が2,000円です',
      '交付を受けるには毎年度の申請が必要です',
    ],
    isRelevant: (p) => p.ageBand === undefined || p.ageBand === '65plus',
    officialUrl:
      'https://www.city.fukuoka.lg.jp/fukushi/oldage-welfare/health/00/01/1-010207_5_3_2_2-2.html',
    sourceUpdatedAt: '2026年7月13日',
    lastVerified: '2026年9月7日',
    applicationStatus: '2026年9月30日まで',
  },
];

export const supportPrograms: SupportProgram[] = [
  ...fukuokaPrograms.map((program) =>
    program.id === 'child-allowance'
      ? {
          ...program,
          scope: 'national' as const,
          officialUrl:
            'https://www.cfa.go.jp/policies/kokoseido/jidouteate/annai',
          sourceUpdatedAt: '公式ページに更新日の明記なし',
          criteria: program.criteria.filter((c) => c.key !== 'city'),
          nextSteps: [
            '出生・転入は原則その翌日から15日以内に市区町村へ申請します。公務員は勤務先が申請先です。',
            '国内居住、監護・生計、別居・施設入所等の例外と第3子の数え方を確認します。',
          ],
        }
      : { ...program, scope: 'fukuoka' as const },
  ),
  ...nationalPrograms,
];

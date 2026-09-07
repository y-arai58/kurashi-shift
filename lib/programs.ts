import type { SupportProgram } from './domain';

const hasEligibleChild = (household?: string) =>
  household === undefined
    ? undefined
    : ['with-children', 'single-parent'].includes(household);

const livesInFukuoka = (residence?: string) =>
  residence === undefined ? undefined : residence === 'fukuoka';

export const supportPrograms: SupportProgram[] = [
  {
    id: 'child-medical',
    benefitLabel: '子どもの通院・入院費を軽減',
    officialName: '福岡市 子ども医療費助成制度',
    category: '医療・子育て',
    amount: '通院は月500円まで／入院・薬局は自己負担なし',
    summary:
      '福岡市内に住み、健康保険に加入している高校生世代までの子どもの保険診療分を助成する制度です。3歳未満の通院と、高校生世代までの入院・薬局は自己負担がありません。',
    criteria: [
      {
        key: 'city',
        label: '福岡市に住んでいる',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'child',
        label: '高校生世代までの子どもがいる',
        evaluate: (p) => hasEligibleChild(p.household),
      },
      {
        key: 'insurance',
        label: '対象の子どもが健康保険に加入している',
        evaluate: (p) =>
          !p.childHealthInsurance || p.childHealthInsurance === 'unknown'
            ? undefined
            : p.childHealthInsurance === 'yes',
      },
    ],
    points: [
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
        label: '高校生年代までの子どもを養育している',
        evaluate: (p) => hasEligibleChild(p.household),
      },
    ],
    points: [
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
        label: '18歳以下の子どもがいる、または妊娠中',
        evaluate: (p) => hasEligibleChild(p.household),
      },
      {
        key: 'move',
        label: '2026年4月1日以降に福岡市内で転居する',
        evaluate: (p) =>
          !p.moveWithinCity || p.moveWithinCity === 'unknown'
            ? undefined
            : p.moveWithinCity === 'yes',
      },
      {
        key: 'housing',
        label: '住宅の購入または賃貸への住み替えを予定している',
        evaluate: (p) =>
          !p.housingPlan || p.housingPlan === 'unknown'
            ? undefined
            : ['renting', 'buying'].includes(p.housingPlan),
      },
    ],
    points: [
      '住宅取得は年20万円を最長5年、家賃は年10万円を最長5年助成します',
      '引越し費用等は対象経費の2分の1、上限15万円。多子世帯は上限20万円です',
      '転居後の住宅、指定校区、市税滞納の有無など複数の追加要件があります',
    ],
    isRelevant: (p) =>
      p.household === undefined || hasEligibleChild(p.household) === true,
    officialUrl:
      'https://www.city.fukuoka.lg.jp/jutaku-toshi/jigyochosei/life/kosodatehikkoshi.html',
    sourceUpdatedAt: '2026年8月31日',
    lastVerified: '2026年9月7日',
    applicationStatus: '令和8年度 申請受付中',
  },
  {
    id: 'school-support',
    benefitLabel: '小・中学校で必要な費用を援助',
    officialName: '令和8年度 就学援助',
    category: '教育・学校',
    amount: '学用品費・給食費・修学旅行費などを援助',
    summary:
      '小・中学校での学習に必要な費用の支払いに困っている世帯へ、学用品費、給食費、修学旅行費などを援助します。',
    criteria: [
      {
        key: 'city',
        label: '福岡市内の対象となる学校・居住条件に該当する',
        evaluate: (p) => livesInFukuoka(p.residence),
      },
      {
        key: 'school',
        label: '小学生または中学生の子どもがいる',
        evaluate: (p) =>
          !p.schoolStage || p.schoolStage === 'unknown'
            ? undefined
            : p.schoolStage === 'elementary-middle',
      },
      {
        key: 'income',
        label: '非課税・児童扶養手当受給・所得基準などの要件に該当する',
        evaluate: (p) =>
          !p.schoolAidEligibility || p.schoolAidEligibility === 'unknown'
            ? undefined
            : p.schoolAidEligibility === 'likely',
      },
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
        label: '介護保険料所得段階区分が1〜7である',
        evaluate: (p) =>
          !p.premiumStage || p.premiumStage === 'unknown'
            ? undefined
            : p.premiumStage === '1-7',
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

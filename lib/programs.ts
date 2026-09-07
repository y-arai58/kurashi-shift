import type { SupportProgram } from './domain';

export const supportPrograms: SupportProgram[] = [
  {
    id: 'child-medical',
    benefitLabel: '子どもの医療費を軽減',
    officialName: '福岡市 子ども医療費助成制度（MVPサンプル）',
    category: '子育て',
    amount: '通院・入院の自己負担を軽減',
    summary: '子どもの通院や入院にかかる医療費の自己負担を軽くする支援です。',
    criteria: [
      {
        key: 'city',
        label: '福岡市に住んでいる',
        evaluate: (p) =>
          p.residence === undefined ? undefined : p.residence === 'fukuoka',
      },
      {
        key: 'children',
        label: '子どもがいる世帯',
        evaluate: (p) =>
          p.household === undefined
            ? undefined
            : ['with-children', 'single-parent'].includes(p.household),
      },
    ],
    points: [
      '申請者と子どもの住所要件があります',
      '健康保険への加入状況を確認します',
      '窓口・郵送などの申請方法があります',
    ],
    officialUrl: 'https://www.city.fukuoka.lg.jp/',
    lastVerified: '未確認（MVP用モック）',
  },
  {
    id: 'family-rent',
    benefitLabel: '子育て世帯の住み替えを支援',
    officialName: '子育て世帯住替え助成事業（MVPサンプル）',
    category: '住まい',
    amount: '引越し費用などを助成',
    summary:
      '子育てしやすい住まいへの住み替えに伴う費用を支援する制度のサンプルです。',
    criteria: [
      {
        key: 'city',
        label: '福岡市に住んでいる',
        evaluate: (p) =>
          p.residence === undefined ? undefined : p.residence === 'fukuoka',
      },
      {
        key: 'family',
        label: '子どもがいる世帯',
        evaluate: (p) =>
          p.household === undefined
            ? undefined
            : ['with-children', 'single-parent'].includes(p.household),
      },
      {
        key: 'housing',
        label: '住み替えを検討している',
        questionLabel: '住まいの予定',
        evaluate: (p) =>
          !p.housingPlan || p.housingPlan === 'unknown'
            ? undefined
            : p.housingPlan === 'renting',
      },
      {
        key: 'income',
        label: '所得などの要件を満たす',
        questionLabel: '世帯年収の目安',
        evaluate: (p) =>
          !p.incomeBand || p.incomeBand === 'unknown'
            ? undefined
            : p.incomeBand !== 'over500',
      },
    ],
    points: [
      '契約前の申請が必要な場合があります',
      '対象となる住宅や費用に条件があります',
      '予算上限に達すると受付が終了します',
    ],
    officialUrl: 'https://www.city.fukuoka.lg.jp/',
    lastVerified: '未確認（MVP用モック）',
  },
  {
    id: 'job-transition',
    benefitLabel: '仕事探しとスキル習得を支援',
    officialName: '就職・就労支援窓口（MVPサンプル）',
    category: '仕事',
    amount: '相談・講座・就職支援',
    summary:
      '仕事を探している人に、相談やスキル習得、就職活動の支援を行う窓口のサンプルです。',
    criteria: [
      {
        key: 'adult',
        label: '働く世代に該当する',
        evaluate: (p) =>
          p.ageBand === undefined
            ? undefined
            : !['under18', '65plus'].includes(p.ageBand),
      },
      {
        key: 'employment',
        label: '仕事探しや復職を考えている',
        questionLabel: '現在の仕事の状況',
        evaluate: (p) =>
          !p.employment || p.employment === 'unknown'
            ? undefined
            : ['seeking', 'leave'].includes(p.employment),
      },
    ],
    points: [
      '相談だけでも利用できる窓口があります',
      '講座ごとに対象者や募集期間が異なります',
      '雇用保険の状況により利用できる制度が変わります',
    ],
    officialUrl: 'https://www.city.fukuoka.lg.jp/',
    lastVerified: '未確認（MVP用モック）',
  },
  {
    id: 'senior-transport',
    benefitLabel: '外出や公共交通の利用を支援',
    officialName: '高齢者乗車券（MVPサンプル）',
    category: '移動',
    amount: '交通費の一部を助成',
    summary:
      '高齢者の社会参加や外出を後押しする、交通費支援制度のサンプルです。',
    criteria: [
      {
        key: 'city',
        label: '福岡市に住んでいる',
        evaluate: (p) =>
          p.residence === undefined ? undefined : p.residence === 'fukuoka',
      },
      {
        key: 'senior',
        label: '対象年齢に該当する',
        evaluate: (p) =>
          p.ageBand === undefined ? undefined : p.ageBand === '65plus',
      },
      {
        key: 'income',
        label: '所得などの要件を満たす',
        questionLabel: '世帯年収の目安',
        evaluate: (p) =>
          !p.incomeBand || p.incomeBand === 'unknown'
            ? undefined
            : p.incomeBand !== 'over500',
      },
    ],
    points: [
      '交付額は所得区分などで変わります',
      '毎年度の申請が必要です',
      '選べる乗車券の種類があります',
    ],
    officialUrl: 'https://www.city.fukuoka.lg.jp/',
    lastVerified: '未確認（MVP用モック）',
  },
];

import type { Profile, SupportProgram, Criterion } from './domain.ts';

const yes = (v?: string) => (!v || v === 'unknown' ? undefined : v === 'yes');
const rule = (field: keyof Profile, label: string): Criterion => ({
  key: field,
  field,
  label,
  evaluate: (p) => yes(p[field]),
});
const expecting = (p: Profile) =>
  p.pregnancyBirth === 'yes' || p.household === 'expecting';
const pregnancyRule: Criterion = {
  key: 'pregnancyBirth',
  field: 'pregnancyBirth',
  label: '世帯に妊娠中・出産後の方がいる',
  evaluate: (p) => (p.household === 'expecting' ? true : yes(p.pregnancyBirth)),
};
const base = (
  item: Omit<
    SupportProgram,
    | 'scope'
    | 'verifiedOn'
    | 'reviewAfter'
    | 'lastVerified'
    | 'sourceUpdatedAt'
    | 'applicationStatus'
  > & { sourceUpdatedAt?: string },
): SupportProgram => ({
  ...item,
  scope: 'national',
  verifiedOn: '2026-09-07',
  reviewAfter: '2026-10-07',
  lastVerified: '2026年9月7日',
  sourceUpdatedAt: item.sourceUpdatedAt ?? '公式ページに更新日の明記なし',
  applicationStatus: '個別の申請時期・実施窓口を確認',
  criteria: [
    ...item.criteria,
    {
      key: 'individual-review',
      label: item.nextSteps.join(' '),
      evaluate: () => undefined,
    },
  ],
});
export const nationalPrograms: SupportProgram[] = [
  base({
    id: 'pregnancy-support',
    benefitLabel: '妊娠期の経済的負担を支援',
    officialName: '妊婦のための支援給付',
    category: '全国共通・妊娠',
    amount: '認定後5万円＋胎児数×5万円',
    summary:
      '国内に住所を有する妊婦を対象とする給付。市区町村への認定申請と胎児数の届出を行います。',
    isRelevant: expecting,
    criteria: [pregnancyRule],
    points: [
      '妊娠の確認・給付認定と、胎児数の届出は別の手続きです。',
      '流産・死産等も対象になる場合があります。経過を初回質問で尋ねず、公式の専用案内で確認します。',
    ],
    nextSteps: [
      '医療機関による妊娠の確認、申請期限、重複給付の有無を市区町村で確認します。',
    ],
    officialUrl: 'https://www.cfa.go.jp/policies/shussan-kosodate/',
  }),
  base({
    id: 'birth-lump-sum',
    benefitLabel: '出産費用の負担を軽減',
    officialName: '出産育児一時金',
    category: '全国共通・出産',
    amount: '原則1児50万円（条件により48.8万円）',
    summary:
      '健康保険の被保険者や扶養家族の出産費用を支援する給付です。加入先へ申請します。',
    isRelevant: expecting,
    criteria: [
      pregnancyRule,
      {
        key: 'healthCoverage',
        field: 'healthCoverage',
        label: '出産する方の健康保険の区分を確認した',
        evaluate: (p) =>
          ['employee', 'dependent', 'national'].includes(p.healthCoverage ?? '')
            ? true
            : undefined,
      },
    ],
    points: [
      '協会けんぽでは妊娠4か月（85日）以上の出産が対象です。',
      '産科医療補償制度への加入・妊娠週数により50万円または48.8万円となります。直接支払制度の利用可否は医療機関で確認します。',
    ],
    nextSteps: [
      '妊娠日数、出産日、加入保険、過去の給付と申請期限を確認します。国保・組合健保は加入先の案内を使用します。',
    ],
    officialUrl: 'https://www.kyoukaikenpo.or.jp/faq/benefit/006/',
  }),
  base({
    id: 'maternity-pay',
    benefitLabel: '出産のため休んだ期間の収入を支援',
    officialName: '出産手当金',
    category: '全国共通・出産休業',
    amount: '標準報酬日額を基に原則3分の2',
    summary:
      '被保険者本人が出産のため仕事を休み、給与を受けられない期間の支援です。退職後も条件次第で継続給付があります。',
    isRelevant: (p) => expecting(p) && p.healthCoverage !== 'dependent',
    criteria: [
      pregnancyRule,
      {
        key: 'healthCoverage',
        field: 'healthCoverage',
        label: '出産する方が勤務先の健康保険の本人加入者（退職後は別途確認）',
        evaluate: (p) => (p.healthCoverage === 'employee' ? true : undefined),
      },
    ],
    points: [
      '原則、出産前42日（多胎98日）から出産後56日までの休業期間が対象。',
      '給与が支給される場合は調整があります。扶養家族への給付ではありません。',
    ],
    nextSteps: [
      '休業期間・給与・被保険者期間を加入保険者で確認します。退職後は継続給付の条件を確認します。',
    ],
    officialUrl:
      'https://www.kyoukaikenpo.or.jp/benefit/childbirth/001/index.html',
  }),
  base({
    id: 'national-rent',
    benefitLabel: '離職・収入減少時の家賃を支援',
    officialName: '住居確保給付金（家賃補助）',
    category: '全国制度・住まい',
    amount: '原則3か月、延長は最大9か月（自治体上限あり）',
    summary:
      '離職・廃業や就労機会の大幅減少で住まいの維持が難しい方の家賃を支援します。',
    isRelevant: (p) => p.rentBurden === 'yes',
    criteria: [
      rule('rentBurden', '家賃や住まいの確保に困っている'),
      rule('incomeReduced', '離職・廃業や大きな収入減少がある'),
    ],
    points: [
      '主たる生計維持者の離職・廃業から原則2年以内、または本人の都合によらない就労機会の減少等が要件です。',
      '世帯収入・預貯金・求職活動等を確認します。基準額は自治体・世帯人数によって異なります。',
    ],
    nextSteps: [
      '自立相談支援機関で、収入・資産・離職日・求職活動と家賃上限を確認します。',
    ],
    officialUrl:
      'https://corona-support.mhlw.go.jp/jukyokakuhokyufukin/index.html',
  }),
  base({
    id: 'national-moving-cost',
    benefitLabel: '家計改善のための転居費用を支援',
    officialName: '住居確保給付金（転居費用補助）',
    category: '全国制度・転居',
    amount: '対象経費・上限は自治体と確認',
    summary:
      '収入の大幅減少等で家賃が安い住宅への転居が必要な方などに、転居費用を支援する制度です。',
    isRelevant: (p) => p.rentBurden === 'yes' && p.plannedMove === 'yes',
    criteria: [
      rule('rentBurden', '住まいの確保や家賃に困っている'),
      rule('incomeReduced', '大きな収入減少がある'),
      rule('plannedMove', '転居を検討している'),
    ],
    points: [
      '単なる転居だけで対象にはなりません。家計改善のための必要性を確認します。',
      '自治体ごとの収入・資産要件と対象経費を確認します。契約・支払い前の相談が重要です。',
    ],
    nextSteps: [
      '自立相談支援機関で家計改善の必要性・収入資産・転居先・経費を確認します。',
    ],
    officialUrl: 'https://www.mhlw.go.jp/stf/newpage_51380.html',
  }),
  base({
    id: 'job-training',
    benefitLabel: '職業訓練と訓練中の生活を支援',
    officialName: '求職者支援制度',
    category: '全国共通・仕事',
    amount: '無料の職業訓練／給付要件を満たすと月10万円',
    summary:
      '再就職・転職を目指す方を、訓練とハローワークの支援につなぎます。訓練の対象と給付金の対象は別に確認します。',
    isRelevant: (p) => p.trainingInterest === 'yes',
    criteria: [rule('trainingInterest', '職業訓練を検討している')],
    points: [
      '訓練の要件：求職申込み、雇用保険の資格、労働の意思・能力、ハローワークによる必要性の認定。',
      '月10万円の給付は本人月収8万円以下・世帯月収30万円以下・金融資産300万円以下等。出席・所有不動産・過去の給付歴も確認します。',
      '給付金の要件を満たさなくても訓練を受けられる場合があります。',
    ],
    nextSteps: [
      '雇用保険資格、本人・世帯収入、資産、出席と受給歴をハローワークで確認します。',
    ],
    officialUrl:
      'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyushokusha_shien/index.html',
  }),
  base({
    id: 'pension-relief',
    sourceUpdatedAt: '2026年8月3日',
    benefitLabel: '国民年金保険料の支払いを相談',
    officialName: '国民年金保険料の免除・納付猶予',
    category: '全国共通・年金',
    amount: '全額・一部免除、または納付猶予',
    summary:
      '所得が一定以下、失業などで納付が難しい場合の制度。免除と猶予では将来の年金額への反映が異なります。',
    isRelevant: (p) => p.pensionBurden === 'yes',
    criteria: [
      rule('pensionBurden', '国民年金保険料を自分で納めており支払いが難しい'),
    ],
    points: [
      '免除では本人・配偶者・世帯主の所得、猶予では本人・配偶者の所得等を確認します。',
      '学生は学生納付特例、生活扶助・障害年金は法定免除、産前産後は専用の免除制度を確認します。',
      '失業の特例でも、配偶者・世帯主など他の審査対象者の所得確認が必要です。',
    ],
    nextSteps: [
      '年齢・加入区分・学生等の状況と審査対象者の所得を年金事務所等で確認します。',
    ],
    officialUrl: 'https://www.nenkin.go.jp/service/kokunen/menjo/20150428.html',
  }),
  base({
    id: 'free-childcare',
    benefitLabel: '幼稚園・保育所等の利用料を軽減',
    officialName: '幼児教育・保育の無償化',
    category: '全国制度・保育',
    amount: '施設・年齢・認定で対象額が異なる',
    summary:
      '3〜5歳児クラス等の利用料や、0〜2歳の住民税非課税世帯などへの支援。施設種別ごとに条件を確認します。',
    isRelevant: (p) => p.preschool === 'yes',
    criteria: [rule('preschool', '小学校入学前の子どもがいる')],
    points: [
      '保育所等は原則、満3歳後の4月1日から。幼稚園は満3歳から。送迎費・食材料費・行事費等は別です。',
      '0〜2歳は非課税世帯等の条件があります。認可外や預かり保育には保育の必要性の認定と上限があります。',
    ],
    nextSteps: [
      '対象児の年齢・施設区分・保育認定・住民税区分を市区町村で確認します。',
    ],
    officialUrl: 'https://www.cfa.go.jp/policies/kokoseido/mushouka/gaiyou',
  }),
  base({
    id: 'higher-education',
    benefitLabel: '多子世帯の大学等の授業料を軽減',
    officialName: '高等教育の修学支援新制度（多子世帯支援）',
    category: '全国共通・進学',
    amount: '授業料・入学金を上限まで減免',
    summary:
      '扶養する子どもが3人以上の多子世帯の学生等を対象とした授業料等減免です。現金の給付奨学金とは要件が異なります。',
    isRelevant: (p) => p.higherEducation === 'yes' && p.manyDependents !== 'no',
    criteria: [
      rule('higherEducation', '大学等への進学予定・在学がある'),
      rule('manyDependents', '扶養する子どもが3人以上いる'),
    ],
    points: [
      '税情報上の子どもの数と本人の扶養状況等で判定します。単純な同居人数ではありません。',
      '多子世帯の授業料減免は所得制限がありませんが、資産・対象学校・学業等の要件があります。給付奨学金が支給されない区分もあります。',
    ],
    nextSteps: [
      '学校を通じて対象校・扶養人数・資産・学業・申込期限を確認します。',
    ],
    officialUrl:
      'https://www.jasso.go.jp/shogakukin/about/kyufu/kakei/r7tashikakudai/index.html',
  }),
];

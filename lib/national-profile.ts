import type { Profile } from './domain.ts';

const yesNo = [
  ['yes', 'はい'],
  ['no', 'いいえ'],
  ['unknown', 'わからない・答えない'],
];
export const nationalQuestions = [
  {
    field: 'pregnancyBirth',
    title: '世帯に妊娠中・出産後の方はいますか？',
    note: '2人目以降の妊娠も含みます。妊婦給付・出産費用・休業中の支援に使います。詳しい経過や病名は入力不要です。',
    choices: yesNo,
  },
  {
    field: 'employment',
    title: 'あなたの現在の働き方は？',
    note: '給付の申請先や、雇用・保険の支援を絞るために使います。',
    choices: [
      ['employee', '会社員・パート等'],
      ['civil', '公務員'],
      ['self', '自営業・フリーランス'],
      ['unemployed', '離職中・無職'],
      ['student', '学生'],
      ['other', 'その他'],
      ['unknown', 'わからない・答えない'],
    ],
  },
  {
    field: 'healthCoverage',
    title: '出産する方の健康保険は？',
    note: '出産する方について回答してください。被保険者本人と扶養家族で、休業中の給付が異なります。',
    choices: [
      ['employee', '勤務先の健康保険（本人）'],
      ['dependent', '家族の健康保険の扶養'],
      ['national', '国民健康保険'],
      ['other', 'その他・加入していない'],
      ['unknown', 'わからない・答えない'],
    ],
    when: (p: Profile) =>
      p.pregnancyBirth === 'yes' || p.household === 'expecting',
  },
  {
    field: 'incomeReduced',
    title: '離職・廃業や収入の大きな減少がありますか？',
    note: '住居確保給付金・年金保険料の負担軽減に関係します。減少の原因や時期は制度ごとに確認します。',
    choices: yesNo,
  },
  {
    field: 'rentBurden',
    title: '家賃の支払い・住まいの確保に困っていますか？',
    note: '家賃補助や家計改善のための転居支援を案内します。',
    choices: yesNo,
  },
  {
    field: 'taxExempt',
    title: '世帯全員が住民税非課税ですか？',
    note: '保育料などに関係します。年収の目安だけで非課税と推定しません。',
    choices: yesNo,
  },
  {
    field: 'preschool',
    title: '小学校入学前の子どもはいますか？',
    note: '幼児教育・保育の無償化に使います。子どもが複数いる場合は該当する方を選んでください。',
    choices: yesNo,
    when: (p: Profile) =>
      ['with-children', 'single-parent'].includes(p.household ?? ''),
  },
  {
    field: 'higherEducation',
    title: '本人や扶養する子どもに、大学等への進学予定・在学がありますか？',
    note: '大学・短大・高専・専門学校の授業料減免と給付奨学金を案内します。',
    choices: yesNo,
  },
  {
    field: 'manyDependents',
    title: '生計を支える方が扶養する子どもは3人以上ですか？',
    note: '多子世帯の授業料減免の入口です。税情報上の扶養人数・資産・学業要件は別途確認します。',
    choices: yesNo,
    when: (p: Profile) => p.higherEducation === 'yes',
  },
  {
    field: 'trainingInterest',
    title: '再就職・転職のために職業訓練を検討していますか？',
    note: '求職者支援制度を案内します。給付金が出ない場合も無料訓練の対象となることがあります。',
    choices: yesNo,
  },
  {
    field: 'pensionBurden',
    title: '国民年金保険料を自分で納めていて、支払いが難しいですか？',
    note: '免除・猶予の案内に使います。学生・産前産後等は別の手続きを案内します。',
    choices: yesNo,
  },
  {
    field: 'plannedMove',
    title: '転居を予定・検討していますか？',
    note: '全国の移住情報の入口と、転居費用支援を案内します。転居先の独自条件は未収集の地域があります。',
    choices: yesNo,
  },
] as const;

export const nationalProfileSchema = Object.fromEntries(
  nationalQuestions.map((q) => [
    q.field,
    { type: 'string', enum: q.choices.map((c) => c[0]) },
  ]),
);
export const nationalInitialQuestions = nationalQuestions.map((q) => ({
  field: q.field,
  title: q.title,
  note: q.note,
  options: q.choices.map(([value, label]) => ({ value, label })),
  show: 'when' in q ? q.when : (_p: Profile) => true,
}));

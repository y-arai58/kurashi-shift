import type { Profile, SupportProgram } from './domain.ts';
import { hasChildren } from './profile.ts';

const yesNo = [
  { value: 'yes', label: 'はい' },
  { value: 'no', label: 'いいえ' },
  { value: 'unknown', label: 'わからない・答えない' },
];
export type FollowupQuestion = {
  field: keyof Profile;
  title: string;
  note: string;
  options: { value: string; label: string }[];
  show: (profile: Profile) => boolean;
};
const child = (p: Profile) => hasChildren(p) && p.childAgeEligible !== 'no';
const moving = (p: Profile) => child(p) || p.household === 'expecting';
const movingDetails = (p: Profile) => moving(p) && p.moveWithinCity === 'yes';
const school = (p: Profile) =>
  child(p) && p.schoolStage === 'elementary-middle';
const select = (choices: [string, string][]) => [
  ...choices.map(([value, label]) => ({ value, label })),
  { value: 'unknown', label: 'わからない・答えない' },
];
const movingQuestion = (
  field: keyof Profile,
  title: string,
  note: string,
): FollowupQuestion => ({
  field,
  title,
  note,
  options: yesNo,
  show: movingDetails,
});
export const followupQuestions: FollowupQuestion[] = [
  {
    field: 'publicAssistance',
    title: '世帯で生活保護等を受給していますか？',
    note: '医療・就学援助・住み替えの判定に共通する項目です。受給中は別の支援から相当額を受ける場合があります。回答は任意です。',
    options: yesNo,
    show: (p) => child(p) || p.household === 'expecting',
  },
  {
    field: 'childAgeEligible',
    title: '高校生年代までの子どもを養育していますか？',
    note: '18歳になった後の最初の3月31日まで。学校に通っていない子どもも含みます。',
    options: yesNo,
    show: hasChildren,
  },
  {
    field: 'childHealthInsurance',
    title: '対象の子どもは健康保険に加入していますか？',
    note: '子ども医療費助成の条件です。子どもごとに状況が違う場合は「わからない」を選び、公式窓口で確認できます。',
    options: yesNo,
    show: child,
  },
  {
    field: 'medicalExclusions',
    title: '優先される他の医療費助成の対象ですか？',
    note: 'ひとり親家庭等医療費助成、3歳以上の重度障がい者医療費助成など。対象か迷う場合は下の条件ガイドを使えます。',
    options: yesNo,
    show: (p) => child(p) && p.childHealthInsurance === 'yes',
  },
  {
    field: 'schoolStage',
    title: '小学生または中学生の子どもはいますか？',
    note: '就学援助に関係する質問です。',
    options: [
      { value: 'elementary-middle', label: 'いる' },
      { value: 'other', label: 'いない' },
      { value: 'unknown', label: 'わからない・答えない' },
    ],
    show: child,
  },
  {
    field: 'schoolType',
    title: '子どもの小中学校の種類は？',
    note: '複数の子で種類が異なる場合は、診断したい子について回答してください。',
    options: select([
      ['city', '福岡市立'],
      ['national-prefectural', '国立・県立'],
      ['private', '私立'],
      ['other', 'その他'],
    ]),
    show: school,
  },
  {
    field: 'schoolAidBasis',
    title: '就学援助のどの要件で申請しますか？',
    note: '下のガイドで6つの要件を確認できます。児童手当と児童扶養手当は別の制度です。',
    options: select([
      ['ended-protection', '生活保護の廃止・停止後も困窮'],
      ['tax-exempt', '市県民税の非課税・減免'],
      ['full-waiver', '国民年金・国保の全額減免（育児期間免除を除く）'],
      ['day-labor-loan', '登録日雇い労働・1か月以内の生活福祉資金貸付'],
      ['allowance', '児童扶養手当を受給'],
      ['income', '課税所得が基準以下'],
      ['none', '上記に該当しない'],
    ]),
    show: school,
  },
  {
    field: 'parentsSameBasis',
    title: '保護者双方が、選んだ同じ要件に該当しますか？',
    note: 'ひとり親世帯の場合はこの質問を省きます。所得基準の場合は双方の資料を確認してください。',
    options: yesNo,
    show: (p) => school(p) && p.household !== 'single-parent',
  },
  {
    field: 'schoolIncomeWithin',
    title: '対象となる保護者の課税所得は基準以下ですか？',
    note: '令和8年度の市県民税の課税所得です。額面年収ではありません。下の計算ツールを保護者ごとに使えます。',
    options: yesNo,
    show: (p) => school(p) && p.schoolAidBasis === 'income',
  },
  {
    field: 'incomeDrop',
    title: '退職・疾病・災害などで収入が減少しましたか？',
    note: '通常の基準外でも個別審査の余地があります。支出が増えただけの場合は含みません。',
    options: yesNo,
    show: (p) =>
      school(p) &&
      (p.schoolAidBasis === 'none' ||
        (p.schoolAidBasis === 'income' && p.schoolIncomeWithin === 'no')),
  },
  {
    field: 'moveWithinCity',
    title: '2026年4月1日以降に福岡市内で転居しますか？',
    note: 'すでに転居した場合も含みます。市外からの転入・市外への転出は、この制度では対象になりません。',
    options: yesNo,
    show: moving,
  },
  {
    field: 'housingPlan',
    title: '転居後の住まいは？',
    note: '家賃助成と住宅取得費助成は条件が異なります。',
    options: [
      { value: 'renting', label: '賃貸住宅' },
      { value: 'buying', label: '購入した住宅' },
      { value: 'none', label: 'それ以外・予定なし' },
      { value: 'unknown', label: 'まだわからない' },
    ],
    show: (p) => moving(p) && p.moveWithinCity === 'yes',
  },
  {
    field: 'age70Plus',
    title: '満70歳以上ですか？',
    note: '高齢者乗車券は満70歳以上が対象です。70歳の誕生日前日から申請できます。',
    options: yesNo,
    show: (p) => p.ageBand === '65plus',
  },
  {
    field: 'premiumStage',
    title: '令和7年度の介護保険料所得段階は？',
    note: '福岡市の介護保険料徴収通知書で確認できます。',
    options: [
      { value: '1-7', label: '所得段階1〜7' },
      { value: '8plus', label: '所得段階8以上' },
      { value: 'unknown', label: 'わからない・答えない' },
    ],
    show: (p) => p.ageBand === '65plus' && p.age70Plus !== 'no',
  },
  {
    field: 'welfareTransport',
    title: '福祉乗車券の交付対象ですか？',
    note: '身体障害者手帳1〜3級、療育手帳A、精神障害者保健福祉手帳1級、戦傷病者手帳、被爆者健康手帳の所持者は福祉乗車券の対象です。',
    options: yesNo,
    show: (p) =>
      p.ageBand === '65plus' &&
      p.age70Plus !== 'no' &&
      p.premiumStage !== '8plus',
  },
  {
    field: 'movingBenefit',
    title: 'どの助成について詳しく診断しますか？',
    note: '購入・家賃と引越し費用では条件が違います。切り替えてそれぞれ確認できます。',
    options: select([
      ['purchase', '住宅取得費の助成'],
      ['rent', '家賃の助成'],
      ['costs', '引越し費用等の助成'],
    ]),
    show: movingDetails,
  },
  {
    field: 'priorHousing',
    title: '転居前の住まいの状況は？',
    note: '家賃滞納がある場合はその選択肢を優先してください。持ち家の例外は下のガイドで確認できます。',
    options: select([
      ['rental-clear', '賃貸等で家賃滞納なし'],
      ['owner-sold', '持ち家を申請時点で処分済み'],
      ['separation', '離婚・DV等による別居で家賃滞納なし'],
      ['owner', 'それ以外の持ち家'],
      ['arrears', '家賃の滞納がある'],
    ]),
    show: movingDetails,
  },
  movingQuestion(
    'duplicateMovingAid',
    '同じ転居・同じ内容の他の助成を受けていますか？',
    '住居確保給付金など。同じ事業内の購入費または家賃と引越し費用の併用は、ここには含めません。',
  ),
  movingQuestion(
    'municipalTaxArrears',
    '対象世帯に市町村税・延滞金の滞納がありますか？',
    '別世帯の配偶者や世帯分離した同居者も含みます。市外に住む配偶者の居住地の税も対象です。',
  ),
  movingQuestion(
    'antisocialTies',
    '暴力団員または密接な関係者が世帯にいますか？',
    '公式の共通要件です。氏名や具体的な事情の入力は不要です。',
  ),
  movingQuestion(
    'priorMovingGrant',
    '以前に対象の住替え助成を受給したことがありますか？',
    '本事業・三世代同居近居・旧子育て世帯住替え助成。受給歴がある場合も再申請の例外をガイドで確認できます。',
  ),
  movingQuestion(
    'housingContract',
    '名義・所有者・契約の条件をすべて満たしますか？',
    '転居前後の契約者等は子の扶養義務者。転居先は個人名義で自ら居住し、親族からの取得や親族所有の賃貸、会社契約の社宅ではないこと。',
  ),
  movingQuestion(
    'housingSpace',
    '転居先は必要な住戸専用面積を満たしますか？',
    '下の面積計算ツールで世帯構成から確認できます。壁芯面積を使います。',
  ),
  movingQuestion(
    'earthquakeSafety',
    '新耐震基準または耐震性能の書面証明がありますか？',
    '築年だけで断定せず、基準への適合または改修・診断の証明を確認してください。条件は下のガイドで読めます。',
  ),
  movingQuestion(
    'hazardSafety',
    '対象の災害区域外、または区域内の安全要件を満たしますか？',
    '区域内なら安全措置と検査済証が必要です。3つの対象区域はガイドに記載しています。',
  ),
  {
    field: 'maternityHandbook',
    title: '転居日時点で母子手帳が交付されていますか？',
    note: '妊娠中の世帯として申請する場合の条件です。',
    options: yesNo,
    show: (p) => movingDetails(p) && p.household === 'expecting',
  },
  {
    field: 'newDesignatedDistrict',
    title: '別の校区から、指定校区へ新たに転居しますか？',
    note: '下の校区一覧で検索できます。同一校区内なら「いいえ」。引越し費用だけならこの制限はありません。',
    options: yesNo,
    show: (p) =>
      movingDetails(p) && ['purchase', 'rent'].includes(p.movingBenefit ?? ''),
  },
  {
    field: 'mortgageFiveYears',
    title: '5年以上の住宅ローンを利用しますか？',
    note: '住宅取得費助成に必要です。引越し費用等助成にはローン利用条件がありません。',
    options: yesNo,
    show: (p) => movingDetails(p) && p.movingBenefit === 'purchase',
  },
  {
    field: 'rentalType',
    title: '賃貸住宅の区分は？',
    note: '家賃助成は民間賃貸、引越し費用等は公営以外の公的賃貸にも対応します。',
    options: select([
      ['private', '家賃を支払う民間賃貸'],
      ['public-not-municipal', '公的賃貸（公営住宅以外）'],
      ['municipal', '公営住宅'],
    ]),
    show: (p) => movingDetails(p) && p.housingPlan === 'renting',
  },
  {
    field: 'movingPayment',
    title: '対象の引越し費用等を申請時に支払済みですか？',
    note: '領収書などで確認します。対象外経費や勤務先からの手当等を除いて算定します。',
    options: yesNo,
    show: (p) => movingDetails(p) && p.movingBenefit === 'costs',
  },
  movingQuestion(
    'movingDeadline',
    '募集期間内かつ転居日から1年以内に申請しますか？',
    '現在の募集期限は2027年2月28日。期限内に書類が届く必要があります。予算到達による早期終了は別途生じます。',
  ),
];

export const initialQuestionFields: (keyof Profile)[] = [
  'childAgeEligible',
  'schoolStage',
  'publicAssistance',
  'age70Plus',
];
export function initialQuestionsFor(profile: Profile) {
  if (profile.residence !== 'fukuoka' || !profile.household) return [];
  return initialQuestionFields
    .map((field) =>
      followupQuestions.find((question) => question.field === field)!,
    )
    .filter((question) => question.show(profile));
}

export function questionsFor(profile: Profile, program?: SupportProgram) {
  if (profile.residence !== 'fukuoka') return [];
  return followupQuestions.filter(
    (question) =>
      question.show(profile) &&
      (!program ||
        program.criteria.some(
          (criterion) => criterion.field === question.field,
        )),
  );
}

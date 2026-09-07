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
export const followupQuestions: FollowupQuestion[] = [
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
    title: '生活保護や優先される医療費助成の対象ですか？',
    note: '生活保護、ひとり親家庭等医療費助成、3歳以上の重度障がい者医療費助成など。他の医療費助成が優先される場合があります。',
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
    field: 'schoolAidEligibility',
    title: '就学援助の所得・受給要件に該当しそうですか？',
    note: '住民税非課税・減免、児童扶養手当受給、課税所得の基準など。該当しないと思う場合も、収入減少による個別相談ができます。',
    options: [
      { value: 'likely', label: '該当しそう' },
      { value: 'unlikely', label: '該当しないと思う' },
      { value: 'unknown', label: '基準を確認したい' },
    ],
    show: (p) => child(p) && p.schoolStage === 'elementary-middle',
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
];

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

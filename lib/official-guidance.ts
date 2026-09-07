import type { Profile } from './domain.ts';

const sources = {
  moving:
    'https://www.city.fukuoka.lg.jp/jutaku-toshi/jigyochosei/life/kosodatehikkoshi.html',
  school:
    'https://www.city.fukuoka.lg.jp/kyoiku-iinkai/gakkoshien/ed/syugakuenjo_r8.html',
  medical: 'https://www.city.fukuoka.lg.jp/hofuku/hokennenkin/hp/01.html',
  allowance:
    'https://www.city.fukuoka.lg.jp/kodomo-mirai/k-katei/child/kodomoteate.html',
  senior:
    'https://www.city.fukuoka.lg.jp/fukushi/oldage-welfare/health/00/01/1-010207_5_3_2_2-2.html',
};
export type Guidance = {
  id: string;
  programIds: string[];
  title: string;
  keywords: string[];
  paragraphs: string[];
  fields: (keyof Profile)[];
  sourceUrl: string;
  verifiedOn: string;
};
type Entry = Omit<Guidance, 'verifiedOn'>;
const moving = (entry: Omit<Entry, 'programIds' | 'sourceUrl'>): Entry => ({
  ...entry,
  programIds: ['child-moving'],
  sourceUrl: sources.moving,
});
const school = (entry: Omit<Entry, 'programIds' | 'sourceUrl'>): Entry => ({
  ...entry,
  programIds: ['school-support'],
  sourceUrl: sources.school,
});

export const designatedDistricts = [
  {
    ward: '東区',
    schools: ['美和台', '香椎下原', '香椎', '香住丘', '千早', '名島', '松島'],
  },
  { ward: '博多区', schools: ['那珂'] },
  { ward: '中央区', schools: ['平尾', '草ヶ江', '舞鶴'] },
  { ward: '南区', schools: ['西花畑', '三宅', '西高宮'] },
  { ward: '城南区', schools: ['別府'] },
  { ward: '早良区', schools: ['野芥', '西新', '高取'] },
  { ward: '西区', schools: ['内浜', '姪浜', '壱岐', '今宿'] },
];
export const schoolIncomeThresholds = [
  1165000, 1519000, 1982000, 2365000, 2895000, 3206000,
];

export const officialGuidance: Guidance[] = (
  [
    moving({
      id: 'moving-area',
      title: '住宅の面積は何㎡必要？',
      keywords: ['広さ', '専用面積', '平米', '人数', '家族', '赤ちゃん'],
      fields: ['housingSpace'],
      paragraphs: [
        '面積の判定では3歳未満を0.25人、3〜5歳を0.5人、6〜9歳を0.75人、10歳以上を1人として数えます。妊娠中の人は胎児分を含め2人です。別世帯の配偶者や世帯分離した同居者も含めます。',
        '換算人数が2人未満なら2人。2〜4人は「10×人数＋10」㎡、4人超はその95％が必要です。年齢換算がない5人世帯は57㎡、6人世帯は66㎡という公式表の値を使います。壁芯面積で確認します。下の計算ツールで試せます。',
      ],
    }),
    moving({
      id: 'moving-district',
      title: '指定校区とは？自分の転居先を調べる',
      keywords: [
        '校区',
        '小学校',
        '学区',
        ...designatedDistricts.flatMap((row) => [row.ward, ...row.schools]),
      ],
      fields: ['newDesignatedDistrict'],
      paragraphs: [
        '指定する小学校区へ別の校区から新たに移る場合、住宅取得費・家賃助成は対象外です。同じ小学校区内の転居は除外されません。引越し費用等助成はこの校区制限を受けません。',
        ...designatedDistricts.map(
          (row) =>
            row.ward + '：' + row.schools.map((name) => name + '小').join('、'),
        ),
        '掲載一覧は令和8・9年度分です。子どもの通学校ではなく、転居先住所が属する校区で判断します。住所境界がわからない場合は「わからない」を選んでください。',
      ],
    }),
    moving({
      id: 'moving-safety',
      title: '古い住宅や災害区域の住宅は対象？',
      keywords: [
        '耐震',
        '築年',
        '1981',
        '昭和56',
        '土砂',
        '地すべり',
        '危険区域',
        '検査済証',
      ],
      fields: ['earthquakeSafety', 'hazardSafety'],
      paragraphs: [
        '原則は1981年6月1日以降に建築され、新耐震基準を満たす住宅。古い住宅でも改修・診断で耐震性能を証明できる場合があります。築年だけでは基準適合を断定できません。',
        '地すべり防止区域・急傾斜地崩壊危険区域・土砂災害特別警戒区域内では、安全措置と建築主事等の検査済証が必要です。対象区域外ならこの追加要件はありません。証明書や不動産会社の資料で確認した内容を回答します。',
      ],
    }),
    moving({
      id: 'moving-previous',
      title: '持ち家からの引越し・家賃滞納の条件',
      keywords: ['持ち家', '売却', '処分', '離婚', 'DV', '家賃滞納'],
      fields: ['priorHousing'],
      paragraphs: [
        '転居前住宅に家賃の滞納がなく、原則として申請者・同居者の持ち家からの転居ではないことが必要です。',
        '持ち家でも申請時に売却・解体等で処分済み、または離婚・配偶者からの暴力等を理由とする別居の転居なら例外があります。事情の詳細をこのサイトへ入力する必要はありません。',
      ],
    }),
    moving({
      id: 'moving-contract',
      title: '契約名義・親族の住宅・社宅の条件',
      keywords: ['扶養義務者', '名義', '親族', '相続', '贈与', '会社', '社宅'],
      fields: ['housingContract', 'housingPlan'],
      paragraphs: [
        '転居前の契約者（社宅は入居者）と転居後の契約者は子の扶養義務者であること。転居後は個人名義で自ら居住する住宅が対象です。',
        '転居先が会社・法人契約の社宅、親族所有の賃貸、親族から相続・贈与・売買で取得した住宅は対象外です。',
      ],
    }),
    moving({
      id: 'moving-household',
      title: '生活保護・税滞納・他の助成との重複',
      keywords: [
        '市税',
        '延滞金',
        '生活保護',
        '二重',
        '併用',
        '住居確保',
        '暴力団',
      ],
      fields: [
        'publicAssistance',
        'duplicateMovingAid',
        'municipalTaxArrears',
        'antisocialTies',
      ],
      paragraphs: [
        '生活保護等を受給していないこと、同じ転居・同じ内容の他の補助金を受けていないこと、市税や延滞金に滞納がないこと、暴力団員等との関係がないことが必要です。',
        '別世帯の配偶者や世帯分離した同居者も確認対象です。配偶者が市外ならその居住地の市町村税の滞納も確認します。',
      ],
    }),
    moving({
      id: 'moving-history',
      title: '以前、住替え助成を受けた場合は？',
      keywords: ['過去', '受給歴', '再申請', '三世代', '結婚', '死別', '独立'],
      fields: ['priorMovingGrant'],
      paragraphs: [
        '本事業・三世代同居近居の住替え支援・旧子育て世帯住替え助成の受給歴がないことが原則です。',
        '結婚・再婚・離婚・死別・子の誕生や独立などで世帯人数が変化した転居等は、再申請できる場合があります。受給歴ありは一律に対象外とせず、変更内容の個別審査が必要と表示します。',
      ],
    }),
    moving({
      id: 'moving-benefit',
      title: '購入・家賃・引越し費用で条件はどう違う？',
      keywords: [
        'ローン',
        '5年',
        '公営',
        '公的',
        '賃貸',
        '購入',
        '領収書',
        '支払',
      ],
      fields: [
        'movingBenefit',
        'mortgageFiveYears',
        'rentalType',
        'movingPayment',
      ],
      paragraphs: [
        '住宅取得費助成には5年以上の住宅ローンが必要です。家賃助成は家賃を支払う民間賃貸住宅が対象です。この2つには指定校区の制限があります。',
        '引越し費用等助成は住宅ローンを問わず、購入住宅・民間賃貸・公営住宅を除く公的賃貸が対象です。校区制限はありません。申請時に支払済みの対象経費を使います。',
        '住宅取得費または家賃の助成と、引越し費用等助成は併用できます。希望する助成を切り替えてそれぞれ診断できます。',
      ],
    }),
    moving({
      id: 'moving-application',
      title: '妊娠中の申請・期限・必要書類',
      keywords: [
        '母子手帳',
        '妊娠',
        '受付',
        '申請',
        '1年',
        '必要書類',
        '予算',
        '近居',
      ],
      fields: ['maternityHandbook', 'moveWithinCity'],
      paragraphs: [
        '妊娠中の世帯は、転居日時点で母子手帳の交付を受けている必要があります。市内から市内へ、2026年4月1日以降の実際の転居が対象です。',
        '募集は2027年2月28日まで、かつ転居日から1年以内の書類到着が必要です。予算に達すると早期終了します。通常は転居後にオンライン・郵送・予約制の窓口で申請します。',
        '購入・賃貸の契約資料、転居日が確認できる資料、費用の支払資料などが必要です。フラット35地域連携型には転居前の認定申請があります。親との同居・1.2km以内の近居は別の三世代支援の要件で扱われます。',
      ],
    }),
    school({
      id: 'school-type',
      title: '就学援助はどの学校・世帯が対象？',
      keywords: [
        '学校種別',
        '市立',
        '国立',
        '県立',
        '私立',
        '生活保護',
        '保護者',
      ],
      fields: ['schoolType', 'publicAssistance', 'schoolStage'],
      paragraphs: [
        '福岡市立の小中学校へ通う子ども、または市内在住で国立・県立の小中学校へ通う子どもの世帯が対象です。私立学校はこの掲載制度の対象に含まれません。',
        '生活保護受給中は保護費から相当額が支給されるため、就学援助の申請は不要です。保護の廃止・停止や受給中の保護開始では教育支援課へ状況を伝えます。',
      ],
    }),
    school({
      id: 'school-basis',
      title: '就学援助の6つの申請要件と保護者双方の確認',
      keywords: [
        '所得',
        '非課税',
        '年金',
        '全額免除',
        '国保',
        '児童扶養手当',
        '日雇い',
        '貸付',
        '父母',
      ],
      fields: ['schoolAidBasis', 'parentsSameBasis'],
      paragraphs: [
        '①生活保護の廃止・停止後も困窮、②市県民税非課税または減免、③国民年金または国保保険料の全額減免（国民年金の育児期間免除を除く）、④職安登録の日雇い労働者または1か月以内の生活福祉資金貸付、⑤児童扶養手当受給、⑥市県民税の課税所得が基準以下、のいずれかです。',
        'ひとり親等を除き、父母の双方が同じ要件に該当している必要があります。児童手当と児童扶養手当は別制度です。該当根拠の書類を確認して選択してください。',
      ],
    }),
    school({
      id: 'school-income',
      title: '所得基準はいくら？年収との違い',
      keywords: ['課税所得', '年収', '源泉徴収', '1165000', '人数', '16歳'],
      fields: ['schoolIncomeWithin'],
      paragraphs: [
        '2026年6月以降の申請は、令和8年度の市県民税の課税所得金額を使います。給与の額面年収や所得税の金額ではありません。税額通知・課税証明書等で確認します。',
        '基準は対象の子ども1人1,165,000円、2人1,519,000円、3人1,982,000円、4人2,365,000円、5人2,895,000円、6人3,206,000円。人数に数えるのは2010年1月2日〜2026年1月1日生まれの子どもです。7人以上など表外の世帯は個別確認になります。',
        '保護者双方が同じ要件に該当することも必要です。下のツールは入力した保護者1人分の基準との比較に使います。世帯全体の認定額を計算するものではありません。',
      ],
    }),
    school({
      id: 'school-special',
      title: '収入が減った場合・申請方法と必要書類',
      keywords: [
        '退職',
        '転職',
        'リストラ',
        '疾病',
        '災害',
        '特別',
        '窓口',
        '申請',
        '必要書類',
      ],
      fields: ['incomeDrop'],
      paragraphs: [
        '通常の6要件に該当しなくても、退職・廃業・事故・疾病・災害等による収入減少なら令和8年中の収入で個別審査ができます。住宅購入等による支出増加だけでは該当しません。',
        '特別事情の審査は教育支援課（092-711-4693）へ事前相談し、窓口で申請します。学校・郵送・オンラインでは手続きできません。通常申請はオンライン等に対応し、2027年3月31日まで。8月以降は原則申請月から認定されます。',
        '申請は原則毎年度。令和8年1月に入学準備金の認定を受けた世帯は再申請不要です。要件を示す税・受給資料など、選んだ根拠に応じた書類を準備します。',
      ],
    }),
    {
      id: 'medical-details',
      programIds: ['child-medical'],
      title: '子ども医療費の対象・自己負担・他の助成との関係',
      keywords: [
        '健康保険',
        '医療証',
        '入院',
        '食事',
        'ひとり親',
        '障がい',
        '500円',
        '生活保護',
      ],
      fields: ['childHealthInsurance', 'medicalExclusions', 'publicAssistance'],
      sourceUrl: sources.medical,
      paragraphs: [
        '高校生世代までの健康保険加入者が対象で、保護者の所得制限はありません。生活保護受給中は対象外。ひとり親家庭等医療費助成や3歳以上の重度障がい者医療費助成が受けられる場合は、それらが優先します。',
        '3歳以上の保険診療の通院は医療機関ごとに月500円まで。3歳未満の通院、対象年齢の入院・薬局は保険診療分の自己負担がありません。食事・個室・健診など保険外の費用は助成外です。',
        '申請には子どもの保険資格がわかる資料と届出者の本人確認書類を用意します。医療証と保険資格の資料を受診時に提示します。県外受診等は一旦支払って払い戻しの手続きとなります。',
      ],
    },
    {
      id: 'allowance-details',
      programIds: ['child-allowance'],
      title: '児童手当の第3子の数え方・申請先・必要書類',
      keywords: [
        '3人目',
        '第三子',
        '大学生',
        '22歳',
        '公務員',
        '別居',
        '15日',
        '通帳',
        '所得制限',
      ],
      fields: ['childAgeEligible'],
      sourceUrl: sources.allowance,
      paragraphs: [
        '2024年10月以降は所得制限なし。3歳未満の第1・2子は月15,000円、3歳〜高校生年代の第1・2子は月10,000円、第3子以降は月30,000円です。',
        '経済的に養育している22歳になる年度末までの子から数え、支給は18歳になる年度末までの子が対象です。大学生年代の生活費等を負担して加算する場合は確認書を提出します。',
        '公務員は勤務先、それ以外は原則住まいの区の子育て支援課または電子申請。出生・転入等の翌日から15日以内に請求します。通常は生計維持の程度が高い保護者が請求者です。',
        '本人確認・マイナンバー確認資料、請求者本人の口座資料等を準備します。子との別居は別居監護申立書、離婚協議中の別居等は状況を示す申立書類など、個別の追加書類があります。',
      ],
    },
    {
      id: 'senior-details',
      programIds: ['senior-transport'],
      title: '高齢者乗車券の所得段階・福祉乗車券・交付額',
      keywords: [
        '70歳',
        '介護保険',
        '通知書',
        '福祉',
        '障害者手帳',
        '3000',
        '2000',
        '期限',
      ],
      fields: ['age70Plus', 'premiumStage', 'welfareTransport'],
      sourceUrl: sources.senior,
      paragraphs: [
        '福岡市在住・住民登録のある満70歳以上で、令和7年度の介護保険料所得段階1〜7が対象です。介護保険料徴収通知書で段階を確認します。70歳の誕生日前日から申請可能です。',
        '身体障害者手帳1〜3級、療育手帳A、精神障害者保健福祉手帳1級、戦傷病者手帳、被爆者健康手帳を持つ場合は福祉乗車券が対象となり、この高齢者乗車券からは除かれます。',
        '2026年7〜9月申請は段階1〜5が3,000円、6・7が2,000円相当です。掲載年度の助成期間は2026年9月30日まで。毎年度の申請が必要で、申請後の乗車券種類変更はできません。',
      ],
    },
  ] satisfies Entry[]
).map((entry) => ({ ...entry, verifiedOn: '2026-09-07' }));

const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/平方メートル|平米|㎡/g, 'm2');
export function searchGuidance(query: string, programId?: string) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return officialGuidance.filter(
    (entry) =>
      (!programId || entry.programIds.includes(programId)) &&
      terms.every((term) =>
        normalize(
          [entry.title, ...entry.keywords, ...entry.paragraphs].join(' '),
        ).includes(term),
      ),
  );
}

export function requiredHousingArea(ages: {
  tenPlus: number;
  under3: number;
  threeTo5: number;
  sixTo9: number;
  pregnant: number;
}) {
  const values = Object.values(ages);
  if (
    values.some(
      (value) => !Number.isSafeInteger(value) || value < 0 || value > 30,
    ) ||
    ages.pregnant > ages.tenPlus ||
    ages.tenPlus < 1
  )
    return undefined;
  const members = Math.max(
    2,
    ages.tenPlus +
      ages.pregnant +
      0.25 * ages.under3 +
      0.5 * ages.threeTo5 +
      0.75 * ages.sixTo9,
  );
  const hasYoung = ages.under3 + ages.threeTo5 + ages.sixTo9 > 0;
  if (!hasYoung && members === 6) return 66;
  return (
    Math.round((10 * members + 10) * (members > 4 ? 0.95 : 1) * 1000) / 1000
  );
}
export function schoolIncomeComparison(
  children: number,
  taxableIncome: number,
) {
  if (
    !Number.isInteger(children) ||
    children < 1 ||
    children > 6 ||
    !Number.isSafeInteger(taxableIncome) ||
    taxableIncome < 0
  )
    return undefined;
  const threshold = schoolIncomeThresholds[children - 1];
  return { threshold, within: taxableIncome <= threshold };
}

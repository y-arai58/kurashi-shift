'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  Flag,
  HeartPulse,
  Home,
  Info,
  MapPin,
  PencilLine,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type {
  AgeBand,
  Evaluation,
  Household,
  MatchStatus,
  Profile,
  Residence,
} from '@/lib/domain';
import { statusMeta } from '@/lib/domain';
import { evaluatePrograms } from '@/lib/evaluate';
import { supportPrograms } from '@/lib/programs';

type View = 'home' | 'profile' | 'results' | 'followup' | 'detail';

const residenceOptions: { value: Residence; label: string; note: string }[] = [
  { value: 'fukuoka', label: '福岡市', note: '現在の対象地域' },
  { value: 'other', label: '福岡市以外', note: '対象地域は順次拡大予定' },
];

const ageOptions: { value: AgeBand; label: string }[] = [
  { value: 'under18', label: '18歳未満' },
  { value: '18-29', label: '18〜29歳' },
  { value: '30-39', label: '30〜39歳' },
  { value: '40-64', label: '40〜64歳' },
  { value: '65plus', label: '65歳以上' },
];

const householdOptions: { value: Household; label: string }[] = [
  { value: 'single', label: 'ひとり暮らし' },
  { value: 'couple', label: '夫婦・パートナー' },
  { value: 'with-children', label: '18歳以下の子どもがいる' },
  { value: 'single-parent', label: 'ひとり親世帯' },
];

const statusStyles: Record<MatchStatus, string> = {
  eligible: 'bg-[#171717] text-white',
  'needs-info': 'bg-[#d9eff8] text-[#17465a]',
  future: 'bg-[#f0f0ed] text-[#666d70]',
};

function Logo({ onHome }: { onHome: () => void }) {
  return (
    <button
      className="flex items-center gap-3 text-left"
      onClick={onHome}
      aria-label="ホームへ戻る"
    >
      <span className="grid size-11 place-items-center border-l-2 border-black text-primary">
        <Flag className="size-8 stroke-[1.7]" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-base font-black tracking-[-0.04em] sm:text-lg">
          くらしシフト
        </span>
        <span className="block text-[9px] font-semibold tracking-[.13em] text-muted-foreground">
          KURASHI SUPPORT NAVIGATOR
        </span>
      </span>
    </button>
  );
}

function Choice<T extends string>({
  value,
  current,
  label,
  note,
}: {
  value: T;
  current?: T;
  label: string;
  note?: string;
}) {
  const selected = value === current;
  return (
    <label
      className={`flex min-h-16 cursor-pointer items-center gap-3 border px-4 py-3 transition ${selected ? 'border-primary bg-secondary' : 'border-[#dfe7e9] bg-white hover:border-primary'}`}
    >
      <RadioGroupItem value={value} className="size-5" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{label}</span>
        {note && (
          <span className="mt-0.5 block text-sm font-medium text-muted-foreground">
            {note}
          </span>
        )}
      </span>
      {selected && <Check className="size-5 text-primary" aria-hidden="true" />}
    </label>
  );
}

function Shell({
  view,
  onHome,
  onBack,
  children,
}: {
  view: View;
  onHome: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const steps: View[] = ['profile', 'results', 'followup', 'detail'];
  const stepIndex = Math.max(0, steps.indexOf(view));
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-primary/60 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[84px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo onHome={onHome} />
          <div
            className="hidden items-center gap-3 md:flex"
            aria-label="診断の進み具合"
          >
            {steps.map((step, index) => (
              <span
                key={step}
                className={`text-xs font-bold ${index <= stepIndex ? 'text-black' : 'text-[#a2aaad]'}`}
              >
                0{index + 1}
              </span>
            ))}
          </div>
          <div className="text-right">
            <span className="block text-xs font-black">福岡市</span>
            <span className="block text-[10px] font-medium text-muted-foreground">
              情報確認 2026.09.07
            </span>
          </div>
        </div>
      </header>
      {onBack && (
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8">
          <Button
            variant="ghost"
            className="h-10 gap-2 px-0 text-sm font-bold text-muted-foreground hover:bg-transparent hover:text-black"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" /> 戻る
          </Button>
        </div>
      )}
      {children}
    </main>
  );
}

function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <header className="mx-auto flex h-[92px] w-full max-w-6xl items-center justify-between border-b border-primary px-5 sm:px-8">
        <Logo onHome={() => undefined} />
        <div className="text-right">
          <p className="text-xs font-black">FUKUOKA CITY</p>
          <p className="text-[10px] text-muted-foreground">
            公式情報 5制度掲載
          </p>
        </div>
      </header>
      <section className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-6xl gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-20">
        <div>
          <p className="mb-6 flex items-center gap-2 text-sm font-black text-primary">
            <MapPin className="size-4" /> 福岡市で使える支援を診断
          </p>
          <h1 className="text-balance text-[clamp(3rem,7vw,5.6rem)] font-black leading-[1.03] tracking-[-0.065em]">
            あなたの暮らしに、
            <br />
            <span className="text-primary">使える制度</span>を。
          </h1>
          <div className="mt-7 h-[3px] w-full bg-primary" />
          <p className="mt-7 max-w-xl text-lg font-semibold leading-8 sm:text-xl">
            制度名から探すのではなく、あなたの条件と福岡市の制度を照らし合わせて、関係のある支援だけを案内します。
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button
              onClick={onStart}
              className="group h-14 gap-3 rounded-none bg-black px-7 text-base font-bold text-white hover:bg-primary"
            >
              診断をはじめる{' '}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ShieldCheck className="size-5 text-primary" />{' '}
              登録不要・入力は保存しません
            </span>
          </div>
        </div>

        <div className="soft-grid border border-border p-4 sm:p-7">
          <div className="bg-white p-5 sm:p-7">
            <div className="flex items-end justify-between border-b-2 border-primary pb-4">
              <div>
                <p className="text-xs font-bold tracking-[.12em] text-muted-foreground">
                  MATCHING PREVIEW
                </p>
                <p className="mt-1 text-2xl font-black">あなたに関係する支援</p>
              </div>
              <p className="text-5xl font-black text-primary">
                4<span className="text-sm text-black">件</span>
              </p>
            </div>
            <div className="py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black">
                    子どもの通院・入院費を軽減
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    福岡市 子ども医療費助成制度
                  </p>
                </div>
                <span className="shrink-0 bg-black px-3 py-1.5 text-xs font-bold text-white">
                  可能性 高い
                </span>
              </div>
              <p className="mt-5 border-l-4 border-primary pl-4 text-base font-black">
                通院は月500円まで
                <br />
                入院・薬局は自己負担なし
              </p>
              <div className="mt-5 grid gap-2 text-sm font-semibold sm:grid-cols-2">
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />{' '}
                  福岡市に住んでいる
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />{' '}
                  18歳以下の子どもがいる
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-border pt-4 text-center">
              {[
                ['1', '可能性 高い'],
                ['3', '要確認'],
                ['0', '対象外'],
              ].map(([count, label]) => (
                <div
                  className="border-r border-border last:border-r-0"
                  key={label}
                >
                  <p className="text-xl font-black">{count}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileView({
  profile,
  setProfile,
  onComplete,
  onBack,
  onHome,
}: {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onComplete: () => void;
  onBack: () => void;
  onHome: () => void;
}) {
  const complete = Boolean(
    profile.residence && profile.ageBand && profile.household,
  );
  return (
    <Shell view="profile" onHome={onHome} onBack={onBack}>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-20 pt-5 sm:px-8 lg:grid-cols-[1fr_290px]">
        <div>
          <p className="text-sm font-black text-primary">01 / BASIC PROFILE</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
            まず、3つだけ
            <br className="hidden sm:block" />
            教えてください
          </h1>
          <div className="mt-6 h-[3px] w-full bg-primary" />
          <p className="mt-5 max-w-2xl font-medium leading-7 text-muted-foreground">
            詳しい所得や住まいの状況は、結果を見たあとに必要な分だけ確認します。
          </p>
          <div className="mt-10 space-y-10">
            <fieldset>
              <legend className="mb-4 text-lg font-black">
                <span className="mr-3 text-primary">1.</span>お住まい
              </legend>
              <RadioGroup
                value={profile.residence ?? ''}
                onValueChange={(value) =>
                  setProfile({ ...profile, residence: value as Residence })
                }
                className="grid gap-3 sm:grid-cols-2"
              >
                {residenceOptions.map((option) => (
                  <Choice
                    key={option.value}
                    {...option}
                    current={profile.residence}
                  />
                ))}
              </RadioGroup>
            </fieldset>
            <fieldset>
              <legend className="mb-4 text-lg font-black">
                <span className="mr-3 text-primary">2.</span>あなたの年齢
              </legend>
              <RadioGroup
                value={profile.ageBand ?? ''}
                onValueChange={(value) =>
                  setProfile({ ...profile, ageBand: value as AgeBand })
                }
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {ageOptions.map((option) => (
                  <Choice
                    key={option.value}
                    {...option}
                    current={profile.ageBand}
                  />
                ))}
              </RadioGroup>
            </fieldset>
            <fieldset>
              <legend className="mb-4 text-lg font-black">
                <span className="mr-3 text-primary">3.</span>世帯について
              </legend>
              <RadioGroup
                value={profile.household ?? ''}
                onValueChange={(value) =>
                  setProfile({ ...profile, household: value as Household })
                }
                className="grid gap-3 sm:grid-cols-2"
              >
                {householdOptions.map((option) => (
                  <Choice
                    key={option.value}
                    {...option}
                    current={profile.household}
                  />
                ))}
              </RadioGroup>
            </fieldset>
          </div>
          <Button
            disabled={!complete}
            onClick={onComplete}
            className="mt-10 h-14 w-full gap-3 rounded-none bg-black px-7 text-base font-bold text-white hover:bg-primary sm:w-auto"
          >
            この条件で結果を見る <ArrowRight className="size-5" />
          </Button>
        </div>
        <aside className="h-fit border-t-[3px] border-primary bg-secondary p-6 lg:sticky lg:top-28">
          <ShieldCheck className="size-7 text-primary" />
          <h2 className="mt-4 text-lg font-black">
            個人を特定する情報は聞きません
          </h2>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-muted-foreground">
            <li>氏名や連絡先</li>
            <li>正確な年収や資産額</li>
            <li>マイナンバーなど</li>
          </ul>
          <p className="mt-5 border-t border-primary/30 pt-4 text-xs leading-5 text-muted-foreground">
            診断は福岡市の公式公開情報を簡略化したものです。
          </p>
        </aside>
      </section>
    </Shell>
  );
}

function ResultCard({
  result,
  onOpen,
}: {
  result: Evaluation;
  onOpen: () => void;
}) {
  return (
    <article className="border border-[#dfe7e9] border-t-[3px] border-t-primary bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(54,121,150,.12)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[.08em] text-primary">
            {result.program.category}
          </p>
          <h3 className="mt-2 text-xl font-black tracking-[-0.035em] sm:text-2xl">
            {result.program.benefitLabel}
          </h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {result.program.officialName}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 text-xs font-black ${statusStyles[result.status]}`}
        >
          {statusMeta[result.status].shortLabel}
        </span>
      </div>
      <p className="mt-6 border-l-4 border-primary pl-4 text-base font-black leading-7">
        {result.program.amount}
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {result.matched.slice(0, 2).map((criterion) => (
          <p
            className="flex items-start gap-2 text-sm font-bold"
            key={criterion.key}
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
            {criterion.label}
          </p>
        ))}
        {result.unknown.slice(0, 2).map((criterion) => (
          <p
            className="flex items-start gap-2 text-sm font-bold text-[#31596b]"
            key={criterion.key}
          >
            <CircleHelp className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
            {criterion.label}
          </p>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs font-bold text-muted-foreground">
          {result.program.applicationStatus}
        </span>
        <button
          onClick={onOpen}
          className="inline-flex min-h-10 items-center gap-1 text-sm font-black hover:text-primary"
        >
          制度を詳しく見る <ChevronRight className="size-4" />
        </button>
      </div>
    </article>
  );
}

function ResultsView({
  results,
  onEdit,
  onFollowup,
  onOpen,
  onHome,
}: {
  results: Evaluation[];
  onEdit: () => void;
  onFollowup: () => void;
  onOpen: (id: string) => void;
  onHome: () => void;
}) {
  const counts = (['eligible', 'needs-info', 'future'] as MatchStatus[]).map(
    (status) => results.filter((result) => result.status === status).length,
  );
  const needsFollowup = results.some(
    (result) => result.status === 'needs-info',
  );
  return (
    <Shell view="results" onHome={onHome} onBack={onEdit}>
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-4 sm:px-8">
        <div className="grid gap-8 border-b-[3px] border-primary pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-black text-primary">02 / YOUR RESULTS</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
              あなたに関係がありそうな
              <br className="hidden sm:block" />
              支援は {results.length}件です
            </h1>
            <button
              onClick={onEdit}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-black"
            >
              <PencilLine className="size-4" /> 基本条件を変更
            </button>
          </div>
          <div className="grid grid-cols-3 border border-border bg-secondary py-5">
            {[
              ['可能性 高い', counts[0]],
              ['要確認', counts[1]],
              ['対象外', counts[2]],
            ].map(([label, count]) => (
              <div
                className="border-r border-primary/30 px-2 text-center last:border-r-0"
                key={String(label)}
              >
                <p className="text-3xl font-black">{count}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {needsFollowup && (
          <div className="mt-8 flex flex-col justify-between gap-5 border-l-4 border-primary bg-secondary p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-black text-primary">
                <Sparkles className="size-4" /> MORE ACCURATE
              </p>
              <h2 className="mt-1 text-xl font-black">
                必要な追加質問に答えると、判定を絞れます
              </h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                今の回答に関係する項目だけ表示します。
              </p>
            </div>
            <Button
              onClick={onFollowup}
              className="h-12 shrink-0 gap-2 rounded-none bg-black px-5 font-bold text-white hover:bg-primary"
            >
              判定精度を上げる <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {results.length > 0 ? (
          <div className="mt-12 grid gap-9 lg:grid-cols-[230px_1fr]">
            <aside>
              <p className="text-sm font-black text-primary">
                制度を探す必要はありません
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                あなたの条件との
                <br />
                一致点から表示。
              </h2>
              <p className="mt-5 text-sm font-medium leading-7 text-muted-foreground">
                該当度の高い順です。支援内容の性質が違うため、金額は合算していません。
              </p>
              <p className="mt-6 border-t border-border pt-4 text-xs font-semibold leading-5 text-muted-foreground">
                掲載情報は2026年9月7日に福岡市公式サイトで確認しています。
              </p>
            </aside>
            <div className="space-y-5">
              {results.map((result) => (
                <ResultCard
                  key={result.program.id}
                  result={result}
                  onOpen={() => onOpen(result.program.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-2xl border-t-[3px] border-primary bg-secondary p-8 text-center">
            <CircleHelp className="mx-auto size-9 text-primary" />
            <h2 className="mt-4 text-2xl font-black">
              現在の掲載制度では候補が見つかりませんでした
            </h2>
            <p className="mt-3 font-medium leading-7 text-muted-foreground">
              これは支援制度がないという意味ではありません。現在は福岡市の5制度から診断しています。対象制度を順次追加します。
            </p>
            <Button
              onClick={onEdit}
              variant="outline"
              className="mt-6 h-11 rounded-none border-black px-5 font-bold"
            >
              条件を見直す
            </Button>
          </div>
        )}

        <div className="mt-14 flex flex-col gap-4 border-t border-dashed border-primary py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[.1em] text-primary">
              NEXT / LIFE CHANGE
            </p>
            <h2 className="mt-2 text-xl font-black">
              もし暮らしが変わったら？
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              次の段階では、引越しや家族の変化による支援の差分を比べられます。
            </p>
          </div>
          <span className="self-start border border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground">
            次期アップデート
          </span>
        </div>
      </section>
    </Shell>
  );
}

const options = {
  yesNo: [
    ['yes', 'はい'],
    ['no', 'いいえ'],
    ['unknown', 'わからない・答えない'],
  ],
  school: [
    ['elementary-middle', '小学生・中学生がいる'],
    ['other', 'それ以外'],
    ['unknown', 'わからない'],
  ],
  aid: [
    ['likely', '非課税・児童扶養手当受給などに該当'],
    ['unlikely', '該当しないと思う'],
    ['unknown', '基準を確認したい'],
  ],
  housing: [
    ['renting', '賃貸へ住み替え'],
    ['buying', '住宅を購入'],
    ['none', '住み替え予定なし'],
    ['unknown', 'まだわからない'],
  ],
  premium: [
    ['1-7', '所得段階1〜7'],
    ['8plus', '所得段階8以上'],
    ['unknown', 'わからない'],
  ],
} as const;

function QuestionCard({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: number;
  icon: typeof Home;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border border-[#dfe7e9] border-t-[3px] border-t-primary bg-white p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-black text-primary">QUESTION 0{number}</p>
          <h2 className="text-lg font-black">{title}</h2>
        </div>
      </div>
      {children}
    </fieldset>
  );
}

function FollowupView({
  profile,
  setProfile,
  onComplete,
  onBack,
  onHome,
}: {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onComplete: () => void;
  onBack: () => void;
  onHome: () => void;
}) {
  const isChildHousehold = ['with-children', 'single-parent'].includes(
    profile.household ?? '',
  );
  const isSenior = profile.ageBand === '65plus';
  let number = 0;
  return (
    <Shell view="followup" onHome={onHome} onBack={onBack}>
      <section className="mx-auto w-full max-w-4xl px-5 pb-24 pt-5 sm:px-8">
        <p className="text-sm font-black text-primary">03 / MORE DETAIL</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
          あなたに必要なことだけ
          <br />
          確認します
        </h1>
        <div className="mt-6 h-[3px] bg-primary" />
        <p className="mt-5 font-medium leading-7 text-muted-foreground">
          答えに迷う項目は「わからない」を選べます。最終的な対象可否は公式窓口で確認してください。
        </p>
        <div className="mt-9 space-y-5">
          {isChildHousehold && (
            <>
              <QuestionCard
                number={++number}
                icon={HeartPulse}
                title="子どもは健康保険に加入していますか"
              >
                <RadioGroup
                  value={profile.childHealthInsurance ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      childHealthInsurance:
                        value as Profile['childHealthInsurance'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {options.yesNo.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.childHealthInsurance ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
              <QuestionCard
                number={++number}
                icon={BookOpen}
                title="小学生または中学生の子どもはいますか"
              >
                <RadioGroup
                  value={profile.schoolStage ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      schoolStage: value as Profile['schoolStage'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {options.school.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.schoolStage ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
              <QuestionCard
                number={++number}
                icon={FileCheck2}
                title="就学援助の所得・受給要件について"
              >
                <RadioGroup
                  value={profile.schoolAidEligibility ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      schoolAidEligibility:
                        value as Profile['schoolAidEligibility'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {options.aid.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.schoolAidEligibility ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
              <QuestionCard
                number={++number}
                icon={MapPin}
                title="2026年4月1日以降に福岡市内で転居しますか"
              >
                <RadioGroup
                  value={profile.moveWithinCity ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      moveWithinCity: value as Profile['moveWithinCity'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {options.yesNo.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.moveWithinCity ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
              <QuestionCard number={++number} icon={Home} title="住まいの予定">
                <RadioGroup
                  value={profile.housingPlan ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      housingPlan: value as Profile['housingPlan'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {options.housing.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.housingPlan ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
            </>
          )}
          {isSenior && (
            <>
              <QuestionCard
                number={++number}
                icon={Users}
                title="満70歳以上ですか"
              >
                <RadioGroup
                  value={profile.age70Plus ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      age70Plus: value as Profile['age70Plus'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {options.yesNo.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.age70Plus ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
              <QuestionCard
                number={++number}
                icon={TrainFront}
                title="介護保険料所得段階区分"
              >
                <RadioGroup
                  value={profile.premiumStage ?? 'unknown'}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      premiumStage: value as Profile['premiumStage'],
                    })
                  }
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {options.premium.map(([value, label]) => (
                    <Choice
                      key={value}
                      value={value}
                      label={label}
                      current={profile.premiumStage ?? 'unknown'}
                    />
                  ))}
                </RadioGroup>
              </QuestionCard>
            </>
          )}
        </div>
        <Button
          onClick={onComplete}
          className="mt-8 h-14 w-full gap-2 rounded-none bg-black text-base font-bold text-white hover:bg-primary"
        >
          結果を更新する <Sparkles className="size-5" />
        </Button>
      </section>
    </Shell>
  );
}

function MatchRow({
  kind,
  label,
}: {
  kind: 'match' | 'unknown' | 'unmatched';
  label: string;
}) {
  const config =
    kind === 'match'
      ? {
          icon: CheckCircle2,
          text: '条件に一致',
          style: 'border-primary bg-secondary',
        }
      : kind === 'unknown'
        ? {
            icon: CircleHelp,
            text: '確認が必要',
            style: 'border-[#b7cbd3] bg-white',
          }
        : {
            icon: ArrowRight,
            text: '現在は対象外',
            style: 'border-[#ddd] bg-[#f5f5f3]',
          };
  const Icon = config.icon;
  return (
    <div className={`border-l-4 p-4 ${config.style}`}>
      <p className="flex items-center gap-2 text-xs font-black text-muted-foreground">
        <Icon className="size-4 text-primary" /> {config.text}
      </p>
      <p className="mt-2 text-sm font-bold">{label}</p>
    </div>
  );
}

function DetailView({
  result,
  onBack,
  onHome,
}: {
  result: Evaluation;
  onBack: () => void;
  onHome: () => void;
}) {
  return (
    <Shell view="detail" onHome={onHome} onBack={onBack}>
      <article className="mx-auto w-full max-w-5xl px-5 pb-24 pt-4 sm:px-8">
        <header className="border-b-[3px] border-primary pb-8">
          <p className="text-sm font-black text-primary">04 / PROGRAM DETAIL</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                {result.program.benefitLabel}
              </h1>
              <p className="mt-3 font-semibold text-muted-foreground">
                {result.program.officialName}
              </p>
            </div>
            <span
              className={`px-4 py-2 text-sm font-black ${statusStyles[result.status]}`}
            >
              {statusMeta[result.status].label}
            </span>
          </div>
        </header>
        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_290px]">
          <div>
            <section>
              <p className="text-xs font-black tracking-[.12em] text-primary">
                YOUR CONDITIONS
              </p>
              <h2 className="mt-2 text-2xl font-black">あなたの条件との照合</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {result.matched.map((item) => (
                  <MatchRow key={item.key} kind="match" label={item.label} />
                ))}
                {result.unknown.map((item) => (
                  <MatchRow key={item.key} kind="unknown" label={item.label} />
                ))}
                {result.unmatched.map((item) => (
                  <MatchRow
                    key={item.key}
                    kind="unmatched"
                    label={item.label}
                  />
                ))}
              </div>
            </section>
            <section className="mt-10 border-t border-border pt-8">
              <p className="text-xs font-black tracking-[.12em] text-primary">
                BENEFIT
              </p>
              <h2 className="mt-2 text-2xl font-black">制度の要点</h2>
              <p className="mt-5 border-l-4 border-primary pl-5 text-xl font-black leading-8">
                {result.program.amount}
              </p>
              <p className="mt-6 font-medium leading-8">
                {result.program.summary}
              </p>
              <ul className="mt-5 space-y-3">
                {result.program.points.map((point) => (
                  <li
                    className="flex gap-3 text-sm font-semibold leading-6"
                    key={point}
                  >
                    <Check className="mt-1 size-4 shrink-0 text-primary" />{' '}
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="h-fit border-t-[3px] border-primary bg-secondary p-6 lg:sticky lg:top-28">
            <Info className="size-6 text-primary" />
            <h2 className="mt-3 text-lg font-black">公式情報で最終確認</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
              診断では主な条件を簡略化しています。申請前に必ず福岡市の公式ページで全要件を確認してください。
            </p>
            <dl className="mt-5 space-y-4 border-t border-primary/30 pt-5 text-sm">
              <div>
                <dt className="text-xs font-bold text-muted-foreground">
                  受付状況
                </dt>
                <dd className="mt-1 font-black">
                  {result.program.applicationStatus}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground">
                  公式ページ更新日
                </dt>
                <dd className="mt-1 font-black">
                  {result.program.sourceUpdatedAt}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground">
                  くらしシフト確認日
                </dt>
                <dd className="mt-1 font-black">
                  {result.program.lastVerified}
                </dd>
              </div>
            </dl>
            <a
              href={result.program.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-black px-4 text-sm font-bold text-white hover:bg-primary"
            >
              福岡市公式ページへ <ExternalLink className="size-4" />
            </a>
          </aside>
        </div>
      </article>
    </Shell>
  );
}

export function KurashiShiftApp() {
  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<Profile>({});
  const [selectedId, setSelectedId] = useState('child-medical');
  const results = useMemo(
    () => evaluatePrograms(supportPrograms, profile),
    [profile],
  );
  const selectedResult =
    results.find((result) => result.program.id === selectedId) ?? results[0];
  const go = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const home = () => go('home');

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const allowedResidence = ['fukuoka', 'other'];
    const allowedAges = ['under18', '18-29', '30-39', '40-64', '65plus'];
    const allowedHouseholds = [
      'single',
      'couple',
      'with-children',
      'single-parent',
    ];
    void Promise.resolve(
      context.registerTool(
        {
          name: 'set_basic_profile',
          title: '基本プロフィールで診断する',
          description:
            '居住地・年齢層・世帯構成を設定し、福岡市の公式制度との診断結果を表示します。',
          inputSchema: {
            type: 'object',
            properties: {
              residence: { type: 'string', enum: allowedResidence },
              ageBand: { type: 'string', enum: allowedAges },
              household: { type: 'string', enum: allowedHouseholds },
            },
            required: ['residence', 'ageBand', 'household'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const value = input as Record<string, unknown>;
            if (
              !allowedResidence.includes(String(value.residence)) ||
              !allowedAges.includes(String(value.ageBand)) ||
              !allowedHouseholds.includes(String(value.household))
            )
              throw new Error(
                '居住地・年齢層・世帯構成の値を確認してください。',
              );
            const next = {
              residence: value.residence as Residence,
              ageBand: value.ageBand as AgeBand,
              household: value.household as Household,
            };
            setProfile(next);
            setView('results');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const matched = evaluatePrograms(supportPrograms, next);
            return {
              displayed: true,
              supportCount: matched.length,
              needsMoreInformation: matched.some(
                (item) => item.status === 'needs-info',
              ),
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  if (view === 'home') return <HomeView onStart={() => go('profile')} />;
  if (view === 'profile')
    return (
      <ProfileView
        profile={profile}
        setProfile={setProfile}
        onComplete={() => go('results')}
        onBack={home}
        onHome={home}
      />
    );
  if (view === 'results')
    return (
      <ResultsView
        results={results}
        onEdit={() => go('profile')}
        onFollowup={() => go('followup')}
        onOpen={(id) => {
          setSelectedId(id);
          go('detail');
        }}
        onHome={home}
      />
    );
  if (view === 'followup')
    return (
      <FollowupView
        profile={profile}
        setProfile={setProfile}
        onComplete={() => go('results')}
        onBack={() => go('results')}
        onHome={home}
      />
    );
  if (selectedResult)
    return (
      <DetailView
        result={selectedResult}
        onBack={() => go('results')}
        onHome={home}
      />
    );
  return (
    <ResultsView
      results={results}
      onEdit={() => go('profile')}
      onFollowup={() => go('followup')}
      onOpen={(id) => {
        setSelectedId(id);
        go('detail');
      }}
      onHome={home}
    />
  );
}

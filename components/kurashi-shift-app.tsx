'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  HeartPulse,
  Home,
  Info,
  MapPin,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { evaluatePrograms } from '@/lib/evaluate';
import { supportPrograms } from '@/lib/programs';
import type {
  AgeBand,
  Evaluation,
  Household,
  MatchStatus,
  Profile,
  Residence,
} from '@/lib/domain';
import { statusMeta } from '@/lib/domain';

type View = 'home' | 'profile' | 'results' | 'followup' | 'detail';

const residenceOptions: { value: Residence; label: string; note: string }[] = [
  { value: 'fukuoka', label: '福岡市', note: '現在のMVP対象地域' },
  { value: 'other', label: '福岡市以外', note: '対象地域は順次拡大予定' },
];

const ageOptions: { value: AgeBand; label: string }[] = [
  { value: 'under18', label: '18歳未満' },
  { value: '18-29', label: '18〜29歳' },
  { value: '30-39', label: '30〜39歳' },
  { value: '40-64', label: '40〜64歳' },
  { value: '65plus', label: '65歳以上' },
];

const householdOptions: {
  value: Household;
  label: string;
  icon: typeof Users;
}[] = [
  { value: 'single', label: 'ひとり暮らし', icon: Users },
  { value: 'couple', label: '夫婦・パートナー', icon: Users },
  { value: 'with-children', label: '子どもがいる', icon: Home },
  { value: 'single-parent', label: 'ひとり親世帯', icon: HeartPulse },
];

const statusStyles: Record<MatchStatus, string> = {
  eligible: 'bg-[#0c5972] text-white',
  'needs-info': 'bg-[#fff0b8] text-[#6a4d00]',
  future: 'bg-[#edf1f3] text-[#526875]',
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <button
      className="flex items-center gap-2.5 text-left font-black tracking-[-0.04em]"
      onClick={() => window.location.reload()}
      aria-label="ホームへ戻る"
    >
      <span
        className={`${compact ? 'size-8 rounded-lg' : 'size-9 rounded-xl'} grid place-items-center bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(15,42,67,.18)]`}
      >
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <span>くらしシフト</span>
    </button>
  );
}

function Choice<T extends string>({
  value,
  current,
  label,
  note,
  onSelect: _onSelect,
}: {
  value: T;
  current?: T;
  label: string;
  note?: string;
  onSelect: (value: T) => void;
}) {
  const selected = value === current;
  return (
    <label
      className={`group flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition ${selected ? 'border-primary bg-secondary shadow-[0_7px_20px_rgba(12,89,114,.08)]' : 'border-border bg-white hover:border-[#9ab7bd]'}`}
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
      {selected && (
        <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
      )}
    </label>
  );
}

function Shell({
  view,
  onBack,
  children,
}: {
  view: View;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const steps: View[] = ['profile', 'results', 'followup', 'detail'];
  const stepIndex = Math.max(0, steps.indexOf(view));
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Logo compact />
          <div
            className="hidden items-center gap-2 sm:flex"
            aria-label="診断の進み具合"
          >
            {steps.map((step, index) => (
              <span
                key={step}
                className={`h-1.5 rounded-full transition-all ${index <= stepIndex ? 'w-8 bg-primary' : 'w-4 bg-[#cbd7d7]'}`}
              />
            ))}
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm">
            福岡市・MVP版
          </span>
        </div>
      </header>
      {onBack && (
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 sm:px-8">
          <Button
            variant="ghost"
            className="h-10 gap-2 px-2 text-sm font-bold text-muted-foreground"
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
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground">
          福岡市・MVP版
        </span>
      </header>
      <section className="relative mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-6xl content-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
            <MapPin className="size-4" /> 暮らしに合う支援を、あなたの条件から
          </p>
          <h1 className="text-balance text-[clamp(2.8rem,7vw,5.8rem)] font-black leading-[.98] tracking-[-0.07em]">
            探す前に、
            <br />
            <span className="text-primary">見つかる。</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-muted-foreground sm:text-xl">
            いくつかの質問に答えるだけで、今のあなたに関係がありそうな公的支援と、その理由がわかります。
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button
              onClick={onStart}
              className="group h-14 gap-3 rounded-2xl px-6 text-base font-bold shadow-[0_14px_34px_rgba(12,65,86,.22)] hover:-translate-y-0.5"
            >
              3分で診断をはじめる{' '}
              <ArrowRight className="size-5 transition group-hover:translate-x-1" />
            </Button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ShieldCheck className="size-5 text-primary" />{' '}
              登録不要・結果は端末内だけ
            </span>
          </div>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-3 border-t border-border pt-5 text-sm font-bold text-muted-foreground">
            <span>① 基本条件</span>
            <span>② 結果を確認</span>
            <span>③ 精度を上げる</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[470px] lg:mr-0">
          <div className="absolute -inset-8 -z-10 rounded-[4rem] bg-[radial-gradient(circle_at_center,rgba(43,186,172,.22),transparent_68%)] blur-2xl" />
          <div className="rotate-[-1.5deg] rounded-[2rem] border border-white/70 bg-white p-5 shadow-[0_30px_90px_rgba(15,42,67,.14)] sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
                  あなたの場合
                </p>
                <p className="mt-1 text-xl font-black tracking-tight">
                  使えそうな支援
                </p>
              </div>
              <div className="flex size-16 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <span className="text-2xl font-black">8</span>
                <span className="text-[10px] font-bold">件</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-secondary p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black">子どもの医療費を軽減</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    福岡市 子ども医療費助成制度
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
                  可能性 高い
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm font-semibold">
                <p className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> 福岡市に住んでいる
                </p>
                <p className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />{' '}
                  対象年齢の子どもがいる
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['3件', 'いま使えそう'],
                ['2件', '条件を確認'],
                ['3件', '今後の候補'],
              ].map(([count, label]) => (
                <div
                  className="rounded-xl border border-border px-2 py-3"
                  key={label}
                >
                  <p className="font-black">{count}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
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
}: {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const complete = Boolean(
    profile.residence && profile.ageBand && profile.household,
  );
  return (
    <Shell view="profile" onBack={onBack}>
      <section className="mx-auto grid w-full max-w-5xl gap-8 px-5 pb-20 pt-5 sm:px-8 lg:grid-cols-[1fr_280px]">
        <div className="rounded-[2rem] border border-border bg-white p-5 shadow-[0_20px_60px_rgba(15,42,67,.08)] sm:p-8">
          <p className="text-sm font-black text-primary">基本プロフィール</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
            まず、3つだけ教えてください
          </h1>
          <p className="mt-3 font-medium leading-7 text-muted-foreground">
            所得や仕事の状況はまだ聞きません。最初の候補を見てから、必要な分だけ確認します。
          </p>
          <div className="mt-9 space-y-9">
            <fieldset>
              <legend className="mb-3 text-lg font-black">1. お住まい</legend>
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
                    onSelect={() =>
                      setProfile({ ...profile, residence: option.value })
                    }
                  />
                ))}
              </RadioGroup>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-lg font-black">
                2. あなたの年齢
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
                    onSelect={() =>
                      setProfile({ ...profile, ageBand: option.value })
                    }
                  />
                ))}
              </RadioGroup>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-lg font-black">
                3. 世帯について
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
                    value={option.value}
                    label={option.label}
                    current={profile.household}
                    onSelect={() =>
                      setProfile({ ...profile, household: option.value })
                    }
                  />
                ))}
              </RadioGroup>
            </fieldset>
          </div>
          <Button
            disabled={!complete}
            onClick={onComplete}
            className="mt-10 h-14 w-full gap-3 rounded-2xl text-base font-bold sm:w-auto sm:px-7"
          >
            この条件で結果を見る <ArrowRight className="size-5" />
          </Button>
        </div>
        <aside className="h-fit rounded-2xl bg-[#123744] p-6 text-white lg:sticky lg:top-24">
          <ShieldCheck className="size-7 text-[#d7f36a]" />
          <h2 className="mt-4 text-lg font-black">まだ入力しないこと</h2>
          <ul className="mt-3 space-y-3 text-sm font-semibold leading-6 text-white/75">
            <li>氏名や連絡先</li>
            <li>正確な年収や資産額</li>
            <li>マイナンバーなどの個人情報</li>
          </ul>
          <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-white/60">
            入力内容はこの端末内の診断だけに使われます。
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
  const meta = statusMeta[result.status];
  return (
    <article className="group rounded-[1.6rem] border border-border bg-white p-5 shadow-[0_9px_28px_rgba(15,42,67,.055)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_34px_rgba(15,42,67,.09)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-black text-primary">
            {result.program.category}
          </span>
          <h3 className="mt-1 text-xl font-black tracking-[-0.035em]">
            {result.program.benefitLabel}
          </h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {result.program.officialName}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-black ${statusStyles[result.status]}`}
        >
          {meta.shortLabel}
        </span>
      </div>
      <p className="mt-5 rounded-xl bg-secondary px-4 py-3 text-sm font-black text-secondary-foreground">
        {result.program.amount}
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {result.matched.slice(0, 2).map((criterion) => (
          <p
            className="flex items-start gap-2 text-sm font-bold"
            key={criterion.key}
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#138477]" />{' '}
            {criterion.label}
          </p>
        ))}
        {result.unknown.slice(0, 2).map((criterion) => (
          <p
            className="flex items-start gap-2 text-sm font-bold text-[#70550a]"
            key={criterion.key}
          >
            <CircleHelp className="mt-0.5 size-4 shrink-0" /> {criterion.label}
          </p>
        ))}
      </div>
      <button
        onClick={onOpen}
        className="mt-5 inline-flex min-h-10 items-center gap-1 text-sm font-black text-primary hover:underline"
      >
        照合結果を詳しく見る <ChevronRight className="size-4" />
      </button>
    </article>
  );
}

function ResultsView({
  results,
  profile: _profile,
  onEdit,
  onFollowup,
  onOpen,
}: {
  results: Evaluation[];
  profile: Profile;
  onEdit: () => void;
  onFollowup: () => void;
  onOpen: (id: string) => void;
}) {
  const counts = (['eligible', 'needs-info', 'future'] as MatchStatus[]).map(
    (status) => results.filter((result) => result.status === status).length,
  );
  const hasUnknown = results.some((result) => result.unknown.length > 0);
  return (
    <Shell view="results" onBack={onEdit}>
      <section className="mx-auto w-full max-w-5xl px-5 pb-24 pt-4 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#123744] p-6 text-white sm:p-9">
          <div className="absolute right-[-40px] top-[-70px] size-60 rounded-full border-[40px] border-[#2bbaa9]/20" />
          <p className="text-sm font-bold text-[#d7f36a]">診断結果</p>
          <h1 className="relative mt-2 max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            あなたに関係がありそうな支援が
            <br className="hidden sm:block" /> {results.length}件あります
          </h1>
          <div className="relative mt-7 grid max-w-2xl grid-cols-3 gap-2">
            {[
              ['いま使えそう', counts[0]],
              ['条件を確認', counts[1]],
              ['今後の候補', counts[2]],
            ].map(([label, count]) => (
              <div
                className="rounded-xl bg-white/10 p-3 sm:p-4"
                key={String(label)}
              >
                <p className="text-2xl font-black">
                  {count}
                  <span className="ml-0.5 text-xs">件</span>
                </p>
                <p className="mt-1 text-[11px] font-bold text-white/65 sm:text-sm">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={onEdit}
            className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"
          >
            <PencilLine className="size-4" /> 基本条件を変更
          </button>
        </div>

        {hasUnknown && (
          <div className="mt-6 flex flex-col justify-between gap-5 rounded-[1.6rem] border-2 border-[#e4c94e] bg-[#fff9dc] p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-black text-[#7a5b00]">
                <Sparkles className="size-4" /> あと一歩で、もっと正確に
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                3つの追加質問で「要確認」を絞れます
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#6f6649]">
                結果を見たあとだから、必要なことだけお聞きします。
              </p>
            </div>
            <Button
              onClick={onFollowup}
              className="h-12 shrink-0 gap-2 rounded-xl px-5 font-bold"
            >
              判定精度を上げる <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <p className="text-sm font-black text-primary">
              あなたに特に関係がありそう
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              制度名より先に、
              <br />
              得られる支援を。
            </h2>
            <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
              該当度の高い順に表示しています。金額が単純に足せないため、合計額は表示していません。
            </p>
          </aside>
          <div className="space-y-4">
            {results.map((result) => (
              <ResultCard
                key={result.program.id}
                result={result}
                onOpen={() => onOpen(result.program.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-[1.6rem] border border-dashed border-[#93aeb4] bg-white/55 p-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">
              Next: life change
            </p>
            <h2 className="mt-2 text-xl font-black">
              もし暮らしが変わったら？
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              次の段階では、引越しや家族の変化による支援の差分を比べられます。
            </p>
          </div>
          <span className="mt-4 inline-block rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground sm:mt-0">
            次期アップデート
          </span>
        </div>
      </section>
    </Shell>
  );
}

function FollowupView({
  profile,
  setProfile,
  onComplete,
  onBack,
}: {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  return (
    <Shell view="followup" onBack={onBack}>
      <section className="mx-auto w-full max-w-3xl px-5 pb-24 pt-5 sm:px-8">
        <p className="text-sm font-black text-primary">判定精度を上げる</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          あと3つだけ、確認します
        </h1>
        <p className="mt-3 font-medium leading-7 text-muted-foreground">
          正確な金額は不要です。答えたくない項目は「わからない」を選べます。
        </p>
        <div className="mt-8 space-y-5">
          <QuestionCard number="1" icon={FileCheck2} title="世帯年収の目安">
            <RadioGroup
              value={profile.incomeBand ?? 'unknown'}
              onValueChange={(value) =>
                setProfile({
                  ...profile,
                  incomeBand: value as Profile['incomeBand'],
                })
              }
              className="grid gap-2 sm:grid-cols-2"
            >
              {[
                ['under300', '300万円未満'],
                ['300-500', '300〜500万円'],
                ['over500', '500万円以上'],
                ['unknown', 'わからない・答えない'],
              ].map(([value, label]) => (
                <Choice
                  key={value}
                  value={value}
                  label={label}
                  current={profile.incomeBand ?? 'unknown'}
                  onSelect={() =>
                    setProfile({
                      ...profile,
                      incomeBand: value as Profile['incomeBand'],
                    })
                  }
                />
              ))}
            </RadioGroup>
          </QuestionCard>
          <QuestionCard number="2" icon={Home} title="住まいの予定">
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
              {[
                ['renting', '賃貸への住み替え'],
                ['buying', '家の購入'],
                ['none', '今は予定なし'],
                ['unknown', 'まだわからない'],
              ].map(([value, label]) => (
                <Choice
                  key={value}
                  value={value}
                  label={label}
                  current={profile.housingPlan ?? 'unknown'}
                  onSelect={() =>
                    setProfile({
                      ...profile,
                      housingPlan: value as Profile['housingPlan'],
                    })
                  }
                />
              ))}
            </RadioGroup>
          </QuestionCard>
          <QuestionCard
            number="3"
            icon={BriefcaseBusiness}
            title="現在の仕事の状況"
          >
            <RadioGroup
              value={profile.employment ?? 'unknown'}
              onValueChange={(value) =>
                setProfile({
                  ...profile,
                  employment: value as Profile['employment'],
                })
              }
              className="grid gap-2 sm:grid-cols-2"
            >
              {[
                ['working', '働いている'],
                ['seeking', '仕事を探している'],
                ['leave', '休職・復職予定'],
                ['unknown', '答えない'],
              ].map(([value, label]) => (
                <Choice
                  key={value}
                  value={value}
                  label={label}
                  current={profile.employment ?? 'unknown'}
                  onSelect={() =>
                    setProfile({
                      ...profile,
                      employment: value as Profile['employment'],
                    })
                  }
                />
              ))}
            </RadioGroup>
          </QuestionCard>
        </div>
        <Button
          onClick={onComplete}
          className="mt-8 h-14 w-full gap-2 rounded-2xl text-base font-bold"
        >
          結果を更新する <Sparkles className="size-5" />
        </Button>
      </section>
    </Shell>
  );
}

function QuestionCard({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: string;
  icon: typeof Home;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-[1.6rem] border border-border bg-white p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-xs font-black text-muted-foreground">
            質問 {number}
          </p>
          <h2 className="text-lg font-black">{title}</h2>
        </div>
      </div>
      {children}
    </fieldset>
  );
}

function DetailView({
  result,
  onBack,
}: {
  result: Evaluation;
  onBack: () => void;
}) {
  const meta = statusMeta[result.status];
  return (
    <Shell view="detail" onBack={onBack}>
      <article className="mx-auto w-full max-w-4xl px-5 pb-24 pt-4 sm:px-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,42,67,.08)] sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-7">
            <div>
              <span className="text-xs font-black text-primary">
                {result.program.category}
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                {result.program.benefitLabel}
              </h1>
              <p className="mt-2 font-semibold text-muted-foreground">
                {result.program.officialName}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-black ${statusStyles[result.status]}`}
            >
              {meta.label}
            </span>
          </div>
          <section className="mt-8">
            <p className="text-xs font-black uppercase tracking-[.13em] text-primary">
              あなたの場合
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              条件との照合
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {result.matched.map((criterion) => (
                <MatchRow
                  key={criterion.key}
                  kind="match"
                  label={criterion.label}
                />
              ))}
              {result.unknown.map((criterion) => (
                <MatchRow
                  key={criterion.key}
                  kind="unknown"
                  label={criterion.label}
                />
              ))}
              {result.unmatched.map((criterion) => (
                <MatchRow
                  key={criterion.key}
                  kind="unmatched"
                  label={criterion.label}
                />
              ))}
            </div>
          </section>
          <section className="mt-9 grid gap-6 rounded-[1.6rem] bg-secondary p-5 sm:grid-cols-[180px_1fr] sm:p-7">
            <div>
              <p className="text-xs font-black text-muted-foreground">
                支援の内容
              </p>
              <p className="mt-2 text-xl font-black text-primary">
                {result.program.amount}
              </p>
            </div>
            <div>
              <p className="font-bold leading-7">{result.program.summary}</p>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-muted-foreground">
                {result.program.points.map((point) => (
                  <li className="flex gap-2" key={point}>
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />{' '}
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="mt-9 border-t border-border pt-7">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-black">
                  申請前に公式情報を確認してください
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                  現在はUI・判定フロー確認用のモックデータです。公開前に制度別の公式ページ、募集期間、最新要件へ差し替えます。
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  公式情報・最終確認日
                </p>
                <p className="mt-1 text-sm font-black">
                  {result.program.lastVerified}
                </p>
              </div>
              <a
                href={result.program.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-[#0a4b60]"
              >
                福岡市公式サイト <ExternalLink className="size-4" />
              </a>
            </div>
          </section>
        </div>
      </article>
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
          style: 'bg-[#ecf6f4] text-[#116d62]',
        }
      : kind === 'unknown'
        ? {
            icon: CircleHelp,
            text: '確認が必要',
            style: 'bg-[#fff8db] text-[#70550a]',
          }
        : {
            icon: ArrowRight,
            text: '現状は対象外',
            style: 'bg-[#f0f3f4] text-[#60737b]',
          };
  const Icon = config.icon;
  return (
    <div className={`rounded-xl p-4 ${config.style}`}>
      <p className="flex items-center gap-2 text-xs font-black">
        <Icon className="size-4" /> {config.text}
      </p>
      <p className="mt-2 text-sm font-bold text-foreground">{label}</p>
    </div>
  );
}

export function KurashiShiftApp() {
  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<Profile>({});
  const [selectedId, setSelectedId] = useState<string>('child-medical');
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
            '居住地・年齢層・世帯構成を設定し、くらしシフトの診断結果を画面に表示します。',
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
        onBack={() => go('home')}
      />
    );
  if (view === 'results')
    return (
      <ResultsView
        results={results}
        profile={profile}
        onEdit={() => go('profile')}
        onFollowup={() => go('followup')}
        onOpen={(id) => {
          setSelectedId(id);
          go('detail');
        }}
      />
    );
  if (view === 'followup')
    return (
      <FollowupView
        profile={profile}
        setProfile={setProfile}
        onComplete={() => go('results')}
        onBack={() => go('results')}
      />
    );
  if (selectedResult)
    return <DetailView result={selectedResult} onBack={() => go('results')} />;
  return (
    <ResultsView
      results={results}
      profile={profile}
      onEdit={() => go('profile')}
      onFollowup={() => go('followup')}
      onOpen={(id) => {
        setSelectedId(id);
        go('detail');
      }}
    />
  );
}

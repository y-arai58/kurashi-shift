'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Flag,
  MapPin,
  PencilLine,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type {
  Evaluation,
  MatchStatus,
  Profile,
  SupportProgram,
} from '@/lib/domain';
import { statusMeta } from '@/lib/domain';
import {
  applicationLabel,
  availability,
  candidateResults,
  compareProfiles,
  evaluateProgram,
  evaluatePrograms,
  todayInJapan,
} from '@/lib/evaluate';
import { supportPrograms } from '@/lib/programs';
import {
  ageOptions,
  householdOptions,
  parseBasicProfile,
  residenceOptions,
  scenarioProfile,
  scenarios,
  updateProfile,
} from '@/lib/profile';
import type { Scenario } from '@/lib/profile';
import {
  followupQuestions,
  questionsFor,
  initialQuestionsFor,
} from '@/lib/questions';
import { ConditionGuide, FieldGuidance } from '@/components/condition-guide';

type Page =
  | 'home'
  | 'profile'
  | 'results'
  | 'questions'
  | 'detail'
  | 'compare'
  | 'guide'
  | 'comparison-detail';
type Route = { page: Page; id?: string };
type Navigate = (page: Page, id?: string) => void;
const primaryButton =
  'min-h-12 h-auto whitespace-normal rounded-none bg-black px-6 py-3 text-base font-bold text-white hover:bg-[#205a74]';
const statusStyles: Record<MatchStatus, string> = {
  eligible: 'bg-[#171717] text-white',
  'needs-info': 'bg-[#d9eff8] text-[#17465a]',
  future: 'bg-[#f0f0ed] text-[#555d60]',
};
const pageNames: Record<Page, string> = {
  home: 'ホーム',
  profile: '基本プロフィール',
  results: '診断結果',
  questions: '追加の質問',
  detail: '制度詳細',
  compare: '暮らしの変化を試す',
  guide: '条件・手続きを調べる',
  'comparison-detail': '変化後の制度詳細',
};
const complete = (profile: Profile) =>
  Boolean(profile.residence && profile.ageBand && profile.household);
const getProgram = (id?: string) =>
  supportPrograms.find((program) => program.id === id);

function readRoute(hash: string): Route {
  const [page = 'home', id] = hash.split('/');
  if (!Object.hasOwn(pageNames, page)) return { page: 'home' };
  if (
    (page === 'detail' ||
      page === 'comparison-detail' ||
      (page === 'questions' && id)) &&
    !getProgram(id)
  )
    return { page: 'home' };
  return { page: page as Page, id };
}

function subscribeToRoute(notify: () => void) {
  window.addEventListener('popstate', notify);
  window.addEventListener('hashchange', notify);
  window.addEventListener('kurashi-navigation', notify);
  return () => {
    window.removeEventListener('popstate', notify);
    window.removeEventListener('hashchange', notify);
    window.removeEventListener('kurashi-navigation', notify);
  };
}
const routeSnapshot = () => window.location.hash.slice(1) || 'home';
const serverRouteSnapshot = () => 'home';

function Logo({ onHome }: { onHome: () => void }) {
  return (
    <button
      className="flex items-center gap-3 text-left"
      onClick={onHome}
      aria-label="くらしシフト ホーム"
    >
      <span className="grid size-10 place-items-center border-l-2 border-black text-primary">
        <Flag className="size-7" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-lg font-black tracking-[-.04em]">
          くらしシフト
        </span>
        <span className="block text-xs font-medium tracking-[.08em] text-muted-foreground">
          KURASHI SHIFT
        </span>
      </span>
    </button>
  );
}

function Shell({
  route,
  go,
  back,
  children,
}: {
  route: Route;
  go: Navigate;
  back?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        本文へ移動
      </a>
      <header className="border-b border-primary bg-white">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Logo onHome={() => go('home')} />
          <Button
            variant="ghost"
            onClick={() => go('guide')}
            className="min-h-11 rounded-none px-2 text-sm font-bold"
          >
            条件を調べる
          </Button>
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <p className="text-sm font-bold text-foreground">福岡市版</p>
            <p>公式情報 {supportPrograms.length}制度</p>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 outline-none sm:px-8"
      >
        {route.page !== 'home' && (
          <nav
            aria-label="現在のページ"
            className="mb-8 mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          >
            {back && (
              <Button
                variant="ghost"
                onClick={back}
                className="min-h-11 gap-2 rounded-none px-2"
              >
                <ArrowLeft className="size-4" />
                戻る
              </Button>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{pageNames[route.page]}</span>
          </nav>
        )}
        {children}
      </main>
      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 text-sm leading-6 text-muted-foreground sm:grid-cols-2 sm:px-8">
          <div>
            <p className="font-bold text-foreground">くらしシフト</p>
            <p className="mt-2">
              福岡市の公式情報をもとにした民間の支援案内です。行政の審査・受給決定を行うものではありません。
            </p>
          </div>
          <div>
            <p>
              入力内容はこのページを開いている間だけ使用します。アプリのサーバーやブラウザーの保存領域には保存しません。再読み込みで消去されます。
            </p>
            <p className="mt-2">
              現在の掲載範囲：子育て・教育・市内住み替え・高齢者の交通費に関する5制度。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b-[3px] border-primary pb-7">
      <p className="mb-3 text-sm font-bold tracking-[.08em] text-[#28637c]">
        {eyebrow}
      </p>
      <h1
        tabIndex={-1}
        className="text-balance text-3xl font-black leading-tight tracking-[-.045em] outline-none sm:text-5xl"
      >
        {title}
      </h1>
      {children && (
        <div className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
          {children}
        </div>
      )}
    </header>
  );
}

function Choices({
  title,
  note,
  value,
  options,
  onChange,
}: {
  title: string;
  note?: string;
  value?: string;
  options: readonly { value: string; label: string; note?: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-lg font-bold">{title}</legend>
      {note && (
        <p className="mb-4 text-sm leading-6 text-muted-foreground">{note}</p>
      )}
      <RadioGroup
        aria-label={title}
        value={value ?? ''}
        onValueChange={onChange}
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={
              'flex min-h-16 cursor-pointer items-center gap-3 border p-4 transition-colors ' +
              (option.value === value
                ? 'border-[#28637c] bg-secondary'
                : 'border-[#d5dee2] hover:border-[#28637c]')
            }
          >
            <RadioGroupItem
              value={option.value}
              className="size-5 shrink-0 border-[#657780]"
            />
            <span className="min-w-0">
              <span className="block text-base font-semibold">
                {option.label}
              </span>
              {option.note && (
                <span className="mt-1 block text-sm text-muted-foreground">
                  {option.note}
                </span>
              )}
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

function HomeView({ go, hasProfile }: { go: Navigate; hasProfile: boolean }) {
  return (
    <section className="grid gap-12 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
      <div>
        <p className="mb-6 flex items-center gap-2 text-sm font-bold text-[#28637c]">
          <MapPin className="size-4" />
          福岡市の暮らしと支援
        </p>
        <h1
          tabIndex={-1}
          className="text-balance text-[clamp(2.8rem,6vw,4.6rem)] font-black leading-[1.18] tracking-[-.06em] outline-none"
        >
          その支援、
          <br />
          あなたにも<span className="text-[#28637c]">。</span>
        </h1>
        <div className="my-7 h-[3px] bg-primary" />
        <p className="max-w-lg text-lg leading-8">
          お住まい・年齢・家族のこと。
          <br />
          基本情報から、関係のある制度と
          <br className="hidden sm:block" />
          「なぜ該当しそうか」がわかります。
        </p>
        <Button
          onClick={() => go(hasProfile ? 'results' : 'profile')}
          className={primaryButton + ' mt-8 gap-3'}
        >
          {hasProfile ? '診断結果に戻る' : '基本情報ではじめる'}
          <ArrowRight className="size-5" />
        </Button>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" />
          登録不要・入力内容は保存しません
        </p>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          現在は福岡市の5制度に対応しています。
        </p>
      </div>
      <div className="soft-grid border border-border p-4 sm:p-7">
        <div className="bg-white p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[.12em] text-muted-foreground">
            診断結果の表示例
          </p>
          <div className="mt-4 border-b-2 border-primary pb-5">
            <p className="text-sm font-bold text-[#28637c]">医療・子育て</p>
            <h2 className="mt-2 text-2xl font-black leading-snug">
              子どもの通院・入院費を軽減
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              福岡市 子ども医療費助成制度
            </p>
          </div>
          <p className="mt-5 text-lg font-bold leading-8">
            保険診療の通院は
            <br />
            1医療機関あたり月500円まで
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="flex gap-2">
              <CheckCircle2 className="size-5 shrink-0 text-[#28637c]" />
              福岡市に住んでいる
            </p>
            <p className="flex gap-2">
              <CircleHelp className="size-5 shrink-0 text-[#28637c]" />
              子どもの年齢・保険加入を確認
            </p>
          </div>
          <p className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
            一致した条件と、確認が必要な条件を分けて案内します。
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileView({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const initialQuestions = initialQuestionsFor(draft);
  const answered = [draft.residence, draft.ageBand, draft.household].filter(
    Boolean,
  ).length;
  const set = (patch: Partial<Profile>) =>
    setDraft((current) => updateProfile(current, patch));
  return (
    <>
      <Heading eyebrow="01 / PROFILE" title="まず、暮らしの基本情報から。">
        お住まい・年齢・世帯は必須です。家族に関係する共通項目だけ続けて表示します。追加項目はわからなくても進めます。
      </Heading>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (complete(draft)) onSave(draft);
        }}
        className="mt-9 grid gap-10 lg:grid-cols-[1fr_270px]"
      >
        <div className="space-y-9">
          <Choices
            title="1. お住まい"
            options={residenceOptions}
            value={draft.residence}
            onChange={(value) =>
              set({ residence: value as Profile['residence'] })
            }
          />
          <Choices
            title="2. あなたの年齢"
            options={ageOptions}
            value={draft.ageBand}
            onChange={(value) => set({ ageBand: value as Profile['ageBand'] })}
          />
          <Choices
            title="3. 世帯について"
            note="子どもを養育している場合は、同居・別居を問わず子どものいる選択肢を選んでください。"
            options={householdOptions}
            value={draft.household}
            onChange={(value) =>
              set({ household: value as Profile['household'] })
            }
          />
          {initialQuestions.map((question, index) => (
            <div key={question.field}>
              <Choices
                title={index + 4 + '. ' + question.title + '（任意）'}
                note={question.note}
                options={question.options}
                value={draft[question.field] ?? 'unknown'}
                onChange={(value) => set({ [question.field]: value })}
              />
            </div>
          ))}
          <div>
            <output className="mb-3 block text-sm text-muted-foreground">
              必須 {answered} / 3 回答済み・追加の基本情報{' '}
              {initialQuestions.length}項目は任意
            </output>
            <Button
              type="submit"
              disabled={!complete(draft)}
              className={primaryButton + ' w-full gap-2 sm:w-auto'}
            >
              この条件で結果を見る
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
        <aside className="h-fit border-t-[3px] border-primary bg-secondary p-6 text-sm leading-7">
          <ShieldCheck className="size-6 text-[#28637c]" />
          <h2 className="mt-4 text-lg font-bold">氏名も、連絡先も不要です。</h2>
          <p className="mt-3 text-muted-foreground">
            正確な年収・住所・マイナンバーは入力しません。追加質問も、答えたくない項目は飛ばせます。
          </p>
        </aside>
      </form>
    </>
  );
}

function Badge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={
        'inline-flex w-fit px-3 py-1.5 text-sm font-bold ' +
        statusStyles[status]
      }
    >
      {statusMeta[status].shortLabel}
    </span>
  );
}

function ResultCard({
  result,
  onOpen,
  today,
}: {
  result: Evaluation;
  onOpen: () => void;
  today: string;
}) {
  return (
    <article className="border border-[#d5dee2] border-t-[3px] border-t-primary p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-bold text-[#28637c]">
          {result.program.category}
        </p>
        <Badge status={result.status} />
      </div>
      <h3 className="mt-3 text-xl font-black leading-snug sm:text-2xl">
        {result.program.benefitLabel}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {result.program.officialName}
      </p>
      <p className="my-5 border-l-4 border-primary pl-4 text-base font-bold leading-7">
        {result.program.amount}
      </p>
      <div className="grid gap-3 text-sm leading-6">
        {result.matched.slice(0, 2).map((item) => (
          <p key={item.key} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#28637c]" />
            {item.label}
          </p>
        ))}
        {(result.status === 'future' ? result.unmatched : result.unknown)
          .slice(0, 2)
          .map((item) => (
            <p key={item.key} className="flex gap-2 text-muted-foreground">
              <CircleHelp className="mt-0.5 size-4 shrink-0" />
              {item.label}
            </p>
          ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          {applicationLabel(result.program, today)}
        </p>
        <Button
          variant="ghost"
          onClick={onOpen}
          aria-label={result.program.officialName + 'の詳細を見る'}
          className="min-h-11 gap-1 rounded-none px-1 font-bold"
        >
          詳しく見る
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </article>
  );
}

function ProfileSummary({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {[
        residenceOptions.find((option) => option.value === profile.residence)
          ?.label,
        ageOptions.find((option) => option.value === profile.ageBand)?.label,
        householdOptions.find((option) => option.value === profile.household)
          ?.label,
      ]
        .filter(Boolean)
        .map((label) => (
          <span
            key={label}
            className="border border-border bg-white px-3 py-1.5"
          >
            {label}
          </span>
        ))}
    </div>
  );
}

function ResultsView({
  results,
  profile,
  go,
  today,
  onReset,
}: {
  results: Evaluation[];
  profile: Profile;
  go: Navigate;
  today: string;
  onReset: () => void;
}) {
  const candidates = candidateResults(results);
  const excluded = results.filter((result) => result.status === 'future');
  const matching = candidates.filter(
    (result) => result.status === 'eligible',
  ).length;
  const questions = questionsFor(profile);
  const unanswered = questions.filter(
    (question) =>
      !profile[question.field] || profile[question.field] === 'unknown',
  ).length;
  return (
    <>
      <Heading
        eyebrow="02 / YOUR RESULTS"
        title={
          profile.residence === 'other'
            ? 'お住まいの地域は、まだ未対応です。'
            : candidates.length
              ? 'あなたの支援候補は、' + candidates.length + '件です。'
              : '今の掲載範囲では、候補が見つかりませんでした。'
        }
      >
        <ProfileSummary profile={profile} />
        <Button
          variant="ghost"
          onClick={() => go('profile')}
          className="mt-3 min-h-11 gap-2 rounded-none px-0 font-bold"
        >
          <PencilLine className="size-4" />
          基本条件を変更
        </Button>
      </Heading>
      {profile.residence === 'fukuoka' && (
        <div className="mt-7 grid grid-cols-2 border border-border bg-secondary p-5 text-center sm:max-w-lg">
          <div className="border-r border-border">
            <p className="text-3xl font-black">
              {matching}
              <span className="ml-1 text-sm">件</span>
            </p>
            <p className="mt-2 text-sm">主な条件に一致</p>
          </div>
          <div>
            <p className="text-3xl font-black">
              {candidates.length - matching}
              <span className="ml-1 text-sm">件</span>
            </p>
            <p className="mt-2 text-sm">確認が必要</p>
          </div>
        </div>
      )}
      {questions.length > 0 && (
        <div className="my-8 flex flex-col justify-between gap-5 border-l-4 border-primary bg-secondary p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">
              {unanswered
                ? 'あと少し、条件を確かめませんか。'
                : '回答した詳しい条件を見直せます。'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {unanswered
                ? '未確認の質問が' +
                  unanswered +
                  '項目あります。制度ごとの詳細からも回答できます。'
                : '状況が変わったら、いつでも回答を修正できます。'}
            </p>
          </div>
          <Button
            onClick={() => go('questions')}
            className={primaryButton + ' shrink-0 gap-2'}
          >
            {unanswered ? '追加質問に答える' : '追加回答を見直す'}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
      {candidates.length > 0 ? (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[230px_1fr]">
          <aside>
            <h2 className="text-2xl font-black">あなたに関係する支援</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              回答と一致する主な条件を確認できます。受給には個別の審査や申請が必要です。
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              月額・一時金・費用軽減を混ぜず、制度ごとに表示しています。
            </p>
          </aside>
          <div className="space-y-5">
            {candidates.slice(0, 3).map((result) => (
              <ResultCard
                key={result.program.id}
                result={result}
                today={today}
                onOpen={() => go('detail', result.program.id)}
              />
            ))}
            {candidates.length > 3 && (
              <details className="border-t border-border pt-4">
                <summary className="cursor-pointer py-3 font-bold">
                  ほかの候補 {candidates.length - 3}件を見る
                </summary>
                <div className="mt-4 space-y-5">
                  {candidates.slice(3).map((result) => (
                    <ResultCard
                      key={result.program.id}
                      result={result}
                      today={today}
                      onOpen={() => go('detail', result.program.id)}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-border bg-secondary p-7">
          <h2 className="text-xl font-bold">
            利用できる支援がない、という意味ではありません。
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            {profile.residence === 'other'
              ? '福岡市以外の制度は診断していません。お住まいの自治体の公式サイトや相談窓口でご確認ください。'
              : '現在は5制度から診断しています。掲載していない支援や、個別事情によって利用できる制度もあります。'}
          </p>
          <Button
            variant="outline"
            onClick={() => go('profile')}
            className="mt-5 min-h-11 rounded-none"
          >
            基本条件を見直す
          </Button>
        </div>
      )}
      {excluded.length > 0 && (
        <details className="mt-9 border-y border-border py-4">
          <summary className="cursor-pointer py-3 text-base font-semibold">
            候補から外れた制度と、その理由（{excluded.length}件）
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {excluded.map((result) => (
              <div key={result.program.id} className="border border-border p-5">
                <h3 className="font-bold">{result.program.officialName}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {result.unmatched.map((item) => (
                    <li key={item.key}>{item.label}：一致しません</li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  onClick={() => go('detail', result.program.id)}
                  className="mt-2 min-h-11 rounded-none px-0"
                >
                  条件を詳しく確認
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
      {profile.residence === 'fukuoka' && (
        <section className="mt-12 border-t-[3px] border-primary pt-7">
          <p className="text-sm font-bold tracking-[.1em] text-[#28637c]">
            IF YOUR LIFE CHANGES
          </p>
          <h2 className="mt-2 text-2xl font-black">
            もし、暮らしが変わったら？
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            出産や福岡市内の住み替えを試して、今との違いを見られます。現在の回答はそのまま残ります。
          </p>
          <Button
            onClick={() => go('compare')}
            className={primaryButton + ' mt-5 gap-2'}
          >
            暮らしの変化を試す
            <ArrowRight className="size-4" />
          </Button>
        </section>
      )}
      <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-border pt-5 text-sm text-muted-foreground">
        <p>掲載情報の最終確認：2026年9月7日</p>
        <Button
          variant="ghost"
          onClick={onReset}
          className="min-h-11 rounded-none px-0"
        >
          回答を消して最初から
        </Button>
      </div>
    </>
  );
}

function FollowupView({
  profile,
  program,
  onSave,
}: {
  profile: Profile;
  program?: SupportProgram;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const questions = questionsFor(draft, program);
  return (
    <>
      <Heading
        eyebrow="03 / A LITTLE MORE"
        title={
          program ? 'この制度の条件を確かめる。' : 'あなたに必要なことだけ。'
        }
      >
        {program?.officialName ?? '回答に合わせて質問が変わります。'}{' '}
        わからない項目は飛ばせます。
      </Heading>
      <form
        className="mx-auto mt-9 max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <div className="space-y-7">
          {questions.map((question, index) => (
            <div
              key={question.field}
              className="border border-border border-t-[3px] border-t-primary p-5 sm:p-7"
            >
              <p className="mb-3 text-sm font-bold text-[#28637c]">
                質問 {index + 1}
              </p>
              <Choices
                title={question.title}
                note={question.note}
                options={question.options}
                value={draft[question.field] ?? 'unknown'}
                onChange={(value) =>
                  setDraft((current) =>
                    updateProfile(current, { [question.field]: value }),
                  )
                }
              />
              <FieldGuidance
                field={question.field}
                onAnswer={(value) =>
                  setDraft((current) =>
                    updateProfile(current, { [question.field]: value }),
                  )
                }
              />
            </div>
          ))}
        </div>
        {!questions.length && (
          <p className="border border-border bg-secondary p-6 leading-7">
            今の条件で追加できる質問はありません。制度詳細の条件ガイドから、個別の要件や手続きを調べられます。
          </p>
        )}
        <div className="sticky bottom-0 mt-8 border-t border-border bg-white/95 py-4 backdrop-blur-sm">
          <Button type="submit" className={primaryButton + ' w-full gap-2'}>
            この回答で更新する
            <Check className="size-5" />
          </Button>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            未回答の項目は「確認が必要」のまま表示します。
          </p>
        </div>
      </form>
    </>
  );
}

function answerLabel(field: keyof Profile | undefined, profile: Profile) {
  if (!field) return undefined;
  if (field === 'childAgeEligible' && profile.household === 'expecting')
    return 'はじめての出産を控えている';
  const value = profile[field];
  if (!value) return '未回答';
  return followupQuestions
    .find((question) => question.field === field)
    ?.options.find((option) => option.value === value)?.label;
}

function DetailView({
  result,
  profile,
  personalized,
  simulation,
  go,
  today,
}: {
  result: Evaluation;
  profile: Profile;
  personalized: boolean;
  simulation: boolean;
  go: Navigate;
  today: string;
}) {
  const program = result.program;
  const followup = questionsFor(profile, program);
  const state = availability(program, today);
  return (
    <>
      <Heading
        eyebrow={simulation ? 'SIMULATION / PROGRAM' : '04 / PROGRAM'}
        title={program.benefitLabel}
      >
        <p>{program.officialName}</p>
        <div className="mt-3">
          {personalized ? (
            <Badge status={result.status} />
          ) : (
            <span className="text-sm">
              基本プロフィールを入力すると、あなたの条件と照合できます。
            </span>
          )}
        </div>
      </Heading>
      {simulation && (
        <p className="mt-5 border-l-4 border-primary bg-secondary p-4 font-semibold">
          暮らしを変えた場合の仮の結果です。
        </p>
      )}
      <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <section>
            <h2 className="text-2xl font-black">
              {personalized ? 'あなたの条件との照合' : '主な対象条件'}
            </h2>
            <div className="mt-5 space-y-3">
              {[
                ...result.unmatched.map((item) => ({
                  item,
                  kind: 'unmatched',
                })),
                ...result.unknown.map((item) => ({ item, kind: 'unknown' })),
                ...result.matched.map((item) => ({ item, kind: 'match' })),
              ].map(({ item, kind }) => (
                <div
                  key={item.key}
                  className={
                    'border-l-4 p-4 ' +
                    (kind === 'match'
                      ? 'border-primary bg-secondary'
                      : 'border-[#98a9b1] bg-[#f5f7f8]')
                  }
                >
                  <p className="flex items-center gap-2 text-sm font-bold text-[#31596b]">
                    {kind === 'match' ? (
                      <CheckCircle2 className="size-4" />
                    ) : kind === 'unmatched' ? (
                      <X className="size-4" />
                    ) : (
                      <CircleHelp className="size-4" />
                    )}
                    {kind === 'match'
                      ? '回答と一致'
                      : kind === 'unmatched'
                        ? '回答と不一致・期限経過'
                        : item.field
                          ? '回答を確認'
                          : '受付・個別事情を確認'}
                  </p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    {item.label}
                  </p>
                  {personalized && answerLabel(item.field, profile) && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      あなたの回答：{answerLabel(item.field, profile)}
                    </p>
                  )}
                  <FieldGuidance
                    field={item.field}
                    guidanceId={item.guidanceId}
                  />
                </div>
              ))}
            </div>
            {!personalized && (
              <Button
                onClick={() => go('profile')}
                className={primaryButton + ' mt-5'}
              >
                プロフィールを入力する
              </Button>
            )}
            {personalized && !simulation && followup.length > 0 && (
              <Button
                onClick={() => go('questions', program.id)}
                className={primaryButton + ' mt-5 gap-2'}
              >
                この制度の質問に答える
                <PencilLine className="size-4" />
              </Button>
            )}
          </section>
          <ConditionGuide
            key={program.id}
            programId={program.id}
            onOpen={(id) =>
              go(personalized && !simulation ? 'questions' : 'detail', id)
            }
          />
          <section className="mt-10 border-t border-border pt-7">
            <h2 className="text-2xl font-black">受けられる支援</h2>
            <p className="my-5 border-l-4 border-primary pl-4 text-xl font-bold leading-8">
              {program.amount}
            </p>
            <p className="leading-8">{program.summary}</p>
            <ul className="mt-5 space-y-3 text-base leading-7">
              {program.points.map((point) => (
                <li className="flex gap-3" key={point}>
                  <Check className="mt-1 size-4 shrink-0 text-[#28637c]" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
          <section className="mt-10 border-t border-border pt-7">
            <h2 className="text-2xl font-black">申請に向けて、次にすること</h2>
            <ol className="mt-5 list-decimal space-y-4 pl-5 leading-8">
              {program.nextSteps.map((step) => (
                <li key={step} className="pl-2">
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="h-fit border-t-[3px] border-primary bg-secondary p-6 lg:sticky lg:top-6">
          <ShieldCheck className="size-6 text-[#28637c]" />
          <h2 className="mt-3 text-xl font-black">公式情報で最終確認</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            診断は主な条件の照合です。対象可否・金額は個別の状況や審査で決まります。
          </p>
          {state !== 'current' && (
            <output className="mt-4 block border border-[#93b8c8] bg-white p-3 text-sm font-bold leading-6">
              情報を再確認する時期です。最新年度・受付状況を公式ページでご確認ください。
            </output>
          )}
          <dl className="mt-5 space-y-4 border-t border-primary/40 pt-5 text-sm">
            <div>
              <dt className="text-muted-foreground">
                受付状況（最終確認時点）
              </dt>
              <dd className="mt-1 font-bold leading-6">
                {applicationLabel(program, today)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">公式ページ更新日</dt>
              <dd className="mt-1 font-bold">{program.sourceUpdatedAt}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">くらしシフト最終確認日</dt>
              <dd className="mt-1 font-bold">
                <time dateTime={program.verifiedOn}>
                  {program.lastVerified}
                </time>
              </dd>
            </div>
          </dl>
          <a
            href={program.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex min-h-12 items-center justify-center gap-2 bg-black p-3 text-sm font-bold text-white hover:bg-[#205a74]"
          >
            福岡市公式ページへ
            <ExternalLink className="size-4" />
            <span className="sr-only">（新しいタブで開きます）</span>
          </a>
        </aside>
      </div>
    </>
  );
}

function ComparisonView({
  profile,
  scenario,
  onScenario,
  go,
  today,
}: {
  profile: Profile;
  scenario: Scenario;
  onScenario: (scenario: Scenario) => void;
  go: Navigate;
  today: string;
}) {
  const next = scenarioProfile(profile, scenario);
  const comparison = compareProfiles(supportPrograms, profile, next, today);
  const chosen = scenarios.find((item) => item.id === scenario)!;
  return (
    <>
      <Heading
        eyebrow="LIFE CHANGE / COMPARE"
        title="暮らしを変えたら、何が変わる？"
      >
        今の回答をもとに、確認済みの制度で試算します。将来の制度改正や給付額の増減を予測するものではありません。
      </Heading>
      <div className="mt-8">
        <Choices
          title="どんな変化を試しますか？"
          options={scenarios.map((item) => ({
            value: item.id,
            label: item.label,
            note: item.note,
          }))}
          value={scenario}
          onChange={(value) => onScenario(value as Scenario)}
        />
      </div>
      <div className="mt-7 bg-secondary p-5 text-sm leading-7">
        <p className="font-bold">変える条件</p>
        <p>
          {scenario === 'baby'
            ? '高校生年代までの子どもがいる状態に変更します。新しく生まれる子どもの保険加入・医療費助成の例外は未確認として扱います。既にいる子どもの就学状況は引き継ぎます。'
            : '2026年4月1日以降の福岡市内の転居あり・転居先は' +
              (scenario === 'rent' ? '賃貸住宅' : '購入した住宅') +
              'に変更します。住宅ごとの確認回答はリセットし、それ以外の回答は引き継ぎます。'}
        </p>
        <p className="mt-2 text-muted-foreground">
          比較するのは候補件数と主な条件です。第何子かの数え方や住宅ごとの要件は、画面上部の「条件を調べる」で確認できます。市外への引越し比較は対象外です。
        </p>
      </div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y-[3px] border-primary py-7 text-center"
      >
        <div>
          <p className="text-sm font-bold">今の暮らし</p>
          <p className="mt-2 text-4xl font-black">
            {comparison.current.length}
            <span className="ml-1 text-base">件</span>
          </p>
        </div>
        <ArrowRight className="size-6 text-[#28637c]" />
        <div>
          <p className="text-sm font-bold">{chosen.label}</p>
          <p className="mt-2 text-4xl font-black">
            {comparison.next.length}
            <span className="ml-1 text-base">件</span>
          </p>
        </div>
      </div>
      <div className="space-y-9">
        {[
          { title: '新しく候補になる', list: comparison.added, mark: '＋' },
          { title: '候補から外れる', list: comparison.removed, mark: '−' },
          {
            title: '確認できた条件が変わる',
            list: comparison.changed,
            mark: '↗',
          },
        ].map((group) => (
          <section key={group.title}>
            <h2 className="text-xl font-black">
              {group.mark} {group.title}
              <span className="ml-3 text-base font-medium">
                {group.list.length}件
              </span>
            </h2>
            {group.list.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.list.map((result) => (
                  <ResultCard
                    key={result.program.id}
                    result={
                      group.mark === '−'
                        ? evaluateProgram(result.program, next, today)
                        : result
                    }
                    today={today}
                    onOpen={() => go('comparison-detail', result.program.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                この変化による該当はありません。
              </p>
            )}
          </section>
        ))}
      </div>
      <details className="mt-9 border-y border-border py-4">
        <summary className="cursor-pointer py-3 font-semibold">
          候補・確認条件が同じ制度（{comparison.unchanged.length}件）
        </summary>
        <div className="mt-3 space-y-2">
          {comparison.unchanged.map((result) => (
            <button
              key={result.program.id}
              onClick={() => go('comparison-detail', result.program.id)}
              className="flex min-h-12 w-full items-center justify-between gap-4 border-b border-border py-3 text-left text-base"
            >
              {result.program.officialName}
              <ChevronRight className="size-4 shrink-0" />
            </button>
          ))}
          {!comparison.unchanged.length && (
            <p className="py-2 text-sm text-muted-foreground">
              該当する制度はありません。
            </p>
          )}
        </div>
      </details>
      <Button onClick={() => go('results')} className={primaryButton + ' mt-8'}>
        今の診断結果に戻る
      </Button>
    </>
  );
}

export function KurashiShiftApp() {
  const routeHash = useSyncExternalStore(
    subscribeToRoute,
    routeSnapshot,
    serverRouteSnapshot,
  );
  const route = readRoute(routeHash);
  const [profile, setProfile] = useState<Profile>({});
  const [scenario, setScenario] = useState<Scenario>('baby');
  const [today, setToday] = useState(todayInJapan);
  const go = useCallback<Navigate>((page, id) => {
    const nextHash = '#' + page + (id ? '/' + id : '');
    if (window.location.hash !== nextHash)
      window.history.pushState(null, '', nextHash);
    window.dispatchEvent(new Event('kurashi-navigation'));
  }, []);
  useEffect(() => {
    const refreshDate = () => setToday(todayInJapan());
    window.addEventListener('focus', refreshDate);
    const timer = window.setInterval(refreshDate, 60000);
    return () => {
      window.removeEventListener('focus', refreshDate);
      window.clearInterval(timer);
    };
  }, []);
  const effectiveRoute: Route =
    !complete(profile) &&
    ['results', 'questions', 'compare', 'comparison-detail'].includes(
      route.page,
    )
      ? { page: 'profile' }
      : profile.residence !== 'fukuoka' &&
          ['compare', 'comparison-detail'].includes(route.page)
        ? { page: 'results' }
        : route;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [route.page, route.id]);
  const results = useMemo(
    () => evaluatePrograms(supportPrograms, profile, today),
    [profile, today],
  );
  const selected = getProgram(effectiveRoute.id);
  const isComparison = effectiveRoute.page === 'comparison-detail';
  const detailProfile = isComparison
    ? scenarioProfile(profile, scenario)
    : profile;

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'set_basic_profile',
          title: '基本プロフィールで診断する',
          description:
            '居住地・年齢層・世帯構成で診断し、確認が必要な条件を含む支援候補を表示します。入力は保存しません。',
          inputSchema: {
            type: 'object',
            properties: {
              residence: {
                type: 'string',
                enum: residenceOptions.map((option) => option.value),
              },
              ageBand: {
                type: 'string',
                enum: ageOptions.map((option) => option.value),
              },
              household: {
                type: 'string',
                enum: householdOptions.map((option) => option.value),
              },
              childAgeEligible: {
                type: 'string',
                enum: ['yes', 'no', 'unknown'],
              },
              schoolStage: {
                type: 'string',
                enum: ['elementary-middle', 'other', 'unknown'],
              },
              publicAssistance: {
                type: 'string',
                enum: ['yes', 'no', 'unknown'],
              },
              age70Plus: { type: 'string', enum: ['yes', 'no', 'unknown'] },
            },
            required: ['residence', 'ageBand', 'household'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const next = parseBasicProfile(input);
            const matched = candidateResults(
              evaluatePrograms(supportPrograms, next),
            );
            setProfile(next);
            go('results');
            return {
              displayed: true,
              supportCount: matched.length,
              coverage:
                next.residence === 'fukuoka'
                  ? 'fukuoka-five-programs'
                  : 'unsupported',
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
  }, [go]);

  const back = () => {
    if (effectiveRoute.page === 'profile')
      go(complete(profile) ? 'results' : 'home');
    else if (effectiveRoute.page === 'questions')
      go(selected ? 'detail' : 'results', selected?.id);
    else if (effectiveRoute.page === 'comparison-detail') go('compare');
    else if (effectiveRoute.page === 'results') go('profile');
    else go(complete(profile) ? 'results' : 'home');
  };
  return (
    <Shell
      route={effectiveRoute}
      go={go}
      back={effectiveRoute.page === 'home' ? undefined : back}
    >
      {effectiveRoute.page === 'home' && (
        <HomeView go={go} hasProfile={complete(profile)} />
      )}
      {effectiveRoute.page === 'guide' && (
        <>
          <Heading
            eyebrow="OFFICIAL INFORMATION / GUIDE"
            title="制度の条件を、ここで調べる。"
          >
            公式ページで確認するよう案内していた条件も、説明・一覧・計算ツールで確かめられます。
          </Heading>
          <ConditionGuide
            key={effectiveRoute.id ?? 'all'}
            programId={getProgram(effectiveRoute.id)?.id}
            onOpen={(id) => go(complete(profile) ? 'questions' : 'detail', id)}
          />
        </>
      )}
      {effectiveRoute.page === 'profile' && (
        <ProfileView
          profile={profile}
          onSave={(next) => {
            setProfile(next);
            go('results');
          }}
        />
      )}
      {effectiveRoute.page === 'results' && (
        <ResultsView
          results={results}
          profile={profile}
          go={go}
          today={today}
          onReset={() => {
            setProfile({});
            setScenario('baby');
            go('profile');
          }}
        />
      )}
      {effectiveRoute.page === 'questions' && (
        <FollowupView
          key={effectiveRoute.id ?? 'all'}
          profile={profile}
          program={selected}
          onSave={(next) => {
            setProfile(next);
            go(selected ? 'detail' : 'results', selected?.id);
          }}
        />
      )}
      {(effectiveRoute.page === 'detail' ||
        effectiveRoute.page === 'comparison-detail') &&
        selected && (
          <DetailView
            result={evaluateProgram(selected, detailProfile, today)}
            profile={detailProfile}
            personalized={complete(profile)}
            simulation={isComparison}
            go={go}
            today={today}
          />
        )}
      {effectiveRoute.page === 'compare' && (
        <ComparisonView
          profile={profile}
          scenario={scenario}
          onScenario={setScenario}
          go={go}
          today={today}
        />
      )}
    </Shell>
  );
}

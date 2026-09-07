'use client';

import { useId, useState } from 'react';
import { Search, ExternalLink, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  officialGuidance,
  searchGuidance,
  requiredHousingArea,
  schoolIncomeComparison,
} from '@/lib/official-guidance';
import type { Guidance } from '@/lib/official-guidance';
import type { Profile, YesNoUnknown } from '@/lib/domain';
import { supportPrograms } from '@/lib/programs';

const inputClass =
  'h-12 rounded-none border-[#93a9b3] bg-white text-base md:text-base';
function NumberEntry({
  label,
  value,
  change,
  step = '1',
}: {
  label: string;
  value: string;
  change: (value: string) => void;
  step?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        inputMode={step === '1' ? 'numeric' : 'decimal'}
        value={value}
        onChange={(event) => change(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

export function AreaCalculator({
  onAnswer,
}: {
  onAnswer?: (value: YesNoUnknown) => void;
}) {
  const [values, setValues] = useState({
    tenPlus: '',
    under3: '',
    threeTo5: '',
    sixTo9: '',
    pregnant: '',
    area: '',
  });
  const [applied, setApplied] = useState(false);
  const ready = Object.values(values).every((value) => value.trim() !== '');
  const required = ready
    ? requiredHousingArea({
        tenPlus: Number(values.tenPlus),
        under3: Number(values.under3),
        threeTo5: Number(values.threeTo5),
        sixTo9: Number(values.sixTo9),
        pregnant: Number(values.pregnant),
      })
    : undefined;
  const area = Number(values.area);
  const valid = required !== undefined && Number.isFinite(area) && area > 0;
  const change = (field: keyof typeof values, value: string) => {
    if (applied) {
      onAnswer?.('unknown');
      setApplied(false);
    }
    setValues((current) => ({ ...current, [field]: value }));
  };
  return (
    <section className="mt-5 border border-border bg-secondary p-5">
      <h3 className="text-lg font-bold">必要面積を計算する</h3>
      <p className="my-3 text-sm leading-6">
        該当しない人数は0を入力してください。10歳以上の人数には妊娠中の人を含め、「妊娠中」はその内数です。別世帯の配偶者・世帯分離した同居者も含みます。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['tenPlus', '10歳以上の人数'],
          ['under3', '3歳未満の人数'],
          ['threeTo5', '3〜5歳の人数'],
          ['sixTo9', '6〜9歳の人数'],
          ['pregnant', 'うち妊娠中の人数'],
          ['area', '転居先の壁芯面積（㎡）'],
        ].map(([field, label]) => (
          <NumberEntry
            key={field}
            label={label}
            value={values[field as keyof typeof values]}
            step={field === 'area' ? '0.001' : '1'}
            change={(value) => change(field as keyof typeof values, value)}
          />
        ))}
      </div>
      <output
        className="mt-4 block text-base font-bold leading-7"
        aria-live="polite"
      >
        {valid
          ? '必要面積は ' +
            required +
            '㎡以上。入力した住宅は' +
            (area >= required!
              ? '面積条件を満たします。'
              : '面積条件を満たしません。')
          : ready
            ? '人数・面積を確認してください。人数は0〜30の整数、10歳以上は1人以上、妊娠中はその内数です。'
            : 'すべて入力すると、必要面積と照合結果が表示されます。'}
      </output>
      {onAnswer && (
        <Button
          type="button"
          disabled={!valid}
          className="mt-4 min-h-11 rounded-none bg-black px-4 text-white"
          onClick={() => {
            onAnswer(area >= required! ? 'yes' : 'no');
            setApplied(true);
          }}
        >
          {applied ? '回答に反映しました' : 'この計算結果を回答に使う'}
        </Button>
      )}
    </section>
  );
}

export function IncomeCalculator() {
  const [children, setChildren] = useState('');
  const [income, setIncome] = useState('');
  const result =
    children.trim() && income.trim()
      ? schoolIncomeComparison(Number(children), Number(income))
      : undefined;
  return (
    <section className="mt-5 border border-border bg-secondary p-5">
      <h3 className="text-lg font-bold">課税所得と基準を比べる</h3>
      <p className="my-3 text-sm leading-6">
        2026年6月以降の申請用。子どもは2010年1月2日〜2026年1月1日生まれを数えます。令和8年度の市県民税の課税所得を、保護者1人分ずつ入力してください。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberEntry
          label="上記の期間に生まれた子どもの人数（1〜6人）"
          value={children}
          change={setChildren}
        />
        <NumberEntry
          label="保護者1人の課税所得金額（円）"
          value={income}
          change={setIncome}
        />
      </div>
      <output className="mt-4 block font-bold leading-7" aria-live="polite">
        {result
          ? '基準額：' +
            result.threshold.toLocaleString('ja-JP') +
            '円。入力した保護者は' +
            (result.within
              ? '基準以下です。'
              : '基準を超えています。収入減少時は個別審査の案内も確認できます。')
          : '人数・課税所得を入力してください。人数が表の範囲外の場合は計算できません。'}
      </output>
      <p className="mt-3 text-sm leading-6">
        ひとり親等を除き、もう一人の保護者も同じ要件に該当する必要があります。ここでの結果だけで、世帯全体の回答は変更しません。
      </p>
    </section>
  );
}

function GuidanceBody({
  entry,
  onAnswer,
}: {
  entry: Guidance;
  onAnswer?: (value: YesNoUnknown) => void;
}) {
  return (
    <div className="space-y-3 py-4 text-base leading-8">
      {entry.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {entry.id === 'moving-area' && <AreaCalculator onAnswer={onAnswer} />}
      {entry.id === 'school-income' && <IncomeCalculator />}
      <p className="border-t border-border pt-3 text-sm text-muted-foreground">
        公式情報の要約・最終確認{' '}
        <time dateTime={entry.verifiedOn}>{entry.verifiedOn}</time>　
        <a
          className="inline-flex items-center gap-1 underline underline-offset-4"
          href={entry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          出典を開く
          <ExternalLink className="size-3" />
          <span className="sr-only">（新しいタブ）</span>
        </a>
      </p>
    </div>
  );
}

export function FieldGuidance({
  field,
  guidanceId,
  onAnswer,
}: {
  field?: keyof Profile;
  guidanceId?: string;
  onAnswer?: (value: YesNoUnknown) => void;
}) {
  const entries = officialGuidance.filter((entry) =>
    guidanceId
      ? entry.id === guidanceId
      : field && entry.fields.includes(field),
  );
  if (!entries.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {entries.map((entry) => (
        <details key={entry.id} className="border-t border-border">
          <summary className="cursor-pointer py-3 text-sm font-bold text-[#28637c]">
            条件をここで確認：{entry.title}
          </summary>
          <GuidanceBody entry={entry} onAnswer={onAnswer} />
        </details>
      ))}
    </div>
  );
}

export function ConditionGuide({
  programId,
  onOpen,
}: {
  programId?: string;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(programId ?? 'all');
  const id = useId();
  const results = searchGuidance(query, filter === 'all' ? undefined : filter);
  return (
    <section className="my-8 border-t-[3px] border-primary pt-6">
      <h2 className="flex items-center gap-2 text-2xl font-black">
        <BookOpen className="size-6 text-[#28637c]" />
        条件・手続きをサイト内で調べる
      </h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        公式情報をもとに整理した{officialGuidance.length}
        項目を検索できます。面積、校区、所得、申請先、必要書類など。実際の審査や証明書の確認が必要な場合も、その理由を説明します。
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_260px]">
        <div>
          <label htmlFor={id} className="mb-2 block text-sm font-bold">
            調べたい言葉
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-5 text-muted-foreground" />
            <Input
              id={id}
              type="search"
              placeholder="例：面積、香椎、所得、必要書類"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>
        <div>
          <span id={id + '-filter'} className="mb-2 block text-sm font-bold">
            制度で絞り込む
          </span>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value ?? 'all')}
          >
            <SelectTrigger
              aria-labelledby={id + '-filter'}
              className="h-12! w-full rounded-none border-[#93a9b3]"
            >
              <SelectValue>
                {filter === 'all'
                  ? 'すべての掲載制度'
                  : supportPrograms.find((program) => program.id === filter)
                      ?.benefitLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white text-foreground">
              <SelectItem value="all">すべての掲載制度</SelectItem>
              {supportPrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.benefitLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {['面積', '校区', '所得', '必要書類', '公務員', '過去'].map((word) => (
          <Button
            type="button"
            key={word}
            variant="outline"
            onClick={() => setQuery(word)}
            className="min-h-10 rounded-none"
          >
            {word}
          </Button>
        ))}
      </div>
      <output
        className="my-5 block text-sm text-muted-foreground"
        aria-live="polite"
      >
        {results.length}項目が見つかりました
      </output>
      <div className="space-y-3">
        {results.map((entry) => (
          <details key={entry.id} className="border border-border px-5">
            <summary className="cursor-pointer py-5 text-lg font-bold">
              {entry.title}
            </summary>
            <GuidanceBody entry={entry} />
            <div className="pb-4">
              {entry.programIds.map((program) => (
                <Button
                  type="button"
                  key={program}
                  variant="outline"
                  onClick={() => onOpen(program)}
                  className="min-h-11 rounded-none"
                >
                  この制度の条件を診断する
                </Button>
              ))}
            </div>
          </details>
        ))}
      </div>
      {!results.length && (
        <div className="border border-border bg-secondary p-6">
          <p className="leading-7">
            一致する説明が見つかりませんでした。別の言葉を使うか、制度の絞り込みを解除してください。未掲載の内容を推測して回答することはありません。
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11 rounded-none"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            検索条件をクリア
          </Button>
        </div>
      )}
    </section>
  );
}

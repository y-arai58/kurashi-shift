'use client';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import collection from '@/data/collection/regions-latest.json';

export function RegionDirectory({
  title = 'お住まい・転居先の地域を調べる',
  value,
  onChange,
  compact = false,
}: {
  title?: string;
  value?: string;
  onChange?: (value: string) => void;
  compact?: boolean;
}) {
  const [local, setLocal] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const id = useId();
  const selected = onChange
    ? (value ?? 'unknown')
    : (local ?? value ?? 'unknown');
  const region = collection.regions.find((r) => r.id === selected);
  const municipalities =
    region?.municipalities.filter((m) =>
      m.name.normalize('NFKC').includes(query.trim().normalize('NFKC')),
    ) ?? [];
  return (
    <section className="my-6 border border-border bg-secondary p-5">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7">
        全国共通の制度は地域によらず診断します。地域独自の制度は情報入口を収集した段階で、受給条件・金額・受付状況は未確認です。
      </p>
      <Select
        value={selected}
        onValueChange={(v) => {
          setLocal(v ?? 'unknown');
          onChange?.(v ?? 'unknown');
          setQuery('');
        }}
      >
        <SelectTrigger
          aria-labelledby={id}
          className="mt-4 h-12! w-full rounded-none bg-white"
        >
          <SelectValue>{region?.name ?? '都道府県を選ぶ（任意）'}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white text-foreground">
          <SelectItem value="unknown">未定・答えない</SelectItem>
          {collection.regions.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && region && (
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            {region.name}：{region.municipalities.length}地域の情報入口／収集日{' '}
            {region.fetchedOn}（制度の確認日ではありません）
          </p>
          <label className="block text-sm font-bold" htmlFor={id + '-search'}>
            市区町村名で絞り込む
          </label>
          <Input
            id={id + '-search'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-none bg-white"
            placeholder="例：糸島市"
          />
          <ul
            className="max-h-72 space-y-2 overflow-auto"
            aria-label="自治体情報の入口"
          >
            {municipalities.map((m) => (
              <li key={m.url}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white p-3 underline underline-offset-4"
                >
                  {m.name}の自治体投稿情報（外部）
                </a>
              </li>
            ))}
          </ul>
          {!municipalities.length && (
            <p>
              該当する情報入口がありません。制度がないという意味ではありません。
            </p>
          )}
          <a
            href={region.directoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block underline"
          >
            {region.name}の情報一覧へ（JOIN）
          </a>
        </div>
      )}
      {!compact && (
        <p className="mt-4 text-sm leading-6">
          出典：公益社団法人ふるさと回帰・移住交流推進機構
          JOIN。47都道府県の自治体投稿情報への入口です。全自治体・全制度の網羅を保証するものではありません。
        </p>
      )}
    </section>
  );
}

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';
import { supportPrograms } from '../lib/programs.ts';

const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(
  new Date(),
);
const directory = new URL('../data/collection/', import.meta.url);
await mkdir(directory, { recursive: true });
let previous;
try {
  previous = JSON.parse(
    await readFile(new URL('official-latest.json', directory), 'utf8'),
  );
} catch {}
const sources = [];
for (const program of supportPrograms) {
  await pause(600);
  const old = previous?.sources.find((s) => s.programId === program.id);
  const record = {
    programId: program.id,
    title: program.officialName,
    url: program.officialUrl,
    scope: program.scope,
    fetchedOn: day,
    contentReviewedOn: program.verifiedOn,
  };
  try {
    const response = await fetch(program.officialUrl, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'KurashiShiftSourceReview/1.0' },
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const html = await response.text();
    if (html.length < 500) throw new Error('Unexpectedly small page');
    const normalized = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const hash = createHash('sha256').update(normalized).digest('hex');
    sources.push({
      ...record,
      httpStatus: response.status,
      finalUrl: response.url,
      hash,
      change: !old ? 'new' : old.hash === hash ? 'unchanged' : 'changed',
      reviewRequired: true,
      meaning: '取得成功は制度内容の確認完了を意味しない',
    });
  } catch (error) {
    sources.push({
      ...record,
      change: 'fetch-failed',
      error: String(error),
      previousHash: old?.hash ?? null,
      reviewRequired: true,
    });
  }
}
const report = {
  fetchedOn: day,
  meaning: '月次再確認のための変更候補。確認日・判定条件は自動更新しない。',
  sources,
};
await writeFile(
  new URL(day + '-official.json', directory),
  JSON.stringify(report, null, 2) + '\n',
);
await writeFile(
  new URL('official-latest.json', directory),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    total: sources.length,
    failed: sources.filter((s) => s.change === 'fetch-failed').length,
    changed: sources.filter((s) => s.change === 'changed').length,
  }),
);

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';

// Directory discovery only: a collected link is never an eligibility decision.
const root = 'https://www.iju-join.jp';
const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(
  new Date(),
);
const out = new URL('../data/collection/', import.meta.url);
await mkdir(out, { recursive: true });
const fetchText = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'KurashiShiftSourceReview/1.0' },
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.text();
};
const html = await fetchText(root + '/prefectures/');
const pattern =
  /<a\s+href="(?:https:)?\/\/www\.iju-join\.jp\/prefectures\/([a-z]+)\/"[^>]*>\s*<img[^>]*alt="([^"]+)"/g;
const seeds = [
  ...new Map(
    [...html.matchAll(pattern)].map((m) => [
      m[1],
      {
        id: m[1],
        name: m[2],
        directoryUrl: root + '/prefectures/' + m[1] + '/',
      },
    ]),
  ).values(),
];
if (seeds.length !== 47)
  throw new Error(
    'Expected 47 prefectures, got ' +
      seeds.length +
      '. Preserve last snapshot and review markup.',
  );
let previous;
try {
  previous = JSON.parse(
    await readFile(new URL('regions-latest.json', out), 'utf8'),
  );
} catch {}
const regions = [];
for (const seed of seeds) {
  await pause(600);
  try {
    const body = await fetchText(seed.directoryUrl);
    const links = [
      ...body.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
    ].map((m) => ({
      url: new URL(m[1], seed.directoryUrl).href,
      name: m[2]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    }));
    const municipalities = [
      ...new Map(
        links
          .filter(
            (x) =>
              /\/prefectures\/[a-z]+\/\d+\/index\.html$/.test(x.url) && x.name,
          )
          .map((x) => [x.url, x]),
      ).values(),
    ];
    if (!municipalities.length)
      throw new Error('No municipality links: parser or source needs review');
    const digest = createHash('sha256')
      .update(JSON.stringify(municipalities))
      .digest('hex');
    const old = previous?.regions.find((x) => x.id === seed.id);
    regions.push({
      ...seed,
      fetchedOn: day,
      status: 'directory-collected',
      eligibilityReviewed: false,
      hash: digest,
      change: !old ? 'new' : old.hash === digest ? 'unchanged' : 'changed',
      municipalities,
    });
  } catch (error) {
    const old = previous?.regions.find((x) => x.id === seed.id);
    regions.push({
      ...seed,
      fetchedOn: day,
      status: 'fetch-failed',
      eligibilityReviewed: false,
      error: String(error),
      lastGoodSnapshot:
        old?.status === 'fetch-failed'
          ? old.lastGoodSnapshot
          : (old?.fetchedOn ?? null),
      hash: old?.hash ?? null,
      municipalities: old?.municipalities ?? [],
    });
  }
}
const report = {
  source: root + '/prefectures/',
  publisher:
    '公益社団法人ふるさと回帰・移住交流推進機構（自治体投稿の情報入口）',
  fetchedOn: day,
  scope:
    '47都道府県の情報入口。個別制度の内容・受付状況・受給条件は未確認。自治体網羅性の保証なし。',
  regions,
};
await writeFile(
  new URL(day + '-regions.json', out),
  JSON.stringify(report, null, 2) + '\n',
);
await writeFile(
  new URL('regions-latest.json', out),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    prefectures: regions.length,
    successful: regions.filter((r) => r.status !== 'fetch-failed').length,
    municipalityLinks: regions.reduce((n, r) => n + r.municipalities.length, 0),
  }),
);

import type {
  Evaluation,
  MatchStatus,
  Profile,
  SupportProgram,
} from './domain.ts';

export function todayInJapan(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(
    now,
  );
}

export function availability(program: SupportProgram, today = todayInJapan()) {
  if (program.applicationDeadline && today > program.applicationDeadline)
    return 'closed';
  if (today > program.reviewAfter) return 'review';
  return 'current';
}

export function applicationLabel(
  program: SupportProgram,
  today = todayInJapan(),
) {
  const state = availability(program, today);
  if (state === 'closed')
    return '掲載年度の受付期限を経過・最新年度を公式ページで確認';
  if (state === 'review') return '受付状況の再確認が必要';
  return program.applicationStatus;
}

export function evaluateProgram(
  program: SupportProgram,
  profile: Profile,
  today = todayInJapan(),
): Evaluation {
  const checked = program.criteria.map((criterion) => ({
    criterion,
    value: criterion.evaluate(profile),
  }));
  const matched = checked
    .filter((item) => item.value === true)
    .map((item) => item.criterion);
  const unknown = checked
    .filter((item) => item.value === undefined)
    .map((item) => item.criterion);
  const unmatched = checked
    .filter((item) => item.value === false)
    .map((item) => item.criterion);
  const state = availability(program, today);
  if (state === 'closed')
    unmatched.push({
      key: 'deadline',
      label: '掲載年度の申請期限を過ぎています',
      evaluate: () => false,
    });
  else if (state === 'review')
    unknown.push({
      key: 'freshness',
      label: '制度内容・受付状況の再確認が必要です',
      evaluate: () => undefined,
    });
  const status: MatchStatus =
    unmatched.length > 0
      ? 'future'
      : unknown.length > 0
        ? 'needs-info'
        : 'eligible';
  const score = program.criteria.length
    ? Math.round((matched.length / program.criteria.length) * 100)
    : 0;
  return { program, status, matched, unknown, unmatched, score };
}

export function evaluatePrograms(
  programs: SupportProgram[],
  profile: Profile,
  today = todayInJapan(),
): Evaluation[] {
  if (profile.residence !== 'fukuoka') return [];
  const rank: Record<MatchStatus, number> = {
    eligible: 0,
    'needs-info': 1,
    future: 2,
  };
  return programs
    .filter((program) => program.isRelevant?.(profile) ?? true)
    .map((program) => evaluateProgram(program, profile, today))
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        b.score - a.score ||
        a.program.id.localeCompare(b.program.id),
    );
}

export function candidateResults(results: Evaluation[]) {
  return results.filter((result) => result.status !== 'future');
}

export function compareProfiles(
  programs: SupportProgram[],
  before: Profile,
  after: Profile,
  today = todayInJapan(),
) {
  const current = candidateResults(evaluatePrograms(programs, before, today));
  const next = candidateResults(evaluatePrograms(programs, after, today));
  const currentById = new Map(
    current.map((result) => [result.program.id, result]),
  );
  const nextById = new Map(next.map((result) => [result.program.id, result]));
  const signature = (result: Evaluation) =>
    result.matched
      .map((item) => item.key)
      .sort()
      .join(',');
  return {
    current,
    next,
    added: next.filter((result) => !currentById.has(result.program.id)),
    removed: current.filter((result) => !nextById.has(result.program.id)),
    changed: next.filter((result) => {
      const previous = currentById.get(result.program.id);
      return (
        previous &&
        (previous.status !== result.status ||
          signature(previous) !== signature(result))
      );
    }),
    unchanged: next.filter((result) => {
      const previous = currentById.get(result.program.id);
      return (
        previous &&
        previous.status === result.status &&
        signature(previous) === signature(result)
      );
    }),
  };
}

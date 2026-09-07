import type {
  Evaluation,
  MatchStatus,
  Profile,
  SupportProgram,
} from './domain';

export function evaluateProgram(
  program: SupportProgram,
  profile: Profile,
): Evaluation {
  const matched = program.criteria.filter(
    (criterion) => criterion.evaluate(profile) === true,
  );
  const unknown = program.criteria.filter(
    (criterion) => criterion.evaluate(profile) === undefined,
  );
  const unmatched = program.criteria.filter(
    (criterion) => criterion.evaluate(profile) === false,
  );
  const status: MatchStatus =
    unmatched.length > 0
      ? 'future'
      : unknown.length > 0
        ? 'needs-info'
        : 'eligible';
  const score = Math.round((matched.length / program.criteria.length) * 100);
  return { program, status, matched, unknown, unmatched, score };
}

export function evaluatePrograms(
  programs: SupportProgram[],
  profile: Profile,
): Evaluation[] {
  const rank: Record<MatchStatus, number> = {
    eligible: 0,
    'needs-info': 1,
    future: 2,
  };
  return programs
    .filter((program) => program.isRelevant?.(profile) ?? true)
    .map((program) => evaluateProgram(program, profile))
    .filter((result) => result.matched.length > 0 || result.unknown.length > 0)
    .sort((a, b) => rank[a.status] - rank[b.status] || b.score - a.score);
}

export function compileFunction<A extends unknown[], R>(
  scope: string,
  script: unknown,
  fallback: NoInfer<(...args: A) => R>,
  ...args: NoInfer<{ [P in keyof A]: string }>
): (...args: A) => R {
  if (typeof script !== "string" || !script) return fallback;
  try {
    const f = new Function(...args, script);
    return (...args) => {
      try {
        return f(...args);
      } catch (err) {
        console.error(`${scope} runtime error`, err);
        return fallback(...args);
      }
    };
  } catch (err) {
    console.error(`${scope} compile error`, script, err);
    return fallback;
  }
}

export function compileRegex(
  scope: string,
  regexString: unknown,
  flags?: string,
  fallback: RegExp = new RegExp("")
) {
  if (typeof regexString !== "string" || !regexString) return fallback;
  try {
    return new RegExp(regexString ?? "", flags);
  } catch (err) {
    console.error(`${scope} parsing error`, regexString, err);
    return fallback;
  }
}

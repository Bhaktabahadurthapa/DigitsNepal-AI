/** Minimal structured JSON logger. Never pass document contents or secrets as fields. */
type Fields = Record<string, unknown>;

function write(level: "debug" | "info" | "warn" | "error", msg: string, fields?: Fields) {
  if (level === "debug" && process.env.LOG_LEVEL !== "debug") return;
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...fields });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, f?: Fields) => write("debug", m, f),
  info: (m: string, f?: Fields) => write("info", m, f),
  warn: (m: string, f?: Fields) => write("warn", m, f),
  error: (m: string, f?: Fields) => write("error", m, f),
};

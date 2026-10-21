import net from "node:net";

export type ScanResult = { status: "clean" | "infected" | "skipped" | "error"; detail?: string };

/**
 * Optional malware scan through a ClamAV daemon (INSTREAM protocol). When CLAMAV_HOST is unset the
 * scan is skipped and that fact is recorded; it is not reported as "clean".
 */
export async function scanBytes(bytes: Uint8Array): Promise<ScanResult> {
  const hostport = process.env.CLAMAV_HOST;
  if (!hostport) return { status: "skipped", detail: "scanner_not_configured" };
  const [host, port] = hostport.split(":");
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port: Number(port ?? 3310) });
    let reply = "";
    sock.setTimeout(20000, () => {
      sock.destroy();
      resolve({ status: "error", detail: "timeout" });
    });
    sock.on("error", (e) => resolve({ status: "error", detail: e.message }));
    sock.on("data", (d) => (reply += d.toString()));
    sock.on("end", () => resolve(/OK\s*$/.test(reply.trim()) ? { status: "clean" } : /FOUND/.test(reply) ? { status: "infected", detail: reply.trim() } : { status: "error", detail: reply.trim() }));
    sock.on("connect", () => {
      sock.write("zINSTREAM\0");
      for (let i = 0; i < bytes.length; i += 64 * 1024) {
        const part = bytes.subarray(i, i + 64 * 1024);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(part.length);
        sock.write(len);
        sock.write(part);
      }
      sock.write(Buffer.alloc(4));
    });
  });
}

import { RECAP_COVER_PROBE_TIMEOUT_MS } from "../../constants";

export function probeRecapCoverSrc(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(false);
      return;
    }

    const image = new Image();
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(ok);
    };

    const timer = window.setTimeout(() => {
      image.src = "";
      finish(false);
    }, RECAP_COVER_PROBE_TIMEOUT_MS);

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = src;
  });
}

export async function probeRecapCoverSrcs(srcs: string[]): Promise<string[]> {
  const unique = [...new Set(srcs)];
  const results = await Promise.all(
    unique.map(async (src) => ({
      src,
      ok: await probeRecapCoverSrc(src),
    })),
  );

  return results.filter((result) => !result.ok).map((result) => result.src);
}

export default probeRecapCoverSrc;

"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const c = cards[i];
  return (
    <section aria-labelledby="fc" className="mt-8">
      <h2 id="fc" className="text-lg font-semibold">{t.player.flashcards}</h2>
      <div className="mt-3 rounded-xl border border-line bg-surface p-6 text-center" aria-live="polite">
        <p className="text-xs text-muted">{i + 1} / {cards.length}</p>
        <p className="mt-3 min-h-16 text-lg font-medium">{flipped ? c.back : c.front}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={i === 0} onClick={() => { setI(i - 1); setFlipped(false); }}>{t.common.previous}</Button>
          <Button variant="navy" size="sm" onClick={() => setFlipped(!flipped)} aria-pressed={flipped}><RotateCcw aria-hidden /> {t.player.flip}</Button>
          <Button variant="outline" size="sm" disabled={i === cards.length - 1} onClick={() => { setI(i + 1); setFlipped(false); }}>{t.common.next}</Button>
        </div>
      </div>
    </section>
  );
}

// src/components/impact/ImpactStats.jsx
import { accentText, accentBg } from '../../utils/accentClasses';
import Reveal from '../Reveal';
import Counter from '../Counter';

export default function ImpactStats({ stats }) {
  // Ensure stats is always an array
  const safeStats = Array.isArray(stats) ? stats : [];

  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
        {safeStats.map((stat, i) => (
          <Reveal key={stat.label || i} delay={i * 80}>
            <div>
              <p className={`font-display text-4xl md:text-5xl mb-3 ${accentText[stat.accentClass]}`}>
                {/* Guard against undefined target */}
                <Counter to={stat.target || 0} suffix={stat.suffix || ''} />
              </p>

              <div className={`w-10 h-1 mb-3 ${accentBg[stat.accentClass]}`} />

              <p className="text-xs uppercase tracking-wide text-ink/70">
                {stat.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
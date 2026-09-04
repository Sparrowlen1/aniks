import { PILLARS } from "../../../data/pillars";
import { accentText } from "../../../utils/accentClasses";
import Reveal from "./Reveal.jsx";

const ALL_OPTION = { slug: "all", name: "All"};

const PillarFilter = ({ active, onChange }) => {
  const options = [ALL_OPTION, ...PILLARS];

  return (
    <Reveal>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10">
        {options.map((pillar) => {
          const isActive = pillar.slug === active;
          const colorClass = pillar.slug === "all" ? "text-ink" : accentText[pillar.accentClass];

          return (
            <button
              key={pillar.slug}
              type="button"
              onClick={() => onChange(pillar.slug)}
              aria-pressed={isActive}
              className={`text-sm font-semibold uppercase tracking-wide pb-1 border-b-2 transition-colors duration-200 ${
                isActive
                  ? `${colorClass} border-current`
                  : "text-ink/50 border-transparent hover:text-ink"
              }`}
            >
              {pillar.name}
            </button>
          );
        })}
      </div>
    </Reveal>
  );
};

export default PillarFilter;
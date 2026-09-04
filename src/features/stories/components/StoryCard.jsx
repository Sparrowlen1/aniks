import { Link } from "react-router-dom";
import { pillarColors, getPillarBySlug } from "../../../data/pillars";

// Original pillar pill
const tagClasses = {
  coral: "bg-coral/10 text-coral",
  gold: "bg-gold/10 text-gold",
  "anika-blue": "bg-anika-blue/10 text-anika-blue",
  "anika-green": "bg-anika-green/10 text-anika-green",
  ink: "bg-ink/10 text-ink",
};

// Solid ribbon badge colors
const badgeClasses = {
  coral: "bg-coral text-cream",
  gold: "bg-gold text-ink",
  "anika-blue": "bg-anika-blue text-cream",
  "anika-green": "bg-anika-green text-cream",
  ink: "bg-ink text-cream",
};

const foldClasses = {
  coral: "border-t-coral",
  gold: "border-t-gold",
  "anika-blue": "border-t-anika-blue",
  "anika-green": "border-t-anika-green",
  ink: "border-t-ink",
};

const formatDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SAMPLE_DATES = [
  "Feb 25, 2026",
  "Feb 4, 2026",
  "Jan 18, 2026",
  "Dec 12, 2025",
  "Nov 3, 2025",
  "Sep 4, 2025",
];

const fallbackDate = (key) => {
  const str = String(key ?? "story");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % SAMPLE_DATES.length;
  }
  return SAMPLE_DATES[hash];
};

const StoryCard = ({ story }) => {
  const colorToken = pillarColors[story.pillar] ?? "ink";
  const pillarName = getPillarBySlug(story.pillar)?.name ?? story.pillar;
  const date = formatDate(story.date) ?? fallbackDate(story.id ?? story.slug ?? story.title);

  return (
    <article className="flex flex-col h-full overflow-hidden rounded-lg bg-white/40 shadow-sm">
      <div className="aspect-4/3 overflow-hidden bg-ink/10 shrink-0">
        <img
          src={story.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Date ribbon — pulled up to overlap the image's bottom edge */}
        <div className="-mt-9 mb-4 flex items-start">
          <span className="relative inline-block">
            <span
              className={`inline-block rounded-sm px-3 py-1.5 font-body text-xs font-semibold shadow-sm ${badgeClasses[colorToken]}`}
            >
              {date}
            </span>
            <span
              className={`absolute -bottom-1.5 left-0 h-0 w-0 border-l-[6px] border-l-transparent border-t-[6px] brightness-75 ${foldClasses[colorToken]}`}
            />
          </span>
        </div>

        <span
          className={`self-start rounded-full px-3 py-1 font-body text-xs uppercase tracking-wide ${tagClasses[colorToken]}`}
        >
          {pillarName}
        </span>

        <h3 className="font-bold text-xl mt-4 mb-2 text-ink leading-snug line-clamp-2">
          {story.title}
        </h3>

        <p className="font-body text-base text-ink/65 leading-relaxed flex-1 line-clamp-4">
          {story.excerpt}
        </p>

        <Link
          to={`/stories/${story.slug}`}
          className="mt-6 inline-flex self-start items-center gap-2 rounded-full bg-anika-blue px-5 py-2 font-body text-sm font-semibold text-cream transition-colors duration-200 hover:bg-coral shrink-0"
        >
          Read More
        </Link>
      </div>
    </article>
  );
};

export default StoryCard;
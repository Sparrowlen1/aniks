import { useParams, Link } from "react-router-dom";
import StoryDetail from "./components/StoryDetail.jsx";
import { storiesStore } from "../../data/storiesStore";
import { useState, useEffect, useCallback } from "react";
import Reveal from "./components/Reveal.jsx";

export default function StoryDetailView() {
  const { slug } = useParams();
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStory = useCallback(async () => {
    setIsLoading(true);
    try {
      const found = await storiesStore.getBySlug(slug);
      setStory(found);
    } catch (error) {
      console.error("Failed to load story:", error);
      setStory(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadStory();
    const unsubscribe = storiesStore.subscribe(loadStory);
    return unsubscribe;
  }, [loadStory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="px-6 py-24 text-center">
        <Reveal>
          <p className="font-body text-base text-ink/55 mb-4">
            We couldn't find that story.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <Link
            to="/stories"
            className="font-body text-sm px-7 py-2.5 rounded border border-ink text-ink hover:bg-ink hover:text-cream transition-colors duration-200"
          >
            Back to stories
          </Link>
        </Reveal>
      </div>
    );
  }

  return <StoryDetail story={story} />;
}

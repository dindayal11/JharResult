
import type { PostRow } from "@/lib/posts";

function isRecentlyPublished(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const publishedAt = new Date(value).getTime();
  const age = Date.now() - publishedAt;
  return Number.isFinite(publishedAt) && age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
}

export default function PostCard({ post }: { post: PostRow }) {
  const isNew = isRecentlyPublished(post.published_at);

  return (
    <article className="update-row">
      <span className="update-bullet">›</span>

      <div className="update-copy">
        <div className="update-title-line">
          <a href={`/post/${post.slug}`} className="update-title">
            {post.title}
          </a>
          {isNew && <span className="new-badge">NEW</span>}
        </div>
      </div>
    </article>
  );
}

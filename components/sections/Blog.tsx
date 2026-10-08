import { sortedPosts } from "@/data/blog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/animations/Reveal";
import { PostCard } from "./blog/PostCard";

export function Blog() {
  return (
    <section id="blog" data-mood="calm" aria-labelledby="blog-title" className="container-x py-section">
      <SectionHeader
        index="06"
        eyebrow="Writing"
        title={["Notes from", "shipping Android."]}
        lead="Problems I hit in production, what the fix turned out to be, and the platform changes worth reading before they land on you."
      />

      <div className="border-b border-line">
        {sortedPosts.map((post, i) => (
          <Reveal key={post.slug} index={i % 4}>
            <PostCard post={post} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

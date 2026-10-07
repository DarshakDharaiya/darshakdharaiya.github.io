import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="container-x flex min-h-svh flex-col items-start justify-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-6 text-h1 font-semibold">
        Lost in the <span className="font-serif font-normal italic text-fg-muted">particles.</span>
      </h1>
      <p className="mt-6 max-w-md text-lead text-fg-muted">This page drifted out of view. Let&apos;s get you back.</p>
      <div className="mt-10">
        <Button href="/" arrow="right" transitionTypes={["page-back"]}>
          Back home
        </Button>
      </div>
    </main>
  );
}

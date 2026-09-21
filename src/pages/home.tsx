import {
  ArrowRight,
  GraduationCap,
  Layers,
  Link2,
  MoonStar,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Carousel, CarouselItem } from "@/components/carousel";
import { EntryCard } from "@/components/entry-card";
import { Button } from "@/components/ui/button";
import { EyePlusIcon } from "@/components/ui/icon";
import { docs, posts } from "@/lib/content";
import { site } from "@/site";

const FEATURES = [
  {
    icon: Layers,
    title: "Four buckets per section",
    body: "TL;DR, steps, nuances, interview must-knows. No wall of prose to get lost in.",
  },
  {
    icon: GraduationCap,
    title: "Graded recall quiz",
    body: "Scenario questions, not recall. You find out what you actually absorbed, scored one at a time.",
  },
  {
    icon: EyePlusIcon,
    title: "Bionic reading",
    body: "A fixation prefix on every word, toggleable, so your eye has somewhere to land.",
  },
  {
    icon: Smartphone,
    title: "Reads on a phone",
    body: "Sections collapse into one sticky dropdown that tracks where you are as you scroll.",
  },
  {
    icon: MoonStar,
    title: "Dark mode, no flash",
    body: "Your theme is read from storage before the first pixel paints, so there is never a light flash.",
  },
  {
    icon: Link2,
    title: "Verified practice links",
    body: "Every practice exercise and further-reading link is opened and checked before it ships.",
  },
] as const;

export const Home = () => (
  <div>
    <section className="py-6">
      <h1 className="max-w-[18ch] text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[44px]">
        Learning docs that survive a short attention span.
      </h1>
      <p className="mt-4 max-w-[60ch] text-[17px] text-[var(--text-muted)]">
        A format and a Claude skill for turning a topic into one interactive
        page: short sections, real code, and a graded quiz that forces active
        recall instead of rereading.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/docs">
          <Button variant="primary">Read the docs</Button>
        </Link>
        <Link to="/how-it-works">
          <Button variant="outline">Use the skill</Button>
        </Link>
      </div>
    </section>

    <section className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <img
          src={site.author.avatar}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="eyebrow">Why I built this</p>
          <div className="mt-2 max-w-[62ch] space-y-3 text-[15px] leading-relaxed text-[var(--text)] sm:text-[16px]">
            <p>
              I used to think a technical doc was good if it read smoothly. Then
              I would close it, get asked one real question about the system it
              described, and realize I could not answer it. The doc felt like it
              worked. My memory said otherwise.
            </p>
            <p>
              So I stopped writing for how a doc feels while you read it, and
              started writing for what is still in your head a week later. Every
              piece of this format exists to serve that: short sections instead
              of a wall of prose, a graded quiz instead of a "did that make
              sense" feeling, and a glossary you can tap instead of one you have
              to remember.
            </p>
            <p>
              I use this on myself first. Every doc in here is something I
              needed to actually know, not just recognize. If a section does not
              survive being closed and recalled from memory, I rewrite it until
              it does.
            </p>
          </div>
          <p className="mt-3 text-[13px] text-[var(--text-muted)]">
            {"- "}
            <a
              href={site.author.url}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--primary)]"
            >
              {site.author.name}
            </a>
          </p>
        </div>
      </div>
    </section>

    <section className="mt-14">
      <h2 className="text-lg font-semibold tracking-tight">Why it works</h2>
      <Carousel className="mt-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <CarouselItem key={title} className="w-[min(85vw,320px)]">
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="m-0 text-[16px] font-semibold">{title}</p>
              <p className="m-0 text-[14px] leading-relaxed text-[var(--text-muted)]">
                {body}
              </p>
            </div>
          </CarouselItem>
        ))}
      </Carousel>
    </section>

    {docs.length > 0 && (
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Latest docs</h2>
          <Link
            to="/docs"
            className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-[var(--primary)]"
          >
            All docs
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <Carousel className="mt-4">
          {docs.slice(0, 8).map((entry) => (
            <CarouselItem key={entry.slug} className="w-[min(88vw,360px)]">
              <EntryCard entry={entry} />
            </CarouselItem>
          ))}
        </Carousel>
      </section>
    )}

    {posts.length > 0 && (
      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">From the blog</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {posts.slice(0, 2).map((entry) => (
            <EntryCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
    )}
  </div>
);

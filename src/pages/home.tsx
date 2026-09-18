import { Link } from 'react-router-dom'
import { EntryCard } from '@/components/entry-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { docs, posts } from '@/lib/content'

const PITCH = [
  ['Four buckets per section', 'TL;DR, steps, nuances, interview must-knows. No wall of prose to get lost in.'],
  ['Graded recall quiz', 'Scenario questions, not recall. You find out what you actually absorbed.'],
  ['Bionic reading', 'A fixation prefix on every word, toggleable, so your eye has somewhere to land.'],
  ['Reads on a phone', 'Sections collapse into one sticky dropdown that tracks where you are.'],
] as const

export const Home = () => (
  <div>
    <section className="py-6">
      <h1 className="max-w-[18ch] text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[44px]">
        Learning docs that survive a short attention span.
      </h1>
      <p className="mt-4 max-w-[60ch] text-[17px] text-[var(--text-muted)]">
        A format and a Claude skill for turning a topic into one interactive page: short sections,
        real code, and a graded quiz that forces active recall instead of rereading.
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

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PITCH.map(([title, body]) => (
        <Card key={title}>
          <p className="m-0 text-sm font-semibold">{title}</p>
          <p className="mt-1.5 mb-0 text-[13px] text-[var(--text-muted)]">{body}</p>
        </Card>
      ))}
    </div>

    {docs.length > 0 && (
      <section className="mt-14">
        <h2 className="text-lg font-semibold tracking-tight">Latest docs</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {docs.slice(0, 4).map((entry) => (
            <EntryCard key={entry.slug} entry={entry} />
          ))}
        </div>
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
)

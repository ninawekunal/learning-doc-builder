import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout";
import { ScrollToTop } from "@/components/scroll-to-top";
import { EntryPage } from "@/pages/entry-page";
import { Home } from "@/pages/home";
import { HowItWorks } from "@/pages/how-it-works";
import { ListPage } from "@/pages/list-page";
import { docs, posts } from "@/lib/content";
import { useBionic } from "@/lib/prefs";

// HashRouter keeps deep links working on GitHub Pages with no 404 rewrite.
export const App = () => {
  const { bionic, toggleBionic } = useBionic();

  return (
    <HashRouter>
      <ScrollToTop />
      <Layout bionic={bionic} onToggleBionic={toggleBionic}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/docs"
            element={
              <ListPage
                title="Published docs"
                blurb="One page per topic: short sections, real code, and a graded quiz at the end."
                entries={docs}
                topical
              />
            }
          />
          <Route
            path="/docs/:slug"
            element={<EntryPage kind="doc" bionic={bionic} />}
          />
          <Route
            path="/blog"
            element={
              <ListPage
                title="Blog"
                blurb="Shorter pieces, same reading controls."
                entries={posts}
              />
            }
          />
          <Route
            path="/blog/:slug"
            element={<EntryPage kind="blog" bionic={bionic} />}
          />
          <Route
            path="/how-it-works"
            element={<HowItWorks bionic={bionic} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function assertIncludes(relativePath, expected) {
  assert.match(file(relativePath), expected, `${relativePath} should include ${expected}`);
}

function assertNotIncludes(relativePath, unexpected) {
  assert.doesNotMatch(file(relativePath), unexpected, `${relativePath} should not include ${unexpected}`);
}

const removedLegacyFiles = [
  "components/GoogleSignIn.js",
  "components/GoogleScript.js",
  "components/SubscribeForm.js",
  "components/header.js",
  "components/bookmark/Header.js",
  "components/workspace/FloatingCommandBar.js",
  "components/workspace/WorkspaceShell.js",
  "contexts/AuthContext.js",
  "lib/auth.js",
  "lib/voteUtils.js",
  "styles/components/_workspace.scss",
  "styles/layout/_header.scss",
  "styles/layout/_bookmarkHeader.scss",
];

for (const relativePath of removedLegacyFiles) {
  assert.equal(exists(relativePath), false, `${relativePath} should remain removed`);
}

assertIncludes("components/figma/FigmaResourceLayout.js", /function BottomHeader/);
assertIncludes("components/figma/FigmaResourceLayout.js", /figma-bottom-header__panel-toggle/);
assertIncludes("components/figma/FigmaResourceLayout.js", /WebsiteRequestForm/);
assertIncludes("components/figma/FigmaResourceLayout.js", /RealtimeCursors/);
assertIncludes("components/figma/FigmaResourceLayout.js", /Mocked answer/);
assertIncludes("components/figma/FigmaResourceLayout.js", /href="\/works"/);
assertIncludes("components/figma/FigmaResourceLayout.js", /href="\/\?node=about-ryan"/);
assertIncludes("components/figma/FigmaResourceLayout.js", /PanelRightOpen|PanelRightClose/);

assertIncludes("styles/components/_figmaRedesign.scss", /\.figma-cursors[\s\S]*z-index: 90/);
assertIncludes("styles/components/_figmaRedesign.scss", /\.figma-bottom-header[\s\S]*z-index: 90/);
assertIncludes("styles/components/_figmaRedesign.scss", /\.figma-bottom-header__panel-toggle[\s\S]*border-left/);
assertIncludes("styles/main.scss", /components\/figmaRedesign/);
assertNotIncludes("styles/main.scss", /components\/workspace|layout\/header|layout\/bookmarkHeader/);

assertIncludes("pages/index.js", /FigmaResourceLayout/);
assertIncludes("pages/index.js", /FigmaProfileLayout/);
assertIncludes("pages/bookmarks/index.js", /bookmark_categories/);
assertIncludes("pages/bookmarks/index.js", /bookmark_tags/);
assertIncludes("pages/bookmarks/index.js", /bookmarks_public/);
assertIncludes("pages/bookmarks/index.js", /categories=\{availableCategories\}/);
assertIncludes("pages/bookmarks/index.js", /tags=\{availableTags\}/);

assertIncludes("pages/works/index.js", /FigmaResourceLayout/);
assertIncludes("pages/works/index.js", /getPublishedPosts/);
assertIncludes("pages/works/index.js", /generatedEssays/);
assertIncludes("pages/works/[slug].js", /getPostContent/);
assertIncludes("pages/works/[slug].js", /NotionBlockRenderer/);
assertIncludes("pages/works/[slug].js", /relatedResourceCount/);
assertIncludes("pages/side-hustle/index.js", /FigmaResourceLayout/);
assertIncludes("pages/works-portfolio-backup/index.js", /FigmaResourceLayout/);
assertIncludes("pages/works-portfolio-backup/[slug].js", /FigmaDetailLayout/);

assertIncludes("pages/auth/callback.js", /Login removed/);
assertNotIncludes("pages/auth/callback.js", /supabase\.auth|GoogleSignIn/);
assertNotIncludes("styles/base/_typography.scss", /fonts\.googleapis|static\.toss|@import url/);

const searchableSources = [
  "pages/index.js",
  "pages/bookmarks/index.js",
  "pages/works/index.js",
  "pages/works/[slug].js",
  "pages/side-hustle/index.js",
  "components/figma/FigmaResourceLayout.js",
  "lib/supabase.js",
  "styles/main.scss",
];

const forbiddenPatterns = [
  /Command Menu/,
  /command-palette/,
  /workspace-status-command/,
  /GoogleSignIn/,
  /AuthContext/,
  /ensureAuthenticated/,
  /supabase\.auth/,
];

for (const relativePath of searchableSources) {
  for (const pattern of forbiddenPatterns) {
    assertNotIncludes(relativePath, pattern);
  }
}

console.log("Figma redesign verification passed.");

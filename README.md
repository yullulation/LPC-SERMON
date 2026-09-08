# Sermon Recap Carousel — Life Pool Chapel

A tiny website with exactly one job: paste a sermon transcript, pick a
template, and copy a set of instructions. Those instructions go into a
Claude chat that has Canva connected — that chat drafts the captions, builds
the real carousel inside the real Canva template, and hands back finished
download links right there in the chat.

**This is a plain static website.** No server, no database, no API key,
nothing to run or restart. It's just an `index.html`, some CSS, and a
little JavaScript — everything happens in the visitor's own browser. That's
what makes it free and simple to host: any static hosting service works,
including Vercel.

## How it works, step by step

1. **Someone opens the site** (works fine on a phone).
2. **They choose a template**, paste the full sermon transcript, and tap
   "Copy instructions for Claude."
3. **They open a Claude chat that has Canva connected** — the church's
   Canva account, connected once to a Claude Pro/Max chat (see "Setting up
   Canva" below) — paste, and send.
4. **Claude does the actual work in that chat**: drafts the slide captions
   from the transcript, makes a safe copy of the real Canva template (never
   touching the original), edits the copy page by page, exports it as PNGs,
   and posts the download links back in that same chat.
5. **They tap each link** to save the images — on a phone this is just
   "tap, then save image," no extra app needed.

The website's role stops at step 2. Everything past that happens in Claude.

## Setting up Canva (one-time, for whoever generates carousels)

1. The generating person needs a **Claude Pro or Max plan** — a paid plan is
   what's required to add a connector (like Canva) to a conversation at all.
   It's not that paid Claude "does more" in general — this one specific
   feature (connectors) needs it.
2. In that Claude account, connect the **Canva connector** (via
   claude.ai → Settings → Connectors, or the equivalent in the Claude app),
   signing in with the church's Canva account when prompted.
3. That's it — from then on, pasting the copied instructions into a new chat
   in that account gives Claude everything it needs.

## Hosting it on Vercel (recommended — free, and updates itself)

Everything the site needs lives in the `public/` folder. To host it:

1. **Push `public/` to a GitHub repo.** Create a new repo on GitHub, then
   from this project's folder:
   ```
   git init
   git add public .gitignore README.md
   git commit -m "Sermon Recap Carousel — static site"
   git branch -M main
   git remote add origin <your GitHub repo URL>
   git push -u origin main
   ```
2. **Import the repo into Vercel** — vercel.com → Add New → Project → pick
   the GitHub repo.
3. **Set the project's Root Directory to `public`** (Vercel asks for this
   during import, under "Configure Project" → "Root Directory" → Edit →
   choose `public`). Leave Framework Preset as "Other" and leave the
   build/output settings blank — there's nothing to build.
4. Click **Deploy**. Vercel gives you a live URL in about a minute.

From then on, any time you `git push` a change (like adding a new
template), Vercel redeploys automatically — no restarting anything, ever.

## Running it locally to preview

Since it's just static files, any static server works. For example:

```
npx serve public
```

(Opening `public/index.html` directly by double-clicking it won't work —
browsers block the `fetch` this page uses to load `templates.json` when
opened as a bare file. A tiny local server, or the real Vercel deployment,
both work fine.)

## Adding a new template

Each template needs to be "taught" to the site once — this is a short
Claude conversation task, not something you do by hand:

1. Design the new template in Canva as usual, and note its Canva design ID
   (from the design's share link) and exactly which text box on each page
   is which (cover quote, headline, highlight, paragraph, etc.).
2. Tell Claude you're adding a new template, share the design, and ask it to
   add a new entry to `public/templates.json` — a `"canva"` block like the
   one already there for "Bishop Said — Classic Green," describing the
   design ID, page ranges, and a plain-language description of each text
   box's role. Also drop in a thumbnail image under
   `public/assets/templates/<your-template-name>/`.
3. No other code changes are needed — `public/js/app.js` reads that config
   to build instructions for any template listed there. Commit and push,
   and Vercel picks it up automatically.

## Project layout

```
public/
  index.html              — the page (template picker, transcript box, one button)
  css/style.css            — styling
  js/app.js                — loads templates.json and builds the Claude+Canva instructions
  templates.json           — the list of templates, including each one's Canva setup
  assets/templates/        — thumbnail images for the template picker
```

Everything outside `public/` (the old Node.js server, from an earlier
version of this project) is no longer used and isn't pushed to GitHub — see
`.gitignore`.

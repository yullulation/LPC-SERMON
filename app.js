// This entire site is static — there is no server. Everything it needs
// (the template list and the recipe-building logic below) runs right here
// in the browser. That's on purpose: nothing here needs a secret or a paid
// API key, so there's nothing a backend would need to protect.

const templatesEl = document.getElementById("templates");
const transcriptEl = document.getElementById("transcript");
const copyBtn = document.getElementById("copy-btn");
const copyStatus = document.getElementById("copy-status");

let selectedTemplate = null;
let templatesCache = [];

// --- Builds the copy-pasteable instructions for a Claude conversation that
// has Canva connected. Mirrors server/lib/canvaPrompt.js from the old
// Node version of this app, just translated to plain browser JS. ---------

function buildCanvaPrompt(template, transcript) {
  const canva = template.canva;
  if (!canva) {
    throw new Error(`Template "${template.id}" isn't set up for Canva yet.`);
  }

  const [firstContentPage, lastContentPage] = canva.contentPageRange;
  const slideCount = lastContentPage - firstContentPage + 1;

  return `You are producing a finished "Sermon Recap Carousel" — an Instagram carousel recapping one Sunday sermon — for Life Pool Chapel. You have a live connection to Canva. Follow every step below, in order, using your Canva tools.

STEP 1 — Draft the text content
Read the sermon transcript at the bottom of this message. Draft:
- coverQuote: something the preacher could plausibly have said, capturing the sermon's core idea, in 2 words (3 only if truly unavoidable). Never punctuation-heavy, never a full sentence.
- Exactly ${slideCount} slide points (this template has exactly ${slideCount} content slides — not more, not fewer), each with:
  - headline: 1-2 very short words (may include a literal newline to force a line break)
  - highlight: ONE word, 7 characters or fewer, ALL CAPS. The headline and highlight should read as one short phrase together when combined (e.g. headline "Living" + highlight "STONES" reads "Living Stones"; headline "Not \\na" + highlight "DUTY" reads "Not a Duty").
  - paragraph: 150-260 characters, a short teaching grounded in the sermon, citing a scripture reference in parentheses like "(1 Peter 2:5)", written in second-person ("you") voice, reading like a real caption someone wrote — not a summary.
  - number: "1" through "${slideCount}" in order.
Base everything strictly on what is actually said in the transcript. Don't invent scripture references that weren't part of the sermon unless they're extremely well-known companion verses.

STEP 2 — Make a safe copy of the real template
The master template's Canva design ID is: ${canva.designId} ("${canva.designName}").
Call copy-design on that ID first. NEVER edit that original design directly — always make your changes on the fresh copy copy-design gives you. Every step below happens on that copy, never the original.

STEP 3 — Edit the copy
Call read-design on your copy with open_transaction: true (fields including design_content) so you can see every page's real text elements and their locator_ids. The design has ${canva.totalPages} pages: page ${canva.coverPage} is the cover, pages ${firstContentPage}-${lastContentPage} are the ${slideCount} content slides, page ${canva.closingPage} is the closing card.

On page ${canva.coverPage} (the cover): find ${canva.coverRole} Replace only that text with your drafted coverQuote.

On each of pages ${firstContentPage}-${lastContentPage}, in order, for your slides 1-${slideCount} respectively: find ${canva.slideRoles.headline}, ${canva.slideRoles.highlight}, and ${canva.slideRoles.paragraph}. Replace each with that slide's headline, highlight, and paragraph. ${canva.numberNote}

Do not touch page ${canva.closingPage} (the closing card) at all — it never changes, on any carousel, ever.

Edit one page at a time using edit-design with finalize: "keep_open". After each page, compare the returned thumbnail against what you intended, per that tool's own instructions, before moving to the next page.

STEP 4 — Commit and export
Once every page looks right, finalize the transaction with finalize: "commit" (operations omitted). This is permanent, so only do it once you've checked the thumbnails. Then call get-export-formats on your copy, and export it as PNG (all ${canva.totalPages} pages, one image per page).

STEP 5 — Hand it over
Share all the resulting download links back in this conversation, clearly labeled in order (cover, slide 1 through slide ${slideCount}, closing), so they can be downloaded directly from here. On a phone this just means tapping each link and saving the image — no extra app needed.

Here is the sermon transcript:

${transcript}`;
}

// --- Page wiring -----------------------------------------------------------

async function init() {
  try {
    const data = await fetch("./templates.json").then((r) => r.json());
    templatesCache = data.templates || [];
    loadTemplates();
  } catch (err) {
    templatesEl.textContent = "Couldn't load templates. Try reloading the page.";
  }
}

function loadTemplates() {
  templatesEl.innerHTML = "";
  templatesCache.forEach((t) => {
    const div = document.createElement("div");
    div.className = "template-option";
    div.dataset.id = t.id;
    div.innerHTML = `<div class="label">${t.name}</div><div class="desc">${t.description || ""}</div>`;
    div.addEventListener("click", () => selectTemplate(t.id));
    templatesEl.appendChild(div);
  });
  if (templatesCache.length === 1) selectTemplate(templatesCache[0].id);
}

function selectTemplate(id) {
  selectedTemplate = templatesCache.find((t) => t.id === id) || null;
  document.querySelectorAll(".template-option").forEach((el) => {
    el.classList.toggle("selected", el.dataset.id === id);
  });
  updateCopyButton();
}

transcriptEl.addEventListener("input", updateCopyButton);

function updateCopyButton() {
  copyBtn.disabled = !selectedTemplate || transcriptEl.value.trim().length < 200;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Clipboard permissions can fail (e.g. older browsers) — fall back to a
    // manual copy by selecting a temporary textarea.
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (e2) {
      copied = false;
    }
    document.body.removeChild(temp);
    return copied;
  }
}

copyBtn.addEventListener("click", async () => {
  const transcript = transcriptEl.value.trim();
  if (!selectedTemplate) {
    copyStatus.textContent = "Choose a template first.";
    return;
  }
  if (!transcript) {
    copyStatus.textContent = "Paste the transcript above first.";
    return;
  }

  copyBtn.disabled = true;
  copyStatus.textContent = "Putting the instructions together…";

  try {
    const instructions = buildCanvaPrompt(selectedTemplate, transcript);
    const copied = await copyText(instructions);
    copyStatus.textContent = copied
      ? "Copied! Now open Claude, paste, and send."
      : "Couldn't copy automatically — try again, or select and copy the text manually.";
  } catch (err) {
    copyStatus.textContent = "Error: " + err.message;
  } finally {
    updateCopyButton();
  }
});

init();

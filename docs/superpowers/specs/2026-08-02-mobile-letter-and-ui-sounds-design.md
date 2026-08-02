# Mobile Letter and UI Sounds Design

## Goal

Improve the opened letter on mobile so the paper feels larger and the text fits
comfortably inside it, make the close button smaller, and add subtle generated
UI sound effects to interactive elements on the home page.

## Behavior

- The opened paper modal remains centered and usable on desktop.
- On mobile, the paper uses more of the viewport and the text area has tighter
  side insets so paragraphs fit inside the paper art without feeling cramped.
- The close button is visibly smaller while remaining large enough to tap.
- Sounds use the existing generated Web Audio tones from
  `src/services/soundEffects.ts`; no new audio assets are added.
- Home-page interactions receive subtle feedback: start/skip song, open/reveal
  letter, close letter, drag bouquet pieces, drop bouquet pieces, tap roses, and
  double-tap rose rotation.

## Implementation Notes

- Modify `src/components/home/MailLetter.tsx` for paper sizing, text insets,
  close-button sizing, and letter interaction sounds.
- Modify `src/components/home/RoseBouquet.tsx` for bouquet drag/tap/drop sounds.
- Modify `src/pages/HomePage.tsx` for song-start and lyric-skip sounds.
- Reuse `playUiSound`; do not introduce a new sound manager or assets.

## Verification

- Run `npm run build`.
- Inspect mobile viewport around 390-430px wide to confirm text stays inside the
  paper and the close button is smaller.

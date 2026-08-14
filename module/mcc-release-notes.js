/* global game, ChatMessage, foundry, document, window, console */

import { globals } from './settings.js'

const { renderTemplate } = foundry.applications.handlebars

// Listener for the card's buttons, registered once at module scope so a
// repeated checkReleaseNotes() call can't stack duplicates. Unlike the
// system's listener, resolve via closest() so clicks landing on the
// button's <i> icon count.
document.addEventListener('click', (event) => {
  const action = event.target.closest?.('[data-action]')?.dataset.action
  if (action === 'mcc-release-notes') {
    window.open('https://github.com/foundryvtt-dcc/mcc-classes/releases', '_blank', 'noopener,noreferrer')
  } else if (action === 'mcc-user-guide') {
    window.open(globals.userGuideUrl, '_blank', 'noopener,noreferrer')
  }
})

/**
 * MCC version of the DCC system's release-notes chat card (see the system's
 * module/release-notes.js and checkReleaseNotes in module/ready-hook.mjs):
 * whisper each user a card with Release Notes and User Guide buttons the
 * first time they load a world on a new module version. The card reuses the
 * system's .dcc-release-notes-card styling and the DCC button labels; only
 * the title and link targets are MCC's own.
 */
export async function checkReleaseNotes () {
  // Never let a chat-card failure (e.g. ChatMessage.create rejecting on
  // permissions) escape: this runs inside the dcc.ready listener, and an
  // unhandled rejection there would abort the rest of MCC's ready work.
  try {
    const lastSeenVersion = game.user.getFlag(globals.id, 'lastSeenModuleVersion')
    const currentVersion = game.modules.get(globals.id).version

    if (lastSeenVersion !== currentVersion) {
      const html = await renderTemplate(globals.templatesPath + 'chat-card-release-notes.html', {})
      await ChatMessage.create({
        whisper: [game.user.id],
        content: html
      })
      await game.user.setFlag(globals.id, 'lastSeenModuleVersion', currentVersion)
    }
  } catch (e) {
    console.error('MCC | Failed to show the release notes chat card:', e)
  }
}

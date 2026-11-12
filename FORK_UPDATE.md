# Fork upstream update and username assessment

## Update scope

Base fork: `d513958c15be84707be938decedb986fdda0b524` (`7.0.0-rc16`).
Official upstream merged: `81345beb67ca3fb0eb79a2c20cd4ac24da517929`.
The fetched upstream package still declares `7.0.0-rc14`; the fork's higher
version label does not imply that every upstream commit was already included.

The merge adds the Windows `WIN_HYBRID` connection-identification fix, an
example logging correction, and copyright updates. Existing custom native-flow
buttons, legacy reply buttons, lists, and companion-delivery fixes are preserved.
`lib/` is tracked in this fork and must be rebuilt along with source changes.

The new `interactive-buttons.test.ts` checks payload construction, protobuf
round-trip of copy buttons with the gateway's view-once envelope, legacy reply
buttons/lists, and ordinary text. These are offline compatibility checks only.
They do not prove WhatsApp server acceptance, recipient delivery, rendering, or
button actions on Android/iOS. Keep the gateway's copy-button envelope helper.

No application dependency, live session, release workflow, or service is changed
by this isolated upgrade. No live messages are sent during verification.

## Verification notes

The production build passed. All 31 test suites and 414 tests passed, including
six new offline compatibility tests. Changed source/test files pass ESLint.
Type checking passed during `npm run lint`; repository-wide ESLint
reported one pre-existing formatting error in `src/__tests__/Socket/socket.test.ts`
and 148 warnings. This update does not suppress or change that unrelated test.
An independent reviewer could not launch because its configured model was
unavailable; the small merge and unchanged button paths were reviewed directly.

## Sending by WhatsApp username

Both the fetched upstream and this fork contain low-level username contact lookup:

- `USyncUser.withUsername()` sets the username query input.
- `withUsernameKey()` optionally serializes the contact `pin` attribute.
- `USyncQuery.withContactProtocol()` selects the protocol that serializes these
  fields and parses whether the contact is registered.
- `sock.executeUSyncQuery()` returns entries with server-provided contact JIDs.
- `sock.sendMessage()` still requires a JID, not a raw username.

Conditional usage, requiring a server response with a registered contact JID:

```ts
import { USyncQuery, USyncUser } from 'baileys'

const user = new USyncUser().withUsername(username)
if (usernameKey) user.withUsernameKey(usernameKey)

const result = await sock.executeUSyncQuery(
  new USyncQuery().withContactProtocol().withUser(user)
)
const match = result?.list.find(entry => entry.contact === true)
if (!match?.id) throw new Error('No WhatsApp contact JID resolved')

await sock.sendMessage(match.id, { text: 'Hello' })
```

Do not pass a raw username to `onWhatsApp()` (it constructs phone queries), or
invent a username-based JID. `withUsernameProtocol()` retrieves/parses a returned
username field; by itself it does not serialize a username lookup input.

Live username resolution is unverified. Source does not establish account/server
availability, whether a PIN is mandatory, its format, or leading-`@`
normalization. The query parser also has TODOs for errors/backoff and discards
entries without a returned JID. Accordingly this is source-level support, not a
claim that arbitrary WhatsApp accounts can currently send to usernames.

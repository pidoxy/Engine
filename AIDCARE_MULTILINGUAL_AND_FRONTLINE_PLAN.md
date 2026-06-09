# AidCare — Multilingual Consultation + Frontline Plan

Version: 1.0 · Date: 2026-06-09 · Status: Draft for approval

This plan covers the **capability** merge of `lang` into AidCare (not a UI merge), in two parts the product owner scoped:

- **Part A — Cross-language consultation:** patient/CHW and clinician converse across languages (e.g. patient in Hausa, doctor in English), each seeing the thread in their own language; or both in the same non-English language.
- **Part B — AidCare Frontline:** a separate, supervised, low-risk multilingual surface on `frontline.aidcare.com`, seeded from the retired `apps/lang` / the `/triage` flow.

Both build on work already shipped in `feat/unified-consolidation`:
- `Consultation.language` and per-turn `Chat.language` (Phase 1 migration).
- Optional `Consultation.patientId` (Phase 4) → anonymous/self-service consultations.
- Room-based live collaboration: presence, `participantJoined`, `escalate`, broadcast (`services/api/src/service/chat.service.ts`).
- API-as-single-boundary with engine proxies incl. `/naija/*`, `/tts` (`services/api/src/lib/engine.ts`).
- Engine multilingual generation: `services/engine/aidcare_pipeline/multilingual.py#generate_multilingual_response(messages, language)`.

---

## Key principle

> A message is authored once, in its **original language**, and rendered to each participant in **their** language. Translation happens at the boundary (API→Engine), is cached per message, and is delivered over the existing consultation room.

---

# Part A — Cross-language consultation

## A.1 Concept

Each room participant has a **view-language**. Each message has an **original language**. The two modes the PO described fall out of one mechanism:

| Mode | Mechanism |
| --- | --- |
| Everyone in the same language (incl. non-English) | All view-languages equal `Consultation.language` → **zero translation calls** |
| Patient/CHW in Hausa, doctor in English | View-languages differ → **translate-on-broadcast** between them, both directions |

Note on "patient": in CHW triage the patient is usually **not** a system user — the CHW inputs on their behalf. So "patient in Hausa, doctor in English" = *CHW-side input language = Hausa, doctor-side view-language = English*, translated both ways.

## A.2 Data model (small additions)

`packages/database/prisma/schema.prisma`:
- `Chat.language` — already added (original language of the turn). Keep `userMessage` as the original text.
- **Add** `Chat.translations Json?` — cache map `{ "en": "...", "ha": "..." }` so a turn is translated at most once per target language.
- No participant table needed for MVP: view-language is a **per-session** setting passed on socket connect (and remembered as a lightweight user preference later).

Migration: one additive column (`chats.translations`), nullable — no backfill.

## A.3 Engine (one new primitive)

`services/engine` currently *generates* in a language but cannot translate arbitrary text. Add:

- `POST /translate/` → body `{ text, source_language, target_language }` → `{ translated_text }`.
  - Thin GPT-4o call; reuse the language tables in `multilingual.py` (`_language_name`, the 5 codes).
  - Optional batch form `{ text, source_language, target_languages: [...] }` → `{ translations: {...} }` to translate a turn into all distinct room languages in one call.
- AI triage/clinical replies: the engine already responds in `Consultation.language`. For cross-language, the AI authors in the consultation language and we translate the reply for other view-languages via the same `/translate/`.

Proxy the new route through the API boundary in `services/api/src/lib/engine.ts` + `engine.controller.ts` (never exposed to the browser directly).

## A.4 API + socket (`chat.service.ts`)

- Extend the in-room `Participant` with `viewLanguage` (read from socket handshake query `viewLang`, default = `Consultation.language` or `en`).
- On every persisted turn (user **and** AI/system):
  1. Persist with `Chat.language = originalLang`, original text in `userMessage`.
  2. Compute the **distinct set** of view-languages among current room participants.
  3. For each target ≠ original not already in `Chat.translations`, call Engine `/translate/`; merge into `Chat.translations` and persist.
  4. Emit to each participant the text in their view-language (emit `{ original, language, translations }` and let each client pick — keeps the payload cache-friendly).
- Reuse existing `presence` / `participantJoined` / `escalate` plumbing unchanged.

## A.5 Frontend (`apps/web/components/ChatDashboard`)

- Add a per-user **language selector** (reuse the ported `apps/web` language system: `languages.ts`, `LanguageSelector`). Selecting it reconnects the socket with `viewLang`.
- Render each message in the viewer's view-language; show a subtle "translated from Hausa · view original" toggle.
- TTS already proxied — speak the message in the viewer's language.

## A.6 Phasing (Part A)

1. Engine `/translate/` + API proxy. (verifiable with curl)
2. `Chat.translations` migration + persist-and-cache in `chat.service.ts`.
3. Per-participant `viewLanguage` on connect + translate-on-broadcast.
4. ChatDashboard: language selector + per-message rendering + "view original".
5. Same-language fast path (skip translation) + AI-reply translation.

---

# Part B — AidCare Frontline (`frontline.aidcare.com`)

## B.1 Concept — a patient ↔ AI ↔ supervisor triad

Following the `lang` style, the **primary loop is patient ↔ computer (AI)**: a community member self-assesses by conversing with the AI assistant in their own language. A **supervisor** (clinician) sits *above* a queue of these AI-driven sessions — overseeing, not directly consulting — and intervenes only when risk rises or the AI is uncertain. This is the repositioned, renamed `lang`, seeded from the `/triage` flow already in `apps/web`.

This is deliberately different from the main app, where the conversation is human↔human (CHW/doctor). Here:

| Role | Who | Does what |
| --- | --- | --- |
| **Patient** | Anonymous self-service user | Converses with the AI in their language (text or audio) |
| **AI (computer)** | Engine `generate_multilingual_response` | Primary responder; runs the low-risk assessment |
| **Supervisor** | Clinician (logged in) | Monitors many live AI sessions; can intervene, take over, or accept an escalation |

The supervisor is **exception-handling + oversight**, not the default responder. Most low-risk sessions complete patient↔AI with no human touch; the supervisor exists so nothing risky slips through unwatched.

**Supervision model (decided):**
- **One supervisor → many sessions.** The supervisor works a queue/dashboard, not a single conversation.
- **No supervisor need be online for a session to run.** Patient↔AI proceeds autonomously; the system does not block on a human being present.
- **Risk-gated surfacing.** A session only demands a supervisor's attention when the risk gate (B.4) trips or the AI flags low confidence — then it jumps the queue / pages an available supervisor. This is what makes one supervisor able to cover many low-risk sessions safely.
- Implication: the audit/safety story rests on the **risk gate**, not on constant human watching. The gate's threshold and the "no supervisor available" fallback (below) are therefore safety-critical.

## B.2 How it reuses what exists

- **Triage UX**: the `/triage` route group already in `apps/web` (5 languages, Send/mic/TTS).
- **Anonymous consultations**: `Consultation.patientId` is already optional (Phase 4) → a Frontline session is a `Consultation` with no patient.
- **Supervision + escalation**: the room model already broadcasts presence and `escalate`. Frontline escalation = page a supervising clinician into the room and (optionally) attach a patient record in the main app.

## B.3 Data model

- `Consultation.mode`: add **`FRONTLINE`** to the enum (alongside `CHW_TRIAGE`, `CLINICAL_SUPPORT`).
- Capture triage **urgency** on the consultation (e.g. `Consultation.urgencyLevel`) so the supervision queue can sort/filter and the risk gate can trigger.
- `Consultation.supervisingClinicianId` (nullable) + an escalation status (`requested` / `accepted`).

## B.4 Risk gating (the "low-risk, with supervision" rule)

- Frontline self-service is allowed only while triage urgency is **below a threshold**.
- On a high-urgency result (or an explicit "get help") → **block self-service**, create/flag the consultation for supervision, and emit `escalate` to the clinician queue. This is the safety boundary that keeps Frontline "low-risk only."
- **No-supervisor-available fallback (safety-critical).** Because no supervisor need be online (B.1), when the gate trips and none is reachable, the AI must **fail safe**, not silently continue: deliver a deterministic safe-fallback message in the patient's language ("this may be urgent — go to the nearest clinic / call emergency services") and hold the case at the top of the queue until a supervisor accepts. Never let a high-risk session keep running purely on the AI.

## B.5 Subdomain — two ways, recommendation

| Option | What | Trade-off |
| --- | --- | --- |
| **1. Host-based routing in `apps/web` (recommended)** | Next middleware maps `frontline.aidcare.com` → the `/triage`/`/frontline` route group, with Frontline branding. One codebase. | No fork; reuses the just-ported language system; subdomain + distinct brand without a second deploy. |
| 2. Separate app | Promote `apps/triage` as a standalone Frontline app deployed to the subdomain. | Cleaner isolation, but re-introduces a second frontend we just consolidated away. |

Recommendation: **Option 1** — we just retired `apps/lang`; don't immediately stand up another separate frontend. The subdomain is a presentation/routing concern, not a reason to fork code. Revisit Option 2 only if Frontline diverges heavily.

## B.6 Supervision dashboard (the supervisor's surface)

- A clinician view listing **active AI sessions**: language, current urgency, waiting/duration, AI-confidence/uncertainty flag, escalation flag.
- Three levels of supervisor action, escalating in involvement:
  1. **Monitor** — open a session read-only and watch the patient↔AI transcript live, rendered in the supervisor's language (Part A translation).
  2. **Intervene** — inject a message into the session; the patient sees it translated into their language. The AI yields while a human is active.
  3. **Take over / escalate** — promote the Frontline session into a full supervised consultation (attach a patient record, switch off autonomous AI) when risk warrants.
- Auto-surfacing: a session jumps to the top of the queue when the risk gate (B.4) trips or the AI signals low confidence — the supervisor doesn't have to watch everything.

## B.7 Phasing (Part B)

1. `FRONTLINE` mode + `urgencyLevel` + escalation fields (migration).
2. Host-based routing → Frontline branding on `frontline.aidcare.com` (middleware) over the existing `/triage` flow.
3. Risk gate: urgency threshold blocks self-service → escalation.
4. Supervision queue + clinician join (reuses room/presence).
5. Compose with Part A so supervision is cross-language.

---

## How A and B compose

Frontline (B) is where cross-language (A) matters most. The triad makes it concrete: a community member self-assesses **with the AI in Yoruba**; a supervisor monitors the live transcript **in English** (translate-on-broadcast renders the patient↔AI turns for them); on rising risk the session auto-surfaces and the supervisor **intervenes in English while the patient stays in Yoruba**. One translation mechanism serves both the AI loop and the human supervisor — two surfaces, one engine.

## Sequencing recommendation

Ship **A.1–A.3 first** (the translate primitive + caching) because B's supervision value depends on it. Then B.1–B.4 (Frontline surface + risk gate), then wire them together (B.6 + A.4–A.5).

## Decisions (locked 2026-06-09)
1. **Patient = anonymous self-service user; supervisor = logged-in clinician.**
2. **Supervision is one→many, pure-AI allowed, risk-gated surfacing** (see B.1), with the no-supervisor fail-safe in B.4.
3. **Take-over creates a patient record.** When a supervisor takes over a Frontline session, they are prompted to create/name a patient record; the session attaches to it and becomes a normal tracked consultation (B.6 level 3).
4. **Subdomain = host-routing in `apps/web`** (Option 1, B.5). `frontline.aidcare.com` is served by `apps/web` via Next middleware → the Frontline route group. No separate app.
5. **Urgency threshold is per-organization** (configurable; safety-critical default to be set conservatively).
6. **Translation reuses the engine's OpenAI GPT-4o** (the new `/translate/` primitive, A.3). Revisit a dedicated MT service only for cost/latency at scale.
7. **View-language is per-session for MVP** (passed on socket connect); promote to a stored user preference later.

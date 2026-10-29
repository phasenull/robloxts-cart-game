# TypeTorch migration notes

Branch `typetorch-migration` (from `master`, carrying the uncommitted cart rewrite). Nothing committed or pushed (the
owner's instruction for this run overrides the playbook's "one commit per step"). Pre-migration snapshot of the tree:
`/tmp/cart-or-die-pre-typetorch-20261029.tgz`.

Sources (read 2026-10-29, `main` of each repo):

- `docs/agents/AGENTS.md` (the agent playbook) — cited as **PB**
- `docs/agents/skills/typetorch-migrate/SKILL.md` — **SK**
- `docs/getting-started/migrate.md` — **MG**
- `docs/guides/player-data.md` — **PD**, `docs/guides/networking.md` — **NW**, `docs/guides/from-flamework.md` — **FF**
- `template` @ `c6680eb` (`package.json`, `tsconfig.json`, `default.project.json`, `studio.project.json`, `rokit.toml`,
  `.gitignore`, `scripts/build-info.ts`, `src/*/boot.ts`, `src/server/services/rush/handoff.ts`) — **TP**
- `framework` @ `52ccc35` (0.5.5) README and source (`ui/index.ts`, `runtime/player-state.ts`, `net/index.ts`) — **FW**

## Rules enforced

Process (PB "Rules", SK "Rules"):

1. No secrets created, read, printed or stored; `.env` never opened. (PB rule 1)
2. Nothing acts on Roblox: no `typetorch` deploy/upload/approve/promote/rollback/pin/deployments/branch ls/settings/
   access push/kernel deploy/kernel restore/keys/assets/test --cloud/servers/report/alerts/backend setup/update/doctor,
   no place publish, no remote-claude/tunnel. These are in "What you need to do". (PB rule 2, Step 6)
3. Never push. (PB rule 3)
4. `node_modules/@typetorch/*` and the template are read-only references. (PB rule 4)
5. No new RemoteEvents, `loadstring`, `_G` hooks, disabled guards or settings changes; security not weakened. (PB rule 5)
6. Player data formats, DataStore names and keys unchanged. (PB rule 6, PD)
7. No invented ids: placeholders `1`. (PB rule 7)
8. Promise only what exists today. (PB rule 8)
9. No CI / GitHub Actions in the game repo. (PB rule 9)
10. Work on branch `typetorch-migration`; log every step here. (PB Step 2/3, MG "Before you start")

Toolchain (PB Step 3, MG section 2, TP):

11. Bun is the package manager; one lockfile (`bun.lock`). (PB 3.2)
12. `rokit.toml` pins `rojo-rbx/rojo@7.7.0-rc.1` and `lune-org/lune@0.10.5`. (PB 3.2)
13. `package.json`: the template's dependencies/devDependencies/overrides merged in (`@typetorch/framework`,
    `@typetorch/kernel`, `@rbxts/t`, `@rbxts/trove`, `rbxts-transform-debug` 2.2.0; dev `@typetorch/transformer`,
    `@typetorch/cli`, `@typetorch/dev-server`, roblox-ts 3, TypeScript 5.5.3 + `overrides`); scripts `build`, `watch`,
    `studio`, `typetorch`; no `packages`/`postinstall`; `@flamework/*` and `rbxts-transformer-flamework` removed. (PB 3.3)
14. `tsconfig.json`: `include` only src, `experimentalDecorators`, `rootDir: src`, `outDir: out`,
    `typeRoots: [@rbxts, @typetorch]`, `types: [types, compiler-types]`, `plugins` = `rbxts-transform-debug` then
    `@typetorch/transformer`. (PB 3.4)
15. `default.project.json` is the template's payload `Model` (Server/Shared/Client/include, `@rbxts` + only
    `@typetorch/framework`); the old project kept as `legacy.project.json`; sources only in `src/server`,
    `src/shared`, `src/client`. (PB 3.5)
16. `studio.project.json` and `scripts/build-info.ts` copied from the template. (PB 3.3)
17. `.gitignore` has `node_modules/ out/ include/ *.tsbuildinfo src/shared/build.ts .typetorch/
    .payload.gen.project.json .tsconfig.typetorch.json .env .env.*`; Flamework leftovers deleted. (PB 3.6)
18. `typetorch.json` per PB 3.7 (default git branch mapped to `prod`, `members: {}`, no template signing fields).
19. `src/server/boot.ts` / `src/client/boot.ts` call `startServer`/`startClient` with the `services`/`controllers`
    folders; every ModuleScript under those folders has side-effect-free top-level code. (PB 3.8, MG 3)

Code (PB Step 4, MG sections 3–8, FF, NW, PD):

20. No `*.server.ts`/`*.client.ts`; the payload holds only Folders and ModuleScripts. (PB 4.1)
21. Every service/controller: `@Service()`/`@Controller()` from `@typetorch/framework`, `extends Module`, `super()`,
    kebab-case `x.service.ts`/`x.controller.ts` in `src/server/services` / `src/client/controllers`; no work in
    constructors. (PB 4.2)
22. No `@flamework/*` import anywhere; `Modding`/`Reflect`/`t`/`Dependency` from `@typetorch/framework`. (PB 4.2)
23. `Dependency<T>()` only in methods / from `onInit` on — never in a constructor, field initializer or module top
    level; cycles broken with `Lazy<T>` or `Dependency<T>()` in a method. (PB 4.2, MG 4)
24. `@flamework/components` → modules using `observeElement` (or `@rbxts/observers`). (PB 4.2, FF mapping)
25. `onInit` short; slow work in `onStart`. (PB 4.2)
26. Swap safety — everything in `this.trove`; no cleanup calls `trove.remove/add/extend`. (PB 4.3.1, MG rule 1)
27. No module-level state or side effects (constants may stay); state that must survive a swap in
    `this.ctx.persist("key.vN", …)` as plain data, per-player maps in `this.ctx.playerState`; `ctx`/`Dependency` never
    in field initializers. (PB 4.3.2, MG rule 2)
28. Players through `onPlayerAdded(player, playerTrove)`/`observePlayers`, never `Players.PlayerAdded.Connect`; join
    handlers idempotent; real-leave work via `this.trove.connect(Players.PlayerRemoving, …)`. (PB 4.3.3, MG rule 3)
29. Tags and characters through observers (`observeElement`, or `playerTrove.connect(player.CharacterAdded, …)`).
    (PB 4.3.4, MG rule 4)
30. No global connections or loops outside troves (a loop directly in `onStart` is fine). (PB 4.3.5, MG rule 5)
31. No `_G`/`shared`. (PB 4.3.6, MG rule 6)
32. `task.spawn/delay/defer` only through a trove; no deprecated `spawn/delay/wait`. (PB 4.3.7, MG rule 7)
33. Instances a module creates go in its trove; libraries with module-level setup driven from the trove or loaded once
    outside the payload. (PB 4.3.8, MG rule 9)
34. Looped animations / cutscenes / in-progress activities resumed from persisted plain data after a swap. (PB 4.3.9,
    MG section 7)
35. Shutdown: `onStop` for short extras only; no saves only in `onStop`; `BindToClose` handlers removed or bound once
    per server. (PB 4.3.10, MG rule 8)
36. One `src/shared/net.ts` with `createNetwork<ClientToServer, ServerToClient>()`; server `.on/.handle/.fire*`, client
    `.fire/.invoke/.on`, every disconnect in the trove; no RemoteEvent/RemoteFunction anywhere (including third-party
    libraries' own remotes); no template-literal leaf types; game checks stay in handlers; `invokeWithTimeout` in
    seconds (0.5–120). (PB 4.4, NW, FF)
37. UI: code-built UI and React roots in a controller's trove; charm atoms per generation. (PB 4.5, MG 7)
38. Player data: library in the place (`ServerStorage.Packages.ProfileService` + `ServerScriptService.DataHost`), handles
    in `persist`, load on join (re-attach after a swap), release on a real leave, writes as DataHost jobs, same store
    name and key on prod and `<name>_dev` on other channels, `TypeTorchTest` early return. (PB 4.6, PD)
39. Developer products: PurchaseId recorded in the profile with the grant, `PurchaseGranted` only once a save holds it
    (`grantOnce`). (PB 4.6, PD "Developer products")
40. Cloud test: side effects (global resets, raw MessagingService publishes, "server started" rows, waits on place
    scripts) guarded with `Workspace.GetAttribute("TypeTorchTest")` and listed here. (PB 4.6)
41. Checks: `bun run build`, `bun run typetorch build` (Folders/ModuleScripts only), guards generated in
    `out/shared/net.luau`, the PB Step 5 pattern scan clean or explained, prod build, `studio.project.json` builds.
    (PB Step 5)

## Inventory (PB Step 1)

- roblox-ts 3, TypeScript 5.5.3, Bun (`bun.lock`), Aftman (`aftman.toml`, rojo 7.7.0-rc.1).
- Flamework 1.3.2: `@flamework/core`, `@flamework/networking`, `@flamework/components`; `Modding.registerDependency`
  for `Logger`.
- Entry points: `src/server/bootstrap.server.ts`, `src/client/bootstrap.client.ts` (Flamework ignite + Centurion).
- Modules: 9 services, 2 controllers (+3 controllers in `src/common`), 18 components (6 server, 8 client, 4 shared).
- Networking: `@flamework/networking` in `src/shared/network.helper.ts` (5 S2C events, 7 C2S events, 15 C2S
  functions); Centurion creates its own 2 RemoteEvents + 1 RemoteFunction.
- Data: ProfileService through `src/common/server/services/base-data.service.ts`, store `players_2`, key
  `${UserId}`.
- `src/common` is a git submodule (`phasenull/rbxts-common`); the game reaches 48 of its files. Owner decision
  (2026-10-29): **vendor** the used files into this repo, leave the submodule untouched and uncompiled.
- `_G`: `global-hud-gui.tsx` / `cash-vfx.tsx`. `BindToClose`: `http.service.ts`, `base-data.service.ts`.
- No MessagingService, MemoryStore or raw DataStore code.
- Ids: none in the repo (group `1059580522` is the group-join prompt, not necessarily the owner): placeholders.

## Log (2026-10-29)

Codemod: `typetorch migrate --from flamework --net native --dry-run --allow-dirty` recognized 13 modules, 0 networks,
0 call sites, 0 boot files (the network was wrapped in `__IS_EDIT__ ? … : Networking.createEvent`, and `ignite()` sat
in `async main()`); 119 flags (3 Flamework API, 5 networking, 1 Dependency-in-constructor, 6 module-level state,
3 PlayerAdded.Connect, 25 connections, 29 task.*, 3 loops, 3 `_G`, 37 components, 1 ProfileService, 1 BindToClose,
2 toolchain). Not applied; the migration was done by hand with the report as a checklist. Every flag is resolved.

1. **Toolchain**: `aftman.toml` → `rokit.toml` (template); `package.json` merged (Flamework removed; `@rbxts/vide`
   added as a direct dependency because it is stepped from the trove; the game's `@rbxts/charm 0.11.0-rc.4` pin
   kept); `@rbxts/types` locked to 1.0.956 as in the template's lockfile; `tsconfig.json` (template typeRoots/types/
   plugins; `include` lists `src/server|shared|client` instead of `./src/**/*.ts`, because the literal would drop the
   `.tsx` stories and compile the submodule); `default.project.json` → `legacy.project.json`, the template's payload
   project and `studio.project.json` copied; `scripts/build-info.ts`; `.gitignore`; `typetorch.json` (placeholders,
   `master` → `prod`); `flamework.build` deleted.
2. **src/common vendored** (owner's decision): the 47 files the game reaches copied to `src/shared/common`,
   `src/client/common`, and `src/client/controllers` (animation, music, char); imports rewritten; the submodule itself
   is unchanged and no longer compiled. `BaseDataService` folded into `DataService`.
3. **Entry points**: `bootstrap.server.ts` / `bootstrap.client.ts` → `src/server/boot.ts`, `src/client/boot.ts`;
   their Centurion setup → `CommandService` / `CommandController`.
4. **Modules**: 11 services (cart, checkpoint, command, components, customization, data, feedback, http,
   monetization, shop) and 8 controllers (animation, cart, char, command, components, garage, music, ui), all
   `extends Module`. Flamework's `Logger` DI factory replaced by a `Logger` field with the same context name.
5. **Networking**: `src/shared/net.ts` (`createNetwork`), the same namespaces and leaves; `CartService.reset` now
   answers `[true]` (a request must). Centurion's RemoteEvents/RemoteFunction replaced by `network.centurion`.
   `invokeWithTimeout(5000, …)` → `(5, …)` (6 sites). `useProduct.predict` → a direct method call.
6. **Components**: `@flamework/components` → `src/shared/component.ts` (`ComponentRegistry` over `observeElement`,
   Flamework's guards reproduced with a `guardOf<T>()` transformer macro, client re-qualification as in Flamework's
   Contextual mode) owned by `ComponentsService` / `ComponentsController`. `PlatformComponent` keeps its guard
   `t.instanceOf("BasePart")`, which never matched under Flamework either (the plain tag never attached).
7. **Swap safety**: everything in troves; `Tasks` / `Scopes` (`src/shared/tasks.ts`) for per-event threads and
   effects so long-lived troves don't grow; React threads through `useTasks` / `useAppTasks` (cancelled when the UI
   root unmounts with `UIController`'s trove). World rigs on place models (Root parts, welds, prompts, rope) are built
   once and handed over (`rigOnce`, the template's handoff.ts pattern); animated poses restart from `homePivot` /
   `homeValue`. Library setup: Vide stepped from the trove, CenturionUI mounted with its unmount in the trove,
   Centurion's server `PlayerRemoving` connected in the trove (pinned 1.0.1 internals), garage tracks owned by
   `GarageController`. Module-level state removed: `QueryClient`, `PITCH_CONFIG`, `cachedCheckpoints`,
   `group-prompt` debounce, `UIHelper` static maps (bindings are now handles), `cart.helper` require-time setup.
   `_G.cash_label` → `CashLabelContext`.
8. **Survives a swap** (`persist` / `playerState`, plain data): ProfileService handles, playtime clock, HTTP sessions
   and leave queue, current checkpoint, last server-verified safe pose (the revive anchor), pending honk purchase,
   cash pickup cooldowns, client revive anchor and death-screen state, collected checkpoint, music position,
   settings (mute, animation speed). A rider's cart is destroyed with the old generation and given back by the new one
   at the last safe pose, with a 5 s shield.
9. **Player data**: PD option B (`TypeTorch.runDetached`); store `players_2` (prod) / `players_2_dev` (other
   channels), key `${UserId}`, template unchanged; `AddUserId` added (guide; metadata only); `profile.Save()` calls
   are detached jobs; `BindToClose` loops removed (ProfileService releases on close in the place; shutdown extras in
   `onStop`, skipped on swaps via `onSwapOut`).
10. **Receipts**: `grantOnce` (PurchaseId in `MetaTags`, `PurchaseGranted` once `MetaTagsLatest` holds it).

### Cloud-test guards (`TypeTorchTest`)

- `DataService` `profileService()`: returns undefined in the test (place `DataHost` never runs there). No other
  `onInit`/`onStart` side effect needs a guard: no MessagingService, no global resets; HTTP calls only on joins/leaves
  and leave-queue retries (empty in the test).

### Checks

- `bun run build`: pass. `bun run typetorch build`: pass, 533 modules (dev) and prod channel; id is `-dirty` because
  nothing is committed (owner's instruction), so the clean-id check was not run.
- Guards generated in `out/shared/net.luau`. `rojo build studio.project.json`: pass.
- Pattern scan (PB Step 5): clean. Module-level `Signal`s (`CashPopupSignal`, `CheckpointSignal`,
  `PromptPurchaseSignal`, `FadeGuiEvent`) kept as event-channel constants (no data; the codemod doesn't flag them);
  UI Labs story `controls`/`story` objects are story constants.

### Needs your decision / known items

- **Open issues touched**: receipts are now idempotent (required by TypeTorch rule 39; `robux_spent` now counts once
  per purchase; pending honk cleared inside the grant). `setCheckpoint`/`tpMeToCheckpoint` index checks, client
  `stage` in revive, `useProduct("flips")` not consuming, cart ownership by `Name.split("_")`, elevator proximity:
  unchanged, not worsened.
- `@rbxts/types` 1.0.956 types `UserOwnsGamePassAsync` / `CreateHumanoidModelFromUserIdAsync` with the new `User`
  datatype; two call sites cast and still pass the numeric UserId.
- Non-code content of `legacy.project.json` that must live in the place: `HttpService.HttpEnabled = true`,
  `Workspace.FilteringEnabled`, `SoundService.RespectFilteringEnabled = true`.
- `src/common` submodule: unused; remove with `git rm src/common` when you accept the vendored copy.

## What you need to do

1. Fill in `typetorch.json` ids (`universeId`, `placeId`, `creator`), placeholders `1` now; optional `members`, then
   `bun run typetorch access push` after step 6.
2. Game Settings > Security: Allow HTTP Requests on; Enable Studio Access to API Services on.
3. Create an Open Cloud API key (asset:read/write, Luau Execution read/write, universe-messaging-service:publish,
   DataStore objects read/create/update, universe.place:write for kernel deploy) and put `OPENCLOUD_API_KEY=` in
   `.env`. Then `bun run typetorch doctor`.
4. `bun run typetorch keys init` and `keys init --fallback`; commit `typetorch.json`; back up the key files and `.env`.
5. Kernel into the place (it has Studio content: never `--replace-place`): `bun run typetorch kernel deploy --dry-run
   --install`, then without `--dry-run`; keep `LoadStringEnabled` off.
6. Player data in the place: `ServerStorage.Packages.ProfileService` (the same 1.4.2 module as
   `node_modules/@rbxts/profileservice/src/init.lua`) and `ServerScriptService.DataHost` (option B: just requires it
   and sets `Warm`); publish.
7. Remove the old Flamework scripts from the place in Studio just before the first deploy.
8. Test: CLI 0.9.1 has no `serve` command; test on a dev branch (step 9) after the kernel is in the place.
9. Dev branch: deploy, `/tt new dev`, play and deploy twice mid-ride and on the death screen; data across deploys;
   buy a product during a deploy; `bun run typetorch test --cloud`; watch "Health window" errors.
10. Live game: go-live checklist, first prod deploy from `master`, rollback drill.

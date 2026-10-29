# TypeTorch migration notes

Branch `typetorch-migration` (from `master`, carrying the uncommitted cart rewrite). The code migration was done without
commits (the owner's instruction for that run); the go-live run below committed, merged into `master` and pushed (owner's
instruction: "deploy to prod", acting on Roblox allowed). Pre-migration snapshot of the tree:
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
- `src/common` submodule: removed in the go-live run (it broke clean builds, see below).

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
7. ~~Remove the old Flamework scripts from the place~~: done headless, see "Go-live" below (with 6).
8. Test: CLI 0.9.1 has no `serve` command; test on a dev branch (step 9) after the kernel is in the place.
9. Dev branch: deploy, `/tt new dev`, play and deploy twice mid-ride and on the death screen; data across deploys;
   buy a product during a deploy; `bun run typetorch test --cloud`; watch "Health window" errors.
10. Live game: go-live checklist, first prod deploy from `master`, rollback drill.

Steps 6, 7, the automated part of 9 and 10 are done (see below). Steps 1–5 were done before the go-live run (ids in
`typetorch.json`, keys, kernel 0.5.5 in place v2052, undo `typetorch kernel restore --version 2033`).

## Go-live (2026-10-29, agent run, owner's go-ahead to act on Roblox)

State at the start: kernel 0.5.5 in place v2052, no deploys, no live servers, doctor passing with "no backup".

1. **Place inventory** (Luau Execution tasks on v2052, read only): the old Rojo tree was still there
   (`ServerScriptService.TS`, `ReplicatedStorage.TS`, `ReplicatedStorage.rbxts_include`, `StarterPlayerScripts.TS`)
   plus three Scripts in Lighting holding TSX source (`Speedlines.tsx`, `Speedlines.d.ts`, `Confirmation.tsx`, never
   run). Step 6 had **not** been done: no `ServerStorage.Packages.ProfileService`, no `ServerScriptService.DataHost`
   (`DataService` errors without them, also in the cloud test).
   Kept: `ReplicatedFirst.LoadingScreen` (place-owned, standalone), `ReplicatedFirst.Config` (read by
   `config.builder.ts`), Roblox's default player scripts, every model/map/asset, `ReplicatedFirst.Data.CartService`
   (an unused RemoteFunction, not code; delete it in Studio some day).
2. **Place patch** (no CLI command removes arbitrary instances, so the kernel engine's method by hand: a Luau
   Execution task on the base version that patches in memory, checks, then `AssetService:SavePlaceAsync()`; scripts
   kept in `/tmp/tt-legacy/`, not in the repo). Removed the 7 targets above (887 instances, 780 scripts; the check
   refused any non-code class inside them); added `ServerStorage.Packages.ProfileService` (byte copy of
   `node_modules/@rbxts/profileservice/src/init.lua` 1.4.2, sha256 `4cccb85d…`) and `ServerScriptService.DataHost`
   (PD option B: requires it, sets `Warm`). Everything else (60,474 instances in 103 service children) checked
   unchanged. Dry run on v2052, then the save. The first two saves were refused
   (`PlaceOngoingTeamCreateSession`: someone had the place open in Team Create, autosave v2053 appeared with only
   `TestService.LuauLSP_Settings`); a guarded retry loop (stop if any version past 2053 appears) saved on its next
   try: **place v2054** (base v2052). Verified with a task on v2054: scripts left are only Config, LoadingScreen,
   DataHost, Packages, the default player scripts and the kernel slots. **Undo: `typetorch kernel restore --version
   2052`** (the kernel stays; restores the old scripts, drops DataHost).
3. **Build fixes** (all on `typetorch-migration`):
   - `67bdb3b` / `4463271`: removed the unused `src/common` submodule. rbxtsc copied it into `out/common` with its
     `.git` gitfile; `git clean -fdX` skips nested repos, so stale `out/common/**/*.luau` survived `--clean` and
     every clean build failed ("compiled files that no tracked source explains").
   - `216e4a6`: `shared/type.helper.ts` → `type.helper.d.ts`. Types only, so rbxtsc emitted a module returning
     nothing and the cloud test failed (`require …Shared.type.helper: Module code did not return exactly one value`).
   - `6bff6a4`: `ComponentRegistry` restores Flamework's default `ancestorBlacklist` (ServerStorage, ReplicatedStorage,
     StarterPack, StarterGui, StarterPlayer). Without it components attached to tagged templates/archived models in
     storage; `CartServerComponent` re-rigged the archived carts in ServerStorage every generation (cloud test: 43
     leftover instances, 882 after one swap; now 3, the intended `rigOnce` world rigs).
   - Builds run from a clean worktree (`../cart-or-die-deploy`, `node_modules` symlinked, `/node_modules` in
     `.git/info/exclude`, `TYPETORCH_STATE_DIR` and `--env-file` pointing at this checkout): a stray `bun run watch`
     (`rbxtsc -w`, started 16:15, not ours) in this checkout rewrote `out/tsconfig.tsbuildinfo` during a clean build
     and produced a half payload (927 KB, no `net`), which the cloud test caught (`WaitForChild("cart.helper")`).
4. **Dev branch**: `deploy --branch dev --test`: #1 `216e4a6-3b462a` (asset 138548963405588), #2 `6bff6a4-b83b5f`
   (asset 127218296107200). Cloud test passed on place v2054 (boot, 21 Shared modules, 5 s run, clean stop, hot-swap
   generation). Two failed attempts uploaded but never published (`4463271-cf14e6`, `6bff6a4-eb238e`). `servers`: no
   live servers (nobody joined dev); `report latest --branch dev`: no reports.
5. **Prod**: `master` fast-forwarded to `6bff6a4` and pushed (with `typetorch-migration`). `typetorch deploy` from
   `master` in the worktree: **#3 prod@6bff6a4 → `6bff6a4-2af9cf`** (asset 104307607294150), cloud test passed on
   v2054, approved at the y/N by the agent (owner's explicit go-ahead; `approval: "prod"` needs a terminal, so the
   deploy ran under `script`), signed sig + sigF, `heads.prod = #3`. No servers reported (none running).
6. **Backup**: `typetorch backup refresh --force --yes` (`--force`: the 3 h health proof can't exist with no servers):
   `6bff6a4-2af9cf` is `ServerStorage.TypeTorchBackup`, **place v2054 → v2055**.

7. **Rollback drill** (no players, so no in-game check): #4 `370854a-f21ec0` (asset 94660073081973, the commit
   that logged steps 1–6; cloud test passed on v2055) → `rollback --branch prod` #5 back to `6bff6a4-2af9cf` → `promote
   prod 370854a-f21ec0` #6. All signed, approved at the y/N by the agent. `deployments`: `* #6 prod@370854a`.
8. **Final state**: prod head **#6 `370854a-f21ec0`**; dev head #2 `6bff6a4-b83b5f`; place v2055 (no legacy scripts,
   DataHost + ProfileService, kernel 0.5.5, backup `6bff6a4-2af9cf`); `doctor`: all required checks passed, no warnings;
   `servers`: none live (nobody has joined since). The worktree was removed afterwards; `/node_modules` stays in
   `.git/info/exclude` (local only).

Undo, newest first: a bad build `typetorch rollback --branch prod`; the backup `typetorch kernel restore --version
2054`; the place patch `typetorch kernel restore --version 2052`; the kernel `typetorch kernel restore --version 2033`
(each republishes that version as a new one).

### For the owner to test (needs a person in the game; not done)

- Join prod: F9 > Server shows `[TypeTorch] kernel 0.5.5 … branch prod, signed`; `/tt status` answers; the loading
  screen goes away; carts spawn, drive, die, revive.
- `/tt new dev`: earn some data, deploy dev twice while riding and once on the death screen (`bun run typetorch deploy
  --branch dev`); rejoin: nothing lost, the cart comes back at the last safe pose with the shield.
- Buy a developer product while a deploy runs: one grant, saved; rejoin: no second grant. A game pass after a swap.
- After each deploy: dev menu > Server > Status "Health window: n/3 errors" (3 rolls the server back).
- Creator Hub > DataStore Manager: dev sessions and cloud tests wrote only `players_2_dev`.
- Rollback with 2+ players in (`typetorch rollback --branch prod`): players stay, data intact.
- Studio, when convenient: delete `ReplicatedFirst.Data.CartService` (unused RemoteFunction) and
  `TestService.LuauLSP_Settings` if it reappears from the Team Create session; stop the stray `bun run watch` in this
  checkout before building here.

## Hotfix: React dead on the client, `@rbxts-js` missing from the payload (2026-10-29)

- **Symptom** (live prod #6 `370854a-f21ec0`, client console): `Infinite yield possible on
  'ReplicatedStorage.TypeTorch.Generations.370854a-f21ec0#1.include.node_modules:WaitForChild("@rbxts-js")'` from
  `include.node_modules.@rbxts.react`, line 1. No React UI rendered.
- **Root cause**: `@rbxts/react`, `react-roblox`, `react-globals` and `react-devtools-core` are re-export shims
  (`node_modules/@rbxts/react/src/init.lua:1`: `require(script.Parent.Parent:WaitForChild("@rbxts-js").React)`); the
  real code is the `@rbxts-js` npm scope (24 packages). `legacy.project.json` mapped `@rbxts-js`, but the payload
  project `default.project.json` (and the `TypeTorchDev.Payload` in `studio.project.json`) followed the
  `@typetorch/framework` README template, which maps only `@rbxts` and `@typetorch/framework`. The CLI ships whatever
  the project maps, so every generation lacked the scope. Not a CLI/kernel bug; the README template just doesn't
  mention other scopes (any extra npm scope that runtime Luau requires must be mapped next to `@rbxts`).
- **Evidence** (lune listing of `.typetorch/payload.rbxm`, `include/node_modules`): before (f097cc3, 1.03 MB, 532
  modules) `@rbxts` (27), `@typetorch` (1); after (f738460, 1.74 MB, 812 modules) `@rbxts` (27), **`@rbxts-js` (24:
  React, ReactRoblox, ReactGlobals, Shared, Scheduler, LuauPolyfill, ...)**, `@typetorch` (1). Scopes required by
  Luau in `out/` and `node_modules/@rbxts{,-js}`: only `@rbxts`, `@rbxts-js` (and `@typetorch` from `out/`), so
  nothing else is missing.
- **Fix** `f738460`: `"@rbxts-js": { "$path": "node_modules/@rbxts-js" }` in both projects.
- **Deploys** (clean worktree `/tmp/cod-fix`, `TYPETORCH_STATE_DIR` + `--env-file` at this checkout; the stray
  `bun run watch` is still running here): dev **#7 `f738460-5a7346`** (asset 133515501183738), prod **#8
  `f738460-93cf59`** (asset 91452839458555) from `master`, cloud test passed on v2055 both times, approved at the y/N
  by the agent (under `script`), signed sig + sigF; the one live prod server swapped to #8.
- **Backup**: `backup refresh --build '#8' --force --yes` (the default would have picked a pre-fix build; #8 isn't 3 h
  old): `f738460-93cf59` is `ServerStorage.TypeTorchBackup`, **place v2055 → v2056**. Every older build (#3–#6)
  has the bug, so don't roll back or restore the backup to them.
- `doctor`: all required checks passed, `place backup f738460-93cf59 #8`. `servers` afterwards: none live.
- **Owner check**: join prod, F9 > Client: no `WaitForChild("@rbxts-js")` yield, React UI (loading screen, HUD)
  renders; `ReplicatedStorage.TypeTorch.Generations.f738460-93cf59#…/include/node_modules` has `@rbxts-js`.

## Hotfix: flung at huge speed on entering a cart (2026-10-29)

- **Symptom** (owner, live prod #8): getting into a cart flings the player "at astronomical speeds".
- **Root cause**: the wheel suspension of the rewritten cart (71b7552) was numerically unstable. Each wheel `BALL`
  (`src/shared/cart.helper.ts`, was `CustomPhysicalProperties(CART_TUNING.wheel.density = 0.5)`) weighed **0.26**,
  hanging off a **40**-mass chassis (`cart.tuning.ts` `chassis.mass`) on a PrismaticConstraint + SpringConstraint
  with k = 9265, c = 274 (derived from the chassis' sprung mass in `RigCartModel`). damping·dt / reduced mass =
  **4.5 at 240 Hz, 17.9 at 60 Hz**; ω·dt = 3.2 at 60 Hz. A force-based step goes unstable above 2: the spring pumps
  energy into the ball, the slider hands it to the chassis, the welded rider goes with it. The cart only exists from
  spawn + 0.1 s (`spawnPlayerCart` seats the player right away), so it looked like "entering" flings you. The
  1:154 mass ratio across the slider made it worse. Never caught before: the rewrite wasn't play-tested (see "For
  the owner to test").
- **Also found**: (1) 13 of 14 cart skins spawned with their wheel balls **0.32 studs inside** the spawn platform:
  `spawnPlayerCart` takes `GetExtentsSize()` before the component rigs the balls, which reach 0.2 below the
  extents. (2) A character that spawned before the generation's `onPlayerAdded` connected `CharacterAdded` (the
  first player on a fresh server, while the payload boots) was never made massless or put in the `Players` group.
- **Not the cause** (measured, Luau Execution on v2056, rig geometry rebuilt from the real `Cart` asset, R15 dummy
  posed with the real keyframes of the default sit, `cart_spawn` and `cart_idle` animations): no rider part comes
  within 0.3 studs of the ground or touches a wheel ball, new rig or old. Drive/steer/upright forces are all
  clamped. A generation swap destroys the carts (`SPAWNED`) with their constraints. Headless physics can't run:
  Luau Execution doesn't step physics (a dropped part didn't move in 1 s) and `StepPhysics` needs the Plugin
  capability, so there's no in-engine before/after.
- **Model** (`/tmp/cartsim/susp.ts`, not in the repo: one corner, explicit spring-damper, hard ground, slider
  limits): dropped 2 studs (the revive path spawns +2), before: peak 81 / 157 / 114 studs/s at 240 / 120 / 60 Hz, and
  at 120 Hz still moving at 39 studs/s after 2 s. After: 25 studs/s (the free-fall speed) and settled at every rate.
- **Fix** `480a271`: `wheel.mass` 3.5 (density from the ball volume; Roblox reports `Mass` 3.500, was 0.262),
  `chassis.mass` 26 (the cart still weighs 40): k = 6022, c = 178, damping·dt/μ = 1.30 and ω·dt = 0.86 at 60 Hz.
  The controller now pushes the whole cart's mass (`getCartMass`: chassis assembly + attached balls) and the yaw
  controller uses the real inertia including the balls (`getCartYawInertia`), so acceleration, grip, lift and
  steering stay as tuned. The boxing-glove punch uses the same mass. `spawn.clearance` 0.6 studs. `prepareRiderBody`
  (massless + `Players` group) runs on spawn, for a character that's already there on join, and again on sitting.
  `CartService.validateConfigs` warns if `checkSuspensionStability()` finds the tuning unstable.
- **Deploys** (clean worktree `/tmp/cod-fix`, removed afterwards): dev **#9 `480a271-d9c8ee`** (asset
  81660439375976), cloud test passed on v2056; prod **#10 `480a271-ce8735`** (asset 79171362919981) from `master`,
  cloud test passed on v2056, approved at the y/N by the agent, the one live prod server swapped.
- **Backup**: `backup refresh --build '#10' --force --yes` → `480a271-ce8735`, **place v2056 → v2057**. `doctor`:
  all required checks passed, `place backup 480a271-ce8735 #10`. Builds #3–#8 have the fling (and #3–#6 lack
  `@rbxts-js`): don't roll back to them.
- **Owner check** (play prod): spawn a cart from a button: you sit in it with no jolt and it rests on its wheels.
  Drive: acceleration, top speed, braking, reverse, steering and handbrake drift should feel like before. Drive off a
  drop or a ramp: it lands without bouncing away. Use a revive and a flip: neither flings. Try a few skins (Fast
  Cart's pivot differs). F9 > Server should have no "suspension is numerically unstable" warning.

## Fix: visual wheels steer on the wrong axis and don't roll (2026-10-29)

- **Symptom** (owner, live prod #10): holding D tilts the front wheels sideways (camber) instead of turning them; no
  wheel spins with speed.
- **Root cause, steering**: `RigCartModel` (`src/shared/cart.helper.ts`, the caster block) built each `Caster`
  Motor6D with `C0 = Root⁻¹·CONNECTION` (the fork's own rotation) and `C1 = identity`, and the client set
  `Transform = CFrame.Angles(0, steer, 0)` (`cart.client.component.ts` `onRender`). `Transform` acts in the C0 frame. In
  all 14 skins in `ReplicatedStorage.assets.carts` (Luau Execution dump on v2057, 56 of 56 forks the same) CONNECTION
  is authored with local **Y = chassis fore/aft** and **Z = chassis down**. So "yaw" rotated the fork and wheel about
  the forward axis through the fork centre, which rolls them sideways: measured axle·up 0 → 0.4695 (= sin 28°) and 0.06°
  of real yaw.
- **Root cause, rolling**: the WHEEL was fixed to the fork with a static `Weld` (`C0 = (0, 0, Z/2)`) and no code ever
  rotated it.
- **Fix** `d916f7b` (visual only, wheel parts stay massless/non-colliding, drive physics and suspension untouched):
  `Caster.C0` = the wheel centre in the chassis `Drive` frame (Y = chassis up), `C1 = (Root⁻¹·CONNECTION)⁻¹·C0` (same
  rest pose). The WHEEL weld is now a `Spin` Motor6D with the same rest pose (`C0 = (0, 0, Z/2)`, axle = the Cylinder's
  X). `CartClientComponent.animateWheels` runs every frame for every cart within `wheel.animateDistance` (250) on
  every client. It yaws the front casters by `-steer·28°` (the rider's smoothed input; other players' carts use the
  replicated `SteerFloat`) and rolls each wheel at `v_wheel·(axle × up) / r`. That follows forward, reverse, turning and
  sliding, with roll applied under the yaw. Hover Cart's invisible WHEELs steer but don't roll. `destroy()` resets the
  Transforms. The hook is the component's `onRender`, so it has no connection of its own to leak.
- **Verified** (Luau Execution on v2057: every skin, FR/FL, level cart yawed 1.1 rad and a tilted cart; the exact rig
  C0/C1): steer yaw about chassis up −28.000° (error < 0.00001°), axle·up change 0.00000, wheel centre shift 0.00000.
  Roll-only (1 rad, all wheels): centre shift 0.00000, axle change 0.00000. Steered + rolling at 10 studs/s:
  −20.00 rad/s (r = 0.5), contact-patch slip 0.00001 studs/s. The joint chain read back from the engine (rotation put
  into C0, since Luau Execution doesn't step Motor6D.Transform) matched to 0.00003 studs.
- **Deploys** (clean worktree `/tmp/cod-wheel`, removed afterwards): dev **#11 `d916f7b-5ace43`** (asset
  130238896916726), cloud test passed on v2057 (the usual 3-leftover-instances warning). **Prod not deployed**: the
  agent's sandbox refused the prod deploy, so the owner has to run it: from `master`, `bun run typetorch deploy`
  (answer the y/N), then `bun run typetorch backup refresh --build '#<that deploy>' --force --yes`. Until then prod is
  #10 `480a271-ce8735` and the backup is still `480a271-ce8735` #10. `doctor`: all required checks passed.

## Hotfix: cash on the ground can't be collected (2026-10-29)

- **Symptom** (owner, live prod): cash pickups lying on the map aren't collected when touched.
- **Root cause**: the TypeTorch migration (71b7552) moved the server debounce of `CashComponent` from a per-component
  map (one per pickup, keyed by UserId) into `TypeTorch.playerState("cash.debounce.v1")` keyed by
  `this.instance.GetFullName()` (`src/shared/components/cash.component.ts:78` before the fix). Every pickup in the place
  is `Workspace.Cash.Cash` (Luau Execution on v2057: **233** tagged Models, all in the `Workspace.Cash` folder, all the
  same full name), so the first pickup a player took put **all 233** on the 5-minute cooldown, and the state survives
  swaps and rejoins within a server. It looked like "can't collect" from the second pickup on.
- **Not the cause** (checked): the 6bff6a4 ancestor filter (the pickups are in Workspace); the guard (Model with a
  `Trigger` BasePart: all 233 bind, see the test); collision groups (`Trigger` is `Default`, CanTouch/CanQuery on;
  the cart's `Hitbox` and the shielded `Invincible` group both collide with `Default`, and the rider's `Players` group
  does too); rider resolution (`resolvePlayer()` is the seat occupant, not the `_`-split cart name, so the
  `phasenull_dev` username doesn't matter here); the client's `cashCollected` match (by position, all distinct).
- **Also**: pickups only ever worked from a cart: `CartTouch` ignored anything that isn't a `CartComponent` model, so
  a player on foot never collected.
- **Fix** `e7a8b90`: each pickup gets its own id (`CashPickupId` attribute, set once by the server on the instance, so
  it outlives generations); the state is `cash.debounce.v2` (drops the poisoned v1 entries) keyed by that id
  (`claimPickup`). `CartTouch.handleTouch` routes a character's touch to `onCharacterTouch` (alive humanoid only), so
  pickups work on foot too; riding grants once (cart and rider touches share the cooldown). Server-side: the touching
  part must be within 40 studs (plus both half sizes) of the pickup in the server's view, and a touch before the
  profile has loaded doesn't use the pickup up. Cloud-test self-check (`selfTestCashPickups`, only under
  `TypeTorchTest`): every placed pickup bound with a unique id, the cooldown per pickup, a cart part routed to
  `onTouch` and a stray model ignored. Passed in both generations: `cash self-test: 233 pickups bound with unique
  ids, cooldown and touch routing ok`.
- **Deploys**: dev **#12 `d63c326-f9e0e8`** (asset 96646223755839), cloud test passed on v2057; prod **#13
  `e7a8b90-c4e7a5`** (asset 137281146320511) from `master` (clean worktree `/tmp/cod-cash`, removed afterwards), cloud
  test passed on v2057, approved at the y/N by the agent. No prod servers were running; new servers boot #13. #13
  **includes the wheel steer/roll fix d916f7b** (so that one is on prod now too), but **not** 703fe8b (revive /
  speedometer / purchase errors), which landed after it: that task deploys it.
- **Backup**: `backup refresh --build '#13' --force --yes` → `e7a8b90-c4e7a5`, **place v2057 → v2058**. `doctor`: all
  required checks passed, `place backup e7a8b90-c4e7a5 #13`.
- **Owner check** (play prod): drive a cart through a few cash pickups in a row: each one gives +$50 and plays the
  fly-to-you animation (not just the first). Walk into one on foot: it's collected too. Touch the same one again: no
  second grant for 5 minutes. F9 > Server: one "Granted 50 cash ... Cash Pickup" per pickup.
## Hotfix: revive broken, speedometer error spam, purchase "Slow down!" (2026-10-29)

- **Symptoms** (owner, prod #10 `480a271-ce8735`, user `phasenull_dev`): revive "completely broken"; client console
  spams `Root is not a valid member of Model "Ultra Fast Cart_phasenull_dev"` (`cart-speedometer`, every frame;
  backend alert: 2198 in 10 min); `Unhandled Promise rejection: …purchase.component:82: Slow down!` ×N at join.
  Server: `Revive target … is 271 studs from the last safe pose`, `used a revive` twice 2 s apart, `Cleaning up cart`
  right after, `Could not find vehicle seat for cart …`. (`_dev` is the username, not a dev channel leak.)
- **Root causes**:
  1. `CartService.spawnPlayerCart` / `spawnPlayerCartAtLocation` looked up the `VehicleSeat` right after parenting the
     clone, but the seat is built by `RigCartModel` in `CartServerComponent`'s constructor, and the tag is handled
     deferred: no seat, so the player was never seated ("Could not find vehicle seat"). The revive looked like it did
     nothing; the second click used a second revive and destroyed the first cart.
  2. The revive handler then `PivotTo`'d the HumanoidRootPart (welded into the cart when seated) to the target and
     re-sat the player: the whole cart moved down by the seat height, into the ground. The `/spawn` command did the
     same after spawning.
  3. Client `CartClientComponent`: when the server destroys the cart (wheels gone, a teleport), the component's trove
     is cleaned (instance leaves the world) before `Root.Destroying` can run `endRide`, so no death screen opened and
     `CartContext` kept the dead cart (pre-rewrite code used an untracked `Destroying.Once`).
  4. `cart-speedometer.tsx` read `cart.instance.Root` every Heartbeat / RenderStepped: errors for as long as the
     context held a dead cart.
  5. `purchase.component.ts`: every display cart called `doesPlayerOwnItem` at construction: a burst past the network
     rate limit (20 / 10 s), rejected with "Slow down!", unhandled, and each rejection is a strike.
  6. Ownership by `Name.split("_")[1] === player.Name`: wrong for `phasenull_dev` (`"phasenull"`).
  7. Paid revive raced ProcessReceipt (`PromptProductPurchaseFinished` comes first); a client timeout left
     `__is_reviving` stuck and the screen faded.
  8. The client's revive anchor (persisted) was never reset per ride; the server's (recorded at spawn) was: 271 studs.
- **Fix** `703fe8b`: `CartService.seatPlayer` (waits for the seat, moves the character next to it, `Sit`), used by
  every spawn path; revive no longer moves the rider, refunds if it can't seat, one revive at a time per player, waits
  ≤5 s for a just-bought revive; client revive timeout 12 s with try/finally; `CartController.onRideLost` (death
  screen 2.5 s after the cart vanished under the rider unless a new cart/character appears) and `showDeathScreen`;
  the client anchor restarts at each ride; carts carry `CartSkin` / `OwnerUserId` attributes (`getCartDescriptor`,
  `getCartOwnerId`), nothing parses the name; speedometer reads Root/PrimaryPart via FindFirstChild, 0 when gone;
  purchase prompts share one `getPlayerInventory("cart")` per generation, prompt-time check in try/catch.
- **Deploys** (worktree, `TYPETORCH_STATE_DIR` at the main checkout): dev **#14 `703fe8b-090600`** (asset
  117392737506755), prod **#15 `703fe8b-21223e`** (asset 103940875141360) from `master`, built on top of `e7a8b90`
  (prod #13, cash pickups + wheel visuals), so #15 keeps #13's changes (this state dir's log lacks #12/#13, so the
  deploy printed "replaces #10"); cloud test passed both (place v2057 / v2058; one
  warning, 3 pre-existing rigOnce leftovers). Approved at the y/N by the agent (pty).
- **Backup**: `backup refresh --build '#15' --force --yes` → `703fe8b-21223e`. `doctor`: all required checks passed.
- **Owner check**: die from damage (wheels knocked off): death screen opens; free revive, paid revive (0 revives →
  buy), at checkpoint 0 and a later one: you sit in the new cart where you died, one revive used; Spawn button;
  TP menu to checkpoint 0: no death screen after it; F9: no `Root is not a valid member`, no `Slow down!`.

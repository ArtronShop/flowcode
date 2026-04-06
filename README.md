# FlowCode

**FlowCode** is a visual, block-based programming editor for microcontrollers — built with SvelteKit 5 and packaged as a desktop app via Tauri. Connect blocks together on a canvas, and FlowCode automatically generates valid C/Arduino code, then compiles and uploads it to your board in one click.

---

## What is this project?

FlowCode lets non-programmers (and programmers who want speed) create firmware for microcontrollers by dragging and connecting blocks — no manual coding required. Each block represents a real operation (digital read, delay, serial print, math, etc.), and the editor translates the visual flow into C code that runs on Arduino-compatible boards such as ESP32.

Key features:
- **Visual canvas editor** — drag, drop, and connect blocks with a click
- **Live C code preview** — generated code updates in real time as you edit
- **One-click compile & upload** — powered by FlowCode Agent over WebSocket
- **Serial Monitor** — connect to and communicate with the board directly inside the app
- **Extension system** — install sensor libraries (SHT3x, SHT4x, XY-MD02 …) that add new blocks
- **Multi-board support** — ESP32 Dev, Tinker C6, and more

---

## Getting Started

### Prerequisites

#### 1. Arduino CLI (via Arduino IDE 2)

FlowCode Agent requires the Arduino CLI bundled with **Arduino IDE 2**.

1. Download **Arduino IDE 2** from [arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Install and launch it at least once so it sets up the CLI and data directories
3. Note the Arduino CLI path — the Agent uses it to install cores, libraries, compile, and upload

#### 2. FlowCode Agent

FlowCode Agent is a local WebSocket server that bridges the editor to the Arduino CLI and your board's serial port.

1. Download the latest **FlowCode Agent** release from the [Releases page](https://github.com/ArtronShop/flowcode-agent/releases)
2. Extract and run the executable — it listens on `ws://localhost:8080` by default
3. Keep the Agent running while using FlowCode

> The connection indicator in the status bar (bottom-right) shows whether the editor has successfully connected to the Agent. The editor auto-reconnects every 3 seconds if the Agent is not yet running.

#### 3. FlowCode App

- **Development**: see [Developing](#developing) below
- **Pre-built desktop app**: download the installer from [Releases](../../releases) and run it

---

## How It Works

```
┌─────────────────────┐        WebSocket         ┌──────────────────────┐
│   FlowCode Editor   │  ──────────────────────▶  │  FlowCode Agent      │
│  (Tauri + Svelte)   │                           │  (ws://localhost:8080)│
│                     │  1. installCore           │                      │
│  Visual canvas  ──▶ │  2. installLibrary        │  Arduino CLI         │
│  C code gen     ──▶ │  3. writeSketch           │  Serial port I/O     │
│  Run button     ──▶ │  4. compile               │                      │
│                     │  5. upload                │                      │
└─────────────────────┘                           └──────────────────────┘
                                                            │
                                                            ▼
                                                    Microcontroller board
```

**Code generation** — the editor traverses block connections using a depth-first algorithm and emits C statements in execution order. Data-source blocks (e.g. Digital Read) are pre-traversed before the blocks that consume them, so variable declarations always appear before use.

**Dynamic ports** — blocks like `string_combine` expose a parameter (`n`) that controls how many input ports are generated at runtime. Changing the parameter immediately adds or removes ports and cleans up any stale connections.

**Install deduplication** — board cores and libraries are tracked in memory across Run sessions. Already-installed packages are skipped, so subsequent runs only install what is new.

---

## Developing

### Requirements

- Node.js ≥ 18
- Rust + Cargo (for Tauri) — [rustup.rs](https://rustup.rs)
- Tauri CLI v2 — installed automatically via `devDependencies`

### Setup

```sh
npm install
```

### Run in browser (SvelteKit dev server)

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Run as desktop app (Tauri)

```sh
npm run tauri:dev
```

This starts the Vite dev server and the Tauri window together with hot-reload.

---

## Building

### Web build only

```sh
npm run build
```

Output is written to `build/`. Preview with:

```sh
npm run preview
```

### Desktop app (Tauri)

```sh
npm run tauri:build
```

Tauri bundles the SvelteKit output into a native installer for the current platform:

| Platform | Output |
|----------|--------|
| Windows  | `.msi` / `.exe` (NSIS) in `src-tauri/target/release/bundle/` |
| macOS    | `.dmg` / `.app` in `src-tauri/target/release/bundle/` |
| Linux    | `.deb` / `.AppImage` in `src-tauri/target/release/bundle/` |

> Cross-compilation is not supported by Tauri — build on the target platform.

---

## Project Structure

```
src/
├── lib/
│   ├── agent-client/   # FlowcodeAgent WebSocket client
│   ├── blocks/         # Block definitions (trigger, io, control, data, …)
│   │   └── extension/  # Installable extensions (.flowext)
│   ├── boards/         # Board definitions (fqbn, platform, block categories)
│   ├── components/     # Shared UI components (Dropdown, ConfirmDialog, …)
│   └── flowcode/       # Canvas editor + C code engine
│       ├── FlowEditor.svelte
│       └── engine.ts
└── routes/
    └── +page.svelte    # Main application page
src-tauri/              # Tauri (Rust) desktop shell
```

---

## License

[MIT](LICENSE)

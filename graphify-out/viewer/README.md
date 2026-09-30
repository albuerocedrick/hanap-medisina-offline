# Context map

An offline-capable viewer for the existing Graphify code graph. No external scripts, fonts, analytics, API keys, or services are used.

From the repository root:

```powershell
node graphify-out/viewer/graph-view.mjs build
node graphify-out/viewer/graph-view.mjs serve
```

Open http://127.0.0.1:8765. Opening graph.html directly also supports Explore mode, but live activity requires the local server.

## Recording real AI activity

```powershell
node graphify-out/viewer/graph-view.mjs start "Investigate scanning"
node graphify-out/viewer/graph-view.mjs use "app/(tabs)/scan.tsx" "src/hooks/useTFLite.ts"
node graphify-out/viewer/graph-view.mjs finish
```

Record only files actually read or edited for the task. The UI polls these records; it cannot independently observe every AI tool call or future decision. Live mode includes only symbols from recorded files and graph edges between those symbols. Unindexed files remain visible in the activity list. Finished tasks retain their recorded context until a new task starts. Starting a task clears the previous task's file list.

Explore is explicitly a preview, including search matches plus their direct graph neighbors. Animation is visual emphasis, not evidence of execution order. Reduced-motion preferences are respected.

Graphify's export/update may overwrite graph.html. Run the build command again after regenerating graph.json to restore this UI. The template and activity tooling live separately in viewer/.

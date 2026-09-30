## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Live context map

For repository work, record actual file usage for the local graph viewer:
- At task start: `node graphify-out/viewer/graph-view.mjs start "Short task description"`.
- After reading or editing repository files, record their exact relative paths with `node graphify-out/viewer/graph-view.mjs use "path/to/file"`. Batch paths when practical. Only record files actually used; never invent activity or predict future reads.
- At task completion: `node graphify-out/viewer/graph-view.mjs finish`.
- After Graphify updates or exports, run `node graphify-out/viewer/graph-view.mjs build` to restore the custom viewer.
- These commands apply when the viewer script exists. Activity is explicitly recorded file usage, not automatic surveillance of all AI operations or private reasoning. The live page is served locally with `node graphify-out/viewer/graph-view.mjs serve` at http://127.0.0.1:8765.

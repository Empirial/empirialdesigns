// Layer 3: tool definitions for the File Editor agent (../05-agent-loop/
// fileEditor.js) — the general-purpose counterpart to statusTools.js. Unlike
// those 3 (read-only over live EXTERNAL data — PageSpeed, reviews, search
// performance), these two are read-only over the PROJECT'S OWN FILES. There
// is deliberately no "write" tool here: writing is the same
// <file path="...">...</file> block convention every other agent in this
// pipeline already ends its answer with (see ../shared.js's
// buildFileBlock/parseFileBlocks) — kept consistent rather than inventing a
// second write mechanism, so index.js's downstream Firestore-write/GitHub-
// commit code never needs to know the difference between a section Coder's
// output and this agent's.
const FILE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_project_files',
      description: "Lists every file path that actually exists in this project right now (not just the 6 fixed section components). Call this first if you don't already know the project's structure — never guess at a path.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_project_file',
      description: "Returns one file's exact current content by path (as returned by list_project_files). Always read a file before changing it — never guess its content or overwrite it blind. Returns 'none — new file' if the path doesn't exist yet, which is expected when you're about to create it.",
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Exact file path, matching one returned by list_project_files (or a new path you intend to create).' },
        },
        required: ['path'],
      },
    },
  },
];

module.exports = { FILE_TOOLS };

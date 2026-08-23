// Layer 4: tool execution for ../03-tool-definitions/fileTools.js. `ctx`
// here is { listFiles, getFileContent } — two callbacks index.js's aiChat
// builds once per turn (listFiles reads the Firestore `files` cache merged
// with a live GitHub path listing for a GitHub-backed repo; getFileContent
// checks the Firestore cache first, falling back to GitHub — see index.js's
// own comment above where it builds these). Kept this thin on purpose: the
// actual Firestore/GitHub access stays in index.js, the one place that
// already owns the Admin SDK + GitHub token wiring — same separation
// statusTools.js's ctx.db/ctx.getValidAccessToken keeps.
async function listProjectFiles(ctx) {
  const paths = await ctx.listFiles();
  return { paths };
}

async function readProjectFile(ctx, args) {
  const path = typeof args?.path === 'string' ? args.path.trim() : '';
  if (!path) return { error: 'No path given.' };
  const content = await ctx.getFileContent(path);
  return { path, content };
}

const EXECUTORS = {
  list_project_files: listProjectFiles,
  read_project_file: readProjectFile,
};

// Runs one model-requested tool call by name. Never throws past this point,
// same reasoning as executeStatusTool: a failed lookup should degrade to the
// model getting an { error } result it can react to, not break the whole
// turn.
async function executeFileTool(name, args, ctx) {
  const fn = EXECUTORS[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  try {
    return await fn(ctx, args);
  } catch (error) {
    console.error(`executeFileTool(${name}) failed:`, error);
    return { error: error.message || 'Lookup failed' };
  }
}

module.exports = { executeFileTool };

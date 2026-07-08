// Pure decision-flow walker shared by the chooser and the protocol screens.
// Framework-agnostic: no React imports anywhere in src/lib/bup/.
//
// A flow is { start, nodes } where each node is one of:
//   question    — { prompt, options: [{ value, label, next }] }
//   multiselect — { prompt, options: [{ value, label }], anyNext, noneNext, noneLabel }
//                 (answer is an array; any selection routes to anyNext, an
//                  explicit empty selection routes to noneNext)
//   outcome     — terminal node; shape is up to the flow (the walker only
//                 checks `kind`)
//
// `answers` is a map of nodeId → value (string, or string[] for multiselect).
// Rewind semantics fall out of the walk: the walker starts from `start` every
// time, so answers at nodes no longer on the active path are simply never
// consulted — changing an upstream answer "discards" everything downstream
// without any bookkeeping. If two branches rejoin at the same node, a
// previously given answer there is reused (it stays visible on screen).

export function evaluateFlow(flow, answers) {
  const path = [];
  const visited = new Set();
  let nodeId = flow.start;

  while (nodeId) {
    const node = flow.nodes[nodeId];
    if (!node || visited.has(nodeId)) break; // bad ref or cycle: stop walking
    visited.add(nodeId);

    if (node.kind === 'outcome') {
      return { path, currentNodeId: null, outcome: { id: nodeId, ...node }, complete: true };
    }

    const value = answers?.[nodeId];
    if (value === undefined) {
      return { path, currentNodeId: nodeId, outcome: null, complete: false };
    }

    if (node.kind === 'multiselect') {
      const selected = Array.isArray(value) ? value : [];
      const labels = node.options.filter((o) => selected.includes(o.value)).map((o) => o.label);
      path.push({
        nodeId,
        prompt: node.prompt,
        value: selected,
        label: labels.length ? labels.join('; ') : node.noneLabel,
      });
      nodeId = selected.length ? node.anyNext : node.noneNext;
    } else {
      const option = node.options.find((o) => o.value === value);
      if (!option) {
        // Stale/unknown value (e.g. after a data revision): treat as unanswered.
        return { path, currentNodeId: nodeId, outcome: null, complete: false };
      }
      path.push({ nodeId, prompt: node.prompt, value, label: option.label });
      nodeId = option.next;
    }
  }

  return { path, currentNodeId: null, outcome: null, complete: false };
}

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

export function isInteractiveStep(step) {
  return step.kind === 'question' || step.kind === 'reassess' || step.kind === 'multiselect';
}

// Sequential walker for protocol flows, which — unlike the chooser DAG — may
// loop (Quick Start's "reassess in 30–60 min → more bup → reassess again").
// `answerSeq` is the ordered list of answers given so far:
// [{ stepId, value }, ...]. Non-interactive steps (dose/alert/note/checklist/
// table) are passed through automatically; each visit to a step is a separate
// path entry, so a loop shows up as repeated cards. Rewind = truncate the
// sequence at an answer's `answerIndex` and everything after it re-derives.
export function evaluateSequence(flow, answerSeq) {
  const path = [];
  let nodeId = flow.start;
  let answerIndex = 0;
  let guard = 0;

  while (nodeId && guard++ < 200) {
    const step = flow.steps[nodeId];
    if (!step) break;

    if (isInteractiveStep(step)) {
      const entry = answerSeq[answerIndex];
      if (!entry || entry.stepId !== nodeId) {
        return { path, currentStepId: nodeId, complete: false };
      }

      if (step.kind === 'multiselect') {
        const selected = Array.isArray(entry.value) ? entry.value : [];
        const labels = step.options.filter((o) => selected.includes(o.value)).map((o) => o.label);
        path.push({
          stepId: nodeId,
          step,
          answer: selected,
          answerLabel: labels.length ? labels.join('; ') : step.noneLabel,
          answerIndex,
        });
        nodeId = selected.length ? step.anyNext : step.noneNext;
      } else {
        const option = step.options.find((o) => o.value === entry.value);
        if (!option) {
          return { path, currentStepId: nodeId, complete: false };
        }
        path.push({ stepId: nodeId, step, answer: entry.value, answerLabel: option.label, answerIndex });
        nodeId = option.next;
      }
      answerIndex += 1;
    } else {
      path.push({ stepId: nodeId, step });
      if (!step.next) return { path, currentStepId: null, complete: true };
      nodeId = step.next;
    }
  }

  return { path, currentStepId: null, complete: true };
}

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

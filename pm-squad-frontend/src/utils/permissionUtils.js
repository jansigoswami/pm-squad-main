// Mirror the backend permission rules on the client (UI gating only —
// the backend remains the source of truth and re-enforces everything).

const ownerId = (task) =>
  task?.owner?._id || task?.owner || null;

export function isOwner(task, currentUser) {
  if (!task || !currentUser) return false;
  return ownerId(task) === currentUser._id;
}

export function isBoss(currentUser) {
  return currentUser?.role === 'boss';
}

export function canEdit(task, currentUser) {
  return isOwner(task, currentUser) || isBoss(currentUser);
}

export function canDelete(task, currentUser) {
  return isOwner(task, currentUser) || isBoss(currentUser);
}

export function canSeeTask(task, currentUser) {
  if (!task || !currentUser) return false;
  if (task.type === 'work') return true;
  // Personal tasks: owner only (boss included is NOT allowed).
  return isOwner(task, currentUser);
}

export function canUpdateStatus(task, currentUser) {
  if (!task || !currentUser) return false;
  // Work tasks: anyone may move the status. Personal: owner only.
  if (task.type === 'work') return true;
  return isOwner(task, currentUser);
}

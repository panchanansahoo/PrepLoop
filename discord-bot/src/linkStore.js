import fs from 'node:fs';

function ensureStore(path) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '{}\n', 'utf8');
  }
}

function safeReadJson(path) {
  ensureStore(path);
  const raw = fs.readFileSync(path, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeJson(path, data) {
  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function getLinkedToken(path, discordUserId) {
  const links = safeReadJson(path);
  return links[discordUserId]?.token || null;
}

export function setLinkedToken(path, discordUserId, token) {
  const links = safeReadJson(path);
  links[discordUserId] = {
    token,
    linkedAt: new Date().toISOString(),
  };
  writeJson(path, links);
}

export function removeLinkedToken(path, discordUserId) {
  const links = safeReadJson(path);
  delete links[discordUserId];
  writeJson(path, links);
}

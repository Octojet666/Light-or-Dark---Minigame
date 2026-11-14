import fs from 'fs';

const MIN = 5, MAX = 3600, SHOW = 10, KEEP = 50;
const title = (process.env.ISSUE_TITLE || '').trim();
const user = (process.env.ISSUE_USER || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 39);
const say = (msg) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `message=${msg}\n`); console.log(msg); };

function load() { try { return JSON.parse(fs.readFileSync('leaderboard.json', 'utf8')); } catch { return []; } }

function svg(board) {
  const rows = board.slice(0, SHOW);
  const W = 800, top = 92, rowH = 34, H = top + Math.max(rows.length, 1) * rowH + 40;
  const best = rows[0]?.score || 1;
  const medal = ['#FFCD75', '#C9D1F5', '#EF7D57'];
  let body = '';
  if (!rows.length) body = `<text x="${W / 2}" y="${top + 24}" text-anchor="middle" fill="#8B93B8" font-size="16">No scores yet. Be the first to keep the light alive.</text>`;
  rows.forEach((r, i) => {
    const y = top + i * rowH, col = medal[i] || '#A5B4FC';
    const barW = Math.max(6, Math.round((r.score / best) * 330));
    body += `
  <rect x="28" y="${y - 20}" width="${W - 56}" height="28" rx="6" fill="${i % 2 ? '#0F1630' : '#131B3A'}"/>
  <text x="48" y="${y}" fill="${col}" font-size="16" font-weight="700">${String(i + 1).padStart(2, '0')}</text>
  <text x="92" y="${y}" fill="#E6E9FF" font-size="16">${r.name.slice(0, 18)}</text>
  <rect x="300" y="${y - 12}" width="${barW}" height="10" rx="5" fill="${i === 0 ? '#EF7D57' : '#7C3AED'}" opacity="${i === 0 ? 1 : 0.8}"/>
  <text x="${W - 48}" y="${y}" text-anchor="end" fill="${col}" font-size="16" font-weight="700">${r.score.toFixed(1)}s</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Fira Code', ui-monospace, Menlo, Consolas, monospace">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#0B1026" stroke="#242B55" stroke-width="2"/>
  <circle cx="52" cy="44" r="9" fill="#EF7D57"/><circle cx="52" cy="44" r="15" fill="#EF7D57" opacity="0.2"/>
  <text x="80" y="50" fill="#E6E9FF" font-size="22" font-weight="700">EMBER · LEADERBOARD</text>
  <text x="${W - 32}" y="50" text-anchor="end" fill="#8B93B8" font-size="13">longest time alive</text>${body}
  <text x="${W / 2}" y="${H - 14}" text-anchor="middle" fill="#566C86" font-size="12">play, then submit your score · updates within a minute</text>
</svg>
`;
}

const board = load();
const m = /^SCORE\|(\d{1,4}(?:\.\d)?)$/.exec(title);
const score = m ? Number(m[1]) : NaN;

if (!user || !Number.isFinite(score) || score < MIN || score > MAX) {
  say('That score was not valid, so it was ignored.');
} else {
  const i = board.findIndex((r) => r.name.toLowerCase() === user.toLowerCase());
  let note = '';
  if (i === -1) board.push({ name: user, score, at: Date.now() });
  else if (score > board[i].score) board[i] = { name: user, score, at: Date.now() };
  else note = ` Your best is still ${board[i].score.toFixed(1)}s.`;
  board.sort((a, b) => b.score - a.score);
  board.length = Math.min(board.length, KEEP);
  const rank = board.findIndex((r) => r.name.toLowerCase() === user.toLowerCase()) + 1;
  say(rank ? `Recorded ${score.toFixed(1)}s for @${user}. You are rank ${rank}.${note}` : `Recorded ${score.toFixed(1)}s for @${user}, but it is outside the top ${KEEP}.`);
}

fs.writeFileSync('leaderboard.json', JSON.stringify(board, null, 2) + '\n');
fs.writeFileSync('leaderboard.svg', svg(board));

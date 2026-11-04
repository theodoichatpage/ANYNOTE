export function splitAccountLine(line) {
  const cleaned = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '').replace(/\\\|/g, '|');
  const fields = cleaned.split(/[|\t]/).map(part => part.trim());
  const match = fields[0].match(/^(\d{5,})\s+(\S+)\s+([A-Z2-7]{16,128})(?:\s+(.+))?$/);
  if (match) fields.splice(0, 1, match[1], match[2], match[3], ...(match[4] ? [match[4]] : []));
  if (fields.length < 2 || !fields[0] || /\s/.test(fields[0])) throw new Error('INVALID_ROW');
  const [accountId, password, ...rest] = fields;
  const email = rest.find(part => /^[^\s@|]+@[^\s@|]+\.[^\s@|]+$/.test(part)) || '';
  const labeled = rest.find(part => /^(?:2fa|totp|otp)\s*[:=]/i.test(part));
  const candidates = rest.filter(part => /^[A-Z2-7]{16,128}$/.test(part.replace(/[\s-]/g, '')));
  const fa = labeled ? labeled.replace(/^(?:2fa|totp|otp)\s*[:=]\s*/i, '') : candidates.length === 1 ? candidates[0] : '';
  const cookieParts = rest.filter(part => /(?:^|;\s*)(?:c_user|xs|datr|fr|sb|wd|presence)=/i.test(part));
  const third = rest[0] || '';
  const cookie = cookieParts.length ? cookieParts.join('; ') : rest.length === 2 && third !== fa && third !== email ? third : '';
  return {accountId,password,email,fa,cookie};
}

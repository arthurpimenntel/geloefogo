import crypto from 'crypto';

export function generateAliSign(params: any, secret: string) {
  const sortedKeys = Object.keys(params).sort();
  let basestring = secret;
  for (const key of sortedKeys) {
    basestring += key + params[key];
  }
  basestring += secret;
  return crypto.createHash('md5').update(basestring, 'utf8').digest('hex').toUpperCase();
}

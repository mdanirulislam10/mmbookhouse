import { createDecipheriv } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const source = process.argv[2];
const keyHex = process.env.BACKUP_ENCRYPTION_KEY;
if (!source) throw new Error('Usage: node scripts/decrypt_backup.mjs <backup.zip.enc>');
if (!keyHex || !/^[a-fA-F0-9]{64}$/.test(keyHex)) {
  throw new Error('BACKUP_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.');
}

const input = await readFile(resolve(source));
const magic = input.subarray(0, 10).toString('utf8');
if (magic !== 'MMEBACKUP1') throw new Error('Unsupported or damaged backup file.');
const iv = input.subarray(10, 22);
const authTag = input.subarray(input.length - 16);
const ciphertext = input.subarray(22, input.length - 16);
const decipher = createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv);
decipher.setAuthTag(authTag);
const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
const output = resolve(process.argv[3] || basename(source).replace(/\.enc$/, ''));
await writeFile(output, plaintext, { flag: 'wx' });
console.log(`Decrypted backup written to: ${output}`);

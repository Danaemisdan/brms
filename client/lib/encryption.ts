import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
    const rawKey = process.env.BANK_DATA_ENCRYPTION_KEY;
    if (!rawKey) {
        throw new Error('BANK_DATA_ENCRYPTION_KEY is required for encrypting bank details.');
    }

    if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
        throw new Error('BANK_DATA_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).');
    }

    return Buffer.from(rawKey, 'hex');
}

export function encryptBankData(bankData: unknown): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const plaintext = JSON.stringify(bankData);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptBankData(encryptedString: string): any {
    const key = getEncryptionKey();
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
}

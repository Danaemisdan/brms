// Mock OTP Service for development
// In production, replace with Twilio/MSG91 integration

import crypto from 'crypto';

type OtpState = { code: string; expiresAt: number; failedAttempts: number };
type SendWindow = { count: number; windowStart: number };

const otpStore = new Map<string, OtpState>();
const sendWindowStore = new Map<string, SendWindow>();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const isProduction = process.env.NODE_ENV === 'production';

export type OtpSendResult =
    | { ok: true; otp: string }
    | { ok: false; retryAfterMs: number };

function getSendWindow(mobile: string): SendWindow {
    const now = Date.now();
    const current = sendWindowStore.get(mobile);
    if (!current || now - current.windowStart > SEND_WINDOW_MS) {
        const resetWindow = { count: 0, windowStart: now };
        sendWindowStore.set(mobile, resetWindow);
        return resetWindow;
    }
    return current;
}

function getRetryAfterMs(window: SendWindow): number {
    const now = Date.now();
    return Math.max(0, SEND_WINDOW_MS - (now - window.windowStart));
}

export function generateOtp(mobile: string): OtpSendResult {
    const window = getSendWindow(mobile);
    if (window.count >= MAX_SENDS_PER_WINDOW) {
        return { ok: false, retryAfterMs: getRetryAfterMs(window) };
    }

    window.count += 1;
    sendWindowStore.set(mobile, window);

    const code = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(mobile, {
        code,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        failedAttempts: 0,
    });
    if (!isProduction) {
        console.log(`[DEV OTP] Mobile: ${mobile} -> OTP: ${code}`);
    }
    return { ok: true, otp: code };
}

export function verifyOtp(mobile: string, inputCode: string): boolean {
    const stored = otpStore.get(mobile);
    if (!stored) return false;

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(mobile);
        return false;
    }

    if (stored.code !== inputCode) {
        stored.failedAttempts += 1;
        if (stored.failedAttempts >= MAX_VERIFY_ATTEMPTS) {
            otpStore.delete(mobile);
        } else {
            otpStore.set(mobile, stored);
        }
        return false;
    }

    otpStore.delete(mobile);
    return true;
}

import * as otplib from 'otplib';
const totp = new otplib.TOTP();
const secret = otplib.generateSecret();
const code = totp.generate(secret);
console.log(secret, code);
console.log(totp.verify({ token: code, secret }));
console.log(otplib.generateURI({ accountName: 'test', issuer: 'issuer', secret }));

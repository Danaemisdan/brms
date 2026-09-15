import { authenticator } from 'otplib';
const secret = authenticator.generateSecret();
console.log('Secret:', secret);
const code = authenticator.generate(secret);
console.log('Code:', code);
console.log('Valid:', authenticator.verify({ token: code, secret }));

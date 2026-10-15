import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

// Initialize the mailer with either production SMTP credentials or Ethereal for testing
export async function initMailer() {
    if (transporter) return;

    try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log("Production SMTP Mailer initialized.");
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log("Test SMTP Mailer initialized (Ethereal).");
        }
    } catch (error) {
        console.error("Failed to initialize mailer", error);
    }
}

export async function sendEmail(to: string, subject: string, html: string) {
    if (!transporter) {
        await initMailer();
    }
    
    if (!transporter) {
        console.warn("Mailer not configured. Skipping email send.");
        return;
    }

    try {
        const fromAddress = process.env.SMTP_FROM || '"Sample Lelo / BRMS" <support@samplelelo.in>';
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
        });

        console.log(`[Email Dispatch] Sent to ${to} (MessageId: ${info.messageId})`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Email Preview URL:", previewUrl);
        }
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export interface OrderConfirmationEmailProps {
    to: string;
    customerName?: string;
    orderId: string;
    productName: string;
    platform?: string;
    amount?: number | string;
    remarks?: string;
}

export async function sendOrderConfirmationEmail({
    to,
    customerName = "Customer",
    orderId,
    productName,
    platform = "Amazon",
    amount,
    remarks = "Order Confirmed (dating)"
}: OrderConfirmationEmailProps) {
    const formattedAmount = amount !== undefined ? `₹${amount}` : "N/A";
    const subject = `Order Confirmed: #${orderId} - Verification Approved`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #eb5757 0%, #c93b3b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0; opacity: 0.9; font-size: 14px; }
            .content { padding: 32px 24px; }
            .status-badge { display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-weight: 700; font-size: 13px; padding: 6px 14px; rounded: 9999px; border-radius: 9999px; margin-bottom: 20px; }
            .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #64748b; font-weight: 500; }
            .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
            .steps { margin: 28px 0; }
            .step-item { display: flex; align-items: flex-start; margin-bottom: 14px; }
            .step-num { background: #eb5757; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 2px; }
            .step-text { font-size: 13px; line-height: 1.5; color: #334155; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; background: #eb5757; color: #ffffff !important; padding: 12px 28px; font-weight: 700; text-decoration: none; border-radius: 8px; margin-top: 10px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Sample Lelo / BRMS</h1>
                <p>Order Verification & Confirmation</p>
            </div>
            <div class="content">
                <span class="status-badge">✓ ${remarks}</span>
                <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hello <strong>${customerName}</strong>,<br>
                    Great news! Your submitted order has been <strong>manually reviewed and verified</strong> by our administration team.
                </p>

                <div class="details-box">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order ID</td>
                            <td style="padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace; font-size: 14px;">${orderId}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Product</td>
                            <td style="padding: 8px 0; font-weight: 700; text-align: right; font-size: 14px;">${productName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Platform</td>
                            <td style="padding: 8px 0; font-weight: 700; text-align: right; font-size: 14px;">${platform}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Refund / Deal Value</td>
                            <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #16a34a; font-size: 15px;">${formattedAmount}</td>
                        </tr>
                    </table>
                </div>

                <div class="steps">
                    <h3 style="font-size: 15px; margin-bottom: 12px; color: #0f172a;">Next Steps for Your Cashback / Refund:</h3>
                    <div class="step-item">
                        <div class="step-num">1</div>
                        <div class="step-text"><strong>Wait for delivery:</strong> Keep the package once delivered by ${platform}.</div>
                    </div>
                    <div class="step-item">
                        <div class="step-num">2</div>
                        <div class="step-text"><strong>Submit Proofs:</strong> Go to your customer dashboard and submit your <strong>Review Screenshot</strong> and <strong>Return Window Screenshot</strong>.</div>
                    </div>
                    <div class="step-item">
                        <div class="step-num">3</div>
                        <div class="step-text"><strong>Instant Wallet / UPI Settlement:</strong> Once verified, your refund will be credited to your wallet and payable directly to your UPI.</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 24px;">
                    <a href="https://samplelelo.in/customer/submissions" class="btn">View Order in Dashboard</a>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 0;">© ${new Date().getFullYear()} Sample Lelo / BRMS Operations. All rights reserved.</p>
                <p style="margin: 4px 0 0;">Need help? Reply directly to this email or visit your customer support section.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail(to, subject, html);
}

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

// Initialize the mailer with Ethereal (fake SMTP service for testing)
// In production, you would replace this with actual SMTP credentials (e.g., SendGrid, AWS SES)
export async function initMailer() {
    if (transporter) return;

    try {
        const testAccount = await nodemailer.createTestAccount();
        
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        console.log("Fake SMTP Mailer initialized.");
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
        const info = await transporter.sendMail({
            from: '"BRMS Support" <support@brms.com>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

import nodemailer from 'nodemailer';
import { promises as dns } from 'dns';

// 配置发信器：直接从 Vercel 环境变量读取账号密码
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    pool: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export default async function handler(req, res) {
    // 1. 跨域处理
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { firstName, surname, email, message } = req.body;

    // 2. DNS 校验 (确保基本有效性)
    try {
        const domain = email.split('@')[1];
        await dns.resolveMx(domain);
    } catch (e) {
        return res.status(400).json({ success: false, error: "INVALID EMAIL ADDRESS" });
    }

    // 🚀 先响应前端，让网页瞬间显示“发送成功”
    res.status(200).json({ success: true });

    const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    const senderEmail = process.env.EMAIL_USER;

    // 3. 剩下的邮件任务进入后台静默处理
    // [任务 A]：发送通知给你自己
    transporter.sendMail({
        from: senderEmail,
        to: senderEmail,
        subject: `New Connection: ${firstName} ${surname}`,
        text: `From: ${firstName} ${surname}\nEmail: ${email}\nMessage: ${message}`
    }).catch(err => console.error("Admin alert failed:", err));

    // [任务 B]：发送精美回执给用户
    transporter.sendMail({
        from: `"Netus" <${senderEmail}>`,
        to: email,
        subject: 'You’re in.',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background-color: #000000;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%; border-collapse: collapse; background: #C988ED linear-gradient(135deg, #4D6EF4 0%, #C988ED 50%, #F6B38E 100%) no-repeat; background-size: cover; background-position: center;">
        <tr>
            <td align="center" style="padding-top: 100px; padding-bottom: 90px; padding-left: 20px; padding-right: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; text-align: left; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding-bottom: 70px;">
                            <h1 style="margin:0; font-family:${fontStack}; font-size: 14px; font-weight: 200; letter-spacing: 0.8em; color: #ffffff !important; text-transform: uppercase;">NETUS</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-family:${fontStack}; font-size: 15px; line-height: 2.1; letter-spacing: 0.04em; color: #ffffff !important; font-weight: 300;">
                            Hello,<br/><br/>
                            Your words have reached us.<br/><br/>
                            At this early stage of Netus, your thoughts carry real weight. They will directly shape where we go from here.<br/><br/>
                            Our goal is simple: return artists to the state of pure creation and bridge the isolated islands to make the co-creation of greatness possible.<br/><br/>
                            We’re glad you are among the first to see this.
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 45px; padding-bottom: 45px;">
                            <div style="height: 1px; width: 30px; background-color: #ffffff !important; opacity: 0.3;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p style="margin:0; font-family:${fontStack}; font-size: 11px; letter-spacing: 0.2em; color: #ffffff !important; font-weight: 300; opacity: 0.8;">Stay authentic. See you soon.</p>
                            <p style="margin-top: 10px; font-family:${fontStack}; font-size: 9px; letter-spacing: 0.3em; color: #ffffff !important; text-transform: uppercase; opacity: 0.4;">Netus Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
    }).catch(err => console.error("Auto-reply failed:", err));
}
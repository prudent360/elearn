// Minimal transactional email senders. Each returns { send({to,subject,text,html}) } so the
// service layer never depends on a specific provider — swap createResendMailer for another
// HTTP-based provider without touching server/service.mjs.
export function createResendMailer({apiKey,from}) {
  return {
    async send({to,subject,text,html}) {
      let response;
      try {
        response=await fetch('https://api.resend.com/emails',{
          method:'POST',
          headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
          body:JSON.stringify({from,to:[to],subject,text,...(html?{html}:{})})
        });
      } catch(error) { console.error('Email delivery failed to reach the provider',error.message); return {sent:false}; }
      if(!response.ok) { console.error('Email delivery failed',response.status,await response.text().catch(()=>'')); return {sent:false}; }
      return {sent:true};
    }
  };
}
// Used when no provider is configured (e.g. local development): logs the message — including
// the verification/reset link or code — instead of silently discarding it.
export function createConsoleMailer() {
  return {
    async send({to,subject,text}) {
      console.warn(`[email not configured] Would send "${subject}" to ${to}:\n${text}`);
      return {sent:false};
    }
  };
}

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Renders the boxed one-time code shown in the verification email. Uses the app's own light-theme
// accent color (see body.light-theme in styles.css) rather than a generic brand color.
export function verificationEmailHtml({code,email,siteOrigin,year=new Date().getFullYear()}) {
  const accent='#6155ff';
  const digitCells=code.split('').map(digit=>
    `<td style="padding:0 4px;"><div style="width:40px;height:48px;line-height:48px;text-align:center;border:2px solid ${accent};border-radius:8px;font-family:'JetBrains Mono',Consolas,monospace;font-size:22px;font-weight:700;color:${accent};">${digit}</div></td>`
  ).join('');
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;">
        <tr><td style="padding:36px 40px 20px;">
          <div style="display:inline-flex;align-items:center;gap:10px;font-size:17px;font-weight:800;color:#101321;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(145deg,#a89cff,${accent});"></span>
            Tekskillup Academy
          </div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;">
          <h1 style="font-size:21px;line-height:1.35;margin:0 0 16px;color:#101321;">Verify your email address</h1>
          <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 28px;">Enter the code below to verify your email address and finish setting up your Tekskillup Academy account.</p>
        </td></tr>
        <tr><td style="padding:0 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;"><tr>${digitCells}</tr></table>
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <p style="font-size:14px;line-height:1.6;color:#374151;margin:0;">This code expires in 15 minutes. If you didn't create an account on Tekskillup Academy, you can safely ignore this email.</p>
          <p style="font-size:14px;line-height:1.6;color:#374151;margin:20px 0 0;">Thanks,<br>The Tekskillup Academy Team</p>
        </td></tr>
        <tr><td style="border-top:1px solid #e5e7eb;padding:22px 40px 28px;">
          <p style="font-size:12px;line-height:1.6;color:#6b7280;margin:0 0 6px;">This email was sent to ${escapeHtml(email)}. If you'd rather not receive this kind of email, you can <a href="${escapeHtml(siteOrigin)}/settings" style="color:${accent};">manage your email preferences</a>.</p>
          <p style="font-size:12px;color:#9ca3af;margin:0;">© ${year} Tekskillup Academy</p>
        </td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}

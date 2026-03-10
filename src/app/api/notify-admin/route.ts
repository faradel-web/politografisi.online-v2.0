import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

// Lazy init — avoid build-time crash when env var is not set

const TOPIC_LABELS: Record<string, string> = {
  pack_3_months: '📦 Πακέτο 3 Μηνών',
  pack_1_month: '📦 Πακέτο 1 Μήνα',
  general: '✉️ Γενική Ερώτηση',
};

export async function POST(request: NextRequest) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('x-api-secret');
    if (authHeader !== process.env.NOTIFICATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, email, phone, topic, message, source } = body;

    const topicLabel = TOPIC_LABELS[topic] || topic;
    const timestamp = new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">📬 Νέα Αίτηση</h1>
          <p style="color: #93c5fd; margin: 8px 0 0; font-size: 14px;">Politografisi.online</p>
        </div>
        
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600; width: 140px;">Ονοματεπώνυμο</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px; font-weight: 700;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Τηλέφωνο</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600;">Θέμα</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px;">${topicLabel}</td>
            </tr>
            ${message ? `
            <tr>
              <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-weight: 600; vertical-align: top;">Μήνυμα</td>
              <td style="padding: 12px 0; color: #0f172a; font-size: 14px; line-height: 1.6;">${message}</td>
            </tr>
            ` : ''}
          </table>

          <div style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              📍 Πηγή: ${source || 'Landing Page'} &nbsp;|&nbsp; 🕐 ${timestamp}
            </p>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="https://politografisi.online/crm/leads" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Άνοιγμα CRM →
            </a>
          </div>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
          Αυτόματη ειδοποίηση από Politografisi.online
        </p>
      </div>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'support@politografisi.online';

    const { data, error } = await resend.emails.send({
      from: 'Politografisi.online <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `📬 Νέα Αίτηση: ${fullName} — ${topicLabel}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

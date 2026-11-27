/**
 * ShowLock AI — Zero-Dependency Serverless Template Engine
 * Powers:
 *  1) Free Consultation Response Generator (mode: "consultation")
 *  2) B2B Partnership & Client Outreach Copywriter (mode: "outreach")
 */

const INDUSTRY_CONFIG = {
  dental: {
    label: 'Dental Clinic',
    defaultBusiness: 'BrightSmile Dental Care',
    defaultClient: 'Sarah',
    defaultService: 'Comprehensive Exam & Hygiene Consultation',
    defaultSlot: 'Tomorrow at 2:00 PM',
    prepTip: 'Please arrive 5 minutes early and bring your photo ID and insurance card (if applicable).',
    painPoint: 'unfilled chair time and last-minute hygiene or cosmetic consult cancellations',
    outcome: 'keep high-value dental chairs booked and respond to new patient web inquiries in under 60 seconds',
    metricNote: 'Most clinics we partner with cut last-minute chair gaps by 45–65% within the first 30 days.'
  },
  legal: {
    label: 'Law Firm',
    defaultBusiness: 'Vanguard Legal Group',
    defaultClient: 'Michael',
    defaultService: 'Confidential Case Evaluation',
    defaultSlot: 'Thursday at 11:00 AM',
    prepTip: 'Feel free to have any relevant documents or timeline notes handy so our attorney can maximize your consultation.',
    painPoint: 'missed intake consultations and prospective clients calling competing firms when inquiries wait hours for a reply',
    outcome: 'lock in qualified legal intake consultations and reply to urgent case inquiries immediately',
    metricNote: 'Firms using structured intake confirmations typically recover 3–6 high-value retainers per month.'
  },
  agency: {
    label: 'Marketing Agency',
    defaultBusiness: 'Northstar Growth Partners',
    defaultClient: 'Taylor',
    defaultService: 'Growth Strategy & Audit Call',
    defaultSlot: 'Wednesday at 1:30 PM',
    prepTip: 'We have reviewed your website ahead of time and prepared 3 tailored growth opportunities to walk through live.',
    painPoint: 'prospects ghosting booked discovery calls and inbound leads cooling off before the first touchpoint',
    outcome: 'boost discovery call show rates and turn inbound marketing leads into confirmed calendar bookings fast',
    metricNote: 'Agencies using pre-call value reminders consistently lift discovery call attendance above 85%.'
  }
};

function sanitize(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed.slice(0, 240) : fallback;
}

function detectIndustry(rawIndustry, topicText = '') {
  const key = sanitize(rawIndustry, '').toLowerCase();
  if (INDUSTRY_CONFIG[key]) return key;

  const t = topicText.toLowerCase();
  if (t.includes('dent') || t.includes('orthodont') || t.includes('implant') || t.includes('clinic') || t.includes('patient') || t.includes('invisalign')) {
    return 'dental';
  }
  if (t.includes('law') || t.includes('legal') || t.includes('attorney') || t.includes('litigat') || t.includes('estate') || t.includes('injury')) {
    return 'legal';
  }
  if (t.includes('agency') || t.includes('marketing') || t.includes('seo') || t.includes('ads') || t.includes('media') || t.includes('brand')) {
    return 'agency';
  }
  return 'dental';
}

function buildConsultationMessages(payload) {
  const industryKey = detectIndustry(payload.industry, payload.serviceType || '');
  const cfg = INDUSTRY_CONFIG[industryKey];

  const businessName = sanitize(payload.businessName, cfg.defaultBusiness);
  const clientName = sanitize(payload.clientName, cfg.defaultClient);
  const serviceType = sanitize(payload.serviceType, cfg.defaultService);
  const appointmentTime = sanitize(payload.appointmentTime, cfg.defaultSlot);

  const instantConfirmation =
`Hi ${clientName}, thank you for reaching out to ${businessName}!

Your ${serviceType} is confirmed for ${appointmentTime}. We have reserved dedicated time specifically for you.

Reply "C" anytime to re-confirm, or reply "R" if you need to pick a better time. We look forward to speaking with you!
— Team at ${businessName}`;

  const reminder24h =
`Friendly reminder from ${businessName}: Hi ${clientName}, we're looking forward to seeing you for your ${serviceType} (${appointmentTime}).

To keep our schedule running smoothly for everyone:
• Reply "C" to confirm your spot
• Reply "R" if you need to reschedule (no hassle—we'll send 3 open times right away)

Thank you!`;

  const prep2h =
`Hi ${clientName} — we're excited to welcome you for your ${serviceType} with ${businessName} (${appointmentTime}).

Quick helpful note: ${cfg.prepTip}

Running a few minutes behind or have a quick question? Simply reply to this message and our team will assist immediately.`;

  return {
    ok: true,
    mode: 'consultation',
    industry: industryKey,
    industryLabel: cfg.label,
    messages: [
      {
        id: 'instant-confirm',
        badge: 'Step 1 • Under 60 Seconds',
        title: 'Instant Inquiry & Booking Confirmation',
        channel: 'SMS / Email Auto-Reply',
        body: instantConfirmation
      },
      {
        id: 'reminder-24h',
        badge: 'Step 2 • 24 Hours Prior',
        title: 'Polite 1-Tap Confirm or Reschedule Reminder',
        channel: 'Automated SMS',
        body: reminder24h
      },
      {
        id: 'prep-2h',
        badge: 'Step 3 • 2 Hours Prior',
        title: 'Warm Pre-Appointment Arrival & Prep Note',
        channel: 'SMS / WhatsApp',
        body: prep2h
      }
    ]
  };
}

function buildOutreachMessages(payload) {
  const topicRaw = sanitize(payload.websiteTopic, 'high-value client consultations and online booking');
  const industryKey = detectIndustry(payload.industry, topicRaw);
  const cfg = INDUSTRY_CONFIG[industryKey];

  const businessName = sanitize(payload.businessName, cfg.defaultBusiness);
  const senderName = sanitize(payload.senderName, 'Jordan Taylor');
  const senderRole = sanitize(payload.senderRole, 'Client Partnerships, ShowLock AI');

  const emailSubject = `Quick idea for ${businessName}'s ${topicRaw} inquiries`;
  const emailBody =
`Subject: ${emailSubject}

Hi ${businessName} Team,

I was reviewing your website today—specifically your focus on ${topicRaw}—and really appreciated how clearly you present your services.

I'm reaching out politely because we built ShowLock AI for ${cfg.label.toLowerCase()}s looking to eliminate ${cfg.painPoint}. Our lightweight workflow helps teams ${cfg.outcome}, without changing their existing calendar or phone setup.

${cfg.metricNote}

Would you be open to me sharing a 60-second interactive preview customized for ${businessName}? Either way, wishing your team a fantastic week ahead.

Warm regards,
${senderName}
${senderRole}`;

  const shortIntro =
`Hi ${businessName} team — loved seeing your work around ${topicRaw} on your site! We partner with ${cfg.label.toLowerCase()}s to prevent ${cfg.painPoint} using polite 1-tap appointment confirmations and sub-60-second inquiry replies. Open to a quick, zero-pressure look at how it could support ${businessName}'s schedule? — ${senderName}`;

  const politeFollowUp =
`Hi ${businessName} team,

Just a brief, polite follow-up on my earlier note regarding your ${topicRaw} consultations.

Even if now isn't the right time for new software, one simple tweak working well for ${cfg.label.toLowerCase()}s right now is adding a two-option ("Reply C to confirm or R for 3 new times") message 24 hours ahead—it turns silent no-shows into advance reschedules so slots stay filled.

If you'd ever like to test our free response templates or see how ShowLock AI automates this end-to-end for ${businessName}, just say the word.

All the best,
${senderName}`;

  return {
    ok: true,
    mode: 'outreach',
    industry: industryKey,
    industryLabel: cfg.label,
    businessName,
    websiteTopic: topicRaw,
    messages: [
      {
        id: 'partnership-email',
        badge: 'Variant 1 • Email Introduction',
        title: 'Consultative Partnership Email',
        subject: emailSubject,
        channel: 'Direct Email',
        body: emailBody
      },
      {
        id: 'linkedin-contact',
        badge: 'Variant 2 • Short DM / Website Form',
        title: 'Concise LinkedIn or Contact-Form Note',
        channel: 'Under 350 Characters',
        body: shortIntro
      },
      {
        id: 'value-followup',
        badge: 'Variant 3 • Day-4 Value Follow-Up',
        title: 'Helpful, Zero-Pressure Follow-Up',
        channel: 'Follow-Up Email',
        body: politeFollowUp
      }
    ]
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  let payload = {};
  if (req.method === 'GET') {
    payload = req.query || {};
  } else if (req.method === 'POST') {
    if (req.body && typeof req.body === 'object') {
      payload = req.body;
    } else if (typeof req.body === 'string' && req.body.trim()) {
      try {
        payload = JSON.parse(req.body);
      } catch (_err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload.' }));
      }
    }
  } else {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed.' }));
  }

  const mode = sanitize(payload.mode, 'consultation').toLowerCase();
  const result = mode === 'outreach'
    ? buildOutreachMessages(payload)
    : buildConsultationMessages(payload);

  res.statusCode = 200;
  return res.end(JSON.stringify(result));
};

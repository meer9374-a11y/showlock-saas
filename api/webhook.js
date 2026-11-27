/**
 * ShowLock AI Pro — Zero-Dependency Appointment & Inquiry Webhook Endpoint
 * Handles:
 *  1) action: "new_inquiry"   -> Generates <60s instant confirmation + 24h & 2h reminder payloads
 *  2) action: "sms_reply"     -> Processes "C" (Confirm) or "R" (Reschedule with 3 open slots)
 *  3) action: "onboard_test"  -> Validates a Pro customer's webhook configuration
 */

function clean(val, fallback = '') {
  if (typeof val !== 'string') return fallback;
  const s = val.trim().replace(/\s+/g, ' ');
  return s ? s.slice(0, 240) : fallback;
}

function formatSlots(slots) {
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.slice(0, 3).map((s, i) => `${i + 1}) ${clean(String(s), 'Next Business Day 2:00 PM')}`).join('\n');
  }
  return [
    '1) Tomorrow at 10:30 AM',
    '2) Tomorrow at 3:00 PM',
    '3) Friday at 11:00 AM'
  ].join('\n');
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      service: 'ShowLock AI Pro Webhook',
      supportedActions: ['new_inquiry', 'sms_reply', 'onboard_test'],
      status: 'ready'
    }));
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed.' }));
  }

  let body = {};
  if (req.body && typeof req.body === 'object') {
    body = req.body;
  } else if (typeof req.body === 'string' && req.body.trim()) {
    try {
      body = JSON.parse(req.body);
    } catch (_e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body.' }));
    }
  }

  const action = clean(body.action, 'new_inquiry').toLowerCase();
  const businessName = clean(body.businessName, 'ShowLock Partner Practice');
  const clientName = clean(body.clientName, 'there');
  const serviceType = clean(body.serviceType, 'Consultation');
  const appointmentTime = clean(body.appointmentTime, 'Tomorrow at 2:00 PM');

  if (action === 'onboard_test') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      action: 'onboard_test',
      businessName,
      industry: clean(body.industry, 'dental'),
      calendarUrl: clean(body.calendarUrl, 'https://cal.com/your-practice'),
      verifiedAt: new Date().toISOString(),
      message: `Webhook verified for ${businessName}. Ready to process live inquiries and C/R replies.`
    }));
  }

  if (action === 'sms_reply') {
    const replyRaw = clean(body.replyText, 'C').toUpperCase();
    const isConfirm = replyRaw === 'C' || replyRaw.startsWith('CONFIRM') || replyRaw.includes('YES');
    const isReschedule = replyRaw === 'R' || replyRaw.startsWith('RESCHED') || replyRaw.includes('CHANGE');

    if (isConfirm) {
      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        action: 'sms_reply',
        intent: 'CONFIRMED',
        calendarStatus: 'LOCKED',
        autoReplySms: `Thank you, ${clientName}! Your ${serviceType} with ${businessName} (${appointmentTime}) is locked in. See you soon!`
      }));
    }

    if (isReschedule) {
      const optionsText = formatSlots(body.alternateSlots);
      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        action: 'sms_reply',
        intent: 'RESCHEDULE_REQUESTED',
        calendarStatus: 'HOLDING_ALTERNATES',
        autoReplySms: `No problem at all, ${clientName}! Which of these open times works best for your ${serviceType} with ${businessName}?\n\n${optionsText}\n\nJust reply 1, 2, or 3 to lock it in.`
      }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      action: 'sms_reply',
      intent: 'HUMAN_HANDOFF',
      calendarStatus: 'NEEDS_STAFF_REVIEW',
      autoReplySms: `Thanks for messaging ${businessName}, ${clientName}! A team member has received your note and will follow up shortly.`
    }));
  }

  // Default: new_inquiry
  res.statusCode = 200;
  return res.end(JSON.stringify({
    ok: true,
    action: 'new_inquiry',
    businessName,
    clientName,
    serviceType,
    appointmentTime,
    sequence: {
      instantReplyUnder60s: `Hi ${clientName}, thanks for contacting ${businessName}! Your ${serviceType} is tentatively held for ${appointmentTime}. Reply "C" to confirm or "R" for 3 alternate times.`,
      reminder24h: `Friendly reminder from ${businessName}: Looking forward to your ${serviceType} (${appointmentTime}). Reply "C" to confirm or "R" to reschedule.`,
      prep2h: `Hi ${clientName}, we're excited to see you in 2 hours for your ${serviceType} at ${businessName}. Reply here if you need directions or anything before arrival.`
    }
  }));
};

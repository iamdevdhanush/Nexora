export interface TemplateContext {
  participantName: string;
  teamName: string;
  teamId: string;
  leaderName: string;
  leaderEmail: string;
  hackathonName: string;
  hackathonVenue: string;
  roomName: string;
  eventDate: string;
  eventTime: string;
  registrationId: string;
  certificateUrl: string;
  [key: string]: string;
}

const DEFAULT_VALUES: Record<string, string> = {
  participantName: 'Participant',
  teamName: 'Your Team',
  teamId: 'NEX-000',
  leaderName: 'Team Leader',
  leaderEmail: '',
  hackathonName: 'the Hackathon',
  hackathonVenue: 'the Venue',
  roomName: 'TBD',
  eventDate: 'TBD',
  eventTime: '',
  registrationId: '',
  certificateUrl: '',
};

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(VARIABLE_PATTERN, (_match, varName: string) => {
    const camelKey = toCamelCase(varName);
    if (camelKey in context && context[camelKey]) {
      return context[camelKey];
    }
    if (camelKey in DEFAULT_VALUES) {
      return DEFAULT_VALUES[camelKey];
    }
    return `{{${varName}}}`;
  });
}

export function extractVariables(template: string): string[] {
  const variables: string[] = [];
  let match;
  while ((match = VARIABLE_PATTERN.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

export function hasUnresolvedVariables(rendered: string): boolean {
  return VARIABLE_PATTERN.test(rendered);
}

const SAFE_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'details', 'dfn',
  'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's',
  'samp', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody',
  'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'var',
]);
const SAFE_ATTRS = new Set([
  'align', 'alt', 'cite', 'colspan', 'datetime', 'height', 'href', 'hreflang',
  'id', 'rel', 'rowspan', 'scope', 'src', 'style', 'target', 'title', 'type', 'width',
]);
const UNSAFE_PATTERN = /^(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*|d\s*a\s*t\s*a\s*|v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*):/i;
const SAFE_SCHEMES = ['http://', 'https://', 'mailto:', 'tel:'];

function isSafeScheme(url: string): boolean {
  if (url.startsWith('/') || url.startsWith('#')) return true;
  for (const scheme of SAFE_SCHEMES) {
    if (url.toLowerCase().startsWith(scheme)) return true;
  }
  return !UNSAFE_PATTERN.test(url);
}

export function sanitizeHtml(html: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?(?:script|iframe|embed|object|style|meta|link|base|form|input|button|textarea|select|option|optgroup|fieldset|legend|label|noscript|canvas|svg|math|xml|frame|frameset|noframes|ilayer|layer|bgsound|audio|video|source|track|applet|marquee)[^>]*\/?>/gi, '');

  cleaned = cleaned.replace(/<(\w+)([^>]*)>/gi, (full, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    if (!SAFE_TAGS.has(tag)) return '';
    const safeAttrs = attrs.replace(/(\w+)\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, (attrFull, attrName: string) => {
      const attr = attrName.toLowerCase();
      if (attr.startsWith('on')) return '';
      if (!SAFE_ATTRS.has(attr)) return '';
      const valMatch = attrFull.match(/=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/);
      if (!valMatch) return '';
      const val = valMatch[1] || valMatch[2] || valMatch[3] || '';
      if (attr === 'href' || attr === 'src') {
        if (!isSafeScheme(val.trim())) return '';
      }
      return ` ${attr}="${val.replace(/"/g, '&quot;')}"`;
    });
    return `<${tag}${safeAttrs}>`;
  });

  return cleaned;
}

export const BUILTIN_TEMPLATES = [
  {
    name: 'Registration Received',
    subject: 'Registration received for {{hackathon_name}}',
    body: `<p>Dear {{participant_name}},</p>
<p>Thank you for registering for <strong>{{hackathon_name}}</strong>!</p>
<p>Your team <strong>{{team_name}}</strong> has been registered successfully.</p>
<p>Your Team ID: <code>{{team_id}}</code></p>
<p>We will keep you updated with further instructions.</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Registration Approved',
    subject: 'Your registration for {{hackathon_name}} is approved!',
    body: `<p>Dear {{participant_name}},</p>
<p>Great news! Your team <strong>{{team_name}}</strong> has been approved for <strong>{{hackathon_name}}</strong>.</p>
<p><strong>Event Details:</strong></p>
<ul>
<li>Date: {{event_date}}</li>
<li>Venue: {{hackathon_venue}}</li>
<li>Team ID: <code>{{team_id}}</code></li>
</ul>
<p>Please check in at the venue on the day of the event.</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Hackathon Reminder',
    subject: 'Reminder: {{hackathon_name}} starts soon!',
    body: `<p>Dear {{participant_name}},</p>
<p>This is a reminder that <strong>{{hackathon_name}}</strong> is starting soon!</p>
<p><strong>When:</strong> {{event_date}} at {{event_time}}</p>
<p><strong>Where:</strong> {{hackathon_venue}}</p>
<p>Your Team: <strong>{{team_name}}</strong> ({{team_id}})</p>
<p>Please arrive on time and proceed to your assigned room.</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Check-in Instructions',
    subject: 'Check-in instructions for {{hackathon_name}}',
    body: `<p>Dear {{participant_name}},</p>
<p>Here are your check-in instructions for <strong>{{hackathon_name}}</strong>:</p>
<ol>
<li>Bring a valid ID card.</li>
<li>Your team will be checked in at the registration desk.</li>
<li>Your assigned room is: <strong>{{room_name}}</strong></li>
</ol>
<p>We look forward to seeing you!</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Room Assignment',
    subject: 'Room assignment for {{hackathon_name}}',
    body: `<p>Dear {{participant_name}},</p>
<p>Your team <strong>{{team_name}}</strong> has been assigned to:</p>
<p style="font-size: 1.2em; font-weight: bold;">Room: {{room_name}}</p>
<p>Please proceed to your assigned room at the venue.</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Schedule Update',
    subject: 'Schedule update for {{hackathon_name}}',
    body: `<p>Dear {{participant_name}},</p>
<p>Please note the following schedule update for <strong>{{hackathon_name}}</strong>:</p>
<p><strong>Date:</strong> {{event_date}}</p>
<p><strong>Venue:</strong> {{hackathon_venue}}</p>
<p>Please check the latest schedule at the venue.</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Results Announcement',
    subject: 'Results for {{hackathon_name}} are out!',
    body: `<p>Dear {{participant_name}},</p>
<p>The results for <strong>{{hackathon_name}}</strong> are now available!</p>
<p>Thank you for participating with team <strong>{{team_name}}</strong>.</p>
<p>Certificates will be sent to your registered email shortly.</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
  {
    name: 'Certificate Available',
    subject: 'Your certificate for {{hackathon_name}} is ready!',
    body: `<p>Dear {{participant_name}},</p>
<p>Your certificate for participating in <strong>{{hackathon_name}}</strong> is now available.</p>
<p>You can download your certificate using the link below:</p>
<p><a href="{{certificate_url}}">Download Certificate</a></p>
<p>Congratulations on your participation!</p>
<p>Best regards,<br/>{{hackathon_name}} Team</p>`,
  },
];

/**
 * Builds "CarCareBooker ERP Sync (recovery)" — an ERP-only n8n workflow.
 *
 *   node scripts/build-erp-sync-workflow.mjs > wf.json
 *
 * No database nodes, no credentials beyond the existing ERPNext one. The caller
 * (scripts/recover-booking.mjs) owns the database side: it claims the row inside a
 * transaction, calls this webhook, and marks 'synced' only after a real Appointment id.
 *
 *  - responseMode 'lastNode' => HTTP 200 means the ERP work actually finished. This is
 *    the trap that made calling UvrwB78oldxJotbH unusable (it responds on receipt).
 *  - Lookups use the raw /api/resource REST endpoints: the erpNext node's getAll filter
 *    syntax silently returned {} and sent a known customer down the create-Lead branch.
 *  - Auth via predefinedCredentialType so no token is ever written into the workflow JSON.
 *  - No WhatsApp / email / notification nodes. UvrwB78oldxJotbH is not modified.
 *
 * Node output shapes differ and are handled explicitly:
 *    httpRequest (lookup) -> { data: [ {...} ] }
 *    erpNext    (create)  -> { data: {...} }
 */
const ERP_CRED = { id: 'x0QUF2TaviezTv1x', name: 'Erp.Plus91inc.in' };
const ERP_URL = 'https://erp.plus91inc.in';
const PATH = 'carcare-erp-sync-recovery';

const N = (name, type, typeVersion, position, parameters, extra = {}) =>
  ({ parameters, name, type, typeVersion, position, ...extra });

// Reference a field from the original webhook body.
const B = (f) => `{{ $('Webhook').item.json.body.${f} }}`;

const nodes = [
  N('Webhook', 'n8n-nodes-base.webhook', 2, [-600, 300], {
    httpMethod: 'POST', path: PATH, responseMode: 'lastNode', options: {},
  }, { webhookId: PATH }),

  // 1. ERP-side duplicate check on the stable [booking:<id>] marker, before creating anything.
  N('ERP: Existing Appointment?', 'n8n-nodes-base.httpRequest', 4.2, [-380, 300], {
    method: 'GET',
    url: `${ERP_URL}/api/resource/Appointment`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'erpNextApi',
    sendQuery: true,
    queryParameters: { parameters: [
      { name: 'limit_page_length', value: '20' },
      { name: 'fields', value: '["name","creation"]' },
      { name: 'filters', value: `=[["customer_details","like","%booking:${B('bookingId')}%"]]` },
    ] },
    options: {},
  }, { credentials: { erpNextApi: ERP_CRED } }),

  N('Already In ERP?', 'n8n-nodes-base.if', 2, [-160, 300], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'number', operation: 'gt' },
        leftValue: '={{ $json.data.length }}', rightValue: 0 }] }, options: {} }),

  N('Result: Duplicate', 'n8n-nodes-base.set', 3.4, [60, 160], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'ok', type: 'boolean', value: '={{ true }}' },
      { name: 'created', type: 'boolean', value: '={{ false }}' },
      { name: 'appointmentId', type: 'string', value: '={{ $json.data[0].name }}' },
      { name: 'bookingId', type: 'string', value: `=${B('bookingId')}` },
      { name: 'executionId', type: 'string', value: '={{ $execution.id }}' },
      { name: 'note', type: 'string', value: 'appointment already existed; nothing created' }] } }),

  // 2. Reuse the customer's existing Lead when there is one.
  N('ERP: Find Lead', 'n8n-nodes-base.httpRequest', 4.2, [60, 440], {
    method: 'GET',
    url: `${ERP_URL}/api/resource/Lead`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'erpNextApi',
    sendQuery: true,
    queryParameters: { parameters: [
      { name: 'limit_page_length', value: '5' },
      { name: 'fields', value: '["name","lead_name","mobile_no"]' },
      { name: 'filters', value: `=[["mobile_no","like","%${B('phone10')}%"]]` },
    ] },
    options: {},
  }, { credentials: { erpNextApi: ERP_CRED } }),

  N('Lead Exists?', 'n8n-nodes-base.if', 2, [280, 440], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'number', operation: 'gt' },
        leftValue: '={{ $json.data.length }}', rightValue: 0 }] }, options: {} }),

  N('ERP: Create Lead', 'n8n-nodes-base.erpNext', 1, [500, 580], {
    resource: 'document', operation: 'create', docType: 'Lead',
    properties: { customProperty: [
      { field: 'first_name', value: `=${B('customerName')}` },
      { field: 'mobile_no', value: `=${B('customerPhone')}` },
      // 'Website Booking' is not a valid Lead Source in this ERP (417 LinkValidationError).
      { field: 'source', value: 'Incoming Lead' },
      { field: 'custom_brand', value: 'P91 CC' }] },
  }, { credentials: { erpNextApi: ERP_CRED } }),

  // Normalises both shapes: lookup gives data[], create gives data{}.
  N('Lead Id', 'n8n-nodes-base.set', 3.4, [720, 440], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      // lookup -> { data: [ {...} ] } ; erpNext create -> flat { name, ... } (NOT wrapped in data)
      { name: 'leadId', type: 'string',
        value: '={{ $json.data ? $json.data[0].name : $json.name }}' }] } }),

  N('ERP: Add Comment', 'n8n-nodes-base.erpNext', 1, [940, 440], {
    resource: 'document', operation: 'create', docType: 'Comment',
    properties: { customProperty: [
      { field: 'comment_type', value: 'Comment' },
      { field: 'reference_doctype', value: 'Lead' },
      { field: 'reference_name', value: '={{ $json.leadId }}' },
      { field: 'content', value:
        `=Appointment booked on p91carcare.com for ${B('customerName')} on ${B('appointmentDate')} ${B('appointmentTime')}. Service: ${B('serviceName')}. Payment confirmed (Razorpay ${B('paymentId')}). [booking:${B('bookingId')}]` }] },
  }, { credentials: { erpNextApi: ERP_CRED } }),

  N('ERP: Create Appointment', 'n8n-nodes-base.erpNext', 1, [1160, 440], {
    resource: 'document', operation: 'create', docType: 'Appointment',
    properties: { customProperty: [
      { field: 'appointment_with', value: 'Lead' },
      { field: 'party', value: "={{ $('Lead Id').item.json.leadId }}" },
      { field: 'customer_name', value: `=${B('customerName')}` },
      { field: 'customer_phone_number', value: `=${B('customerPhone')}` },
      { field: 'customer_email', value: `=${B('customerEmail')}` },
      { field: 'scheduled_time', value: `=${B('appointmentDate')} ${B('appointmentTime')}` },
      { field: 'status', value: 'Open' },
      // Stable idempotency marker, matched by 'ERP: Existing Appointment?'.
      { field: 'customer_details', value:
        `=Appointment booked on p91carcare.com. Service: ${B('serviceName')}. Amount: Rs ${B('amount')}. Razorpay payment ${B('paymentId')}, order ${B('orderId')}. [booking:${B('bookingId')}]` }] },
  }, { credentials: { erpNextApi: ERP_CRED } }),

  // Final node — its output IS the HTTP response (responseMode: lastNode).
  N('Result: Created', 'n8n-nodes-base.set', 3.4, [1380, 440], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'ok', type: 'boolean', value: '={{ true }}' },
      { name: 'created', type: 'boolean', value: '={{ true }}' },
      // erpNext create returns the document flat, so the id is $json.name (verified 2026-08-03).
      { name: 'appointmentId', type: 'string', value: '={{ $json.name }}' },
      { name: 'leadId', type: 'string', value: "={{ $('Lead Id').item.json.leadId }}" },
      { name: 'bookingId', type: 'string', value: `=${B('bookingId')}` },
      { name: 'executionId', type: 'string', value: '={{ $execution.id }}' }] } }),
];

const connections = {
  'Webhook':                    { main: [[{ node: 'ERP: Existing Appointment?', type: 'main', index: 0 }]] },
  'ERP: Existing Appointment?': { main: [[{ node: 'Already In ERP?', type: 'main', index: 0 }]] },
  'Already In ERP?':            { main: [[{ node: 'Result: Duplicate', type: 'main', index: 0 }],
                                         [{ node: 'ERP: Find Lead', type: 'main', index: 0 }]] },
  'ERP: Find Lead':             { main: [[{ node: 'Lead Exists?', type: 'main', index: 0 }]] },
  'Lead Exists?':               { main: [[{ node: 'Lead Id', type: 'main', index: 0 }],
                                         [{ node: 'ERP: Create Lead', type: 'main', index: 0 }]] },
  'ERP: Create Lead':           { main: [[{ node: 'Lead Id', type: 'main', index: 0 }]] },
  'Lead Id':                    { main: [[{ node: 'ERP: Add Comment', type: 'main', index: 0 }]] },
  'ERP: Add Comment':           { main: [[{ node: 'ERP: Create Appointment', type: 'main', index: 0 }]] },
  'ERP: Create Appointment':    { main: [[{ node: 'Result: Created', type: 'main', index: 0 }]] },
};

process.stdout.write(JSON.stringify({
  name: 'CarCareBooker ERP Sync (recovery)',
  nodes, connections,
  settings: { executionOrder: 'v1', saveManualExecutions: true, executionTimeout: 300 },
}, null, 2));

/**
 * Builds "CarCareBooker ERP Poller (scheduled)" — the permanent 5-minute safety net.
 *
 *   node scripts/build-erp-poller-scheduled.mjs <PG_CRED_ID> > wf.json
 *
 * Schedule -> atomic claim (batch 5) -> per-booking loop -> ERP lookup/create -> settle row.
 *
 * Schema adaptations vs the brief (real column names verified on the live DB):
 *   paid_at        -> does not exist; ordered by created_at
 *   erp_last_error -> the real column is erp_sync_error
 *   manual_%       -> lives on payment_id, not razorpay_order_id
 * Genuine Razorpay payments are positively required (order_% AND pay_%), which excludes
 * dev_order_, manual_ overrides and anything unverified in one condition.
 *
 * No WhatsApp / email / Meta / notification nodes of any kind.
 */
const PG = process.argv[2];
if (!PG) { console.error('usage: build-erp-poller-scheduled.mjs <PG_CRED_ID>'); process.exit(1); }

const PG_CRED = { id: PG, name: 'CarCareBooker Live DB (poller)' };
const ERP_CRED = { id: 'x0QUF2TaviezTv1x', name: 'Erp.Plus91inc.in' };
const ERP_URL = 'https://erp.plus91inc.in';
const BATCH = 5;
const MAX_ATTEMPTS = 5;

const claimSql = `
WITH candidates AS (
  SELECT id
    FROM bookings
   WHERE payment_status = 'paid'
     AND erp_document_id IS NULL
     AND COALESCE(erp_sync_attempts, 0) < ${MAX_ATTEMPTS}
     AND (
          erp_sync_status IS NULL
       OR erp_sync_status IN ('pending', 'failed')
       OR (erp_sync_status = 'processing' AND updated_at < NOW() - INTERVAL '15 minutes')
     )
     -- genuine Razorpay payments only: excludes dev_order_%, manual_% and anything unverified
     AND razorpay_order_id LIKE 'order_%'
     AND payment_id        LIKE 'pay_%'
     -- SAFETY FLOOR. 205 pre-July bookings are 'synced' by backfill but have
     -- erp_document_id IS NULL, and their ERP Appointments predate the [booking:<id>]
     -- marker convention. If any regressed to NULL/failed the marker search would miss
     -- them and create duplicates. The integration broke on 2026-07-10, so nothing
     -- before that date can ever legitimately need syncing.
     AND created_at >= DATE '2026-07-10'
   ORDER BY created_at ASC
   FOR UPDATE SKIP LOCKED
   LIMIT ${BATCH}
)
UPDATE bookings b
   SET erp_sync_status   = 'processing',
       erp_sync_attempts = COALESCE(b.erp_sync_attempts, 0) + 1,
       erp_sync_error    = NULL,
       updated_at        = NOW()
  FROM candidates c
 WHERE b.id = c.id
RETURNING b.id, b.customer_name, b.customer_phone, b.customer_email, b.amount,
          b.appointment_date, b.appointment_time, b.payment_id, b.razorpay_order_id,
          b.erp_sync_attempts,
          (SELECT s.title FROM services s WHERE s.id = b.service_id) AS service_name;`.trim();

const markSynced = `
UPDATE bookings
   SET erp_sync_status   = 'synced',
       erp_document_type = 'Appointment',
       erp_document_id   = '{{ $json.appointmentId }}',
       erp_synced_at     = NOW(),
       erp_sync_error    = NULL,
       n8n_execution_id  = '{{ $execution.id }}',
       updated_at        = NOW()
 WHERE id = '{{ $json.bookingId }}'
   AND erp_document_id IS NULL;`.trim();

const markFailed = `
UPDATE bookings
   SET erp_sync_status  = 'failed',
       erp_sync_error   = LEFT('{{ $json.errorSummary }}', 500),
       n8n_execution_id = '{{ $execution.id }}',
       updated_at       = NOW()
 WHERE id = '{{ $json.bookingId }}';`.trim();

const N = (name, type, typeVersion, position, parameters, extra = {}) =>
  ({ parameters, name, type, typeVersion, position, ...extra });

const L = (f) => `{{ $('Loop Over Bookings').item.json.${f} }}`;
const pg = { credentials: { postgres: PG_CRED } };
const erp = { credentials: { erpNextApi: ERP_CRED } };
// ERP failures route to their error output instead of aborting the whole run.
const softFail = { onError: 'continueErrorOutput' };

const nodes = [
  N('Every 5 Minutes', 'n8n-nodes-base.scheduleTrigger', 1.2, [-880, 300], {
    rule: { interval: [{ field: 'minutes', minutesInterval: 5 }] } }),

  N('Claim Bookings', 'n8n-nodes-base.postgres', 2.4, [-660, 300],
    { operation: 'executeQuery', query: claimSql, options: {} }, pg),

  N('Loop Over Bookings', 'n8n-nodes-base.splitInBatches', 3, [-440, 300],
    { batchSize: 1, options: { reset: false } }),

  // --- ERP-side duplicate check on the stable booking marker ---
  N('ERP: Find Appointment', 'n8n-nodes-base.httpRequest', 4.2, [-200, 420], {
    method: 'GET', url: `${ERP_URL}/api/resource/Appointment`,
    authentication: 'predefinedCredentialType', nodeCredentialType: 'erpNextApi',
    sendQuery: true, queryParameters: { parameters: [
      { name: 'limit_page_length', value: '20' },
      { name: 'fields', value: '["name","creation"]' },
      { name: 'filters', value: `=[["customer_details","like","%booking:${L('id')}%"]]` }] },
    options: {},
  }, { ...erp, ...softFail }),

  N('Appointment Exists?', 'n8n-nodes-base.if', 2, [20, 420], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'number', operation: 'gt' },
        leftValue: '={{ $json.data.length }}', rightValue: 0 }] }, options: {} }),

  N('Existing Appointment', 'n8n-nodes-base.set', 3.4, [260, 300], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'bookingId', type: 'string', value: `=${L('id')}` },
      { name: 'appointmentId', type: 'string', value: '={{ $json.data[0].name }}' }] } }),

  // --- Lead: reuse when present ---
  N('ERP: Find Lead', 'n8n-nodes-base.httpRequest', 4.2, [260, 540], {
    method: 'GET', url: `${ERP_URL}/api/resource/Lead`,
    authentication: 'predefinedCredentialType', nodeCredentialType: 'erpNextApi',
    sendQuery: true, queryParameters: { parameters: [
      { name: 'limit_page_length', value: '5' },
      { name: 'fields', value: '["name","lead_name","mobile_no"]' },
      { name: 'filters', value: `=[["mobile_no","like","%{{ $('Loop Over Bookings').item.json.customer_phone.replace(/\\D/g,'').slice(-10) }}%"]]` }] },
    options: {},
  }, { ...erp, ...softFail }),

  N('Lead Exists?', 'n8n-nodes-base.if', 2, [480, 540], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'number', operation: 'gt' },
        leftValue: '={{ $json.data.length }}', rightValue: 0 }] }, options: {} }),

  N('ERP: Create Lead', 'n8n-nodes-base.erpNext', 1, [700, 680], {
    resource: 'document', operation: 'create', docType: 'Lead',
    properties: { customProperty: [
      { field: 'first_name', value: `=${L('customer_name')}` },
      { field: 'mobile_no', value: `=${L('customer_phone')}` },
      { field: 'source', value: 'Incoming Lead' },
      { field: 'custom_brand', value: 'P91 CC' }] },
  }, { ...erp, ...softFail }),

  // lookup -> { data: [ ... ] } ; erpNext create -> flat { name, ... }
  N('Lead Id', 'n8n-nodes-base.set', 3.4, [920, 540], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'leadId', type: 'string',
        value: '={{ $json.data ? $json.data[0].name : $json.name }}' }] } }),

  N('ERP: Add Comment', 'n8n-nodes-base.erpNext', 1, [1140, 540], {
    resource: 'document', operation: 'create', docType: 'Comment',
    properties: { customProperty: [
      { field: 'comment_type', value: 'Comment' },
      { field: 'reference_doctype', value: 'Lead' },
      { field: 'reference_name', value: '={{ $json.leadId }}' },
      { field: 'content', value:
        `=Appointment booked on p91carcare.com for ${L('customer_name')} on ${L('appointment_date')} ${L('appointment_time')}. Service: ${L('service_name')}. Payment confirmed (Razorpay ${L('payment_id')}). [booking:${L('id')}]` }] },
  }, { ...erp, ...softFail }),

  N('ERP: Create Appointment', 'n8n-nodes-base.erpNext', 1, [1360, 540], {
    resource: 'document', operation: 'create', docType: 'Appointment',
    properties: { customProperty: [
      { field: 'appointment_with', value: 'Lead' },
      { field: 'party', value: "={{ $('Lead Id').item.json.leadId }}" },
      { field: 'customer_name', value: `=${L('customer_name')}` },
      { field: 'customer_phone_number', value: `=${L('customer_phone')}` },
      { field: 'customer_email', value: `=${L('customer_email')}` },
      { field: 'scheduled_time', value: `=${L('appointment_date')} ${L('appointment_time')}` },
      { field: 'status', value: 'Open' },
      { field: 'customer_details', value:
        `=Appointment booked on p91carcare.com. Service: ${L('service_name')}. Amount: Rs ${L('amount')}. Razorpay payment ${L('payment_id')}, order ${L('razorpay_order_id')}. [booking:${L('id')}]` }] },
  }, { ...erp, ...softFail }),

  N('Created Appointment', 'n8n-nodes-base.set', 3.4, [1580, 540], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'bookingId', type: 'string', value: `=${L('id')}` },
      { name: 'appointmentId', type: 'string', value: '={{ $json.name }}' }] } }),

  // Settle: only ever writes erp_document_id when it is still NULL (belt and braces).
  N('DB: Mark Synced', 'n8n-nodes-base.postgres', 2.4, [1800, 420],
    { operation: 'executeQuery', query: markSynced, options: {} }, pg),

  N('Failure Summary', 'n8n-nodes-base.set', 3.4, [1360, 860], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'bookingId', type: 'string', value: `=${L('id')}` },
      { name: 'errorSummary', type: 'string',
        value: '=ERP step failed: {{ ($json.error && ($json.error.message || $json.error)) || "unknown error" }}' }] } }),

  N('DB: Mark Failed', 'n8n-nodes-base.postgres', 2.4, [1580, 860],
    { operation: 'executeQuery', query: markFailed, options: {} }, pg),
];

const to = (node) => [{ node, type: 'main', index: 0 }];
const connections = {
  'Every 5 Minutes':      { main: [to('Claim Bookings')] },
  'Claim Bookings':       { main: [to('Loop Over Bookings')] },
  // output 0 = "done" (all batches processed), output 1 = current batch
  'Loop Over Bookings':   { main: [[], to('ERP: Find Appointment')] },
  'ERP: Find Appointment':{ main: [to('Appointment Exists?'), to('Failure Summary')] },
  'Appointment Exists?':  { main: [to('Existing Appointment'), to('ERP: Find Lead')] },
  'Existing Appointment': { main: [to('DB: Mark Synced')] },
  'ERP: Find Lead':       { main: [to('Lead Exists?'), to('Failure Summary')] },
  'Lead Exists?':         { main: [to('Lead Id'), to('ERP: Create Lead')] },
  'ERP: Create Lead':     { main: [to('Lead Id'), to('Failure Summary')] },
  'Lead Id':              { main: [to('ERP: Add Comment')] },
  'ERP: Add Comment':     { main: [to('ERP: Create Appointment'), to('Failure Summary')] },
  'ERP: Create Appointment': { main: [to('Created Appointment'), to('Failure Summary')] },
  'Created Appointment':  { main: [to('DB: Mark Synced')] },
  'DB: Mark Synced':      { main: [to('Loop Over Bookings')] },
  'Failure Summary':      { main: [to('DB: Mark Failed')] },
  'DB: Mark Failed':      { main: [to('Loop Over Bookings')] },
};

process.stdout.write(JSON.stringify({
  name: 'CarCareBooker ERP Poller (scheduled)',
  nodes, connections,
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    executionTimeout: 600,
    // Overlap prevention: a second run cannot start while one is in flight.
    executionOrder_: undefined,
  },
}, null, 2));

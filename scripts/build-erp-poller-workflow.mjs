/**
 * Builds the "CarCareBooker ERP Poller" n8n workflow JSON.
 *
 *   node scripts/build-erp-poller-workflow.mjs <PG_CREDENTIAL_ID> [BOOKING_ID] > wf.json
 *
 * Design constraints (per the approved brief):
 *  - Does NOT call UvrwB78oldxJotbH: its webhook responds immediately, so HTTP 200 would not
 *    prove ERP completion. This workflow performs the ERP calls itself and reads the real
 *    Appointment document id. UvrwB78oldxJotbH is left completely untouched.
 *  - Atomic claim with FOR UPDATE SKIP LOCKED so overlapping runs cannot double-process.
 *  - ERP-side duplicate check by a stable marker before creating anything.
 *  - Marks 'synced' ONLY after a real Appointment id is returned; otherwise 'failed'.
 *  - No WhatsApp / email / notification nodes of any kind.
 *  - Created INACTIVE.
 */
const PG_CRED_ID = process.argv[2];
const ONLY_BOOKING = process.argv[3] || null; // restrict to one booking id for the controlled test
if (!PG_CRED_ID) { console.error('usage: build-erp-poller-workflow.mjs <PG_CREDENTIAL_ID|UNSET> [BOOKING_ID]'); process.exit(1); }

const ERP_CRED = { id: 'x0QUF2TaviezTv1x', name: 'Erp.Plus91inc.in' }; // existing, unchanged
// "UNSET" leaves the Postgres credential blank so it can be picked from the n8n dropdown,
// avoiding the need to hunt for a credential id.
const PG_CRED = PG_CRED_ID === 'UNSET' ? null
  : { id: PG_CRED_ID, name: 'CarCareBooker Poller (restricted)' };
const pgCreds = PG_CRED ? { credentials: { postgres: PG_CRED } } : {};

// Atomic claim. Note: the bookings table has no paid_at column, so ordering is by created_at.
// dev_order_ rows and manual_ payment overrides are excluded at the SQL level.
const claimSql = `
WITH candidates AS (
  SELECT id
  FROM bookings
  WHERE payment_status = 'paid'
    AND razorpay_order_id LIKE 'order_%'
    AND payment_id LIKE 'pay_%'
    AND (
      erp_sync_status IS NULL
      OR erp_sync_status = 'pending'
      OR (erp_sync_status = 'processing' AND updated_at < NOW() - INTERVAL '15 minutes')
      OR (erp_sync_status = 'failed' AND COALESCE(erp_sync_attempts,0) < 5)
    )
    ${ONLY_BOOKING ? `AND id = '${ONLY_BOOKING}'` : ''}
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE bookings b
   SET erp_sync_status   = 'processing',
       erp_sync_attempts = COALESCE(b.erp_sync_attempts, 0) + 1,
       erp_sync_error    = NULL,
       updated_at        = NOW()
  FROM candidates c
 WHERE b.id = c.id
RETURNING b.id, b.customer_name, b.customer_phone, b.customer_email,
          b.appointment_date, b.appointment_time, b.payment_id, b.razorpay_order_id,
          b.amount, b.erp_sync_attempts,
          (SELECT s.title FROM services s WHERE s.id = b.service_id) AS service_name;`.trim();

const markSynced = `
UPDATE bookings
   SET erp_sync_status  = 'synced',
       erp_document_type = 'Appointment',
       erp_document_id  = '{{ $json.erpAppointmentId }}',
       erp_synced_at    = NOW(),
       erp_sync_error   = NULL,
       n8n_execution_id = '{{ $execution.id }}',
       updated_at       = NOW()
 WHERE id = '{{ $json.bookingId }}';`.trim();

const markFailed = `
UPDATE bookings
   SET erp_sync_status = 'failed',
       erp_sync_error  = LEFT('{{ $json.errorSummary }}', 500),
       updated_at      = NOW()
 WHERE id = '{{ $json.bookingId }}';`.trim();

const N = (name, type, typeVersion, position, parameters, extra = {}) =>
  ({ parameters, name, type, typeVersion, position, ...extra });

const nodes = [
  N('Manual Trigger', 'n8n-nodes-base.manualTrigger', 1, [-560, 300], {}),

  N('Claim Booking', 'n8n-nodes-base.postgres', 2.4, [-340, 300],
    { operation: 'executeQuery', query: claimSql, options: {} },
    pgCreds),

  N('Got A Booking?', 'n8n-nodes-base.if', 2, [-120, 300], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'string', operation: 'exists' },
        leftValue: '={{ $json.id }}', rightValue: '' }] }, options: {} }),

  // ERP-side duplicate check BEFORE creating anything.
  N('ERP: Existing Appointment?', 'n8n-nodes-base.erpNext', 1, [120, 200], {
    resource: 'document', operation: 'getAll', docType: 'Appointment', returnAll: true,
    options: { filters: { customProperty: [
      { field: 'customer_details', operator: 'like', value: '=%booking:{{ $json.id }}%' }] } },
  }, { credentials: { erpNextApi: ERP_CRED }, alwaysOutputData: true }),

  N('Already In ERP?', 'n8n-nodes-base.if', 2, [340, 200], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'string', operation: 'exists' },
        leftValue: '={{ $json.name }}', rightValue: '' }] }, options: {} }),

  N('ERP: Find Lead', 'n8n-nodes-base.erpNext', 1, [560, 320], {
    resource: 'document', operation: 'getAll', docType: 'Lead', returnAll: true,
    options: { filters: { customProperty: [
      { field: 'mobile_no', operator: 'like',
        value: "=%{{ $('Claim Booking').item.json.customer_phone.replace(/\\D/g,'').slice(-10) }}%" }] } },
  }, { credentials: { erpNextApi: ERP_CRED }, alwaysOutputData: true }),

  N('Lead Exists?', 'n8n-nodes-base.if', 2, [780, 320], {
    conditions: { options: { caseSensitive: true, version: 2 }, combinator: 'and',
      conditions: [{ operator: { type: 'string', operation: 'exists' },
        leftValue: '={{ $json.name }}', rightValue: '' }] }, options: {} }),

  N('ERP: Create Lead', 'n8n-nodes-base.erpNext', 1, [1000, 440], {
    resource: 'document', operation: 'create', docType: 'Lead',
    properties: { customProperty: [
      { field: 'first_name', value: "={{ $('Claim Booking').item.json.customer_name }}" },
      { field: 'mobile_no', value: "={{ $('Claim Booking').item.json.customer_phone }}" },
      { field: 'source', value: 'Website Booking' },
      { field: 'custom_brand', value: 'P91 CC' }] },
  }, { credentials: { erpNextApi: ERP_CRED } }),

  N('ERP: Add Comment', 'n8n-nodes-base.erpNext', 1, [1220, 320], {
    resource: 'document', operation: 'create', docType: 'Comment',
    properties: { customProperty: [
      { field: 'comment_type', value: 'Comment' },
      { field: 'reference_doctype', value: 'Lead' },
      { field: 'reference_name', value: '={{ $json.name }}' },
      { field: 'content',
        value: "=Appointment booked on p91carcare.com for {{ $('Claim Booking').item.json.customer_name }} on {{ $('Claim Booking').item.json.appointment_date }} {{ $('Claim Booking').item.json.appointment_time }}. Service: {{ $('Claim Booking').item.json.service_name }}. Payment confirmed (Razorpay {{ $('Claim Booking').item.json.payment_id }}). [booking:{{ $('Claim Booking').item.json.id }}]" }] },
  }, { credentials: { erpNextApi: ERP_CRED } }),

  N('ERP: Create Appointment', 'n8n-nodes-base.erpNext', 1, [1440, 320], {
    resource: 'document', operation: 'create', docType: 'Appointment',
    properties: { customProperty: [
      { field: 'appointment_with', value: 'Lead' },
      { field: 'party', value: "={{ $('ERP: Add Comment').item.json.reference_name }}" },
      { field: 'customer_name', value: "={{ $('Claim Booking').item.json.customer_name }}" },
      { field: 'customer_phone_number', value: "={{ $('Claim Booking').item.json.customer_phone }}" },
      { field: 'customer_email', value: "={{ $('Claim Booking').item.json.customer_email }}" },
      { field: 'scheduled_time', value: "={{ $('Claim Booking').item.json.appointment_date }} {{ $('Claim Booking').item.json.appointment_time }}" },
      { field: 'status', value: 'Open' },
      // The marker below is the stable idempotency key used by 'ERP: Existing Appointment?'.
      { field: 'customer_details',
        value: "=Appointment booked on p91carcare.com. Service: {{ $('Claim Booking').item.json.service_name }}. Amount: Rs {{ $('Claim Booking').item.json.amount }}. Razorpay payment {{ $('Claim Booking').item.json.payment_id }}, order {{ $('Claim Booking').item.json.razorpay_order_id }}. [booking:{{ $('Claim Booking').item.json.id }}]" }] },
  }, { credentials: { erpNextApi: ERP_CRED } }),

  // Normalise both success paths to { bookingId, erpAppointmentId } before the DB update.
  N('Prepare Synced (new)', 'n8n-nodes-base.set', 3.4, [1660, 320], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'bookingId', type: 'string', value: "={{ $('Claim Booking').item.json.id }}" },
      { name: 'erpAppointmentId', type: 'string', value: '={{ $json.name }}' }] } }),

  N('Prepare Synced (existing)', 'n8n-nodes-base.set', 3.4, [560, 100], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'bookingId', type: 'string', value: "={{ $('Claim Booking').item.json.id }}" },
      { name: 'erpAppointmentId', type: 'string', value: '={{ $json.name }}' }] } }),

  N('DB: Mark Synced', 'n8n-nodes-base.postgres', 2.4, [1880, 220],
    { operation: 'executeQuery', query: markSynced, options: {} },
    pgCreds),

  N('Prepare Failed', 'n8n-nodes-base.set', 3.4, [1660, 560], {
    mode: 'manual', duplicateItem: false, options: {},
    assignments: { assignments: [
      { name: 'bookingId', type: 'string', value: "={{ $('Claim Booking').item.json.id }}" },
      { name: 'errorSummary', type: 'string',
        value: '=ERP did not return an Appointment id. node={{ $json.error || "unknown" }}' }] } }),

  N('DB: Mark Failed', 'n8n-nodes-base.postgres', 2.4, [1880, 560],
    { operation: 'executeQuery', query: markFailed, options: {} },
    pgCreds),
];

const C = (from, to, out = 0) => ({ [from]: { main: [] } , _from: from, _to: to, _out: out });
const connections = {
  'Manual Trigger':             { main: [[{ node: 'Claim Booking', type: 'main', index: 0 }]] },
  'Claim Booking':              { main: [[{ node: 'Got A Booking?', type: 'main', index: 0 }]] },
  'Got A Booking?':             { main: [[{ node: 'ERP: Existing Appointment?', type: 'main', index: 0 }], []] },
  'ERP: Existing Appointment?': { main: [[{ node: 'Already In ERP?', type: 'main', index: 0 }]] },
  'Already In ERP?':            { main: [[{ node: 'Prepare Synced (existing)', type: 'main', index: 0 }],
                                         [{ node: 'ERP: Find Lead', type: 'main', index: 0 }]] },
  'Prepare Synced (existing)':  { main: [[{ node: 'DB: Mark Synced', type: 'main', index: 0 }]] },
  'ERP: Find Lead':             { main: [[{ node: 'Lead Exists?', type: 'main', index: 0 }]] },
  'Lead Exists?':               { main: [[{ node: 'ERP: Add Comment', type: 'main', index: 0 }],
                                         [{ node: 'ERP: Create Lead', type: 'main', index: 0 }]] },
  'ERP: Create Lead':           { main: [[{ node: 'ERP: Add Comment', type: 'main', index: 0 }]] },
  'ERP: Add Comment':           { main: [[{ node: 'ERP: Create Appointment', type: 'main', index: 0 }]] },
  'ERP: Create Appointment':    { main: [[{ node: 'Prepare Synced (new)', type: 'main', index: 0 }]] },
  'Prepare Synced (new)':       { main: [[{ node: 'DB: Mark Synced', type: 'main', index: 0 }]] },
  'Prepare Failed':             { main: [[{ node: 'DB: Mark Failed', type: 'main', index: 0 }]] },
};

process.stdout.write(JSON.stringify({
  name: 'CarCareBooker ERP Poller (recovery)',
  nodes,
  connections,
  settings: { executionOrder: 'v1', saveManualExecutions: true, executionTimeout: 300 },
}, null, 2));

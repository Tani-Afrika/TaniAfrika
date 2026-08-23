import { requireEnv } from './http.ts';

type JsonRecord = Record<string, unknown>;

function mpesaBaseUrl() {
  return (Deno.env.get('MPESA_BASE_URL') ?? 'https://sandbox.safaricom.co.ke').replace(/\/$/, '');
}

export function normalizeKenyanPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  throw new Error('Enter a valid Kenyan mobile number.');
}

function nairobiTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}${part('month')}${part('day')}${part('hour')}${part('minute')}${part('second')}`;
}

async function accessToken(): Promise<string> {
  const credentials = btoa(`${requireEnv('MPESA_CONSUMER_KEY')}:${requireEnv('MPESA_CONSUMER_SECRET')}`);
  const response = await fetch(`${mpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
  });
  const body = await response.json() as { access_token?: string; errorMessage?: string };
  if (!response.ok || !body.access_token) throw new Error(body.errorMessage ?? 'M-Pesa authentication failed.');
  return body.access_token;
}

async function mpesaPost(path: string, payload: JsonRecord): Promise<JsonRecord> {
  const token = await accessToken();
  const response = await fetch(`${mpesaBaseUrl()}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json() as JsonRecord;
  if (!response.ok) throw new Error(String(body.errorMessage ?? body.ResponseDescription ?? 'M-Pesa request failed.'));
  return body;
}

export async function initiateStkPush(input: {
  phone: string;
  amountKes: number;
  accountReference: string;
  description: string;
}) {
  const timestamp = nairobiTimestamp();
  const shortcode = requireEnv('MPESA_SHORTCODE');
  const password = btoa(`${shortcode}${requireEnv('MPESA_PASSKEY')}${timestamp}`);
  const callbackBase = requireEnv('MPESA_CALLBACK_URL');
  const callbackToken = encodeURIComponent(requireEnv('MPESA_CALLBACK_TOKEN'));

  return mpesaPost('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: Deno.env.get('MPESA_TRANSACTION_TYPE') ?? 'CustomerPayBillOnline',
    Amount: input.amountKes,
    PartyA: input.phone,
    PartyB: shortcode,
    PhoneNumber: input.phone,
    CallBackURL: `${callbackBase}${callbackBase.includes('?') ? '&' : '?'}token=${callbackToken}`,
    AccountReference: input.accountReference.slice(0, 12),
    TransactionDesc: input.description.slice(0, 32),
  });
}

export async function queryStkPush(checkoutRequestId: string) {
  const timestamp = nairobiTimestamp();
  const shortcode = requireEnv('MPESA_SHORTCODE');
  return mpesaPost('/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: shortcode,
    Password: btoa(`${shortcode}${requireEnv('MPESA_PASSKEY')}${timestamp}`),
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  });
}

export async function initiateB2cPayout(input: {
  amountKes: number;
  destination: string;
  remarks: string;
  occasion: string;
  callbackKind?: 'payout' | 'refund';
}) {
  const callbackPrefix = input.callbackKind === 'refund' ? 'MPESA_REFUND' : 'MPESA_B2C';
  const resultBase = requireEnv(`${callbackPrefix}_RESULT_URL`);
  const timeoutBase = requireEnv(`${callbackPrefix}_TIMEOUT_URL`);
  const callbackToken = encodeURIComponent(requireEnv(`${callbackPrefix}_CALLBACK_TOKEN`));
  const suffix = (url: string) => `${url}${url.includes('?') ? '&' : '?'}token=${callbackToken}`;

  return mpesaPost('/mpesa/b2c/v3/paymentrequest', {
    OriginatorConversationID: crypto.randomUUID(),
    InitiatorName: requireEnv('MPESA_B2C_INITIATOR_NAME'),
    SecurityCredential: requireEnv('MPESA_B2C_SECURITY_CREDENTIAL'),
    CommandID: Deno.env.get(`${callbackPrefix}_COMMAND_ID`) ?? Deno.env.get('MPESA_B2C_COMMAND_ID') ?? 'BusinessPayment',
    Amount: input.amountKes,
    PartyA: requireEnv('MPESA_B2C_SHORTCODE'),
    PartyB: input.destination,
    Remarks: input.remarks.slice(0, 100),
    QueueTimeOutURL: suffix(timeoutBase),
    ResultURL: suffix(resultBase),
    Occasion: input.occasion.slice(0, 100),
  });
}

export function stkCallback(body: JsonRecord) {
  const callback = ((body.Body as JsonRecord | undefined)?.stkCallback ?? {}) as JsonRecord;
  const items = (((callback.CallbackMetadata as JsonRecord | undefined)?.Item ?? []) as JsonRecord[]);
  const metadata = new Map(items.map((item) => [String(item.Name), item.Value]));
  return {
    merchantRequestId: String(callback.MerchantRequestID ?? ''),
    checkoutRequestId: String(callback.CheckoutRequestID ?? ''),
    resultCode: Number(callback.ResultCode ?? -1),
    resultDescription: String(callback.ResultDesc ?? ''),
    amountKes: metadata.has('Amount') ? Number(metadata.get('Amount')) : null,
    receipt: metadata.has('MpesaReceiptNumber') ? String(metadata.get('MpesaReceiptNumber')) : null,
    transactionDate: metadata.has('TransactionDate') ? String(metadata.get('TransactionDate')) : null,
    phone: metadata.has('PhoneNumber') ? String(metadata.get('PhoneNumber')) : null,
  };
}

export function b2cResult(body: JsonRecord) {
  const result = (body.Result ?? {}) as JsonRecord;
  return {
    resultCode: Number(result.ResultCode ?? -1),
    resultDescription: String(result.ResultDesc ?? ''),
    conversationId: String(result.ConversationID ?? ''),
    originatorConversationId: String(result.OriginatorConversationID ?? ''),
    transactionId: result.TransactionID ? String(result.TransactionID) : null,
    resultType: Number(result.ResultType ?? 0),
  };
}

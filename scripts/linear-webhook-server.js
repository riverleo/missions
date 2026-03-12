import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { handleWorkflowEvent } from './linear-webhook-workflow.js';

const PORT = 3000;
const WEBHOOK_PATH = '/linear/webhook';
const LINEAR_SIGNATURE_HEADER = 'linear-signature';
const DEFAULT_WEBHOOK_MAX_AGE_MS = 60 * 1000;

function getWebhookSecret() {
	return process.env.LINEAR_WEBHOOK_SECRET;
}

function getWebhookMaxAgeMs() {
	const value = Number(process.env.LINEAR_WEBHOOK_MAX_AGE_MS ?? DEFAULT_WEBHOOK_MAX_AGE_MS);
	return Number.isFinite(value) && value > 0 ? value : DEFAULT_WEBHOOK_MAX_AGE_MS;
}

/**
 * Platform engineer spec:
 * Verify the Linear HMAC signature against the exact raw body bytes.
 */
function verifySignature(headerSignatureString, rawBody) {
	const webhookSecret = getWebhookSecret();
	if (!webhookSecret) {
		return false;
	}

	if (typeof headerSignatureString !== 'string' || !headerSignatureString.length) {
		return false;
	}

	const computedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest();
	const headerSignature = Buffer.from(headerSignatureString, 'hex');

	if (headerSignature.length !== computedSignature.length) {
		return false;
	}

	return timingSafeEqual(computedSignature, headerSignature);
}

/**
 * Platform engineer spec:
 * Reject webhook payloads that fall outside Linear's recommended replay window.
 */
function isTimestampCurrent(jsonBody) {
	if (!jsonBody || typeof jsonBody !== 'object' || typeof jsonBody.webhookTimestamp !== 'number') {
		return false;
	}

	return Math.abs(Date.now() - jsonBody.webhookTimestamp) <= getWebhookMaxAgeMs();
}

/**
 * Platform engineer spec:
 * Summarize only the request details needed to inspect incoming Linear webhooks locally.
 */
function getRequestSummary(request, rawBody) {
	// Keep the log payload small enough to scan while preserving the fields needed for debugging.
	return {
		method: request.method,
		url: request.url,
		headers: {
			'user-agent': request.headers['user-agent'],
			'content-type': request.headers['content-type'],
			'linear-signature': request.headers[LINEAR_SIGNATURE_HEADER],
		},
		body: rawBody,
	};
}

/**
 * Platform engineer spec:
 * Read the request body once and parse JSON bodies into an object for local webhook inspection.
 */
async function readJsonBody(request) {
	// Collect the raw payload from the stream.
	const chunks = [];
	for await (const chunk of request) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	// Normalize the body before parsing so empty payloads stay valid.
	const rawBody = Buffer.concat(chunks).toString('utf8');
	if (!rawBody) {
		return {
			rawBody,
			jsonBody: undefined,
		};
	}

	// Parse JSON only when the payload is present; invalid JSON is reported to the client.
	return {
		rawBody,
		rawBodyBuffer: Buffer.concat(chunks),
		jsonBody: JSON.parse(rawBody),
	};
}

const server = createServer(async (request, response) => {
	if (request.method === 'GET' && request.url === '/health') {
		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(JSON.stringify({ ok: true, port: PORT }));
		return;
	}

	if (request.method !== 'POST' || request.url !== WEBHOOK_PATH) {
		response.writeHead(404, { 'content-type': 'application/json' });
		response.end(JSON.stringify({ ok: false, message: 'Not found' }));
		return;
	}

	try {
		const { rawBody, rawBodyBuffer, jsonBody } = await readJsonBody(request);

		if (getWebhookSecret()) {
			if (!verifySignature(request.headers[LINEAR_SIGNATURE_HEADER], rawBodyBuffer)) {
				response.writeHead(401, { 'content-type': 'application/json' });
				response.end(JSON.stringify({ ok: false, message: 'Invalid Linear signature' }));
				return;
			}

			if (!isTimestampCurrent(jsonBody)) {
				response.writeHead(401, { 'content-type': 'application/json' });
				response.end(JSON.stringify({ ok: false, message: 'Expired webhook timestamp' }));
				return;
			}
		} else {
			console.warn('[linear-webhook] LINEAR_WEBHOOK_SECRET not set, skipping signature verification');
		}

		const summary = getRequestSummary(request, jsonBody ?? rawBody);

		console.log('[linear-webhook] request received');
		console.log(JSON.stringify(summary, null, 2));

		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(
			JSON.stringify({
				ok: true,
				receivedAt: new Date().toISOString(),
				path: WEBHOOK_PATH,
			}),
		);

		handleWorkflowEvent(jsonBody).catch((automationError) => {
			console.error(
				`[linear-webhook] automation failed: ${
					automationError instanceof Error ? automationError.message : String(automationError)
				}`,
			);
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';

		console.error('[linear-webhook] invalid payload');
		console.error(message);

		response.writeHead(400, { 'content-type': 'application/json' });
		response.end(JSON.stringify({ ok: false, message }));
	}
});

server.listen(PORT, () => {
	console.log(`[linear-webhook] listening on http://localhost:${PORT}${WEBHOOK_PATH}`);
});

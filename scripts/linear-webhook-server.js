import { createServer } from 'node:http';

const PORT = 3000;
const WEBHOOK_PATH = '/linear/webhook';

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
			'linear-signature': request.headers['linear-signature'],
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
		const { rawBody, jsonBody } = await readJsonBody(request);
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

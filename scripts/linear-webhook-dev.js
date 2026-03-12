import { spawn } from 'node:child_process';
import { once } from 'node:events';

const WEBHOOK_SERVER_COMMAND = ['node', ['scripts/linear-webhook-server.js']];
const WEBHOOK_URL = 'http://localhost:3000';
const QUICK_TUNNEL_HOST_PATTERN = /https:\/\/[-a-z0-9]+\.trycloudflare\.com/;

/**
 * Platform engineer spec:
 * Select the safest cloudflared invocation from the configured environment.
 */
function getTunnelCommand() {
	// Prefer a remotely-managed tunnel token when it is present.
	if (process.env.CLOUDFLARED_TUNNEL_TOKEN) {
		return {
			args: ['tunnel', 'run', '--token', process.env.CLOUDFLARED_TUNNEL_TOKEN],
			mode: 'token',
		};
	}

	// Fall back to a locally-managed tunnel when both name and config path are provided.
	if (process.env.CLOUDFLARED_CONFIG_PATH && process.env.CLOUDFLARED_TUNNEL_NAME) {
		return {
			args: [
				'tunnel',
				'--config',
				process.env.CLOUDFLARED_CONFIG_PATH,
				'run',
				process.env.CLOUDFLARED_TUNNEL_NAME,
			],
			mode: 'config',
		};
	}

	// Default to a quick tunnel so local webhook testing works without extra Cloudflare setup.
	return {
		args: ['tunnel', '--url', WEBHOOK_URL],
		mode: 'quick',
	};
}

/**
 * Platform engineer spec:
 * Start the webhook server and wait until it is ready before opening the tunnel.
 */
async function startWebhookServer() {
	// Launch the local webhook server in a child process so both processes can be managed together.
	const server = spawn(WEBHOOK_SERVER_COMMAND[0], WEBHOOK_SERVER_COMMAND[1], {
		cwd: process.cwd(),
		env: process.env,
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	server.stdout.setEncoding('utf8');
	server.stderr.setEncoding('utf8');

	const ready = new Promise((resolve, reject) => {
		server.stdout.on('data', (chunk) => {
			process.stdout.write(chunk);
			if (chunk.includes('[linear-webhook] listening on')) {
				resolve(undefined);
			}
		});

		server.stderr.on('data', (chunk) => {
			process.stderr.write(chunk);
		});

		server.once('exit', (code) => {
			reject(new Error(`Webhook server exited before becoming ready (code: ${code ?? 'null'})`));
		});
	});

	await ready;
	return server;
}

/**
 * Platform engineer spec:
 * Run cloudflared with the chosen mode and surface the public URL when available.
 */
async function startTunnel() {
	// Choose the cloudflared command based on environment configuration.
	const command = getTunnelCommand();
	const tunnel = spawn('cloudflared', command.args, {
		cwd: process.cwd(),
		env: process.env,
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	tunnel.stdout.setEncoding('utf8');
	tunnel.stderr.setEncoding('utf8');

	let resolvedPublicUrl;
	const ready = new Promise((resolve, reject) => {
		const onData = (chunk) => {
			process.stdout.write(chunk);

			if (!resolvedPublicUrl) {
				const quickTunnelUrl = chunk.match(QUICK_TUNNEL_HOST_PATTERN)?.[0];
				const configuredHostname =
					process.env.CLOUDFLARED_PUBLIC_HOSTNAME &&
					`https://${process.env.CLOUDFLARED_PUBLIC_HOSTNAME}`;

				resolvedPublicUrl = quickTunnelUrl ?? configuredHostname;
			}

			if (command.mode === 'quick' && resolvedPublicUrl) {
				resolve({
					mode: command.mode,
					publicUrl: resolvedPublicUrl,
				});
			}

			if (command.mode === 'quick' && chunk.includes('Registered tunnel connection')) {
				resolve({
					mode: command.mode,
					publicUrl: resolvedPublicUrl,
				});
			}

			if (command.mode !== 'quick' && chunk.includes('Registered tunnel connection')) {
				resolve({
					mode: command.mode,
					publicUrl: resolvedPublicUrl,
				});
			}
		};

		tunnel.stdout.on('data', onData);
		tunnel.stderr.on('data', (chunk) => {
			process.stderr.write(chunk);

			if (command.mode !== 'quick' && chunk.includes('Registered tunnel connection')) {
				resolve({
					mode: command.mode,
					publicUrl: resolvedPublicUrl,
				});
			}
		});

		tunnel.once('error', (error) => {
			reject(error);
		});

		tunnel.once('exit', (code) => {
			reject(new Error(`cloudflared exited before becoming ready (code: ${code ?? 'null'})`));
		});
	});

	const tunnelState = await ready;
	return {
		process: tunnel,
		...tunnelState,
	};
}

/**
 * Platform engineer spec:
 * Stop all child processes when one side fails or the parent receives a signal.
 */
async function stopProcess(childProcess, signal = 'SIGTERM') {
	// Guard against already-terminated children so repeated shutdown calls stay safe.
	if (!childProcess || childProcess.exitCode !== null || childProcess.killed) {
		return;
	}

	childProcess.kill(signal);
	await once(childProcess, 'exit').catch(() => undefined);
}

let shuttingDown = false;

async function shutdown(childProcesses, signal = 'SIGTERM') {
	if (shuttingDown) {
		return;
	}

	shuttingDown = true;
	await Promise.all(childProcesses.map((childProcess) => stopProcess(childProcess, signal)));
}

/**
 * Platform engineer spec:
 * Coordinate the webhook server and Cloudflare Tunnel under a single pnpm command.
 */
async function main() {
	// Start the webhook server first so the tunnel always points at a live origin.
	const webhookServer = await startWebhookServer();

	try {
		// Open the tunnel after the local server is confirmed ready.
		const tunnel = await startTunnel();

		console.log('[linear-webhook] tunnel connected');
		console.log(`[linear-webhook] tunnel mode: ${tunnel.mode}`);
		console.log(
			`[linear-webhook] public webhook URL: ${
				tunnel.publicUrl ? `${tunnel.publicUrl}/linear/webhook` : 'hostname not reported by cloudflared'
			}`,
		);

		const childProcesses = [webhookServer, tunnel.process];
		const handleSignal = async (signal) => {
			await shutdown(childProcesses, signal);
			process.exit(0);
		};

		process.once('SIGINT', handleSignal);
		process.once('SIGTERM', handleSignal);

		await Promise.race([
			once(webhookServer, 'exit').then(([code]) => {
				throw new Error(`Webhook server stopped unexpectedly (code: ${code ?? 'null'})`);
			}),
			once(tunnel.process, 'exit').then(([code]) => {
				throw new Error(`cloudflared stopped unexpectedly (code: ${code ?? 'null'})`);
			}),
		]);
	} catch (error) {
		await shutdown([webhookServer]);
		throw error;
	}
}

main().catch((error) => {
	const message = error instanceof Error ? error.message : 'Unknown error';
	console.error(`[linear-webhook] startup failed: ${message}`);
	process.exit(1);
});

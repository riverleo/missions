import { spawn, execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const processedEvents = new Set();
const activeAutomations = new Map();
const pendingReplans = new Map();
const DEFAULT_CODEX_BIN = '/Applications/Codex.app/Contents/Resources/codex';
const AUTOMATION_COMMENT_PREFIXES = ['[플래너] ', '[플랫폼 엔지니어, 테스트 엔지니어] '];

function getIssueCode(payload) {
	return payload?.data?.identifier ?? payload?.data?.issue?.identifier;
}

function getIssueTitle(payload) {
	return payload?.data?.title ?? payload?.data?.issue?.title ?? '제목 없음';
}

function getIssueUrl(payload) {
	return payload?.data?.issue?.url ?? payload?.url ?? payload?.data?.url ?? '';
}

function getIssueDescription(payload) {
	return payload?.data?.description ?? '설명 없음';
}

function getIssueId(payload) {
	return payload?.data?.id && payload?.type === 'Issue' ? payload.data.id : payload?.data?.issueId;
}

function getIssueTeamId(payload) {
	return payload?.data?.team?.id ?? payload?.data?.issue?.team?.id;
}

function getCommentBody(payload) {
	return payload?.data?.body ?? '';
}

function isIssueStateTransition(payload, stateName) {
	return (
		payload?.type === 'Issue' &&
		payload?.action === 'update' &&
		payload?.data?.state?.name === stateName &&
		payload?.updatedFrom?.stateId &&
		payload?.updatedFrom?.stateId !== payload?.data?.stateId
	);
}

function isIssueTodo(payload) {
	return isIssueStateTransition(payload, 'Todo');
}

function isIssueDone(payload) {
	return isIssueStateTransition(payload, 'Done');
}

function isIssueCanceled(payload) {
	return isIssueStateTransition(payload, 'Canceled');
}

function isIssueRemoved(payload) {
	return payload?.type === 'Issue' && payload?.action === 'remove';
}

function isCommentEvent(payload) {
	return payload?.type === 'Comment' && ['create', 'update'].includes(payload?.action);
}

function isAutomationComment(payload) {
	const body = getCommentBody(payload);
	return AUTOMATION_COMMENT_PREFIXES.some((prefix) => body.startsWith(prefix));
}

function isUserReplanComment(payload) {
	return isCommentEvent(payload) && Boolean(getIssueCode(payload)) && !isAutomationComment(payload);
}

function getProcessedEventKey(payload) {
	return [
		payload.webhookId,
		payload.type,
		payload.action,
		payload.data?.id,
		payload.data?.updatedAt,
	]
		.filter(Boolean)
		.join(':');
}

async function runCommand(command, args, options = {}) {
	const result = await execFileAsync(command, args, {
		cwd: options.cwd,
		env: options.env ?? process.env,
		maxBuffer: 10 * 1024 * 1024,
	});

	return {
		stdout: result.stdout?.trim() ?? '',
		stderr: result.stderr?.trim() ?? '',
	};
}

async function getRepoRoot() {
	const { stdout } = await runCommand('git', ['rev-parse', '--show-toplevel']);
	return stdout;
}

async function pathExists(path) {
	try {
		await readdir(path);
		return true;
	} catch {
		return false;
	}
}

async function resolveCodexBinary() {
	const configuredBinary = process.env.CODEX_BIN;
	if (configuredBinary) {
		return configuredBinary;
	}

	try {
		const { stdout } = await runCommand('which', ['codex']);
		if (stdout) {
			return stdout;
		}
	} catch {
		// Fall through to the bundled app binary path.
	}

	return DEFAULT_CODEX_BIN;
}

async function createLinearIssueComment(issueId, body) {
	if (!process.env.LINEAR_API_KEY) {
		console.warn('[linear-webhook] LINEAR_API_KEY not set, skipping Linear comment update');
		return;
	}

	const response = await fetch('https://api.linear.app/graphql', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: process.env.LINEAR_API_KEY,
		},
		body: JSON.stringify({
			query: `
				mutation CommentCreate($issueId: String!, $body: String!) {
					commentCreate(input: { issueId: $issueId, body: $body }) {
						success
					}
				}
			`,
			variables: {
				issueId,
				body,
			},
		}),
	});

	const result = await response.json();
	if (!response.ok || result.errors?.length || !result.data?.commentCreate?.success) {
		throw new Error(`Failed to create Linear comment: ${JSON.stringify(result.errors ?? result)}`);
	}
}

async function getWorkflowStateId(teamId, stateName) {
	if (!process.env.LINEAR_API_KEY) {
		return undefined;
	}

	const response = await fetch('https://api.linear.app/graphql', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: process.env.LINEAR_API_KEY,
		},
		body: JSON.stringify({
			query: `
				query WorkflowStates($teamId: ID!, $stateName: String!) {
					workflowStates(
						filter: { team: { id: { eq: $teamId } }, name: { eq: $stateName } }
					) {
						nodes {
							id
							name
						}
					}
				}
			`,
			variables: {
				teamId,
				stateName,
			},
		}),
	});

	const result = await response.json();
	if (!response.ok || result.errors?.length) {
		throw new Error(`Failed to fetch workflow states: ${JSON.stringify(result.errors ?? result)}`);
	}

	return result.data?.workflowStates?.nodes?.[0]?.id;
}

async function updateLinearIssueState(issueId, teamId, stateName) {
	if (!process.env.LINEAR_API_KEY) {
		console.warn('[linear-webhook] LINEAR_API_KEY not set, skipping issue state update');
		return;
	}

	const stateId = await getWorkflowStateId(teamId, stateName);
	if (!stateId) {
		throw new Error(`Workflow state "${stateName}" not found for team ${teamId}`);
	}

	const response = await fetch('https://api.linear.app/graphql', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: process.env.LINEAR_API_KEY,
		},
		body: JSON.stringify({
			query: `
				mutation IssueUpdate($issueId: String!, $stateId: String!) {
					issueUpdate(id: $issueId, input: { stateId: $stateId }) {
						success
					}
				}
			`,
			variables: {
				issueId,
				stateId,
			},
		}),
	});

	const result = await response.json();
	if (!response.ok || result.errors?.length || !result.data?.issueUpdate?.success) {
		throw new Error(`Failed to update issue state: ${JSON.stringify(result.errors ?? result)}`);
	}
}

async function findOpenPullRequestForIssue(repoRoot, issueCode) {
	const { stdout } = await runCommand(
		'gh',
		['pr', 'list', '--state', 'open', '--json', 'number,title,url', '--limit', '100'],
		{ cwd: repoRoot }
	);

	return JSON.parse(stdout).find((pullRequest) => pullRequest.title.startsWith(`[${issueCode}] `));
}

async function findPlanPathForIssue(worktreePath, issueCode) {
	const plansDirectory = join(worktreePath, 'docs', 'plans');
	const entries = await readdir(plansDirectory, { withFileTypes: true });
	const planFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

	for (const planFile of planFiles) {
		const absolutePath = join(plansDirectory, planFile.name);
		const contents = await readFile(absolutePath, 'utf8');

		if (contents.includes(`이슈: ${issueCode}`)) {
			return {
				absolutePath,
				relativePath: `docs/plans/${planFile.name}`,
				planStem: planFile.name.replace(/\.md$/, ''),
			};
		}
	}

	return undefined;
}

async function ensureIssueWorktree(repoRoot, issueCode) {
	const worktreeRoot = dirname(repoRoot);
	const worktreePath = join(worktreeRoot, `${basename(repoRoot)}-${issueCode.toLowerCase()}`);

	if (!(await pathExists(worktreePath))) {
		await runCommand('git', ['fetch', 'origin', 'main'], { cwd: repoRoot });
		await runCommand('git', ['worktree', 'add', '--detach', worktreePath, 'origin/main'], {
			cwd: repoRoot,
		});
	}

	return worktreePath;
}

function getRunPaths(repoRoot, issueCode, stage) {
	const runDirectory = join(repoRoot, '.codex', 'linear-runs', issueCode.toLowerCase(), stage);
	return {
		runDirectory,
		outputPath: join(runDirectory, 'last-message.txt'),
		stdoutPath: join(runDirectory, 'stdout.log'),
		stderrPath: join(runDirectory, 'stderr.log'),
	};
}

async function getGitStatusSummary(worktreePath) {
	const { stdout } = await runCommand('git', ['status', '--short', '--branch'], {
		cwd: worktreePath,
	});
	return stdout;
}

async function ensureWorkerCompletionCommitted(worktreePath) {
	const statusSummary = await getGitStatusSummary(worktreePath);
	const statusLines = statusSummary.split('\n').filter(Boolean);
	const branchLine = statusLines[0] ?? '';
	const changeLines = statusLines.slice(1);

	if (changeLines.length > 0) {
		throw new Error(
			`구현 세션이 종료되었지만 커밋되지 않은 변경이 남아 있습니다.\n${changeLines.join('\n')}`
		);
	}

	if (branchLine.includes('[ahead ')) {
		throw new Error(
			`구현 세션이 종료되었지만 원격에 푸시되지 않은 커밋이 남아 있습니다.\n${branchLine}`
		);
	}

	if (!branchLine.includes('...origin/')) {
		throw new Error(`구현 브랜치의 원격 추적 정보가 없습니다.\n${branchLine}`);
	}
}

function getStageLabel(stage) {
	return stage === 'planner' ? '플래너' : '플랫폼 엔지니어, 테스트 엔지니어';
}

function formatAutomationComment(role, message, detail) {
	const lines = [`[${role}] ${message}`];
	if (detail) {
		lines.push(detail);
	}

	return lines.join('\n');
}

function buildStartStatusComment(stage, mode = 'default') {
	if (stage === 'planner') {
		return formatAutomationComment(
			getStageLabel(stage),
			mode === 'replan'
				? '수정 요청 반영을 위한 플랜 갱신을 시작했습니다.'
				: '플랜 작성을 시작했습니다.'
		);
	}

	return formatAutomationComment(
		getStageLabel(stage),
		mode === 'replan' ? '수정 사항 반영 작업을 시작했습니다.' : '플랜 구현을 시작했습니다.'
	);
}

function buildCompletionStatusComment(stage, code, completionError, mode = 'default') {
	const role = getStageLabel(stage);

	if (code === 0) {
		if (stage === 'planner') {
			return formatAutomationComment(
				role,
				mode === 'replan'
					? '수정 요청 반영을 위한 플랜 갱신을 완료했습니다.'
					: '플랜 작성을 완료했습니다.'
			);
		}

		return formatAutomationComment(
			role,
			mode === 'replan' ? '수정 사항 반영 작업을 완료했습니다.' : '플랜 구현을 완료했습니다.'
		);
	}

	if (completionError) {
		return formatAutomationComment(role, '작업이 실패했습니다.', completionError);
	}

	return formatAutomationComment(role, '작업이 실패했습니다.');
}

function hasActiveAutomationForIssue(issueCode) {
	for (const automation of activeAutomations.values()) {
		if (automation.issueCode === issueCode) {
			return true;
		}
	}

	return false;
}

async function startCodexSession({
	codexBinary,
	repoRoot,
	issueCode,
	issueId,
	stage,
	worktreePath,
	prompt,
	startComment,
	completeComment,
	onSuccess,
}) {
	const lockKey = `${issueCode}:${stage}`;
	if (activeAutomations.has(lockKey)) {
		console.log(`[linear-webhook] ${stage} workflow already running for ${issueCode}`);
		return;
	}

	const runPaths = getRunPaths(repoRoot, issueCode, stage);
	await mkdir(runPaths.runDirectory, { recursive: true });

	const stdoutStream = createWriteStream(runPaths.stdoutPath, { flags: 'a' });
	const stderrStream = createWriteStream(runPaths.stderrPath, { flags: 'a' });

	stdoutStream.write(
		`\n=== ${new Date().toISOString()} ${stage} session start: ${issueCode} ===\n`
	);
	stderrStream.write(
		`\n=== ${new Date().toISOString()} ${stage} session start: ${issueCode} ===\n`
	);

	const child = spawn(
		codexBinary,
		[
			'exec',
			'--dangerously-bypass-approvals-and-sandbox',
			'-C',
			worktreePath,
			'-o',
			runPaths.outputPath,
			prompt,
		],
		{
			cwd: repoRoot,
			env: process.env,
			stdio: ['ignore', 'pipe', 'pipe'],
		}
	);

	child.stdout.pipe(stdoutStream);
	child.stderr.pipe(stderrStream);

	activeAutomations.set(lockKey, {
		issueCode,
		stage,
		pid: child.pid ?? -1,
		worktreePath,
		outputPath: runPaths.outputPath,
	});

	if (startComment) {
		await createLinearIssueComment(issueId, startComment(child.pid ?? 'unknown', worktreePath));
	}

	child.once('error', async (error) => {
		activeAutomations.delete(lockKey);
		stdoutStream.end();
		stderrStream.end();

		try {
			await createLinearIssueComment(
				issueId,
				`${getStageLabel(stage)} 작업을 시작하지 못했어요.\n${
					error instanceof Error ? error.message : String(error)
				}`
			);
		} catch (commentError) {
			console.error(
				`[linear-webhook] failed to publish ${stage} start error for ${issueCode}: ${
					commentError instanceof Error ? commentError.message : String(commentError)
				}`
			);
		}

		await flushPendingReplan(issueCode).catch((flushError) => {
			console.error(
				`[linear-webhook] failed to flush queued replan for ${issueCode}: ${
					flushError instanceof Error ? flushError.message : String(flushError)
				}`
			);
		});
	});

	child.once('exit', async (code) => {
		stdoutStream.end();
		stderrStream.end();
		activeAutomations.delete(lockKey);

		try {
			const finalMessage = await readFile(runPaths.outputPath, 'utf8').catch(() => '');
			let completionError;

			if (code === 0 && onSuccess) {
				try {
					await onSuccess(finalMessage);
				} catch (error) {
					completionError = error instanceof Error ? error.message : String(error);
				}
			}

			if (completeComment) {
				await createLinearIssueComment(
					issueId,
					completeComment(completionError ? 1 : (code ?? null), finalMessage, completionError)
				);
			}
		} catch (error) {
			console.error(
				`[linear-webhook] failed to publish ${stage} result for ${issueCode}: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		} finally {
			await flushPendingReplan(issueCode).catch((flushError) => {
				console.error(
					`[linear-webhook] failed to flush queued replan for ${issueCode}: ${
						flushError instanceof Error ? flushError.message : String(flushError)
					}`
				);
			});
		}
	});

	console.log(
		`[linear-webhook] ${stage} session started for ${issueCode} (pid: ${child.pid ?? 'unknown'})`
	);
}

function buildPlannerPrompt(payload, worktreePath) {
	const issueCode = getIssueCode(payload);
	const issueTitle = getIssueTitle(payload);
	const issueUrl = getIssueUrl(payload);
	const issueDescription = getIssueDescription(payload);

	return `[플래너]
Linear 이슈 ${issueCode}의 상태가 Todo로 변경되었다. 현재 저장소 규칙에 따라 플래너 작업을 즉시 수행하라.

이슈 정보
- 코드: ${issueCode}
- 제목: ${issueTitle}
- 링크: ${issueUrl}
- 설명:
${issueDescription}

수행할 일
1. AGENTS.md와 docs/agents/planner/AGENTS.md 규칙을 따른다.
2. 이슈 기준 플랜 문서를 docs/plans에 작성한다.
3. 플랜 파일 최상단에 아래 두 줄을 제목보다 먼저 추가한다.
   이슈: ${issueCode}
   링크: ${issueUrl}
4. main 최신화, 플랜 전용 브랜치 생성, 원격 푸시, PR 생성까지 완료한다.
5. PR 제목은 반드시 [${issueCode}] ${issueTitle} 형식을 사용한다.
6. PR 본문은 .github/PULL_REQUEST_TEMPLATE/plan.md 형식을 따른다.
7. 플랜 작성 후 [플랫폼 엔지니어, 테스트 엔지니어] 역할 호출 문구를 남긴다.
8. LINEAR_API_KEY가 있으면 Linear 이슈 상태를 In Progress로 변경한다.
9. 변경 사항을 커밋하고 푸시한다.

작업 디렉토리
- ${worktreePath}

작업을 끝낸 뒤 최종 응답에는 아래만 간결히 포함하라.
- 생성한 플랜 파일 경로
- PR URL
- Linear 상태 변경 여부`;
}

function buildWorkerPrompt({ issueCode, issueTitle, planInfo, worktreePath, pullRequestUrl }) {
	return `[플랫폼 엔지니어, 테스트 엔지니어]
${planInfo.planStem} 플랜 구현 시작

이슈 정보
- 코드: ${issueCode}
- 제목: ${issueTitle}
- 플랜: ${planInfo.relativePath}
- PR: ${pullRequestUrl}

수행할 일
1. AGENTS.md와 역할별 지침을 따른다.
2. 플랜 체크리스트 기준으로 필요한 구현과 검증을 완료한다.
3. 변경 파일을 모두 커밋하고 현재 PR 브랜치에 반드시 푸시한다.
4. 작업 종료 시 worktree에 미커밋 변경이 남아 있으면 안 된다.
5. 최종 응답에는 변경 파일, 검증 내용, 커밋/푸시 완료 여부를 간결히 적는다.

작업 디렉토리
- ${worktreePath}`;
}

function buildReplanPrompt({ payload, planInfo, worktreePath, pullRequestUrl }) {
	const issueCode = getIssueCode(payload);
	const issueTitle = getIssueTitle(payload);
	const issueUrl = getIssueUrl(payload);
	const commentBody = getCommentBody(payload);

	return `[플래너]
${issueCode} 이슈에 사용자 수정 요청 코멘트가 추가되었다. 기존 플랜을 갱신하고 구현 역할을 다시 지시하라.

이슈 정보
- 코드: ${issueCode}
- 제목: ${issueTitle}
- 링크: ${issueUrl}
- 플랜: ${planInfo.relativePath}
- PR: ${pullRequestUrl}

사용자 코멘트
${commentBody}

수행할 일
1. AGENTS.md와 docs/agents/planner/AGENTS.md 규칙을 따른다.
2. 새 플랜을 만들지 말고 기존 플랜 파일 ${planInfo.relativePath}를 갱신한다.
3. 사용자 코멘트에서 요구한 변경 사항을 플랜의 목표, 할 일, 노트에 반영한다.
4. 기존 브랜치와 PR을 유지한 채 플랜 변경을 커밋하고 푸시한다.
5. 플랜 갱신 후 [플랫폼 엔지니어, 테스트 엔지니어] 역할 호출 문구를 남긴다.
6. LINEAR_API_KEY가 있으면 Linear 이슈 상태를 In Progress로 변경한다.

작업 디렉토리
- ${worktreePath}

작업을 끝낸 뒤 최종 응답에는 아래만 간결히 포함하라.
- 갱신한 플랜 파일 경로
- 반영한 사용자 코멘트 요약
- 재지시 여부`;
}

async function flushPendingReplan(issueCode) {
	if (!issueCode || hasActiveAutomationForIssue(issueCode)) {
		return;
	}

	const queuedPayload = pendingReplans.get(issueCode);
	if (!queuedPayload) {
		return;
	}

	pendingReplans.delete(issueCode);
	await startReplanSession(queuedPayload);
}

async function startPlannerSession(payload) {
	const repoRoot = await getRepoRoot();
	const issueCode = getIssueCode(payload);
	const issueTitle = getIssueTitle(payload);
	const issueLockKey = issueCode ?? payload.data?.id;

	if (activeAutomations.has(issueLockKey)) {
		console.log(`[linear-webhook] planner workflow already running for ${issueCode}`);
		return;
	}

	const existingPullRequest = await findOpenPullRequestForIssue(repoRoot, issueCode);
	const worktreePath = await ensureIssueWorktree(repoRoot, issueCode);
	const codexBinary = await resolveCodexBinary();

	if (existingPullRequest) {
		const planInfo = await findPlanPathForIssue(worktreePath, issueCode);
		if (!planInfo) {
			console.warn(
				`[linear-webhook] open PR exists for ${issueCode} but no plan file was found in ${worktreePath}`
			);
			return;
		}

		console.log(
			`[linear-webhook] open PR already exists for ${issueCode}, continuing with worker stage: ${existingPullRequest.url}`
		);

		const workerPrompt = buildWorkerPrompt({
			issueCode,
			issueTitle,
			planInfo,
			worktreePath,
			pullRequestUrl: existingPullRequest.url,
		});

		await updateLinearIssueState(payload.data.id, payload.data.team.id, 'In Progress');

		await startCodexSession({
			codexBinary,
			repoRoot,
			issueCode,
			issueId: payload.data.id,
			stage: 'worker',
			worktreePath,
			prompt: workerPrompt,
			startComment: () => buildStartStatusComment('worker'),
			completeComment: (code, _finalMessage, completionError) =>
				buildCompletionStatusComment('worker', code, completionError),
			onSuccess: async () => {
				await ensureWorkerCompletionCommitted(worktreePath);
				await updateLinearIssueState(payload.data.id, payload.data.team.id, 'In Review');
			},
		});
		return;
	}

	const plannerPrompt = buildPlannerPrompt(payload, worktreePath);
	await startCodexSession({
		codexBinary,
		repoRoot,
		issueCode,
		issueId: payload.data.id,
		stage: 'planner',
		worktreePath,
		prompt: plannerPrompt,
		startComment: () => buildStartStatusComment('planner'),
		completeComment: (code, _finalMessage, completionError) =>
			buildCompletionStatusComment('planner', code, completionError),
		onSuccess: async () => {
			const planInfo = await findPlanPathForIssue(worktreePath, issueCode);
			if (!planInfo) {
				throw new Error(`Planner completed but no plan file was found for ${issueCode}`);
			}

			const pullRequest = await findOpenPullRequestForIssue(repoRoot, issueCode);

			const workerPrompt = buildWorkerPrompt({
				issueCode,
				issueTitle,
				planInfo,
				worktreePath,
				pullRequestUrl:
					pullRequest?.url ??
					`https://github.com/riverleo/missions/pulls?q=is%3Apr+is%3Aopen+%5B${issueCode}%5D`,
			});

			await startCodexSession({
				codexBinary,
				repoRoot,
				issueCode,
				issueId: payload.data.id,
				stage: 'worker',
				worktreePath,
				prompt: workerPrompt,
				startComment: () => buildStartStatusComment('worker'),
				completeComment: (code, _finalMessage, completionError) =>
					buildCompletionStatusComment('worker', code, completionError),
				onSuccess: async () => {
					await ensureWorkerCompletionCommitted(worktreePath);
					await updateLinearIssueState(payload.data.id, payload.data.team.id, 'In Review');
				},
			});
		},
	});
}

async function startReplanSession(payload) {
	const repoRoot = await getRepoRoot();
	const issueCode = getIssueCode(payload);
	if (!issueCode) {
		return;
	}

	if (hasActiveAutomationForIssue(issueCode)) {
		pendingReplans.set(issueCode, payload);
		console.log(
			`[linear-webhook] queued replan for ${issueCode} while another automation is running`
		);
		return;
	}

	const worktreePath = await ensureIssueWorktree(repoRoot, issueCode);
	const existingPullRequest = await findOpenPullRequestForIssue(repoRoot, issueCode);
	if (!existingPullRequest) {
		console.warn(`[linear-webhook] no open PR found for ${issueCode}, skipping replan`);
		return;
	}

	const planInfo = await findPlanPathForIssue(worktreePath, issueCode);
	if (!planInfo) {
		console.warn(`[linear-webhook] no existing plan found for ${issueCode}, skipping replan`);
		return;
	}

	const codexBinary = await resolveCodexBinary();
	const issueId = getIssueId(payload);
	const teamId = getIssueTeamId(payload);
	const issueTitle = getIssueTitle(payload);
	const replanPrompt = buildReplanPrompt({
		payload,
		planInfo,
		worktreePath,
		pullRequestUrl: existingPullRequest.url,
	});

	await updateLinearIssueState(issueId, teamId, 'In Progress').catch(() => undefined);

	await startCodexSession({
		codexBinary,
		repoRoot,
		issueCode,
		issueId,
		stage: 'planner',
		worktreePath,
		prompt: replanPrompt,
		startComment: () => buildStartStatusComment('planner', 'replan'),
		completeComment: (code, _finalMessage, completionError) =>
			buildCompletionStatusComment('planner', code, completionError, 'replan'),
		onSuccess: async () => {
			const refreshedPlanInfo = await findPlanPathForIssue(worktreePath, issueCode);
			if (!refreshedPlanInfo) {
				throw new Error(`Replanner completed but no plan file was found for ${issueCode}`);
			}

			const workerPrompt = buildWorkerPrompt({
				issueCode,
				issueTitle,
				planInfo: refreshedPlanInfo,
				worktreePath,
				pullRequestUrl: existingPullRequest.url,
			});

			await startCodexSession({
				codexBinary,
				repoRoot,
				issueCode,
				issueId,
				stage: 'worker',
				worktreePath,
				prompt: workerPrompt,
				startComment: () => buildStartStatusComment('worker', 'replan'),
				completeComment: (code, _finalMessage, completionError) =>
					buildCompletionStatusComment('worker', code, completionError, 'replan'),
				onSuccess: async () => {
					await ensureWorkerCompletionCommitted(worktreePath);
					await updateLinearIssueState(issueId, teamId, 'In Review');
				},
			});
		},
	});
}

async function mergePullRequestForIssue(payload) {
	const repoRoot = await getRepoRoot();
	const issueCode = getIssueCode(payload);
	const matchingPullRequest = await findOpenPullRequestForIssue(repoRoot, issueCode);

	if (!matchingPullRequest) {
		console.warn(`[linear-webhook] no open PR found for ${issueCode}, skipping merge`);
		return;
	}

	const mergeMethod = process.env.GITHUB_PR_MERGE_METHOD ?? 'squash';
	const mergeFlag =
		mergeMethod === 'merge' ? '--merge' : mergeMethod === 'rebase' ? '--rebase' : '--squash';

	await runCommand(
		'gh',
		['pr', 'merge', String(matchingPullRequest.number), mergeFlag, '--delete-branch'],
		{ cwd: repoRoot }
	);

	console.log(`[linear-webhook] merged PR for ${issueCode}: ${matchingPullRequest.url}`);
}

async function closePullRequestForIssue(payload) {
	const repoRoot = await getRepoRoot();
	const issueCode = getIssueCode(payload);
	const matchingPullRequest = await findOpenPullRequestForIssue(repoRoot, issueCode);

	if (!matchingPullRequest) {
		console.warn(`[linear-webhook] no open PR found for ${issueCode}, skipping close`);
		return;
	}

	await runCommand('gh', ['pr', 'close', String(matchingPullRequest.number), '--delete-branch'], {
		cwd: repoRoot,
	});

	console.log(`[linear-webhook] closed PR for ${issueCode}: ${matchingPullRequest.url}`);
}

export async function handleWorkflowEvent(payload) {
	const processedEventKey = getProcessedEventKey(payload);
	if (processedEvents.has(processedEventKey)) {
		return;
	}

	processedEvents.add(processedEventKey);

	try {
		if (isIssueTodo(payload)) {
			await startPlannerSession(payload);
			return;
		}

		if (isUserReplanComment(payload)) {
			await startReplanSession(payload);
			return;
		}

		if (isIssueDone(payload)) {
			await mergePullRequestForIssue(payload);
			await updateLinearIssueState(payload.data.id, payload.data.team.id, 'Done').catch(
				() => undefined
			);
			return;
		}

		if (isIssueCanceled(payload)) {
			await closePullRequestForIssue(payload);
			return;
		}

		if (isIssueRemoved(payload)) {
			await closePullRequestForIssue(payload);
		}
	} finally {
		setTimeout(() => processedEvents.delete(processedEventKey), 5 * 60 * 1000).unref?.();
	}
}

export const __test__ = {
	AUTOMATION_COMMENT_PREFIXES,
	buildCompletionStatusComment,
	buildReplanPrompt,
	buildStartStatusComment,
	formatAutomationComment,
	getCommentBody,
	getIssueCode,
	getIssueId,
	getIssueTeamId,
	getIssueTitle,
	getIssueUrl,
	isAutomationComment,
	isUserReplanComment,
};

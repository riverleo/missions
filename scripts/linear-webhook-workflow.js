import { spawn, execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const processedEvents = new Set();
const activeAutomations = new Map();

function getIssueCode(payload) {
	return payload?.data?.identifier;
}

function getIssueTitle(payload) {
	return payload?.data?.title ?? '제목 없음';
}

function getIssueUrl(payload) {
	return payload?.url ?? payload?.data?.url ?? '';
}

function getIssueDescription(payload) {
	return payload?.data?.description ?? '설명 없음';
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

function getProcessedEventKey(payload) {
	return [payload.webhookId, payload.type, payload.action, payload.data?.id, payload.data?.updatedAt]
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
		{ cwd: repoRoot },
	);

	return JSON.parse(stdout).find((pullRequest) => pullRequest.title.startsWith(`[${issueCode}] `));
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
	if (existingPullRequest) {
		console.log(`[linear-webhook] open PR already exists for ${issueCode}: ${existingPullRequest.url}`);
		return;
	}

	const worktreeRoot = dirname(repoRoot);
	const worktreePath = join(worktreeRoot, `${basename(repoRoot)}-${issueCode.toLowerCase()}`);
	const runDirectory = join(repoRoot, '.codex', 'linear-runs', issueCode.toLowerCase());
	const outputPath = join(runDirectory, 'last-message.txt');
	const stdoutPath = join(runDirectory, 'stdout.log');
	const stderrPath = join(runDirectory, 'stderr.log');

	await mkdir(runDirectory, { recursive: true });

	if (!(await pathExists(worktreePath))) {
		await runCommand('git', ['fetch', 'origin', 'main'], { cwd: repoRoot });
		await runCommand('git', ['worktree', 'add', '--detach', worktreePath, 'origin/main'], {
			cwd: repoRoot,
		});
	}

	const plannerPrompt = buildPlannerPrompt(payload, worktreePath);
	const stdoutStream = createWriteStream(stdoutPath, { flags: 'a' });
	const stderrStream = createWriteStream(stderrPath, { flags: 'a' });

	stdoutStream.write(`\n=== ${new Date().toISOString()} planner session start: ${issueCode} ===\n`);
	stderrStream.write(`\n=== ${new Date().toISOString()} planner session start: ${issueCode} ===\n`);

	const child = spawn(
		'codex',
		[
			'exec',
			'--dangerously-bypass-approvals-and-sandbox',
			'-C',
			worktreePath,
			'-o',
			outputPath,
			plannerPrompt,
		],
		{
			cwd: repoRoot,
			env: process.env,
			stdio: ['ignore', 'pipe', 'pipe'],
		},
	);

	child.stdout.pipe(stdoutStream);
	child.stderr.pipe(stderrStream);

	activeAutomations.set(issueLockKey, {
		issueCode,
		pid: child.pid ?? -1,
		worktreePath,
		outputPath,
	});

	await createLinearIssueComment(
		payload.data.id,
		`플래너 자동화를 시작했습니다.\n\n- 이슈: ${issueCode}\n- 제목: ${issueTitle}\n- 작업 디렉토리: \`${worktreePath}\`\n- PID: ${child.pid ?? 'unknown'}`,
	);

	child.once('exit', async (code) => {
		stdoutStream.end();
		stderrStream.end();
		activeAutomations.delete(issueLockKey);

		try {
			const finalMessage = await readFile(outputPath, 'utf8').catch(() => '');
			const statusLine = code === 0 ? '플래너 자동화가 완료되었습니다.' : `플래너 자동화가 실패했습니다. (exit: ${code ?? 'null'})`;
			await createLinearIssueComment(
				payload.data.id,
				`${statusLine}\n\n${finalMessage || '최종 메시지를 읽지 못했습니다.'}`,
			);
		} catch (error) {
			console.error(
				`[linear-webhook] failed to publish planner result for ${issueCode}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	});

	console.log(`[linear-webhook] planner session started for ${issueCode} (pid: ${child.pid ?? 'unknown'})`);
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
		{ cwd: repoRoot },
	);

	console.log(`[linear-webhook] merged PR for ${issueCode}: ${matchingPullRequest.url}`);
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

		if (isIssueDone(payload)) {
			await mergePullRequestForIssue(payload);
			await updateLinearIssueState(payload.data.id, payload.data.team.id, 'Done').catch(() => undefined);
		}
	} finally {
		setTimeout(() => processedEvents.delete(processedEventKey), 5 * 60 * 1000).unref?.();
	}
}

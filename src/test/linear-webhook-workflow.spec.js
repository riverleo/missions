import { describe, expect, it } from 'vitest';
import { __test__ } from '../../scripts/linear-webhook-workflow.js';

describe('linear webhook workflow comment formatting', () => {
	it('자동화 코멘트는 역할 프리픽스로 시작한다.', () => {
		const comment = __test__.buildStartStatusComment('planner');

		expect(comment.startsWith('[플래너] ')).toBe(true);
		expect(comment).toContain('[플래너] 플랜 작성을 시작했습니다.');
	});

	it('재플래닝 완료 코멘트는 역할 프리픽스를 유지한다.', () => {
		const comment = __test__.buildCompletionStatusComment('worker', 0, undefined, 'replan');

		expect(comment).toContain(
			'[플랫폼 엔지니어, 테스트 엔지니어] 수정 사항 반영 작업을 완료했습니다.'
		);
	});

	it('실패 코멘트는 오류 상세를 함께 남긴다.', () => {
		const comment = __test__.buildCompletionStatusComment('planner', 1, 'boom');

		expect(comment).toContain('[플래너] 작업이 실패했습니다.');
		expect(comment).toContain('boom');
	});
});

describe('linear webhook workflow replan comment detection', () => {
	it('사용자 코멘트 생성 이벤트는 재플래닝 대상으로 인식한다.', () => {
		const payload = {
			type: 'Comment',
			action: 'create',
			data: {
				body: '이 부분은 다시 수정해주세요.',
				issue: {
					identifier: 'OOA-11',
					title: '지형 타일을 제거',
					url: 'https://linear.app/ooaah/issue/OOA-11/slug',
					team: { id: 'team-1' },
				},
				issueId: 'issue-1',
			},
		};

		expect(__test__.isUserReplanComment(payload)).toBe(true);
		expect(__test__.getIssueCode(payload)).toBe('OOA-11');
		expect(__test__.getIssueId(payload)).toBe('issue-1');
		expect(__test__.getIssueTeamId(payload)).toBe('team-1');
	});

	it('자동화가 남긴 코멘트는 재플래닝 대상에서 제외한다.', () => {
		const payload = {
			type: 'Comment',
			action: 'create',
			data: {
				body: '[플래너] 플랜 작성을 완료했습니다.',
				issue: {
					identifier: 'OOA-11',
				},
			},
		};

		expect(__test__.isAutomationComment(payload)).toBe(true);
		expect(__test__.isUserReplanComment(payload)).toBe(false);
	});
});

describe('linear webhook workflow replan prompt', () => {
	it('재플랜 프롬프트는 기존 플랜 파일과 사용자 코멘트를 함께 전달한다.', () => {
		const prompt = __test__.buildReplanPrompt({
			payload: {
				type: 'Comment',
				action: 'create',
				url: 'https://linear.app/ooaah/issue/OOA-11/slug#comment-1',
				data: {
					body: '테스트 케이스를 더 추가해주세요.',
					issue: {
						identifier: 'OOA-11',
						title: '지형 타일을 제거',
						url: 'https://linear.app/ooaah/issue/OOA-11/slug',
					},
				},
			},
			planInfo: {
				relativePath: 'docs/plans/20260313030225_linear_webhook_comment_replanning.md',
			},
			worktreePath: '/tmp/missions-ooa-11',
			pullRequestUrl: 'https://github.com/riverleo/missions/pull/33',
		});

		expect(prompt).toContain(
			'기존 플랜 파일 docs/plans/20260313030225_linear_webhook_comment_replanning.md를 갱신한다.'
		);
		expect(prompt).toContain('테스트 케이스를 더 추가해주세요.');
		expect(prompt).toContain('https://github.com/riverleo/missions/pull/33');
	});
});

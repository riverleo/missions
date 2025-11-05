<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import WorldExclamationIcon from '@tabler/icons-svelte/icons/world-exclamation';
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon">
			<WorldExclamationIcon />
		</Empty.Media>
		<Empty.Title>세상을 놀라게 할 준비가 되셨습니까?</Empty.Title>
		<Empty.Description>
			여기에 뭔가 설득력 있는 문장을 넣어서 읽는 사람을 감동시키자.
		</Empty.Description>
	</Empty.Header>
	<Empty.Content>
		<Button variant="outline" size="sm">클릭해서 세상 놀라게 하기</Button>
	</Empty.Content>
</Empty.Root>

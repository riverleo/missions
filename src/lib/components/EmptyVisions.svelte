<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import CloudIcon from '@tabler/icons-svelte/icons/cloud';
	import { hasMissions } from '$lib/stores';
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon">
			<CloudIcon />
		</Empty.Media>
		<Empty.Title>Your vision is empty</Empty.Title>
		<Empty.Description>Ensure your vision and write it.</Empty.Description>
	</Empty.Header>
	<Empty.Content>
		<Button variant="outline" size="sm" onclick={() => ($hasMissions = true)}>
			Write your vision
		</Button>
	</Empty.Content>
</Empty.Root>

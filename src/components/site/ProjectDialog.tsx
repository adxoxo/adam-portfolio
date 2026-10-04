import { component$, useContext } from '@qwik.dev/core';
import { ProjectsCtx, SiteStateCtx } from './state';
import { ProjectContent } from './ProjectContent';
import { afterProjectClose, closeOnBackdrop } from './runtime/dialogs';

/** One shared dialog for every project, opened from cards, the list and the map. */
export const ProjectDialog = component$(() => {
	const state = useContext(SiteStateCtx);
	const projects = useContext(ProjectsCtx);
	const project = state.detailId ? projects.list.find((item) => item.id === state.detailId) : undefined;
	return (
		<dialog
			id="project-dialog"
			class="pd"
			aria-labelledby="pd-title"
			onClose$={(_, element) => afterProjectClose(state, element)}
			onClick$={(event, element) => closeOnBackdrop(event, element)}
		>
			{project && <ProjectContent key={project.id} project={project} />}
		</dialog>
	);
});

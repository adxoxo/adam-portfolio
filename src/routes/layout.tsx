import { component$, Slot } from '@qwik.dev/core';

// Public routes and the admin render their own chrome; this layout adds none.
export default component$(() => <Slot />);

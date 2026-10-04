import { component$ } from '@qwik.dev/core';
import { SERVICES, STACK } from '~/lib/data/services';
import { techIcon } from '~/lib/data/tech';

/** What Adam does and the stack he builds with. Kept quiet, after the work. */
export const About = component$(() => (
	<section class="section about" id="about" aria-labelledby="about-h">
		<div class="wrap">
			<div class="sec-head">
				<h2 id="about-h">what i do</h2>
				<p>full-stack, ai, cloud and embedded work, from the database to the device.</p>
			</div>
			<ol class="svc-list">
				{SERVICES.map((s, i) => (
					<li class="svc" key={s.title}>
						<span class="i" aria-hidden="true">
							{String(i + 1).padStart(2, '0')}
						</span>
						<h3>{s.title}</h3>
						<p>{s.desc}</p>
					</li>
				))}
			</ol>
			<div class="stack">
				<h3>the stack</h3>
				<div class="stack-groups">
					{STACK.map((g) => (
						<div class="stack-g" key={g.label}>
							<span class="gl">{g.label}</span>
							<ul class="logos" aria-label={g.label}>
								{g.items.map((item) => {
									const src = techIcon(item);
									return (
										<li key={item} title={item}>
											{src ? <img src={src} alt={item} width={18} height={18} loading="lazy" /> : item}
										</li>
									);
								})}
							</ul>
						</div>
					))}
				</div>
			</div>
		</div>
	</section>
));

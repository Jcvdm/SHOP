import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Increase timeout for serverless functions (PDF generation can take 1-2 minutes)
			// Vercel Pro allows up to 300 seconds (5 minutes)
			// Vercel Hobby allows up to 10 seconds (will need to upgrade for production)
			maxDuration: 300
		})
	}
};

export default config;

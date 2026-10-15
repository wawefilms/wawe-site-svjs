import { env } from '$env/dynamic/public';
import { siteConfiguration } from '$lib/seo/metadata';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ site: siteConfiguration(env) });

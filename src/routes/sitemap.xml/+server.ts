import { env } from '$env/dynamic/public';
import { getProjectCatalogue } from '$lib/server/payload';
import { sitemapResponse } from '$lib/seo/crawlers';

export const GET = () => sitemapResponse(env, getProjectCatalogue);

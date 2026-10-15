import { env } from '$env/dynamic/public';
import { robotsResponse } from '$lib/seo/crawlers';

export const GET = () => robotsResponse(env);

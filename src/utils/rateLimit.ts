import { supabaseAdmin } from '@/utils/supabaseClient';

export async function checkRateLimit(ip: string, limit: number = 10) {
    if (!supabaseAdmin) return { error: null, status: 200 };

    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabaseAdmin
            .from('analysis_logs')
            .select('*', { count: 'exact', head: true })
            .eq('ip_address', ip)
            .gte('created_at', oneHourAgo);

        if (countError) {
            console.error('Rate limit check error:', countError);
            return { error: null, status: 200 };
        }

        if (count !== null && count >= limit) {
            return {
                error: 'Rate limit exceeded. Please try again later.',
                status: 429
            };
        }

        return { error: null, status: 200 };
    } catch (e) {
        return { error: null, status: 200 };
    }
}
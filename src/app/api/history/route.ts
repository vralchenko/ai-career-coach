import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        const { data, error } = await supabaseAdmin
            .from('analysis_logs')
            .select('id, created_at, job_url, recommendations')
            .eq('ip_address', ip)
            .neq('job_url', 'PDF_EXPORT')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        const body = await req.json();
        const { id, clearAll } = body;

        let error;

        if (clearAll) {
            // Delete all records for this IP
            const result = await supabaseAdmin
                .from('analysis_logs')
                .delete()
                .eq('ip_address', ip);
            error = result.error;
        } else if (id) {
            // Delete specific record, ensuring it belongs to this IP
            const result = await supabaseAdmin
                .from('analysis_logs')
                .delete()
                .match({ id, ip_address: ip });
            error = result.error;
        } else {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (error) {
            console.error('Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        const response = await fetch(`http://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        const suggestions = data[1] || [];
        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Failed to fetch suggestions', error);
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}

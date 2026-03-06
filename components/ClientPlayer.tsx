'use client';

import dynamic from 'next/dynamic';

// Must live in a Client Component — ssr:false is only allowed in Client Components
const CustomPlayer = dynamic(() => import('./CustomPlayer'), { ssr: false });

export default function ClientPlayer() {
    return <CustomPlayer />;
}

'use client';

import Navbar from './Navbar';
import CustomPlayer from './CustomPlayer';
import { useVideoStore } from '@/store/useVideoStore';

export default function ClientPlayer() {
    const { isPlayerOpen } = useVideoStore();

    return (
        <>
            <Navbar />
            {isPlayerOpen && <CustomPlayer />}
        </>
    );
}

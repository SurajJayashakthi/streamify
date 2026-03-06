export default function SkeletonCard() {
    return (
        <div className="flex flex-col gap-3">
            {/* Thumbnail skeleton */}
            <div className="skeleton w-full aspect-video rounded-xl" />
            {/* Avatar + text row */}
            <div className="flex gap-3">
                <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                </div>
            </div>
        </div>
    );
}

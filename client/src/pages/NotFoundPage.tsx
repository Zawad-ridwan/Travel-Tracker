import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { buttonVariants, Stamp } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Stamp title="Lost" label="Error 404" caption="No such place" size="lg" rotate={-12} animate />
      <h1 className="mt-10 text-4xl font-semibold">This page went off the map</h1>
      <p className="mt-3 max-w-md text-lg text-muted">
        The link may be old, or the page may have moved. Let&apos;s get you back on route.
      </p>
      <Link to="/" className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
        <Compass /> Back to Explore
      </Link>
    </div>
  );
}

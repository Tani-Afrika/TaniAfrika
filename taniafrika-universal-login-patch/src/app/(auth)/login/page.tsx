import { AuthIllustration } from '@/components/auth/AuthIllustration';
import { UniversalLoginForm } from '@/components/auth/UniversalLoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#fbfdfa] sm:grid sm:place-items-center sm:p-6">
      {/* Mobile: full-height "native app" screen — image band + bottom sheet. */}
      {/* Desktop (sm+): a single compact centered card, image folded into it. */}
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden sm:min-h-0 sm:max-w-sm sm:rounded-[28px] sm:shadow-xl sm:shadow-emerald-950/10">
        <div className="relative h-[30vh] min-h-[180px] w-full shrink-0 sm:h-40">
          <AuthIllustration className="h-full w-full" />
          <span className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-[#1F5F3F] shadow-sm">
            T
          </span>
        </div>

        <div className="relative -mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-8 pt-6 sm:mt-0 sm:rounded-none sm:px-6 sm:pb-7">
          <UniversalLoginForm />
        </div>
      </div>
    </main>
  );
}

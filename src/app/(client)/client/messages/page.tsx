import { ClientIcon } from '@/components/client/ClientIcons';

export default function ClientMessagesPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#1F5F3F]">Communication</p><h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Messages</h1><p className="mt-2 text-sm text-[#6b7280]">Keep driver and support conversations organised.</p></div>
      <div className="grid min-h-[620px] overflow-hidden rounded-[28px] border border-[#C2E4D2] bg-white shadow-[0_16px_45px_rgba(31,95,63,.10)] lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-[#C2E4D2] lg:border-b-0 lg:border-r"><div className="p-5"><div className="relative"><ClientIcon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"/><input placeholder="Search conversations" className="w-full rounded-xl border border-[#C2E4D2] bg-[#F3FAF4] py-3 pl-9 pr-4 text-sm outline-none focus:border-[#1F5F3F] focus:ring-4 focus:ring-[#E8F5EE]" /></div></div><div className="border-t border-[#E8F5EE] p-4"><div className="rounded-2xl bg-[#E8F5EE] p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1F5F3F] text-white"><ClientIcon name="support" className="h-5 w-5" /></span><div><p className="text-sm font-black">TaniAfrika Support</p><p className="text-xs text-[#6b7280]">We are here to help.</p></div></div></div></div></aside>
        <section className="grid place-items-center bg-[#ffffff] p-8 text-center"><div className="max-w-sm"><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#E8F5EE] text-[#1F5F3F]"><ClientIcon name="message" className="h-8 w-8" /></span><h2 className="mt-5 text-xl font-black">Your conversations will appear here</h2><p className="mt-2 text-sm leading-6 text-[#6b7280]">When a driver is assigned, you can continue the delivery conversation from this workspace.</p></div></section>
      </div>
    </div>
  );
}

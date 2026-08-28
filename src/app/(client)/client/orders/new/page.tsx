import { NewOrderForm } from '@/components/client/NewOrderForm';

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#ef4d16]">New move request</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Book a truck</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7280]">
          Enter pickup, drop-off, and what you are moving so verified drivers can send reliable bids.
        </p>
      </div>
      <NewOrderForm />
    </div>
  );
}

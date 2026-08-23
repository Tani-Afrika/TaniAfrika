import { NewOrderForm } from '@/components/client/NewOrderForm';

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#ef4d16]">New delivery request</p><h1 className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">Send a parcel</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7280]">Enter accurate route and parcel details so verified drivers can send reliable bids.</p></div>
      <NewOrderForm />
    </div>
  );
}

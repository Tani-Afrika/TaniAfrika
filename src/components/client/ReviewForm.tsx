'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { submitClientReview } from '@/lib/actions/client-order-detail';
import type { ClientReview } from '@/lib/actions/client-order-detail';

interface ReviewFormProps {
  orderId: string;
  existingReview: ClientReview | null;
  orderCompleted: boolean;
}

const RATINGS = [1, 2, 3, 4, 5] as const;

export default function ReviewForm({ orderId, existingReview, orderCompleted }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(existingReview?.rating ?? null);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSelectRating = (value: number) => {
    setRating(value);
    setErrorMessage('');
  };

  const handleSubmit = () => {
    if (rating == null) {
      setErrorMessage('Choose a rating from 1 to 5.');
      return;
    }

    setErrorMessage('');

    startTransition(async () => {
      const result = await submitClientReview(orderId, rating, comment);

      if (!result.success) {
        setErrorMessage(result.error ?? 'Could not save this rating.');
        return;
      }

      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-trust-600">Rate this trip</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-ink-900">
        {existingReview ? 'Your rating' : 'How was the driver?'}
      </h2>
      {!orderCompleted ? (
        <p className="mt-2 text-sm leading-6 text-ink-600">
          You can choose a rating now. The database only saves it after payout marks the trip completed.
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-ink-600">Ratings are 1 to 5. A short comment is optional.</p>
      )}

      <div role="radiogroup" aria-label="Driver rating from 1 to 5" className="mt-4 flex flex-wrap gap-2">
        {RATINGS.map((value) => {
          const selected = rating === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${value} out of 5`}
              onClick={() => handleSelectRating(value)}
              className={`grid h-11 w-11 place-items-center rounded-lg border text-sm font-semibold transition ${
                selected
                  ? 'border-trust-600 bg-trust-600 text-white'
                  : 'border-ink-400/25 bg-white text-ink-800 hover:border-trust-200 hover:text-trust-700'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>

      <label htmlFor="review-comment" className="mt-4 block text-xs font-medium text-ink-500">
        Comment (optional)
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={2000}
        rows={3}
        className="mt-1 w-full rounded-lg border border-ink-400/30 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-trust-600 focus:ring-2 focus:ring-trust-100"
      />

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {existingReview && orderCompleted ? (
        <p className="mt-3 text-xs text-ink-500">Saved as {existingReview.rating} out of 5. You can update it.</p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || rating == null}
        className="mt-4 rounded-lg bg-trust-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-trust-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Saving…' : existingReview ? 'Update rating' : 'Save rating'}
      </button>
    </section>
  );
}

export default function AdsMeasurementChoice({ consent, onChoose }) {
  const allowed = consent?.choice === 'granted' && consent?.optOut !== true;
  const refused = consent?.optOut === true;
  return (
    <section className="mt-4 rounded-3xl border border-primary/10 bg-white p-5 text-sm">
      <h2 className="text-base font-bold">Google Ads measurement</h2>
      <p className="mt-2 text-text/70">
        This is off until you allow it. Allowing reports this new membership only.
        The report is the transaction id and the membership dues. It does not include your name, email, phone, or address.
        Patron and donations are not included.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="min-h-12 rounded-full bg-primary-text px-4 font-semibold text-white" onClick={() => onChoose('granted')}>
          Allow this report
        </button>
        <button type="button" className="min-h-12 rounded-full border border-primary/20 px-4 font-semibold" onClick={() => onChoose('denied')}>
          Don&apos;t allow
        </button>
      </div>
      <p className="mt-2 text-text/60">
        {allowed ? 'Allowed on this browser. You can turn it off.' : refused ? 'Turned off on this browser.' : 'Not allowed yet.'}
      </p>
    </section>
  );
}

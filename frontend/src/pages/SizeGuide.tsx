export default function SizeGuide() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
      <h1 className="font-display text-4xl text-brand-900 font-semibold mb-6">Size Guide</h1>
      <p className="text-base text-brand-600 leading-relaxed mb-4">
        Find the right fit with MAISON’s size guide. We recommend choosing your normal size for a tailored yet comfortable fit.
      </p>
      <p className="text-base text-brand-600 leading-relaxed mb-4">
        If you are between sizes, size up for a relaxed look or size down for a more fitted silhouette.
      </p>
      <div className="mt-8 space-y-6">
        <div>
          <h2 className="font-semibold text-xl text-brand-900 mb-2">How to measure</h2>
          <ul className="list-disc list-inside text-base text-brand-600 leading-relaxed space-y-2">
            <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape level.</li>
            <li><strong>Waist:</strong> Measure at your natural waistline, just above the belly button.</li>
            <li><strong>Hips:</strong> Measure around the fullest part of your hips while standing naturally.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-xl text-brand-900 mb-2">MAISON fit notes</h2>
          <p className="text-base text-brand-600 leading-relaxed">
            Our pieces are designed for modern tailoring with comfort in mind. Knitwear and relaxed trousers are cut for ease, while jackets and shirts offer a sharper line.
          </p>
          <p className="text-base text-brand-600 leading-relaxed mt-2">
            For a more relaxed silhouette, choose the larger size when you are between measurements. For a closer fit, take the smaller size.
          </p>
        </div>
      </div>
    </div>
  );
}

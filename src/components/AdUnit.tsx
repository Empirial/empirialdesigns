import { useEffect } from 'react';

const AdUnit = () => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-fr-a+1o-66+9e"
        data-ad-client="ca-pub-8293305741444500"
        data-ad-slot="8138223007"
      />
    </div>
  );
};

export default AdUnit;

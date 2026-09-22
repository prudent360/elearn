'use client';

import { useEffect, useState } from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

type Price = {key:'pro-monthly'|'pro-yearly';unitAmount:number;currency:string;interval:'month'|'year'};
const zeroDecimal = new Set(['BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF']);
function formatted(price:Price){return new Intl.NumberFormat(undefined,{style:'currency',currency:price.currency,maximumFractionDigits:zeroDecimal.has(price.currency.toUpperCase())?0:2}).format(price.unitAmount/(zeroDecimal.has(price.currency.toUpperCase())?1:100))}

export default function PricingPage() {
  const { billing, api, startCheckout, openBillingPortal } = useLearning();
  const [annual, setAnnual] = useState(true);
  const [prices,setPrices]=useState<Price[]>([]);
  const [priceError,setPriceError]=useState('');
  useEffect(()=>{let current=true;void api('billing/plans').then(result=>{if(current)setPrices(result.plans||[])}).catch(()=>{if(current)setPriceError('Plan prices are temporarily unavailable.')});return()=>{current=false}},[billing.configured]);
  const pro = billing.plan === 'pro';
  const monthly=prices.find(price=>price.key==='pro-monthly');const yearly=prices.find(price=>price.key==='pro-yearly');
  const chosen=annual?yearly:monthly;
  const savings=monthly&&yearly&&monthly.currency===yearly.currency?Math.max(0,Math.round((1-yearly.unitAmount/(monthly.unitAmount*12))*100)):0;
  return <div className="pricing-page">
    <header className="pricing-hero">
      <span className="eyebrow"><Sparkles size={15}/> Simple membership</span>
      <h1>Learn deeply, at your own pace.</h1>
      <p>Start with the free foundation course. Upgrade when you are ready for the full library, projects, and instructor feedback.</p>
      <div className="billing-toggle" aria-label="Billing period"><button className={!annual?'active':''} onClick={()=>setAnnual(false)}>Monthly</button><button className={annual?'active':''} onClick={()=>setAnnual(true)}>Yearly {savings>0&&<span>Save {savings}%</span>}</button></div>
    </header>
    <div className="pricing-grid">
      <article className="price-card surface"><div><span className="plan-label">Free</span><h2>Build your foundation</h2><p className="price"><strong>£0</strong><span>forever</span></p></div><ul><li><Check/> Foundation course</li><li><Check/> Notes and progress tracking</li><li><Check/> Community access</li></ul><button className="btn btn-secondary" disabled>{pro ? 'Included with Pro' : 'Your current plan'}</button></article>
      <article className="price-card featured surface"><div><span className="plan-label">Pro</span><h2>Unlock the full academy</h2><p className="price"><strong>{chosen?formatted(chosen):'—'}</strong><span>{chosen?`/ ${chosen.interval}`:'Price available when billing opens'}</span></p></div><ul><li><Check/> Every course and future release</li><li><Check/> Practical assignments and feedback</li><li><Check/> Certificates and live classes</li><li><Check/> Cancel from the billing portal</li></ul>{pro?<button className="btn btn-primary" onClick={()=>void openBillingPortal()}>Manage membership</button>:<button className="btn btn-primary" disabled={!billing.configured||!chosen} onClick={()=>void startCheckout(annual?'pro-yearly':'pro-monthly')}>{chosen?'Choose Pro':'Payments coming soon'}</button>}</article>
    </div>
    {priceError&&<p className="backend-error" role="status">{priceError}</p>}
    <p className="billing-trust"><ShieldCheck size={17}/> Secure checkout and subscription management are handled by Stripe. Payment details never touch this application.</p>
  </div>;
}

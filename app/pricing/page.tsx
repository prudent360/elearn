'use client';

import { useState } from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { useLearning } from '@/context/LearningContext';

export default function PricingPage() {
  const { billing, startCheckout, openBillingPortal } = useLearning();
  const [annual, setAnnual] = useState(true);
  const pro = billing.plan === 'pro';
  return <div className="pricing-page">
    <header className="pricing-hero">
      <span className="eyebrow"><Sparkles size={15}/> Simple membership</span>
      <h1>Learn deeply, at your own pace.</h1>
      <p>Start with the free foundation course. Upgrade when you are ready for the full library, projects, and instructor feedback.</p>
      <div className="billing-toggle" aria-label="Billing period"><button className={!annual?'active':''} onClick={()=>setAnnual(false)}>Monthly</button><button className={annual?'active':''} onClick={()=>setAnnual(true)}>Yearly <span>Save 20%</span></button></div>
    </header>
    <div className="pricing-grid">
      <article className="price-card surface"><div><span className="plan-label">Free</span><h2>Build your foundation</h2><p className="price"><strong>£0</strong><span>forever</span></p></div><ul><li><Check/> Foundation course</li><li><Check/> Notes and progress tracking</li><li><Check/> Community access</li></ul><button className="btn btn-secondary" disabled>{pro ? 'Included with Pro' : 'Your current plan'}</button></article>
      <article className="price-card featured surface"><div className="popular-badge">Most popular</div><div><span className="plan-label">Pro</span><h2>Unlock the full academy</h2><p className="price"><strong>{annual?'£15':'£19'}</strong><span>/ month{annual?', billed yearly':''}</span></p></div><ul><li><Check/> Every course and future release</li><li><Check/> Practical assignments and feedback</li><li><Check/> Certificates and live classes</li><li><Check/> Cancel from the billing portal</li></ul>{pro?<button className="btn btn-primary" onClick={()=>void openBillingPortal()}>Manage membership</button>:<button className="btn btn-primary" disabled={!billing.configured} onClick={()=>void startCheckout(annual?'pro-yearly':'pro-monthly')}>{billing.configured?'Choose Pro':'Payments coming soon'}</button>}</article>
    </div>
    <p className="billing-trust"><ShieldCheck size={17}/> Secure checkout and subscription management are handled by Stripe. Payment details never touch this application.</p>
  </div>;
}

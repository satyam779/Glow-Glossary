import { useSearchParams } from 'react-router';
import { Chat, Instagram, Mail, MapPin } from '../components/Icons';
import ContactForm from '../components/watermelon/ContactForm';
import ContactMethods from '../components/watermelon/ContactMethods';
import '../components/watermelon/watermelon.css';
import { ADDRESS, CONTACT, CONTACT_EMAIL, INSTAGRAM, PHONE_DISPLAY, WHATSAPP } from '../content';
import PageShell from './PageShell';

export default function ContactPage() {
  const [params] = useSearchParams();
  const mailto = `mailto:${CONTACT_EMAIL}`;

  const methods = [
    {
      id: 'email',
      icon: Mail,
      title: 'Email us',
      description: 'Send us your questions, feedback or partnership ideas and we’ll get back to you.',
      details: CONTACT_EMAIL,
      href: mailto,
      linkLabel: 'Write to us',
    },
    {
      id: 'chat',
      icon: Chat,
      title: 'Chat with us',
      description: 'Message us on WhatsApp for quick help with orders, products and brewing.',
      details: PHONE_DISPLAY,
      href: WHATSAPP,
      linkLabel: 'Open WhatsApp',
      external: true,
    },
    {
      id: 'visit',
      icon: MapPin,
      title: 'Visit us',
      description: ADDRESS.company,
      details: ADDRESS.lines.map((l) => (
        <span key={l} className="wm-line">
          {l}
        </span>
      )),
      href: ADDRESS.maps,
      linkLabel: 'Get directions',
      external: true,
    },
  ];

  return (
    <PageShell title="Contact us" className="contactpage">
      <ContactForm
        badge={CONTACT.badge}
        headline={CONTACT.headline}
        headlineAccent={CONTACT.accent}
        subheadline={CONTACT.sub}
        contactInfo={{ email: CONTACT_EMAIL, emailHref: mailto, phone: PHONE_DISPLAY, phoneHref: WHATSAPP }}
        ctaLabel={CONTACT.cta}
        initialTopic={params.get('topic') || ''}
      />

      <ContactMethods badge={CONTACT.methodsBadge} heading={CONTACT.methodsHeading} methods={methods} footerText={CONTACT.methodsFooter} />

      <a className="ig-band" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
        <Instagram />
        <span>
          Follow the ritual on Instagram <b>@Glow_Glossary</b>
        </span>
      </a>
    </PageShell>
  );
}

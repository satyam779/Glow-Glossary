// All site copy, images and links in one place, so the words can change without touching layout code.
// Product names, prices, descriptions, recipe, reviews, press, cafe partners and photos all come
// from glowglossary.com (checked 23 Oct 2026).

// The store says the matcha comes from family farms in Shizuoka. (The new tin and box artwork
// says Kagoshima; that's worth fixing on the packaging.) This drives the copy and the label on
// the 3D tin.
export const ORIGIN = { region: 'Shizuoka' };

export const STORE = 'https://glowglossary.com';
export const CONTACT_EMAIL = 'contact@glowglossary.in';
export const WHATSAPP_NUMBER = '919810155476';
export const whatsappLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
export const WHATSAPP = whatsappLink('Hi Glow Glossary, I have a query regarding your products 🍵');
export const INSTAGRAM = 'https://www.instagram.com/glow_glossary/';
export const PROMO = { code: 'WELCOME10', text: 'Use code WELCOME10 for 10% off' };

export const NAV = {
  links: [
    { label: 'Shop', to: '/shop' },
    { label: 'Our story', to: '/our-story' },
    { label: 'Rituals', to: '/rituals' },
    { label: 'Contact', to: '/contact' },
  ],
};

export const HERO = {
  lines: ['Shade-grown calm,', 'stone-ground'],
  accent: 'glow.',
};

export const PRESS = {
  headline: 'As seen on Shark Tank India',
  label: 'and in',
  logos: [
    { src: '/images/press/vogue.png', name: 'Vogue' },
    { src: '/images/press/elle.png', name: 'Elle' },
    { src: '/images/press/grazia.png', name: 'Grazia' },
    { src: '/images/press/bazaar.png', name: "Harper's Bazaar" },
    { src: '/images/press/femina.png', name: 'Femina' },
    { src: '/images/press/financial-express.png', name: 'The Financial Express' },
    { src: '/images/press/pinkvilla.png', name: 'Pinkvilla' },
    { src: '/images/press/times-now.png', name: 'Times Now' },
    { src: '/images/press/news18.png', name: 'News18' },
  ],
};

export const STORY = {
  num: '01',
  title: ['It began with', 'a friendship and', 'a cup of matcha'],
  copy:
    'Our founder, Pratishtha Rawat, was introduced to matcha by her Japanese friend Linh. For Linh it was a daily ritual of slowing down, not a trend. Years later, on her own wellness journey, Pratishtha went looking for clean, organic alternatives and brought that ritual home to India.',
  photo: { src: '/images/founder.webp', alt: 'Pratishtha Rawat, founder of Glow Glossary, sipping an iced matcha', caption: 'Pratishtha Rawat · Founder' },
  facts: [
    { k: "India's first", v: 'Matcha Bar' },
    { k: 'Workshops', v: '& pop-ups' },
    { k: 'Wellness', v: 'retreats' },
  ],
};

export const CRAFT = {
  num: '02',
  title: ['Shade-grown.', 'Stone-ground.', 'Never bitter.'],
  copy:
    'Our leaves come from named, multi-generational family farms in Shizuoka, a region that has been perfecting tea for over 400 years. They are shaded for about three weeks, hand-picked at the first harvest and stone-ground in small batches. Just one ingredient: the whole leaf.',
  points: [
    { k: 'Ceremonial grade A', v: 'First harvest only, when the leaves are at their best.' },
    { k: 'USDA + JAS organic', v: "Certified by the US and by Japan's own, stricter seal." },
    { k: 'Lab tested', v: 'Every batch, before it reaches you.' },
  ],
  photo: { src: '/images/farm.webp', alt: 'The Glow Glossary founders with their tea farmers in Japan', caption: 'With our growers' },
};

export const COMPARE = {
  eyebrow: 'Choose better. Feel better.',
  title: 'Not just green powder',
  ours: 'GG Matcha',
  theirs: 'Others',
  rows: [
    ['Bright, vivid green', 'Dull yellow-brown'],
    ['Naturally sweet', 'Bitter'],
    ['Smooth texture', 'Grainy texture'],
    ['Named family farms', 'Mass factory produced'],
    ['USDA + JAS organic', 'Often uncertified'],
    ['Lab tested, every batch', 'Mystery blends'],
  ],
};

export const RITUAL = {
  num: '03',
  title: ['Ready in', 'five minutes'],
  copy: 'No skill required. This is how we make ours.',
  steps: [
    { icon: 'scoop', title: 'Scoop', text: 'Take 2 g of GG Matcha, about half a teaspoon.' },
    { icon: 'whisk', title: 'Whisk', text: 'Add 30 ml (one shot glass) of warm water, not boiling. Whisk in a zig-zag until frothy.' },
    { icon: 'base', title: 'Base', text: 'Add 4 ice cubes to a glass, then your milk of choice, coconut water or any base you like.' },
    { icon: 'pour', title: 'Pour', text: 'Pour the matcha over the top for a layered look. Stir and enjoy.' },
  ],
};

export const SHOP = {
  num: '04',
  title: ['Bring home', 'the glow'],
  // The featured product on the home page; name, price and photos come from the catalogue.
  featuredSlug: 'gg-matcha-green',
  featuredPoints: [
    'Organic ceremonial grade A, first harvest',
    'USDA + JAS certified',
    'One ingredient: the whole leaf',
    'Free shipping',
  ],
  rating: { score: '4.7', count: 31 },
  cta: 'Add to bag',
  secondary: 'Questions? WhatsApp us',
  banner: {
    wide: '/images/banner-wide.webp',
    tall: '/images/banner-tall.webp',
    alt: "India's favourite matcha: clean energy, no crash. Glow Glossary organic ceremonial grade matcha.",
    to: '/shop',
  },
  rangeTitle: 'The full range',
  all: { label: 'Shop all', to: '/shop' },
};

export const COMMUNITY = {
  title: 'Hear from our community',
  summary: '4.68 out of 5 from 31 reviews',
  quotes: [
    { text: 'Finally, a matcha that isn’t bitter.', name: 'Ishita R.' },
    { text: 'Worth every rupee.', name: 'Devika M.' },
    { text: 'Converted my whole family.', name: 'Sana P.' },
    { text: 'Smooth as hell!', name: 'Shivangi S.' },
    { text: 'The packaging, the colour, the taste.', name: 'Naina K.' },
    { text: 'Yummy, smooth matcha with no grassiness!', name: 'Mia' },
    { text: 'My afternoons make sense again.', name: 'Tarun V.' },
    { text: 'My top choice for matcha!', name: 'Pranav M.' },
  ],
  photos: [
    { src: '/images/friends.webp', alt: 'Three friends in pyjamas sharing iced matcha. Where wellness is a way of life.', wide: true },
    { src: '/images/community.webp', alt: 'A Glow Glossary wellness session with a crowd on yoga mats' },
    { src: '/images/powder-jar.webp', alt: 'Bright green GG Matcha powder in a jar with a wooden spoon' },
  ],
  partnersLabel: 'Poured at our cafe partners',
  partners: [
    { src: '/images/partners/soho-house.png', name: 'Soho House' },
    { src: '/images/partners/araku-coffee.png', name: 'Araku Coffee' },
    { src: '/images/partners/fig.png', name: 'Fig' },
    { src: '/images/partners/harajuku.png', name: 'Harajuku' },
    { src: '/images/partners/perch.png', name: 'Perch Wine & Coffee Bar' },
  ],
};

export const FOOTER = {
  title: 'Ready to glow?',
  cta: 'Shop the tin',
  brand: 'Glow Glossary',
  tagline: 'Wellness from India, matcha from Japan.',
  hours: 'Mon–Fri, 9am–5pm IST',
  columns: [
    [
      { label: 'Shop all', href: '/shop' },
      { label: 'Our story', href: '/our-story' },
      { label: 'Rituals', href: '/rituals' },
      { label: 'Bulk inquiries', href: '/contact?topic=wholesale' },
    ],
    [
      { label: 'FAQ', href: '/rituals#faq' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Instagram', href: INSTAGRAM },
    ],
  ],
  legal: 'Glow Glossary Pvt. Ltd.',
};

// ---------------------------------------------------------------------------
// Inner pages (copy from glowglossary.com: About Us, FAQ, Shipping Policy, Contact)
// ---------------------------------------------------------------------------

export const PHONE_DISPLAY = '+91 98101 55476';
export const ADDRESS = {
  company: 'Glow Glossary Private Limited',
  lines: ['Khasra no. 988, 989, Opp. Jaintube Company', 'Meerut Road, Ghaziabad', 'Uttar Pradesh 201003'],
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Khasra no. 988, 989, Opp. Jaintube Company, Meerut Road, Ghaziabad, Uttar Pradesh 201003'
  )}`,
};

export const OUR_STORY = {
  eyebrow: 'Our founder’s story',
  title: 'Where matcha met',
  accent: 'a mission',
  lede: 'It all began with a friendship and a cup of matcha.',
  founder: { name: 'Pratishtha Rawat', role: 'Founder, Glow Glossary', photo: '/images/founder.webp' },
  story: [
    'When our founder, Pratishtha Rawat, met her best friend Linh, who is Japanese, she was introduced to the world of matcha: not just as a drink, but as a ritual deeply rooted in mindfulness and wellness. That introduction sparked a lifelong passion.',
    'After moving to the U.S. and living there for over six years, Pratishtha developed a wellness routine that blended ancient traditions with modern lifestyle habits. As an international health practitioner with a deep love for fitness and holistic well-being, she found herself drawn to the power of intentional living. Her thyroid healing journey inspired her to turn to organic, clean alternatives, and to truly understand their benefits.',
    'The brand leaves no stone unturned when it comes to educating its audience about what clean, organic products can do. GG’s carefully curated range includes ceremonial and culinary matcha sourced directly from Japan.',
    'The vision took its next step when Pratishtha met Kavya. Their shared passion for wellness and authenticity brought them together. Today they are partners in Glow Glossary, helping people embrace their glow from the inside out and making wellness accessible and enjoyable for everyone.',
  ],
  quote: 'With Glow Glossary, you don’t just use a product, you invest in a lifestyle that celebrates beauty, health and mindful living.',
  values: ['Holistic wellness', 'Health practitioner', 'Clean living', 'Mindful rituals', 'Japan-sourced matcha'],
  facts: [
    { k: '6+ years', v: 'of wellness practice in the U.S.' },
    { k: 'Shizuoka', v: 'family farms we source from' },
    { k: 'India’s first', v: 'Matcha Bar' },
  ],
  chapters: [
    {
      num: '01',
      title: 'How we source',
      body: [
        'Our matcha comes directly from organic, family-run farms in Shizuoka, Japan, where tea cultivation dates back centuries.',
        'The leaves are shade-grown for three weeks, hand-picked during the first harvest and stone-ground in small batches to keep them pure. Each step honours Japanese tradition and modern wellness, to give you ceremonial-grade matcha at its best.',
      ],
      photo: { src: '/images/farm.webp', alt: 'The Glow Glossary founders with their tea farmers in Japan' },
    },
    {
      num: '02',
      title: 'What’s inside',
      body: [
        'Just one ingredient: 100% pure, organic, ceremonial-grade Japanese matcha. No fillers. No sweeteners. No preservatives.',
        'Only the finest shade-grown tencha leaves, stone-ground into a vibrant, antioxidant-rich powder.',
      ],
      list: [
        'A clean, focused energy boost',
        'Chlorophyll and EGCG, for skin that glows',
        'Antioxidants that fight free radicals',
        'Calm focus from L-theanine',
      ],
      photo: { src: '/images/powder-jar.webp', alt: 'Bright green GG Matcha powder in a jar with a wooden spoon' },
    },
    {
      num: '03',
      title: 'Community building',
      body: [
        'Glow Glossary has always been more than a product. It’s a feeling, a lifestyle and, most of all, a community.',
        'From matcha-making workshops and mindful mornings to India’s first Matcha Bar, everything we create is designed to bring people together. Whether you’re sipping with us at a city pop-up, journaling at a wellness retreat or dancing at a café takeover, we’re there to share moments, not just matcha.',
      ],
      photo: { src: '/images/community.webp', alt: 'A Glow Glossary wellness session with a crowd on yoga mats' },
    },
  ],
};

export const RITUALS = {
  eyebrow: 'Rituals',
  title: 'Five minutes,',
  accent: 'no skill required.',
  lede: 'Matcha is the whole leaf, ground fine and whisked into water, so you drink all of it. Here’s everything you need to make a smooth, frothy, never-bitter cup at home.',
  tools: [
    { title: 'Bamboo whisk', text: 'Its fine tines break up the powder and whip in air for a silky foam. Whisk in a zig-zag, not in circles.' },
    { title: 'Bamboo scoop', text: 'The traditional spoon for measuring out your matcha, a little at a time.' },
    { title: 'Matcha bowl', text: 'A wide bowl leaves room to whisk properly and build a fine, even foam.' },
  ],
  recipes: [
    {
      id: 'iced-latte',
      name: 'Iced matcha latte',
      note: 'Our everyday favourite',
      photo: '/images/box-latte.webp',
      chips: ['2 g matcha', '30 ml warm water', '4 ice cubes', 'Milk of choice'],
      steps: [
        { icon: 'scoop', title: 'Scoop', text: 'Take 2 g of GG Matcha, about half a teaspoon, into a bowl or cup.' },
        { icon: 'whisk', title: 'Whisk', text: 'Add 30 ml (one shot glass) of warm water, not boiling. Whisk in a zig-zag until smooth and frothy.' },
        { icon: 'base', title: 'Base', text: 'Add 4 ice cubes to a glass, then your milk of choice, coconut water or any base you like.' },
        { icon: 'pour', title: 'Pour', text: 'Pour the whisked matcha over the top for a layered look. Stir and enjoy.' },
      ],
    },
    {
      id: 'classic',
      name: 'Classic matcha',
      note: 'Creamy and made in the bowl',
      photo: '/images/lineup-mango.webp',
      chips: ['1.5–2 g matcha', '30–40 ml water at 60–80 °C', '1 cup milk or water'],
      steps: [
        { icon: 'scoop', title: 'Scoop', text: 'Add 1.5–2 g of GG Matcha from the jar into your bowl.' },
        { icon: 'whisk', title: 'Whisk', text: 'Pour in 30–40 ml of warm water (60–80 °C) and whisk in a zig-zag motion, not round, until frothy.' },
        { icon: 'base', title: 'Top up', text: 'Add a cup of milk of your choice, or water. Top up with ice if you like it cold.' },
        { icon: 'pour', title: 'Sweeten', text: 'If you like, stir in a teaspoon of honey or jaggery syrup. No jitters, just glow.' },
      ],
    },
  ],
  tips: [
    { title: 'Warm, never boiling', text: 'Bitterness usually comes from old, low-grade or overheated matcha. Warm water keeps it smooth.' },
    { title: 'Zig-zag, not circles', text: 'Whisk briskly from side to side. It breaks up clumps and builds a fine, even foam.' },
    { title: 'Sweeten with liquids', text: 'Honey, maple syrup, jaggery or monk fruit blend better than sugar, which settles at the bottom.' },
    { title: 'Keep it cool', text: 'Store your matcha sealed, away from light and heat. In the Indian climate, the fridge is best.' },
  ],
  faq: [
    {
      q: 'How is matcha different from regular green tea?',
      a: 'With regular green tea, the leaves are steeped and thrown away. Matcha is the whole leaf, ground into a fine powder, so you drink all of it. That gives it a richer flavour, more antioxidants and a smoother, longer-lasting energy boost.',
    },
    {
      q: 'Where is your matcha sourced from?',
      a: 'Shizuoka, one of Japan’s most celebrated tea-growing regions, known for its nutrient-rich soil, pristine water and ideal climate. Matcha from here is loved for its smooth, balanced flavour with subtle umami and no bitterness, which makes it great for beginners and everyday drinkers alike.',
    },
    { q: 'What grade of matcha do you use?', a: '100% USDA Organic, ceremonial grade A matcha, for a smooth, vibrant and non-bitter cup.' },
    {
      q: 'Does matcha contain caffeine?',
      a: 'Yes, but usually much less than coffee: a serving has around 70 mg, compared with about 90–120 mg in a cup of coffee. Matcha also contains L-theanine, an amino acid that helps the caffeine feel calm and focused, without the jitters or crash.',
    },
    { q: 'How much matcha should I use?', a: 'About 2 g, roughly half a teaspoon, per serving. A 30 g tin or pouch makes about 15 servings.' },
    { q: 'How should I store matcha?', a: 'Keep it tightly sealed in a cool, dry place away from sunlight. For the Indian climate, the fridge is best. Always use a clean, dry spoon.' },
    {
      q: 'What’s the difference between Matcha and Matcha Collagen?',
      a: 'GG Matcha is pure organic ceremonial grade A matcha for a clean, energising daily ritual. Matcha Collagen combines our matcha with Wellbeing Nutrition’s marine collagen for added beauty-from-within support for skin, hair and nails, with the same smooth energy.',
    },
    {
      q: 'Why is your Matcha Collagen non-vegetarian?',
      a: 'It contains marine collagen, which is sourced from fish. Because collagen is an animal-derived protein, the product is non-vegetarian.',
    },
    {
      q: 'Can I drink matcha every day?',
      a: 'Yes. Most people enjoy one or two servings a day. If you’re new to matcha or sensitive to caffeine, start with one serving and see how your body responds.',
    },
  ],
  kitSlug: 'matcha-ritual-kit',
  shopSlugs: ['matcha-ritual-kit', 'gg-matcha-green', 'gg-matcha'],
};

export const CONTACT = {
  badge: 'Get in touch',
  headline: 'Let’s talk',
  accent: 'matcha.',
  sub: 'Questions about an order, bulk and wholesale, café partnerships, workshops or press: send us a note and the team will get back to you.',
  cta: 'Send message',
  methodsBadge: 'Other ways to reach us',
  methodsHeading: 'We’re here to help',
  methodsFooter: 'Our team is around Monday to Friday, 9am–5pm IST.',
};

export const SHIPPING_POLICY = {
  title: 'Shipping policy',
  intro: 'At Glow Glossary, we want your matcha ritual to reach you as quickly and safely as possible. Here’s everything you need to know about how we ship.',
  sections: [
    { h: 'Where we ship', p: ['We currently ship within India only. We don’t offer international shipping at this time.'] },
    {
      h: 'Order processing',
      p: [
        'Orders are dispatched within 24 hours of being placed, excluding Sundays and public holidays. Once your order ships, you’ll get your tracking details by email, SMS or WhatsApp.',
      ],
    },
    {
      h: 'Shipping charges',
      p: ['Shipping is free across India on every order, with no minimum order value.', 'Cash on delivery orders carry a ₹50 handling fee, added at checkout.'],
    },
    {
      h: 'Delivery time',
      p: [
        'Orders usually arrive within 3 business days of dispatch. Remote and non-metro PIN codes may take a little longer. Your estimated arrival is shared with your tracking information.',
      ],
    },
    {
      h: 'Incorrect address or failed delivery',
      p: [
        'Please make sure your address and phone number are accurate and complete at checkout. If a shipment comes back to us because of an incorrect address, an unavailable recipient or a refused cash-on-delivery order, we’ll get in touch to arrange a re-dispatch. Re-shipping charges may apply.',
      ],
    },
    {
      h: 'Delayed or missing deliveries',
      p: ['If your order hasn’t arrived within 7 days of dispatch, email us at contact@glowglossary.in with your order details and we’ll help you sort it out.'],
    },
    {
      h: 'Damaged or defective items',
      p: [
        'Please check your parcel as soon as it arrives. If anything is damaged, defective or tampered with, contact us straight away with photos of the outer packaging and the product, and we’ll make it right.',
      ],
    },
  ],
};

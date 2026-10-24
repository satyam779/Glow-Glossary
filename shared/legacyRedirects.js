// Old Shopify URLs on glowglossary.com -> pages on this site, so existing links, bookmarks and
// search results keep working after the switch. The server answers these with a 301.
export const LEGACY_REDIRECTS = {
  '/pages/about-us': '/our-story',
  '/pages/contact': '/contact',
  '/pages/faq': '/rituals#faq',
  '/pages/wholesale': '/contact?topic=wholesale',
  '/collections/all': '/shop',
  '/collections/all-products': '/shop',
  '/collections/matcha-kit': '/shop?category=kits',
  '/products/gg-matcha-copy': '/shop/gg-matcha',
  '/products/gg-matcha-green': '/shop/gg-matcha-green',
  '/products/matcha-kit': '/shop/matcha-ritual-kit',
  '/products/matcha-collagen': '/shop/matcha-collagen',
  '/products/the-collagen-ritual-set': '/shop/collagen-ritual-kit',
  '/products/matcha-duo': '/shop/matcha-duo',
  '/products/glow-on-the-go-1': '/shop/glow-on-the-go',
  '/about': '/our-story',
  '/ritual': '/rituals',
};

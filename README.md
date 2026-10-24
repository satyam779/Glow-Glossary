# Glow Glossary: storefront + admin

A full-stack shop for Glow Glossary matcha:

- **Storefront** (React): the 3D landing page, a shop with filters, product pages with galleries, a cart, checkout (cash on delivery) and order confirmation pages.
- **Pages**: Our story (`/our-story`), Rituals with recipes and FAQ (`/rituals`), Contact with a message form (`/contact`), and Shipping policy (`/shipping`). Old glowglossary.com links such as `/pages/about-us` redirect to the new pages.
- **Admin** at `/admin`: dashboard, products (create, edit, hide, feature, delete), photo upload with drag-to-reorder, orders with status updates, contact-form messages, and promo codes.
- **API** (Node.js + Express): prices every order on the server, checks stock, validates everything, and protects the admin with signed, http-only cookies.
- **Supabase**: Postgres for products, orders, promo codes and messages; Storage for product photos; Auth for admin logins.

Without Supabase keys the app runs in **local mode**: the same features, with data in `data/db.json` and photos in `data/uploads/`. That's handy for development, but use Supabase for the live site.

```
client/        React app (Vite): pages, components, admin, 3D scene
server/        Express API: routes, validation, Supabase + local stores, seed data
shared/        Constants used by both (categories, statuses, COD fee, old-URL redirects)
supabase/      schema.sql: tables, security policies, checkout function, storage bucket
seed/images/   Starting product photos (from glowglossary.com)
assets-src/    Original images; `npm run images` turns them into web-ready files
```

---

## 1. Run it locally

Needs Node.js 20.12 or newer.

```bash
npm install
cp .env.example .env    # set ADMIN_PASSWORD (and SESSION_SECRET) in .env
npm run dev
```

- Store: http://localhost:5173
- Admin: http://localhost:5173/admin. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

On first start in local mode, the catalogue (7 products, 31 photos and the `WELCOME10` code) is loaded automatically. To start over, stop the server and delete the `data/` folder.

## 2. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com) (the free tier is fine).
2. **Database:** open *SQL Editor → New query*, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click *Run*. This creates the tables, security policies, the checkout function and the `product-images` storage bucket. It's safe to run again, so re-run it after updating the app to pick up new tables and columns.
3. **Admin user:** go to *Authentication → Users → Add user*, enter your email and a strong password, and tick *Auto confirm*.
4. **Keys:** go to *Project Settings → API*. Put these in `.env`:
   ```ini
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...   # "service_role" key. Server only, never share it
   SUPABASE_ANON_KEY=...           # "anon public" key
   ADMIN_EMAILS=you@glowglossary.in
   SESSION_SECRET=<long random string>
   ```
5. **Catalogue:** run `npm run seed` to upload the starting products and photos to Supabase.
6. Run `npm run dev` again. The admin dashboard no longer shows "Local data mode".

To give someone else admin access, create their user in Supabase Auth and add their email to `ADMIN_EMAILS`.

## 3. Go live

The app is one Node process: Express serves the API and the built site. It runs on Render, Railway, Fly.io, a VPS, or any other Node host.

```bash
npm install
npm run build     # builds the site into dist/
npm start         # serves site + API on $PORT (default 3001)
```

On the host:

- Set the same `.env` values as environment variables, plus `NODE_ENV=production`.
- Use Supabase in production. Local mode keeps data on the server's disk, which many hosts wipe on every deploy.
- Point your domain at the app and make sure it's served over HTTPS (cookies are `Secure` in production).

## Everyday admin

| Task | Where |
| --- | --- |
| Add a product | Admin → Products → **Add product**. Fill in the details, drop in photos, then **Create product** |
| Change price or sale price | Product → Pricing. "Compare-at" shows a struck-through price and a % off badge |
| Reorder photos / choose the cover | Drag photos, or use ← → and **Make cover**. The first photo is the cover |
| Hide a product | Turn off **Live**: it disappears from the shop but stays in admin |
| Feature on the home page | Turn on **Featured**. The home page also highlights `gg-matcha-green` (set in `client/src/content.js`) |
| Track stock | Enter a number. Checkout blocks orders beyond it and shows "Sold out" at 0. Leave empty to not track |
| Process an order | Orders → open it → **Mark as confirmed / shipped / delivered**. WhatsApp and copy-address buttons are there too |
| Discount codes | Promo codes → add a code and %; toggle it on or off |
| Reply to a message | Messages (the number shows unread ones) → open it → **Reply by email** or **WhatsApp**. Opening marks it read; **Archive** tidies the inbox |
| Change the COD fee | `COD_FEE_PAISE` in `shared/constants.js` (5000 = ₹50; 0 turns it off). Checkout, order pages and the product page update automatically |

Photos can be JPG, PNG, WebP or AVIF, up to 12 MB. They're resized to at most 1600 px and saved as WebP.

## Where things live

| What | File |
| --- | --- |
| Home page words, press, reviews, links | `client/src/content.js` |
| Our story, Rituals (recipes, FAQ), Contact, Shipping policy text | `OUR_STORY`, `RITUALS`, `CONTACT`, `SHIPPING_POLICY` in `client/src/content.js` |
| Phone, address, email, WhatsApp, Instagram | top and bottom of `client/src/content.js` |
| Old glowglossary.com URLs → new pages | `shared/legacyRedirects.js` |
| Origin (Shizuoka), also used on the 3D tin label | `ORIGIN` in `client/src/content.js` |
| Storefront pages | `client/src/pages/` |
| Admin screens | `client/src/admin/` |
| Styles | `client/src/styles.css` (landing), `shop.css`, `pages.css`, `admin/admin.css` |
| Contact form and "ways to reach us" blocks | `client/src/components/watermelon/` |
| 3D tin, powder, flight path | `client/src/three/` |
| API routes | `server/routes/public.js`, `server/routes/admin.js` |
| Input rules (validation) | `server/lib/schemas.js` |
| Database access | `server/store/supabase.js` (and `local.js` for local mode) |
| Starting catalogue | `server/seed/products.js` + `seed/images/<slug>/` |

### Moving the 3D tin

Each home-page section has a `<TinSlot>`, an invisible box the tin flies to. Its size and position in the CSS decide where the tin parks; its props set the pose (`yaw`, `tilt`, `lean`, `lid`).

## Security notes

- The Supabase `service_role` key stays on the server; the browser never receives any Supabase key.
- Row Level Security is on for every table. The public can read only live products and their photos, never orders, messages or promo codes.
- Checkout prices come from the database, not the browser, inside a single transaction that also checks and reduces stock.
- Admin sessions are signed, http-only, SameSite cookies. Admin writes are rejected unless they come from the site itself.
- Logins, checkout, promo checks and the contact form are rate-limited. Every input is validated, and uploads are checked to be real images.
- The contact form has a hidden honeypot field; bot submissions get a normal "sent" reply but are never stored.

## Not included yet

- **Online payments.** Checkout is cash on delivery. Razorpay or Stripe can be added to the checkout step once you have merchant keys.
- **Email/SMS notifications.** New orders show in the admin; customers get a confirmation page with a WhatsApp button. Order emails need an email provider (e.g. Resend).
- **Message notifications.** Contact messages land in Admin → Messages; there's no email alert yet (same email provider as above).
- Refund, privacy and terms pages aren't ported yet. Add them to `client/src/pages/` the same way as the Shipping page.

## Credits

The contact form and "ways to reach us" blocks are adapted from [Watermelon UI](https://ui.watermelon.sh) blocks `contact-4` and `contact-5` (MIT licence), rewritten from Tailwind/shadcn into plain CSS.

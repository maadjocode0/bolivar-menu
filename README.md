# Bolivar — Coffee & Lounge

Menu website for Bolivar, Megrine. Plain HTML, CSS and JavaScript — no framework, no build step.
The menu is stored in Supabase and edited by the owner on `admin.html`; the site still works without it.

## Files

| File | What it is |
|---|---|
| `index.html`, `styles.css` | The public menu page |
| `script.js` | Loads the menu (Supabase, else the copy saved on the phone, else `menu-data.js`), category bar, search; fills the footer's hours, address, Maps link and phone from the admin's "Infos" tab |
| `menu-data.js` | Built-in copy of the menu: used to fill the database once, and as a fallback |
| `admin.html`, `admin.css`, `admin.js` | The owner's admin page (French), not linked from the site |
| `supabase-config.js` | Supabase project address and **publishable** key (empty = no database) |
| `supabase/schema.sql` | Tables, security rules, reorder function, photo storage — safe to run again |
| `supabase/seed.sql` | The current menu (25 categories, 138 products) and footer details, to load once after the schema |

## Admin setup (once)

1. **Supabase → SQL Editor → New query**: paste `supabase/schema.sql`, click **Run**. Then do the same with
   `supabase/seed.sql` (it loads the current menu and refuses to run twice).
2. **Authentication → Sign In / Providers**: turn off **Allow new users to sign up**, so nobody can create an account.
3. **Authentication → Users → Add user → Create new user**: the owner's e-mail and a strong password,
   with **Auto Confirm User** ticked.
4. Give that account admin rights (SQL Editor):

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'owner@example.com';
   ```

5. Open `/admin.html` and log in.

Another admin later: repeat steps 3–4. To remove one: delete their row in `public.admins`.

## How it works

- **Security** is enforced by the database rules in `supabase/schema.sql`: everyone can read the menu and the
  footer details; only accounts in `public.admins` can change them or upload photos. The admin page itself
  protects nothing. `supabase-config.js` holds the publishable key only — never put the secret key in the project.
- **Prices, availability, photos, new products and categories, category order** → `admin.html`.
  An unavailable product stays on the menu, greyed out, with "Indisponible".
- **Opening hours, address, Google Maps link, phone** → `admin.html`, "Infos" tab. They replace the footer's
  built-in text; a detail saved empty hides its row.
- **Photos** are shrunk on the phone before upload into an 800 px and a 480 px copy (WebP, or JPEG on Safari),
  stored in the public `menu` bucket. Replaced or deleted photos are removed from storage.
- The public site shows changes on the next page load. Each visitor's phone keeps the last menu it loaded, so the
  site still works if Supabase is down; `menu-data.js` is used only if Supabase was never reached.
- Supabase free plan: a project pauses after a week without activity (restore it from the dashboard), and there is
  no automatic backup — export the `items` table now and then (Table editor → Export).

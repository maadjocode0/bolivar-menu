/*
  Bolivar — connection to the Supabase project that stores the menu.

  - Leave both values empty: the website uses the built-in menu (menu-data.js) and the
    admin page shows a "configuration missing" message.
  - The publishable key is meant to be public. It can only do what the database rules in
    supabase/schema.sql allow: everyone may read the menu, only admins may change it.
  - NEVER put the secret / service_role key here (or anywhere in this repository).
*/
const SUPABASE_URL = "https://owwbenlyhzabgiavpdnw.supabase.co";
const SUPABASE_KEY = "sb_publishable_8jpGAB9H_EzZUcy7WlTsQw_WgRDEpJK"; // publishable (public) key

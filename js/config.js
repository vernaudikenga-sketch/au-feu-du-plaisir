/* ==========================================================
   CONFIGURATION DU RESTAURANT
   Tout ce que le client modifie régulièrement est ici.
   (Les textes du site sont dans i18n.js)
   ========================================================== */
const CONFIG = {
  phone: "306931456288",              // format international, sans "+" ni espaces
  phoneDisplay: "+30 693 145 6288",
  email: "aufeuduplaizir@gmail.com",  // ⚠ à confirmer (z ou s ?)
  instagram: "https://www.instagram.com/aufeuduplaisir_athenes/",

  /* Réservation en ligne :
     1. Créer une clé gratuite sur https://web3forms.com avec l'e-mail du restaurant
     2. La coller ci-dessous → chaque réservation arrive automatiquement par e-mail.
     Tant que la clé est vide, la réservation est envoyée via WhatsApp. */
  web3formsKey: "",

  /* Horaires — jours : 0 = dimanche, 1 = lundi … 6 = samedi
     ⚠ À CONFIRMER avec le client */
  hours: {
    restaurant: { days: [2, 3, 4, 5, 6, 0], open: "12:00", close: "23:00" },
    night:      { days: [5, 6],             open: "23:00", close: "04:00" }
  },
  slotMinutes: 30,      // intervalle entre deux créneaux de réservation
  maxGuests: 20,        // au-delà → "Événement privé"

  /* Livraison : coller l'URL de la page du restaurant sur chaque plateforme.
     Un bouton n'apparaît que si son URL est renseignée. */
  delivery: [
    { name: "Wolt",  url: "" },
    { name: "efood", url: "" },
    { name: "Box",   url: "" }
  ],

  /* Plat du jour, par jour de la semaine (0 = dimanche … 6 = samedi).
     ⚠ EXEMPLES — à remplacer par les vrais plats du jour. */
  daily: {
    2: { name: "Ndolé", origin: "cm", price: 13,
         d: { el: "Φύλλα ndolé με φυστίκια, γαρίδες και μοσχάρι, με πλαντέν.",
              fr: "Feuilles de ndolé aux arachides, crevettes et bœuf, servi avec plantains.",
              en: "Ndolé leaves with peanuts, prawns and beef, served with plantains." } },
    3: { name: "Poulet à la moambé", origin: "cd", price: 13,
         d: { el: "Κοτόπουλο σε σάλτσα φοινικόκαρπου, με ρύζι.",
              fr: "Poulet à la sauce noix de palme, servi avec riz.",
              en: "Chicken in palm-nut sauce, served with rice." } },
    4: { name: "Garba", origin: "ci", price: 10,
         d: { el: "Attiéké με τηγανητό τόνο, κρεμμύδι και πιπεριά.",
              fr: "Attiéké, thon frit, oignons et piment.",
              en: "Attiéké with fried tuna, onion and chilli." } },
    5: { name: "Poisson braisé", origin: "cm", price: 15,
         d: { el: "Ψάρι στη σχάρα με attiéké ή πλαντέν.",
              fr: "Poisson braisé, attiéké ou plantains.",
              en: "Grilled fish with attiéké or plantains." } },
    6: { name: "Liboke de poisson", origin: "cd", price: 14,
         d: { el: "Ψάρι σε φύλλα μπανάνας, με chikwangue.",
              fr: "Poisson en feuille de bananier, avec chikwangue.",
              en: "Fish in banana leaves, with chikwangue." } },
    0: { name: "Kedjenou", origin: "ci", price: 14,
         d: { el: "Κοτόπουλο σιγομαγειρεμένο με λαχανικά, με attiéké.",
              fr: "Poulet mijoté aux légumes, avec attiéké.",
              en: "Slow-cooked chicken with vegetables, with attiéké." } }
  },

  /* Agenda des soirées. Les dates passées disparaissent automatiquement.
     Exemple :
     { date: "2026-10-24", time: "22:00",
       title: { el: "Rumba Night", fr: "Soirée Rumba", en: "Rumba Night" },
       desc:  { el: "Ζωντανή μουσική", fr: "Live band", en: "Live band" } } */
  events: []
};

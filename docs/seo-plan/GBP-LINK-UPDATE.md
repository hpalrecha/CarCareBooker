# Google Business Profile: link update (prepared, not applied)

Date: 20 November 2026. Only the owner can edit the Business Profile. Nothing was changed there, and nothing on the site depends on this step.

## Why

Search Console (19 Aug to 17 Nov) shows 207 impressions for `booking.p91carcare.com/services/paint-protection-film-bangalore` plus about 50 variants carrying `rwg_token`, `gsas=1` and `source=cat`. Those parameters are what Google adds to booking links from a Business Profile. The booking host now redirects to the main domain, so the signal is split: the PPF guide on `p91carcare.com` has no impressions of its own, and a car-wash search such as "car wash near me" (277 impressions, 0 clicks) landed on the PPF guide instead of a wash page.

## Destinations to use (main domain only)

| Profile field | Set to | Why this page |
|---|---|---|
| Website | `https://p91carcare.com/` | The indexed homepage; keeps the brand query on the main domain |
| Appointment link / "Book" button | `https://p91carcare.com/services` | The service chooser that opens booking. Replaces the old booking-subdomain link |
| Service: Paint protection film | `https://p91carcare.com/ppf` | Price and booking page |
| Service: Ceramic coating (car) | `https://p91carcare.com/ceramic-coating/car` | Price and booking page |
| Service: Ceramic coating (bike) | `https://p91carcare.com/ceramic-coating/bike` | Price and booking page |
| Service: Car wash | `https://p91carcare.com/service/premium-car-wash-special` | Matches the "car wash near me" demand |
| Service: Interior cleaning | `https://p91carcare.com/service/interior-detailing-service` | Matches "car interior cleaning" demand |
| Service: Glass and sun film | `https://p91carcare.com/services/glass-sun-control-film-bangalore` | Matches "car window film" demand |

Optional tracking: append `?utm_source=google&utm_medium=organic&utm_campaign=gbp` to the Website and Appointment links. The page canonical ignores query strings, so this adds no duplicate URL for Google; the site's attribution code already reads UTM parameters.

## Steps

1. Open the profile at business.google.com, choose **Edit profile**.
2. **Business information, Website:** paste the Website URL above. Save.
3. **Bookings (or Edit profile, Appointment link):** paste `https://p91carcare.com/services`. Save. If the booking button comes from a "Reserve with Google" partner and not from this field, change it in that partner's dashboard.
4. **Services:** edit each service item and add its link from the table, only for services the studio actually offers.
5. Keep the studio name, address (49, 13th Cross, Ayappa Garden, Adugodi, Bengaluru 560030), phone (+91 74066 19191) and hours exactly as on the website: Mon to Sat 10:30 to 16:30, Sun 10:30 to 14:00.
6. Check the links in an incognito window.

## Do not

- Do not remove the redirect from `booking.p91carcare.com`. Old shared links still point there, and it is what keeps them working.
- Do not add the old booking host to any new profile field.
- Do not put tracking parameters on the Website field of a second profile or listing (it would look like a different page).

## How we will know it worked

In Search Console, over the following 2 to 4 weeks: impressions on `booking.p91carcare.com` URLs stop growing, and impressions appear on `p91carcare.com/service/premium-car-wash-special` and `/ppf` for the "near me" queries. Check with the existing `scripts/gsc-indexing-audit.mjs`.

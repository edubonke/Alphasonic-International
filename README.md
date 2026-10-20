# Alphasonic International one-page website

Static one-page site. Open `index.html` directly or deploy the folder to GitHub Pages/Netlify/Vercel.

## Brand protection
The supplied Alphasonic round logo, banner/poster artwork, slogans and contact artwork are not altered. The favicon references the original round brand image.

## Site assessment and quote requests
Customers select a service, describe the project, provide the site area and their contact details, and optionally share an address and assessment availability. Service cards preselect the relevant service in the form. No measurements, rate bands or automated prices are used.

The form validates required fields and South African phone numbers, saves a draft in the current browser, and lets the customer review the complete request before opening a prepared WhatsApp message to **074 643 7729**. The customer must press Send in WhatsApp to submit it. The team contacts the customer to confirm assessment arrangements.

Request behavior lives in `assessment.js`. The WhatsApp destination is configured in the form's `data-whatsapp-number` attribute in `index.html`.

## Video playback and social links
Both portfolio videos autoplay muted, play inline and loop. Native playback controls remain available if a browser blocks autoplay. Both supplied MP4 files contain video only, with no audio stream.

The footer links to Alphasonic International's verified Facebook page and the existing WhatsApp contact. The Facebook page matches the business name, location and 074 643 7729 phone number: https://www.facebook.com/p/Alphasonic-International-100063898484808/

## Sitemap
After the site has a permanent public URL, replace `https://YOUR-LIVE-DOMAIN.example/` in `sitemap.xml.template`, rename the file to `sitemap.xml`, and optionally add this line to `robots.txt`:

`Sitemap: https://your-domain.example/sitemap.xml`

## Analytics
The existing Google Analytics configuration is retained. `analytics.js` tracks assessment-form interactions, WhatsApp handoffs, portfolio interactions and contact-link clicks. Names, phone numbers, addresses, availability text and project descriptions are excluded from analytics. A WhatsApp handoff does not confirm that a message was sent or an appointment booked.


## Project work gallery
The new `#projects` section uses the supplied on-site photographs as evidence of real work in progress. Images are grouped into:
- Residential kitchen/interior refurbishment
- Residential interior/exterior painting
- Commercial interior maintenance

The original image files are copied into `assets/projects/` without altering the supplied brand assets. Clicking a project photograph opens an accessible full-screen viewer with previous/next controls.

The section is intentionally placed after **Services** and before **Why Alphasonic** so the page flow is:
**what we do → evidence of the work → why choose us → site assessment and quote request → contact**.


## V4 update
- Replaced the hero visual with a logical portfolio preview using real project photos.
- Retained the dedicated portfolio section and refined its framing to emphasise completed jobs and work-in-progress proof.

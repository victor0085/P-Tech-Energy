# P-Tech Energy Solutions — Website

Pages: Home, About, Products, Projects, Contact, Get a Quote, 404.
Login, sign-up and account pages have been removed.

## Run locally
    python3 -m http.server 8000     # then open http://localhost:8000

## Pictures (online)
All photos load from the internet, only while the device is connected, and only when they
scroll near the screen (saves mobile data). If a photo can't load, a navy/orange panel stays.
To change any picture, edit its URL in the `IMAGES` list at the top of `js/site.js`.
The logo is `assets/images/logo-full.png`; the tab icon is `assets/favicon.png`.

## Quote page
Three steps: power needs -> your details -> downloadable quote (PDF, print, WhatsApp, email).
Pricing constants are in `ESTIMATE_ASSUMPTIONS` at the top of `js/quote.js` — replace with your real costs.
The PDF is built in the browser (jsPDF from cdnjs, needs a connection); offline it falls back to Print > Save as PDF.

## Before launch
- Sample projects (`PROJECTS` in `js/site.js`) and homepage testimonials are placeholders; use real ones.
- No server: the contact and quote forms send via WhatsApp/email buttons. Use Formspree or a backend to receive them automatically.
- Newsletter box is a demo; connect it to your mailing list.

## Deploy with GitHub Pages (step by step)
1. **Create the repository.** On github.com click **New repository**, name it (for example `ptech-energy`), keep it **Public**, do not add a README, then click **Create repository**.
2. **Open a terminal inside this project folder** (the one containing `index.html`) and run these one at a time:
   ```
   git init
   git add .
   git commit -m "First version of P-Tech Energy website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ptech-energy.git
   git push -u origin main
   ```
3. **Turn on Pages.** In the repository go to **Settings, Pages**, and under **Source** choose **GitHub Actions**.
4. **Wait about a minute.** Open the **Actions** tab. When "Deploy to GitHub Pages" shows a green tick, the site is live at `https://YOUR-USERNAME.github.io/ptech-energy/`.
5. **To update later:** change files, then `git add .`, `git commit -m "what you changed"`, `git push`.

Notes
- `index.html` must be at the top level of the repository, not inside another folder.
- The `.github` folder is hidden; drag-and-drop upload on github.com often skips it, so use the `git` commands above.
- `.nojekyll` stops GitHub from processing the files, so everything is served exactly as written.
- All links are relative, so the site works at a project address like `/ptech-energy/` and on a custom domain.
- To use your own domain: **Settings, Pages, Custom domain**.

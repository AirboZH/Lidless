"""
Simplified screenshot capture for lidless.cc visual SEO audit.
Captures key viewports and runs JS checks.
"""
from playwright.sync_api import sync_playwright
import os, time, json

OUTPUT_DIR = r"X:\Lidless\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def run_audit():
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── 1. Desktop 1440 above-the-fold ───────────────────────────────────
        print("Capturing desktop 1440…")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "01_desktop_1440_atf.png"), full_page=False)

        # Collect JS data while we have this page
        results["desktop_atf"] = page.evaluate("""
        () => {
            const h1 = document.querySelector('h1');
            const ctaLinks = Array.from(document.querySelectorAll('a')).filter(
                a => a.textContent.includes('Download') || a.textContent.includes('下载')
            );
            const mainCta = ctaLinks[0];
            const skip = Array.from(document.querySelectorAll('a')).find(
                a => a.href.includes('#main') || a.textContent.toLowerCase().includes('skip')
            );
            return {
                h1Text: h1 ? h1.textContent.trim() : null,
                h1Rect: h1 ? (() => { const r = h1.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width)} })() : null,
                ctaText: mainCta ? mainCta.textContent.trim() : null,
                ctaRect: mainCta ? (() => { const r = mainCta.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width)} })() : null,
                viewportH: window.innerHeight,
                viewportW: window.innerWidth,
                h1AboveFold: h1 ? h1.getBoundingClientRect().bottom < window.innerHeight : false,
                ctaAboveFold: mainCta ? mainCta.getBoundingClientRect().bottom < window.innerHeight : false,
                skipLink: skip ? {text: skip.textContent.trim(), href: skip.getAttribute('href'), classes: skip.className} : null,
                docTitle: document.title,
                metaDesc: (document.querySelector('meta[name="description"]') || {}).content,
                canonicalHref: (document.querySelector('link[rel="canonical"]') || {}).href,
                ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content,
                ogDesc: (document.querySelector('meta[property="og:description"]') || {}).content,
                ogImage: (document.querySelector('meta[property="og:image"]') || {}).content,
                twitterCard: (document.querySelector('meta[name="twitter:card"]') || {}).content,
                hreflang: Array.from(document.querySelectorAll('link[hreflang]')).map(l => ({lang: l.hreflang, href: l.href})),
                bodyScrollWidth: document.body.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                hasHorizScroll: document.body.scrollWidth > document.documentElement.clientWidth,
            };
        }
        """)

        # Hero contrast
        results["hero_contrast"] = page.evaluate("""
        () => {
            const h1 = document.querySelector('h1');
            if (!h1) return {error: 'no h1'};
            const cs = window.getComputedStyle(h1);
            let bg = h1;
            let bgColor = 'transparent';
            while (bg && bgColor === 'transparent') {
                bgColor = window.getComputedStyle(bg).backgroundColor;
                bg = bg.parentElement;
            }
            const span = h1.querySelector('span');
            return {
                h1Color: cs.color,
                h1FontSize: cs.fontSize,
                h1FontWeight: cs.fontWeight,
                bgColor,
                bodyBg: window.getComputedStyle(document.body).backgroundColor,
                gradientSpanColor: span ? window.getComputedStyle(span).color : null,
            };
        }
        """)

        # Images
        results["images"] = page.evaluate("""
        () => Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            hasAlt: img.hasAttribute('alt'),
            role: img.getAttribute('role'),
            ariaHidden: img.getAttribute('aria-hidden'),
            width: img.naturalWidth,
            height: img.naturalHeight
        }))
        """)

        # Full page
        page.screenshot(path=os.path.join(OUTPUT_DIR, "02_desktop_1440_full.png"), full_page=True)
        ctx.close()

        # ── 2. Mobile 390 above-the-fold ─────────────────────────────────────
        print("Capturing mobile 390…")
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "03_mobile_390_atf.png"), full_page=False)

        results["mobile_atf"] = page.evaluate("""
        () => {
            const h1 = document.querySelector('h1');
            const ctaLinks = Array.from(document.querySelectorAll('a')).filter(
                a => a.textContent.includes('Download') || a.textContent.includes('下载')
            );
            const mainCta = ctaLinks[0];
            return {
                h1AboveFold: h1 ? h1.getBoundingClientRect().bottom < window.innerHeight : false,
                ctaAboveFold: mainCta ? mainCta.getBoundingClientRect().bottom < window.innerHeight : false,
                h1Rect: h1 ? (() => { const r = h1.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom)} })() : null,
                ctaRect: mainCta ? (() => { const r = mainCta.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width)} })() : null,
                viewportH: window.innerHeight,
                hasHorizScroll: document.body.scrollWidth > document.documentElement.clientWidth,
                bodyScrollWidth: document.body.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            };
        }
        """)

        results["mobile_tap_targets"] = page.evaluate("""
        () => {
            const els = Array.from(document.querySelectorAll('a, button'));
            return els
                .map(el => {
                    const r = el.getBoundingClientRect();
                    if (r.width === 0 || r.height === 0) return null;
                    return {
                        tag: el.tagName,
                        text: el.textContent.trim().substring(0, 50),
                        width: Math.round(r.width),
                        height: Math.round(r.height),
                        top: Math.round(r.top),
                        tooSmall: r.width < 44 || r.height < 44,
                        inViewport: r.top < window.innerHeight
                    };
                })
                .filter(Boolean)
                .filter(t => t.inViewport);
        }
        """)

        # Full mobile page
        page.screenshot(path=os.path.join(OUTPUT_DIR, "04_mobile_390_full.png"), full_page=True)
        ctx.close()

        # ── 3. Tablet 768 ────────────────────────────────────────────────────
        print("Capturing tablet 768…")
        ctx = browser.new_context(viewport={"width": 768, "height": 1024}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "05_tablet_768_atf.png"), full_page=False)
        ctx.close()

        # ── 4. Dark mode ─────────────────────────────────────────────────────
        print("Capturing dark mode…")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "06_desktop_dark.png"), full_page=False)
        results["dark_hero_contrast"] = page.evaluate("""
        () => {
            const h1 = document.querySelector('h1');
            if (!h1) return {error: 'no h1'};
            const cs = window.getComputedStyle(h1);
            let bg = h1; let bgColor = 'transparent';
            while (bg && bgColor === 'transparent') { bgColor = window.getComputedStyle(bg).backgroundColor; bg = bg.parentElement; }
            return { h1Color: cs.color, bodyBg: window.getComputedStyle(document.body).backgroundColor, bgColor, prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches };
        }
        """)
        ctx.close()

        # ── 5. OG Image ──────────────────────────────────────────────────────
        print("Capturing OG image…")
        ctx = browser.new_context(viewport={"width": 1200, "height": 630})
        page = ctx.new_page()
        try:
            page.goto("https://lidless.cc/en/opengraph-image", wait_until="networkidle", timeout=15000)
            time.sleep(1)
            page.screenshot(path=os.path.join(OUTPUT_DIR, "07_og_image_en.png"), full_page=False)
            results["og_en_dims"] = page.evaluate("""
            () => {
                const img = document.querySelector('img');
                if (img) return {type:'img', w: img.naturalWidth, h: img.naturalHeight, src: img.src.substring(0,100)};
                return {type:'page', w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight};
            }
            """)
        except Exception as e:
            results["og_en_dims"] = {"error": str(e)}
        ctx.close()

        ctx = browser.new_context(viewport={"width": 1200, "height": 630})
        page = ctx.new_page()
        try:
            page.goto("https://lidless.cc/zh/opengraph-image", wait_until="networkidle", timeout=15000)
            time.sleep(1)
            page.screenshot(path=os.path.join(OUTPUT_DIR, "08_og_image_zh.png"), full_page=False)
            results["og_zh_dims"] = page.evaluate("""
            () => {
                const img = document.querySelector('img');
                if (img) return {type:'img', w: img.naturalWidth, h: img.naturalHeight};
                return {type:'page', w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight};
            }
            """)
        except Exception as e:
            results["og_zh_dims"] = {"error": str(e)}
        ctx.close()

        # ── 6. Chinese locale ─────────────────────────────────────────────────
        print("Capturing zh locale…")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc/zh", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "09_zh_desktop_atf.png"), full_page=False)
        results["zh_checks"] = page.evaluate("""
        () => {
            const h1 = document.querySelector('h1');
            return {
                h1Text: h1 ? h1.textContent.trim() : null,
                hasHorizScroll: document.body.scrollWidth > document.documentElement.clientWidth,
                bodyScrollWidth: document.body.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                htmlLang: document.documentElement.lang,
                ogLocale: (document.querySelector('meta[property="og:locale"]') || {}).content,
                canonical: (document.querySelector('link[rel="canonical"]') || {}).href,
                hreflang: Array.from(document.querySelectorAll('link[hreflang]')).map(l => ({lang: l.hreflang, href: l.href})),
            };
        }
        """)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "10_zh_desktop_full.png"), full_page=True)
        ctx.close()

        ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc/zh", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "11_zh_mobile_atf.png"), full_page=False)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "12_zh_mobile_full.png"), full_page=True)
        ctx.close()

        # ── 7. Docs ────────────────────────────────────────────────────────────
        print("Capturing docs…")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc/docs", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "13_docs_desktop.png"), full_page=False)
        ctx.close()

        ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc/docs", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "14_docs_mobile.png"), full_page=False)
        ctx.close()

        browser.close()

    print("\n=== RESULTS ===")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    return results


if __name__ == "__main__":
    run_audit()

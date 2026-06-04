"""
Screenshot capture script for lidless.cc visual SEO audit.
Captures multiple viewports, OG image, dark mode, and zh locale.
"""
from playwright.sync_api import sync_playwright
import os, time

OUTPUT_DIR = r"X:\Lidless\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CAPTURES = [
    # (url, filename, width, height, color_scheme, wait_extra)
    ("https://lidless.cc", "desktop_1440.png", 1440, 900, "light", 0),
    ("https://lidless.cc", "mobile_390.png", 390, 844, "light", 0),
    ("https://lidless.cc", "tablet_768.png", 768, 1024, "light", 0),
    ("https://lidless.cc", "desktop_dark.png", 1440, 900, "dark", 0),
    ("https://lidless.cc/zh", "zh_desktop_1440.png", 1440, 900, "light", 0),
    ("https://lidless.cc/zh", "zh_mobile_390.png", 390, 844, "light", 0),
    ("https://lidless.cc/docs", "docs_desktop.png", 1440, 900, "light", 0),
    ("https://lidless.cc/docs", "docs_mobile.png", 390, 844, "light", 0),
]

OG_URLS = [
    ("https://lidless.cc/opengraph-image", "og_image_root.png"),
    ("https://lidless.cc/en/opengraph-image", "og_image_en.png"),
    ("https://lidless.cc/zh/opengraph-image", "og_image_zh.png"),
]


def capture_page(page, url, output_path, color_scheme="light"):
    """Capture above-the-fold screenshot."""
    page.goto(url, wait_until="networkidle", timeout=30000)
    # Extra settle time for fonts/images
    time.sleep(2)
    page.screenshot(path=output_path, full_page=False)
    print(f"  Saved: {output_path}")


def capture_full_page(page, url, output_path, color_scheme="light"):
    """Capture full-page screenshot."""
    page.goto(url, wait_until="networkidle", timeout=30000)
    time.sleep(2)
    page.screenshot(path=output_path, full_page=True)
    print(f"  Saved (full): {output_path}")


def measure_og_image(page, url):
    """Navigate to OG image URL and get actual dimensions."""
    try:
        page.goto(url, wait_until="networkidle", timeout=15000)
        # Check if it's an image response
        dimensions = page.evaluate("""
            () => {
                const img = document.querySelector('img');
                if (img) return { w: img.naturalWidth, h: img.naturalHeight, src: img.src };
                // Maybe the page IS an image (direct image response)
                const body = document.body;
                if (body) {
                    const imgs = document.getElementsByTagName('img');
                    if (imgs.length > 0) {
                        return { w: imgs[0].naturalWidth, h: imgs[0].naturalHeight };
                    }
                }
                return { w: window.innerWidth, h: window.innerHeight, note: 'no img element found' };
            }
        """)
        return dimensions
    except Exception as e:
        return {"error": str(e)}


def check_accessibility(page):
    """Run accessibility checks on the current page."""
    checks = page.evaluate("""
        () => {
            const results = {};

            // Check for skip link
            const skipLinks = Array.from(document.querySelectorAll('a')).filter(a =>
                (a.href && a.href.includes('#main')) ||
                (a.textContent && a.textContent.toLowerCase().includes('skip'))
            );
            results.skipLink = skipLinks.map(a => ({
                text: a.textContent.trim(),
                href: a.getAttribute('href'),
                visible: a.offsetParent !== null,
                classes: a.className
            }));

            // Check H1
            const h1s = document.querySelectorAll('h1');
            results.h1s = Array.from(h1s).map(h => ({
                text: h.textContent.trim().substring(0, 120),
                visible: h.offsetParent !== null
            }));

            // Check images for alt text
            const imgs = document.querySelectorAll('img');
            results.images = Array.from(imgs).map(img => ({
                src: img.src.substring(0, 80),
                alt: img.getAttribute('alt'),
                hasAlt: img.hasAttribute('alt'),
                role: img.getAttribute('role')
            }));

            // Check primary CTA
            const ctaKeywords = ['download', 'Download', 'get started', 'Get Started'];
            const ctas = Array.from(document.querySelectorAll('a, button')).filter(el =>
                ctaKeywords.some(kw => el.textContent.includes(kw))
            );
            results.ctas = ctas.map(el => ({
                tag: el.tagName,
                text: el.textContent.trim().substring(0, 80),
                href: el.getAttribute('href'),
                rect: (() => {
                    const r = el.getBoundingClientRect();
                    return { top: Math.round(r.top), left: Math.round(r.left),
                             width: Math.round(r.width), height: Math.round(r.height) };
                })()
            }));

            // Check focus styles - inspect stylesheet rules for :focus
            let hasFocusStyle = false;
            try {
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules) {
                            if (rule.selectorText && rule.selectorText.includes(':focus')) {
                                hasFocusStyle = true;
                                break;
                            }
                        }
                    } catch(e) {}
                }
            } catch(e) {}
            results.hasFocusStyle = hasFocusStyle;

            // Check nav structure
            const nav = document.querySelector('nav');
            results.nav = nav ? {
                found: true,
                children: nav.children.length,
                innerHTML_preview: nav.innerHTML.substring(0, 200)
            } : { found: false };

            // Viewport height
            results.viewportHeight = window.innerHeight;
            results.viewportWidth = window.innerWidth;

            return results;
        }
    """)
    return checks


def check_contrast_hero(page):
    """Check hero section computed styles."""
    try:
        hero = page.evaluate("""
            () => {
                // Find H1
                const h1 = document.querySelector('h1');
                if (!h1) return { error: 'no h1 found' };
                const style = window.getComputedStyle(h1);
                const rect = h1.getBoundingClientRect();

                // Find hero section background
                let bgEl = h1;
                let bgColor = 'transparent';
                while (bgEl && bgColor === 'transparent') {
                    bgColor = window.getComputedStyle(bgEl).backgroundColor;
                    bgEl = bgEl.parentElement;
                }

                return {
                    h1Text: h1.textContent.trim().substring(0, 100),
                    h1Color: style.color,
                    h1FontSize: style.fontSize,
                    h1FontWeight: style.fontWeight,
                    h1Rect: {
                        top: Math.round(rect.top),
                        bottom: Math.round(rect.bottom),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width)
                    },
                    bgColor: bgColor,
                    bodyBg: window.getComputedStyle(document.body).backgroundColor
                };
            }
        """)
        return hero
    except Exception as e:
        return {"error": str(e)}


def check_mobile_tap_targets(page):
    """Check CTA and nav link tap target sizes on mobile."""
    try:
        targets = page.evaluate("""
            () => {
                const interactive = document.querySelectorAll('a, button');
                const results = [];
                for (const el of interactive) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) continue;
                    if (rect.top > window.innerHeight) continue; // only above fold
                    results.push({
                        tag: el.tagName,
                        text: el.textContent.trim().substring(0, 40),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        tooSmall: rect.width < 44 || rect.height < 44
                    });
                }
                return results;
            }
        """)
        return targets
    except Exception as e:
        return {"error": str(e)}


def check_horizontal_scroll(page):
    """Check if the page has horizontal overflow."""
    try:
        result = page.evaluate("""
            () => ({
                scrollWidth: document.body.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                hasHorizontalScroll: document.body.scrollWidth > document.documentElement.clientWidth,
                overflow: window.getComputedStyle(document.body).overflowX
            })
        """)
        return result
    except Exception as e:
        return {"error": str(e)}


def run_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        results = {}

        print("\n=== Capturing screenshots ===")
        for url, fname, w, h, scheme, _ in CAPTURES:
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                color_scheme=scheme
            )
            page = ctx.new_page()
            out = os.path.join(OUTPUT_DIR, fname)
            try:
                capture_page(page, url, out, scheme)
            except Exception as e:
                print(f"  ERROR capturing {fname}: {e}")
            ctx.close()

        print("\n=== Capturing full-page screenshots ===")
        for url, fname, w, h, scheme, _ in CAPTURES:
            if "mobile" in fname or "dark" in fname or "zh" in fname:
                continue  # only full-page for desktop light
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                color_scheme=scheme
            )
            page = ctx.new_page()
            fname_full = fname.replace(".png", "_full.png")
            out = os.path.join(OUTPUT_DIR, fname_full)
            try:
                capture_full_page(page, url, out, scheme)
            except Exception as e:
                print(f"  ERROR capturing {fname_full}: {e}")
            ctx.close()

        print("\n=== OG Image checks ===")
        ctx = browser.new_context(viewport={"width": 1200, "height": 630})
        page = ctx.new_page()
        for url, fname in OG_URLS:
            out = os.path.join(OUTPUT_DIR, fname)
            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
                time.sleep(1)
                page.screenshot(path=out, full_page=False)
                dims = measure_og_image(page, url)
                results[f"og_{fname}"] = dims
                print(f"  OG {url} -> dims: {dims}")
            except Exception as e:
                print(f"  ERROR OG {url}: {e}")
                results[f"og_{fname}"] = {"error": str(e)}
        ctx.close()

        print("\n=== Accessibility & contrast checks (desktop) ===")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        results["a11y_desktop"] = check_accessibility(page)
        results["contrast_hero_light"] = check_contrast_hero(page)
        results["horiz_scroll_desktop"] = check_horizontal_scroll(page)
        ctx.close()

        print("\n=== Accessibility checks (mobile) ===")
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        results["a11y_mobile"] = check_accessibility(page)
        results["tap_targets"] = check_mobile_tap_targets(page)
        results["horiz_scroll_mobile"] = check_horizontal_scroll(page)
        ctx.close()

        print("\n=== Dark mode contrast checks ===")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark")
        page = ctx.new_page()
        page.goto("https://lidless.cc", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        results["contrast_hero_dark"] = check_contrast_hero(page)
        ctx.close()

        print("\n=== Chinese locale checks ===")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        page = ctx.new_page()
        page.goto("https://lidless.cc/zh", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        results["a11y_zh"] = check_accessibility(page)
        results["horiz_scroll_zh"] = check_horizontal_scroll(page)
        results["contrast_hero_zh"] = check_contrast_hero(page)
        ctx.close()

        browser.close()

        # Print all results
        import json
        print("\n\n=== AUDIT RESULTS JSON ===")
        print(json.dumps(results, indent=2, ensure_ascii=False))

        return results


if __name__ == "__main__":
    run_audit()

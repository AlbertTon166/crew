/**
 * Playwright Diagnostic Script
 * Get actual page structure for test selector debugging
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://tzx.aiteamsvr.work';

async function diagnose() {
  console.log('Connecting to:', BASE_URL);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    console.log('\n=== PAGE TITLE ===');
    console.log(await page.title());
    
    console.log('\n=== ALL BUTTONS ===');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      const className = await btn.getAttribute('class');
      console.log(`Button: "${text?.trim()}" class="${className}"`);
    }
    
    console.log('\n=== ALL LINKS ===');
    const links = await page.$$('a');
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`Link: "${text?.trim()}" href="${href}"`);
    }
    
    console.log('\n=== ALL INPUTS ===');
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const className = await input.getAttribute('class');
      console.log(`Input: type="${type}" placeholder="${placeholder}" class="${className}"`);
    }
    
    console.log('\n=== NAV / HEADER ELEMENTS ===');
    const navElements = await page.$$('nav, header, [class*="nav"], [class*="header"], [class*="top"]');
    for (const el of navElements) {
      const tag = await el.evaluate(e => e.tagName);
      const className = await el.getAttribute('class');
      console.log(`Nav element: <${tag}> class="${className}"`);
    }
    
    console.log('\n=== BODY TEXT (first 500 chars) ===');
    const bodyText = await page.textContent('body');
    console.log(bodyText?.substring(0, 500));
    
    console.log('\n=== HTML STRUCTURE (simplified) ===');
    const html = await page.content();
    // Find first level children of root
    const root = await page.$('#root');
    if (root) {
      const children = await root.evaluate(el => {
        return Array.from(el.children).map(child => ({
          tag: child.tagName,
          class: child.className,
          id: child.id,
          childCount: child.children.length
        }));
      });
      console.log(JSON.stringify(children, null, 2));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
}

diagnose().catch(console.error);

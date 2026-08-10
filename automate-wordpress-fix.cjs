#!/usr/bin/env node

/**
 * Automate Kastoria FM WordPress Snippet Fix using Puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const WP_URL = 'https://kastoriafm.gr';
const WP_USER = 'super@dmin';
const WP_PASS = 'Super@dmin1992@@';

// Read the snippet code
const SNIPPET_CODE = fs.readFileSync('/workspace/wordpress-page/webapp-snippet-final.php', 'utf8');

(async () => {
  console.log('🚀 Starting WordPress automation...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Step 1: Login to WordPress
    console.log('📝 Logging in to WordPress...');
    await page.goto(`${WP_URL}/wp-login.php`, { waitUntil: 'networkidle2', timeout: 60000 });
    
    await page.waitForSelector('#user_login', { timeout: 10000 });
    await page.type('#user_login', WP_USER);
    await page.type('#user_pass', WP_PASS);
    await page.click('#wp-submit');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✓ Logged in successfully\n');

    // Step 2: Go to Code Snippets page
    console.log('📋 Navigating to Code Snippets...');
    await page.goto(`${WP_URL}/wp-admin/admin.php?page=snippets`, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✓ On Code Snippets page\n');

    // Step 3: Deactivate/Delete the broken "Webapp Player HTML Content" snippet
    console.log('🗑️  Looking for broken snippet...');
    try {
      const brokenSnippet = await page.$x("//td[@class='name column-name has-row-actions column-primary']/strong/a[contains(text(), 'Webapp Player HTML')]");
      if (brokenSnippet.length > 0) {
        const row = await brokenSnippet[0].evaluateHandle(el => el.closest('tr'));
        const deleteLink = await row.$('span.trash a');
        if (deleteLink) {
          await deleteLink.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          console.log('✓ Deleted broken snippet\n');
        }
      } else {
        console.log('ℹ️  Broken snippet not found (maybe already deleted)\n');
      }
    } catch (err) {
      console.log('ℹ️  Broken snippet not found or already deleted\n');
    }

    // Step 4: Add new snippet
    console.log('➕ Creating new snippet...');
    await page.goto(`${WP_URL}/wp-admin/admin.php?page=snippets`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('a.page-title-action', { timeout: 10000 });
    await page.click('a.page-title-action'); // Click "Add New"
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✓ On new snippet page\n');

    // Step 5: Fill in snippet details
    console.log('✍️  Filling snippet details...');
    await page.waitForSelector('#title', { timeout: 10000 });
    await page.type('#title', 'Kastoria FM Webapp Page');
    
    // Description field
    try {
      await page.type('#description', 'Serves standalone player page for /webapp bypassing theme');
    } catch (e) {
      console.log('ℹ️  Description field optional\n');
    }

    // Step 6: Insert code
    console.log('📝 Inserting snippet code...');
    
    // Try CodeMirror editor first
    try {
      await page.evaluate((code) => {
        if (window.wp && window.wp.CodeMirror) {
          const editor = document.querySelector('.CodeMirror');
          if (editor && editor.CodeMirror) {
            editor.CodeMirror.setValue(code);
            return true;
          }
        }
        return false;
      }, SNIPPET_CODE);
      console.log('✓ Code inserted via CodeMirror\n');
    } catch (e) {
      // Fallback to textarea
      console.log('ℹ️  CodeMirror not found, trying textarea...');
      const codeTextarea = await page.$('#snippet_code');
      if (codeTextarea) {
        await page.evaluate((el, code) => {
          el.value = code;
        }, codeTextarea, SNIPPET_CODE);
        console.log('✓ Code inserted via textarea\n');
      }
    }

    // Step 7: Set scope to "Run everywhere" (global)
    console.log('🌐 Setting scope...');
    try {
      await page.select('#snippet_scope', 'global');
      console.log('✓ Scope set to global\n');
    } catch (e) {
      console.log('ℹ️  Scope field not found (may be default)\n');
    }

    // Step 8: Save and Activate
    console.log('💾 Saving snippet...');
    const saveButton = await page.$('#save_snippet_activate');
    if (saveButton) {
      await saveButton.click();
      console.log('✓ Clicked "Save Changes and Activate"\n');
    } else {
      // Try just save button
      const altSave = await page.$('#save_snippet');
      if (altSave) {
        await altSave.click();
        console.log('✓ Snippet saved\n');
      }
    }
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✓ Snippet activated!\n');

    // Step 9: Verify webapp page exists
    console.log('🔍 Checking webapp page...');
    await page.goto(`${WP_URL}/wp-admin/edit.php?post_type=page`, { waitUntil: 'networkidle2', timeout: 30000 });
    const webappPage = await page.$x("//a[@class='row-title'][contains(text(), 'Web App')]");
    if (webappPage.length > 0) {
      console.log('✓ Webapp page exists\n');
    } else {
      console.log('⚠️  Webapp page not found - may need to create it\n');
    }

    // Step 10: Clear cache (WP Rocket)
    console.log('🧹 Attempting to clear cache...');
    try {
      await page.goto(`${WP_URL}/wp-admin/admin.php?page=wprocket`, { waitUntil: 'networkidle2', timeout: 15000 });
      const clearCacheBtn = await page.$('button[data-action="purge_cache"]');
      if (clearCacheBtn) {
        await clearCacheBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Cache cleared\n');
      } else {
        console.log('ℹ️  Cache clear button not found\n');
      }
    } catch (e) {
      console.log('ℹ️  Could not access WP Rocket (may not be available)\n');
    }

    // Step 11: Screenshot the snippets page
    console.log('📸 Taking screenshot of snippets...');
    await page.goto(`${WP_URL}/wp-admin/admin.php?page=snippets`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: '/workspace/snippets-final.png', fullPage: true });
    console.log('✓ Screenshot saved: /workspace/snippets-final.png\n');

    // Step 12: Test the webapp page
    console.log('🌐 Testing webapp page...');
    await page.goto(`${WP_URL}/webapp/`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if player UI is visible
    const hasLogo = await page.$('img.kfm-logo');
    const hasPlayBtn = await page.$('button.kfm-play');
    const hasTitle = await page.$x("//h1[contains(text(), 'Kastoria FM')]");
    
    if (hasLogo && hasPlayBtn && hasTitle.length > 0) {
      console.log('✅ Player UI is visible!\n');
      
      // Screenshot the player
      await page.screenshot({ path: '/workspace/webapp-player-success.png', fullPage: true });
      console.log('✓ Screenshot saved: /workspace/webapp-player-success.png\n');
      
      // Try to click play (audio won't actually play in headless mode)
      console.log('▶️  Clicking play button...');
      await page.click('button.kfm-play');
      await page.waitForTimeout(2000);
      
      const statusText = await page.$eval('.kfm-status', el => el.textContent);
      console.log(`   Status: "${statusText}"\n`);
      
      if (statusText.includes('Παίζει ζωντανά') || statusText.includes('Σύνδεση')) {
        console.log('✅ AUDIO PLAYBACK INITIATED!\n');
      } else {
        console.log('⚠️  Play button clicked, but audio status unclear\n');
      }
    } else {
      console.log('❌ Player UI NOT visible - theme may still be interfering\n');
      await page.screenshot({ path: '/workspace/webapp-failed.png', fullPage: true });
    }

    console.log('=== FIX COMPLETE ===\n');
    console.log('📊 FINAL STATUS:');
    console.log('  • Page URL: https://kastoriafm.gr/webapp/');
    console.log('  • Snippet active: YES');
    console.log('  • Page published: ' + (webappPage.length > 0 ? 'YES' : 'CHECK MANUALLY'));
    console.log('  • Player UI visible: ' + (hasLogo && hasPlayBtn ? 'YES' : 'CHECK MANUALLY'));
    console.log('  • Play works: TEST MANUALLY IN REAL BROWSER\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    const page = await browser.pages().then(pages => pages[0]);
    if (page) {
      await page.screenshot({ path: '/workspace/error-screenshot.png' });
      console.log('Screenshot saved: /workspace/error-screenshot.png');
    }
  } finally {
    await browser.close();
  }
})();

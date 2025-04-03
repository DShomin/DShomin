const core = require('@actions/core');
const puppeteer = require('puppeteer');

async function run() {
    try {
        const username = core.getInput('username');
        console.log(`Fetching Kaggle profile for user: ${username}`);

        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setDefaultNavigationTimeout(30000);

        console.log('Navigating to Kaggle profile...');
        await page.goto(`https://www.kaggle.com/${username}`, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });

        // Wait for any of these selectors to be visible
        console.log('Waiting for profile content to load...');
        await Promise.race([
            page.waitForSelector('.profile-summary', { timeout: 5000 }),
            page.waitForSelector('.profile-info', { timeout: 5000 }),
            page.waitForSelector('.profile-header', { timeout: 5000 })
        ]);

        // Create directories if they don't exist
        const fs = require('fs');
        const dirs = ['./kaggle-badges', './kaggle-plates'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Wait a bit for any animations to complete
        await page.waitForTimeout(2000);

        console.log('Taking screenshot...');
        await page.screenshot({
            path: './kaggle-badges/profile.png',
            fullPage: true
        });

        await browser.close();
        console.log('Successfully generated Kaggle badges');
        core.setOutput('status', 'success');
    } catch (error) {
        console.error('Error:', error.message);
        core.setFailed(error.message);
    }
}

run(); 
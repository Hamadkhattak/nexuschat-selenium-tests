const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function test() {
  console.log('Starting Chrome...');
  
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1280,800');

  try {
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    console.log('Chrome launched!');
    await driver.get('http://localhost:3000');
    const title = await driver.getTitle();
    console.log('Page title:', title);
    await driver.quit();
    console.log('Done!');
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

test();
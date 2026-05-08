const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

let chromedriverPath;
if (process.platform === 'linux') {
  chromedriverPath = '/usr/local/bin/chromedriver';
} else {
  chromedriverPath = require('chromedriver').path;
}

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 15000;

const timestamp = Date.now();
const TEST_EMAIL = `testbusiness${timestamp}@test.com`;
const TEST_NAME = `TestBiz${timestamp}`;
const TEST_PASSWORD = 'password123';

function getChromeOptions() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1280,800');
  options.addArguments('--disable-extensions');
  options.addArguments('--no-first-run');
  options.addArguments('--disable-background-networking');
  options.addArguments('--shm-size=512m');
  return options;
}

async function buildDriver() {
  const service = new chrome.ServiceBuilder(chromedriverPath);
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(getChromeOptions())
    .setChromeService(service)
    .build();
}

// ── GROUP 1: Page Structure (9 tests) ─────────────────
describe('NexusChat - Group 1: Page Structure', function () {
  this.timeout(60000);
  let driver;

  before(async function () { driver = await buildDriver(); });
  after(async function () { if (driver) await driver.quit(); });
  beforeEach(async function () {
    await driver.get(BASE_URL);
    await driver.sleep(800);
  });

  it('TC01: Page title should be NexusChat', async function () {
    const title = await driver.getTitle();
    if (!title.includes('NexusChat')) throw new Error(`Unexpected title: ${title}`);
  });

  it('TC02: Register name field should be visible', async function () {
    const el = await driver.findElement(By.id('reg-name'));
    if (!await el.isDisplayed()) throw new Error('Register name field not visible');
  });

  it('TC03: Login section should be visible', async function () {
    const el = await driver.findElement(By.id('login-email'));
    if (!await el.isDisplayed()) throw new Error('Login email field not visible');
  });

  it('TC04: Initial status should show DISCONNECTED', async function () {
    const el = await driver.findElement(By.id('status-text'));
    const text = await el.getText();
    if (!text.includes('DISCONNECTED')) throw new Error(`Expected DISCONNECTED, got: ${text}`);
  });

  it('TC05: Connect button visible, Disconnect button hidden initially', async function () {
    const connectBtn = await driver.findElement(By.id('connect-btn'));
    const disconnectBtn = await driver.findElement(By.id('disconnect-btn'));
    if (!await connectBtn.isDisplayed()) throw new Error('Connect button should be visible');
    if (await disconnectBtn.isDisplayed()) throw new Error('Disconnect button should be hidden');
  });

  it('TC06: Chat input area should be hidden before connecting', async function () {
    const inputArea = await driver.findElement(By.id('input-area'));
    const cls = await inputArea.getAttribute('class');
    if (cls.includes('visible')) throw new Error('Input area should be hidden before connecting');
  });

  it('TC07: Messages container should exist on page', async function () {
    const el = await driver.findElement(By.id('messages'));
    if (!await el.isDisplayed()) throw new Error('Messages container not found');
  });

  it('TC08: JWT textarea should be visible', async function () {
    const el = await driver.wait(until.elementLocated(By.id('jwt-input')), TIMEOUT);
    if (!await el.isDisplayed()) throw new Error('JWT input not visible');
  });

  it('TC09: Health check API should return ok', async function () {
    await driver.get(`${BASE_URL}/api/health`);
    const body = await driver.findElement(By.css('body')).getText();
    if (!body.includes('ok')) throw new Error(`Health check failed: ${body}`);
  });
});

// ── GROUP 2: Auth tests (6 tests) ─────────────────────
describe('NexusChat - Group 2: Auth & Interactions', function () {
  this.timeout(60000);
  let driver;

  before(async function () { driver = await buildDriver(); });
  after(async function () { if (driver) await driver.quit(); });
  beforeEach(async function () {
    await driver.get(BASE_URL);
    await driver.sleep(800);
  });

  it('TC10: Register with valid credentials should succeed', async function () {
    await driver.findElement(By.id('reg-name')).sendKeys(TEST_NAME);
    await driver.findElement(By.id('reg-email')).sendKeys(TEST_EMAIL);
    await driver.findElement(By.id('reg-password')).sendKeys(TEST_PASSWORD);
    await driver.findElement(By.css('button.btn.primary')).click();
    const feedback = await driver.findElement(By.id('reg-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (text.toLowerCase().includes('error')) throw new Error(`Registration failed: ${text}`);
  });

  it('TC11: Register with missing name should show error', async function () {
    await driver.findElement(By.id('reg-email')).sendKeys('noname@test.com');
    await driver.findElement(By.id('reg-password')).sendKeys('pass123');
    await driver.findElement(By.css('button.btn.primary')).click();
    const feedback = await driver.findElement(By.id('reg-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for missing name');
  });

  it('TC12: Register with missing password should show error', async function () {
    await driver.findElement(By.id('reg-name')).sendKeys('NoPwdBiz');
    await driver.findElement(By.id('reg-email')).sendKeys('nopwd@test.com');
    await driver.findElement(By.css('button.btn.primary')).click();
    const feedback = await driver.findElement(By.id('reg-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for missing password');
  });

  it('TC13: Login with wrong password should show error', async function () {
    await driver.findElement(By.id('login-email')).sendKeys('nonexistent@test.com');
    await driver.findElement(By.id('login-password')).sendKeys('wrongpassword');
    await driver.findElement(By.css('button.btn[onclick="loginBusiness()"]')).click();
    const feedback = await driver.findElement(By.id('login-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for wrong password');
  });

  it('TC14: Login with empty fields should show error', async function () {
    await driver.findElement(By.css('button.btn[onclick="loginBusiness()"]')).click();
    const feedback = await driver.findElement(By.id('login-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for empty login fields');
  });

  it('TC15: Room name should show global by default', async function () {
    const roomName = await driver.findElement(By.id('room-name'));
    const text = await roomName.getText();
    if (!text.toLowerCase().includes('global')) throw new Error(`Expected global room, got: ${text}`);
  });
});

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Use system chromedriver on Linux (EC2), npm package on Windows
let chromedriverPath;
if (process.platform === 'linux') {
  chromedriverPath = '/usr/local/bin/chromedriver';
} else {
  chromedriverPath = require('chromedriver').path;
}

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

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
  options.addArguments('--disable-background-networking');
  options.addArguments('--no-first-run');
  return options;
}

describe('NexusChat - Selenium Test Suite', function () {
  this.timeout(60000);
  let driver;

  before(async function () {
    const service = new chrome.ServiceBuilder(chromedriverPath);
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(getChromeOptions())
      .setChromeService(service)
      .build();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  beforeEach(async function () {
    await driver.get(BASE_URL);
  });

  // ── TC01 ─────────────────────────────────────────────
  it('TC01: Page title should be NexusChat', async function () {
    const title = await driver.getTitle();
    if (!title.includes('NexusChat')) throw new Error(`Unexpected title: ${title}`);
  });

  // ── TC02 ─────────────────────────────────────────────
  it('TC02: Register name field should be visible', async function () {
    const el = await driver.findElement(By.id('reg-name'));
    if (!await el.isDisplayed()) throw new Error('Register name field not visible');
  });

  // ── TC03 ─────────────────────────────────────────────
  it('TC03: Login section should be visible', async function () {
    const el = await driver.findElement(By.id('login-email'));
    if (!await el.isDisplayed()) throw new Error('Login email field not visible');
  });

  // ── TC04 ─────────────────────────────────────────────
  it('TC04: Initial status should show DISCONNECTED', async function () {
    const el = await driver.findElement(By.id('status-text'));
    const text = await el.getText();
    if (!text.includes('DISCONNECTED')) throw new Error(`Expected DISCONNECTED, got: ${text}`);
  });

  // ── TC05 ─────────────────────────────────────────────
  it('TC05: Connect button visible, Disconnect button hidden initially', async function () {
    const connectBtn = await driver.findElement(By.id('connect-btn'));
    const disconnectBtn = await driver.findElement(By.id('disconnect-btn'));
    if (!await connectBtn.isDisplayed()) throw new Error('Connect button should be visible');
    if (await disconnectBtn.isDisplayed()) throw new Error('Disconnect button should be hidden');
  });

  // ── TC06 ─────────────────────────────────────────────
  it('TC06: Chat input area should be hidden before connecting', async function () {
    const inputArea = await driver.findElement(By.id('input-area'));
    const cls = await inputArea.getAttribute('class');
    if (cls.includes('visible')) throw new Error('Input area should be hidden before connecting');
  });

  // ── TC07 ─────────────────────────────────────────────
  it('TC07: Register with valid credentials should succeed', async function () {
    await driver.findElement(By.id('reg-name')).sendKeys(TEST_NAME);
    await driver.findElement(By.id('reg-email')).sendKeys(TEST_EMAIL);
    await driver.findElement(By.id('reg-password')).sendKeys(TEST_PASSWORD);
    await driver.findElement(By.css('button.btn.primary')).click();

    const feedback = await driver.findElement(By.id('reg-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (text.toLowerCase().includes('error')) throw new Error(`Registration failed: ${text}`);
  });

  // ── TC08 ─────────────────────────────────────────────
  it('TC08: Register with missing name should show error', async function () {
    await driver.findElement(By.id('reg-email')).sendKeys('noname@test.com');
    await driver.findElement(By.id('reg-password')).sendKeys('pass123');
    await driver.findElement(By.css('button.btn.primary')).click();

    const feedback = await driver.findElement(By.id('reg-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for missing name');
  });

  // ── TC09 ─────────────────────────────────────────────
  it('TC09: Register with missing password should show error', async function () {
    await driver.findElement(By.id('reg-name')).sendKeys('NoPwdBiz');
    await driver.findElement(By.id('reg-email')).sendKeys('nopwd@test.com');
    await driver.findElement(By.css('button.btn.primary')).click();

    const feedback = await driver.findElement(By.id('reg-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for missing password');
  });

  // ── TC10 ─────────────────────────────────────────────
  it('TC10: Successful register should display JWT token', async function () {
    const u = Date.now();
    await driver.findElement(By.id('reg-name')).sendKeys(`TokenBiz${u}`);
    await driver.findElement(By.id('reg-email')).sendKeys(`tokenbiz${u}@test.com`);
    await driver.findElement(By.id('reg-password')).sendKeys('pass1234');
    await driver.findElement(By.css('button.btn.primary')).click();

    const tokenBox = await driver.findElement(By.id('reg-token'));
    await driver.wait(async () => (await tokenBox.getText()).length > 10, TIMEOUT);
    const token = await tokenBox.getText();
    if (!token || token.length < 10) throw new Error('JWT token not displayed after registration');
  });

  // ── TC11 ─────────────────────────────────────────────
  it('TC11: Login with valid credentials should succeed', async function () {
    const u = Date.now();
    const email = `logintest${u}@test.com`;

    await driver.findElement(By.id('reg-name')).sendKeys(`LoginBiz${u}`);
    await driver.findElement(By.id('reg-email')).sendKeys(email);
    await driver.findElement(By.id('reg-password')).sendKeys('pass1234');
    await driver.findElement(By.css('button.btn.primary')).click();
    await driver.sleep(1500);

    await driver.findElement(By.id('login-email')).sendKeys(email);
    await driver.findElement(By.id('login-password')).sendKeys('pass1234');
    await driver.findElement(By.css('button.btn[onclick="loginBusiness()"]')).click();

    const feedback = await driver.findElement(By.id('login-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('invalid')) {
      throw new Error(`Login failed: ${text}`);
    }
  });

  // ── TC12 ─────────────────────────────────────────────
  it('TC12: Login with wrong password should show error', async function () {
    await driver.findElement(By.id('login-email')).sendKeys('nonexistent@test.com');
    await driver.findElement(By.id('login-password')).sendKeys('wrongpassword');
    await driver.findElement(By.css('button.btn[onclick="loginBusiness()"]')).click();

    const feedback = await driver.findElement(By.id('login-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for wrong password');
  });

  // ── TC13 ─────────────────────────────────────────────
  it('TC13: Login with empty fields should show error', async function () {
    await driver.findElement(By.css('button.btn[onclick="loginBusiness()"]')).click();

    const feedback = await driver.findElement(By.id('login-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for empty login fields');
  });

  // ── TC14 ─────────────────────────────────────────────
  it('TC14: JWT input field should accept text', async function () {
    const jwtInput = await driver.findElement(By.id('jwt-input'));
    if (!await jwtInput.isDisplayed()) throw new Error('JWT input not visible');
    await jwtInput.sendKeys('test.jwt.token');
    const val = await jwtInput.getAttribute('value');
    if (val !== 'test.jwt.token') throw new Error('JWT input did not accept text');
  });

  // ── TC15 ─────────────────────────────────────────────
  it('TC15: Connecting with invalid JWT should show error', async function () {
    await driver.findElement(By.id('jwt-input')).sendKeys('invalid.token.here');
    await driver.findElement(By.id('connect-btn')).click();

    const feedback = await driver.findElement(By.id('connect-feedback'));
    await driver.wait(async () => (await feedback.getText()).length > 0, TIMEOUT);
    const text = await feedback.getText();
    if (!text) throw new Error('Expected error for invalid JWT');
  });

  // ── TC16 ─────────────────────────────────────────────
  it('TC16: Messages container should exist on page', async function () {
    const el = await driver.findElement(By.id('messages'));
    if (!await el.isDisplayed()) throw new Error('Messages container not found');
  });

  // ── TC17 ─────────────────────────────────────────────
  it('TC17: Health check API should return ok', async function () {
    await driver.get(`${BASE_URL}/api/health`);
    const body = await driver.findElement(By.css('body')).getText();
    if (!body.includes('ok')) throw new Error(`Health check failed: ${body}`);
  });
});

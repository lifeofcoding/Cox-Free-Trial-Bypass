const puppeteer = require("puppeteer");
const sh = require("shelljs");
const random_name = require("node-random-name");
const random_useragent = require("random-useragent");
const fs = require("fs");
const path = require("path");

(async function run() {
  const name = random_name();
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ")[1];

  const agent = random_useragent.getRandom(function (ua) {
    return !ua.userAgent.includes("Mobile") && ua.userAgent.includes("Windows");
  });

  const args = [
    "--user-agent=" + agent,
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
  ];

  const options = {
    args,
    headless: true,
    ignoreHTTPSErrors: true,
  };

  sh.exec("bash ./Macchangerizer.sh && sleep 10", async (code, output) => {
    var macParts = output.match(/(?<=New MAC:       \s*).*?(?=\s* )/gs);

    const mac = macParts[0];

    await new Promise((r) => setTimeout(r, 30000));

    const browser = await puppeteer.launch(options);

    const context = await browser.createIncognitoBrowserContext();

    const page = await context.newPage();

    const preloadFile = fs.readFileSync("./preload.js", "utf8");
    await page.evaluateOnNewDocument(preloadFile);

    await page.goto(
      `http://cwifi-new.cox.com/?mac-address=${mac}&ap-mac=70:03:7E:E2:F4:10&ssid=CoxWiFi&vlan=103&nas-id=BTNRWAGB01.at.at.cox.net&block=false&unique=$HASH`,
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      }
    );

    await page.screenshot({
      path: path.resolve(__dirname) + "/landing.jpeg",
      type: "jpeg",
      quality: 100,
    });

    await page.waitForSelector(
      "#signIn > .signInText > .freeAccessPassSignup > .floatleft > .coxRegisterButton"
    );
    await page.keyboard.down("Tab");
    await page.keyboard.down("Tab");
    await page.keyboard.press("Enter");

    await page.waitForNavigation({ timeout: 90000 });

    var userAgent = await page.evaluate(() => {
      return (function () {
        return window.navigator.userAgent;
      })();
    });

    var url = await page.evaluate(() => {
      return (function () {
        return window.location.href;
      })();
    });

    await page.setViewport({ width: 1440, height: 779 });

    await page.waitForSelector("table #trial_request_voucher_form_firstName");
    await page.click("table #trial_request_voucher_form_firstName");

    await page.type("table #trial_request_voucher_form_firstName", firstName, {
      delay: 200,
    });

    await page.type("table #trial_request_voucher_form_lastName", lastName, {
      delay: 200,
    });

    await page.waitForSelector("table #trial_request_voucher_form_isp");
    await page.click("table #trial_request_voucher_form_isp");

    await page.select("table #trial_request_voucher_form_isp", "Verizon");

    await page.waitForSelector("table #trial_request_voucher_form_email");
    await page.click("table #trial_request_voucher_form_email");

    await page.type(
      "table #trial_request_voucher_form_email",
      `${lastName}.${firstName}@gmail.com`,
      {
        delay: 200,
      }
    );

    await page.waitForSelector(
      ".decisionBlock > table > tbody > tr > .top:nth-child(2)"
    );
    await page.click(".decisionBlock > table > tbody > tr > .top:nth-child(2)");

    await page.waitForSelector(
      "table #trial_request_voucher_form_serviceTerms"
    );
    await page.click("table #trial_request_voucher_form_serviceTerms");

    await page.keyboard.down("Tab");
    await page.keyboard.down("Tab");
    await page.keyboard.press("Enter");

    await page.waitForNavigation({ timeout: 90000 });

    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );

    if (data.includes("Thank you")) {
      console.log("Wifi Connected Successfully");
    }

    await page.screenshot({
      path: path.resolve(__dirname) + "/result.jpeg",
      type: "jpeg",
      quality: 100,
    });

    await browser.close();

    setTimeout(run, 60000 * 60);
  });
})();

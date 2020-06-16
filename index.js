const puppeteer = require("puppeteer");
const sh = require("shelljs");
const random_name = require("node-random-name");
const random_useragent = require("random-useragent");
const fs = require("fs");
const path = require("path");
const randomMac = require("random-mac");
const argv = require("yargs")
  .option("iface", {
    alias: "i",
    describe: "Interfaceto use",
    demandOption: true,
  })
  .option("debug", {
    alias: "d",
    type: "boolean",
    description: "Run with debug output",
  })
  .option("timeout", {
    alias: "t",
    default: 60000,
    description: "Time to wait for page loads",
  }).argv;

const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const domains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "live.com",
  "aol.com",
];

const emailMixer = (firstName, lastName) => {
  let first = rand(0, 1)
    ? firstName + "." + lastName
    : lastName + "." + firstName;

  return `${first}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

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

  sh.exec(
    `bash ./Macchangerizer.sh ${argv.iface} && sleep 10`,
    async (code, output) => {
      var macParts = output.match(/(?<=New MAC:       \s*).*?(?=\s* )/gs);

      const mac = macParts[0];

      await new Promise((r) => setTimeout(r, argv.timeout));

      const browser = await puppeteer.launch(options);

      const context = await browser.createIncognitoBrowserContext();

      const page = await context.newPage();

      try {
        page.on("error", (msg) => {
          throw msg;
        });

        const preloadFile = fs.readFileSync("./preload.js", "utf8");
        await page.evaluateOnNewDocument(preloadFile);

        await page.goto(
          `http://cwifi-new.cox.com/?mac-address=${mac}&ap-mac=${randomMac()}&ssid=CoxWiFi&vlan=103&nas-id=BTNRWAGB01.at.at.cox.net&block=false&unique=$HASH`,
          {
            waitUntil: "networkidle2",
            timeout: 60000,
          }
        );

        if (argv.debug) {
          await page.screenshot({
            path: path.resolve(__dirname) + "/landing.jpeg",
            type: "jpeg",
            quality: 100,
          });

          console.log(
            "[DEBUG]: Landing page screenshot: ",
            path.resolve(__dirname) + "/landing.jpeg"
          );
        }

        await page.waitForSelector(
          "#signIn > .signInText > .freeAccessPassSignup > .floatleft > .coxRegisterButton"
        );
        await page.keyboard.down("Tab");
        await page.keyboard.down("Tab");
        await page.keyboard.press("Enter");

        await page.waitForNavigation({ timeout: argv.timeout });

        var userAgent = await page.evaluate(() => {
          return (function () {
            return window.navigator.userAgent;
          })();
        });

        if (argv.debug) {
          console.log("Using usere-agent:", userAgent);
        }

        await page.setViewport({ width: 1440, height: 779 });

        await page.waitForSelector(
          "table #trial_request_voucher_form_firstName"
        );
        await page.click("table #trial_request_voucher_form_firstName");

        await page.type(
          "table #trial_request_voucher_form_firstName",
          firstName,
          {
            delay: rand(100, 300),
          }
        );

        await page.type(
          "table #trial_request_voucher_form_lastName",
          lastName,
          {
            delay: rand(100, 300),
          }
        );

        await page.waitForSelector("table #trial_request_voucher_form_isp");
        await page.click("table #trial_request_voucher_form_isp");

        await page.select("table #trial_request_voucher_form_isp", "Verizon");

        await page.waitForSelector("table #trial_request_voucher_form_email");
        await page.click("table #trial_request_voucher_form_email");

        await page.type(
          "table #trial_request_voucher_form_email",
          emailMixer(firstName, lastName),
          {
            delay: rand(100, 300),
          }
        );

        await page.waitForSelector(
          ".decisionBlock > table > tbody > tr > .top:nth-child(2)"
        );
        await page.click(
          ".decisionBlock > table > tbody > tr > .top:nth-child(2)"
        );

        await page.waitForSelector(
          "table #trial_request_voucher_form_serviceTerms"
        );
        await page.click("table #trial_request_voucher_form_serviceTerms");

        await page.keyboard.down("Tab");
        await page.keyboard.down("Tab");
        await page.keyboard.press("Enter");

        await page.waitForNavigation({ timeout: argv.timeout });

        var pageText = await page.evaluate(() => {
          return (function () {
            var s = window.getSelection();
            s.removeAllRanges();
            var r = document.createRange();
            r.selectNode(document.body);
            s.addRange(r);
            var c = s.toString();
            s.removeAllRanges();
            return c;
          })();
        });

        if (argv.debug) {
          console.log("[DEBUG]: pageText:", pageText);
        }

        if (pageText.toLowerCase().includes("you are now connected")) {
          let t = new Date().toLocaleString();

          console.log("Wifi Connected Successfully", t);
          if (argv.debug) {
            await page.screenshot({
              path: path.resolve(__dirname) + "/result.jpeg",
              type: "jpeg",
              quality: 100,
            });

            console.log(
              "[DEBUG]: Result page screenshot: ",
              path.resolve(__dirname) + "/result.jpeg"
            );
          }
        } else {
          await page.screenshot({
            path: path.resolve(__dirname) + "/error-result.jpeg",
            type: "jpeg",
            quality: 100,
          });

          console.log(
            "[DEBUG]: Error screenshot: ",
            path.resolve(__dirname) + "/error-result.jpeg"
          );
        }

        await browser.close();

        setTimeout(run, 60000 * 60);
      } catch (err) {
        console.warn("Error: ", err);
        run();
      }
    }
  );
})();

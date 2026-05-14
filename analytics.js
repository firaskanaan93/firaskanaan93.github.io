// Create this free GoatCounter site code at https://www.goatcounter.com/signup.
// If the code is unavailable, replace this value with the code GoatCounter gives you.
const GOATCOUNTER_CODE = "firaskanaan93";

if (GOATCOUNTER_CODE) {
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.appendChild(script);
}

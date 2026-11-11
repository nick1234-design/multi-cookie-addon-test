module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Multi-Cookie FebBox · Configuration</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:#0b1020;color:#eef2ff;font:16px system-ui,sans-serif}main{max-width:620px;margin:auto}.card{background:#151f35;border:1px solid #30405b;border-radius:16px;padding:22px;margin:18px 0}h1{font-size:28px;margin-bottom:8px}h2{font-size:21px}p{color:#bac7dc;line-height:1.55}label{display:block;margin:18px 0 7px;font-weight:650}input{width:100%;padding:14px;border-radius:10px;border:1px solid #40516e;background:#0b1426;color:white;font-size:16px}button,a.btn{display:inline-block;padding:14px 18px;margin:16px 8px 0 0;border:0;border-radius:10px;background:#7185ff;color:white;font-weight:700;text-decoration:none;cursor:pointer;font-size:16px}a.secondary{background:#293a58}.muted{font-size:13px;color:#8fa2c2}.status{padding:13px;background:#0b1426;border-radius:10px;line-height:1.5}#result{white-space:pre-wrap;color:#dce5ff}
</style>
</head>
<body><main>
<h1>Multi-Cookie FebBox</h1>
<p>Configure your two FebBox accounts once. Stremio will automatically request the correct movie or TV episode streams. No IMDb search or manual testing is needed here.</p>
<section class="card">
<h2>FebBox cookie settings</h2>
<div class="status" id="status">Checking secure storage…</div>
<label for="password">Configuration password</label>
<input id="password" type="password" autocomplete="current-password" placeholder="Create a password (10+ characters)">
<p class="muted">Create this password on your first save. Use the same password whenever you update your cookies.</p>
<label for="cookie1">FebBox Cookie 1</label>
<input id="cookie1" type="password" autocomplete="off" placeholder="Paste first ui token">
<label for="cookie2">FebBox Cookie 2</label>
<input id="cookie2" type="password" autocomplete="off" placeholder="Paste second ui token">
<p class="muted">Paste the value of the FebBox ui cookie. A leading ui= is accepted. Cookie values are stored privately and are never shown again after saving.</p>
<button id="save">Save FebBox cookies</button>
<div id="result" aria-live="polite"></div>
</section>
<section class="card">
<h2>Install in Stremio</h2>
<p>After saving your cookies, install the add-on using this manifest address.</p>
<div class="status" id="manifest"></div>
<a class="btn" id="install" href="#">Install in Stremio</a>
<a class="btn secondary" href="/api/manifest">View manifest</a>
</section>
</main>
<script>
const $=id=>document.getElementById(id);
const manifest=location.origin+"/api/manifest";
$("manifest").textContent=manifest;
$("install").href="stremio://"+location.host+"/api/manifest";
async function refresh(){
 try{
  const r=await fetch("/api/settings",{cache:"no-store"});
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||"Storage unavailable");
  $("status").textContent=d.initialized
   ? "Secure storage connected · "+d.cookieCount+" of 2 cookies saved."
   : "Secure storage connected · No cookies saved yet.";
 }catch(e){
  $("status").textContent="Storage is not connected. Connect Redis/Upstash to this Vercel project and set REDIS_URL. FebBox cookies are entered here, not in Vercel.";
 }
}
$("save").addEventListener("click",async()=>{
 $("result").textContent="Saving cookies securely…";
 try{
  const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("password").value,cookie1:$("cookie1").value,cookie2:$("cookie2").value})});
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||"Could not save cookies.");
  $("result").textContent="Saved successfully. "+d.cookieCount+" FebBox cookie(s) are ready for automatic fallback.";
  $("cookie1").value="";$("cookie2").value="";
  await refresh();
 }catch(e){$("result").textContent="Save failed: "+e.message;}
});
refresh();
</script>
</body></html>`);
};

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Multi-Cookie FebBox Configuration</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:#0b1020;color:#eef2ff;font:16px system-ui,sans-serif}main{max-width:720px;margin:auto}.card{background:#151f35;border:1px solid #30405b;border-radius:16px;padding:20px;margin:16px 0}h1{font-size:26px}p{color:#bac7dc;line-height:1.5}label{display:block;margin:14px 0 6px;font-weight:600}input,select{width:100%;padding:13px;border-radius:9px;border:1px solid #40516e;background:#0b1426;color:white;font-size:16px}button,a.btn{display:inline-block;padding:13px 16px;margin:12px 8px 0 0;border:0;border-radius:9px;background:#7185ff;color:white;font-weight:700;text-decoration:none;cursor:pointer}button.secondary{background:#293a58}pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#dce5ff}.muted{font-size:13px;color:#8fa2c2}.status{padding:12px;background:#0b1426;border-radius:10px}.warning{color:#fbbf24}
</style></head><body><main>
<h1>Multi-Cookie FebBox</h1>
<p>Save two FebBox session tokens here. The add-on stores them privately in Redis; they are not placed in the browser URL or returned to the page after saving.</p>
<section class="card">
<h2>Secure cookie configuration</h2>
<div class="status" id="status">Checking secure storage…</div>
<label for="password">Configuration password</label>
<input id="password" type="password" autocomplete="current-password" placeholder="Create a password on first save">
<p class="muted">First time: create a password with at least 10 characters. Later visits: enter the same password to update your cookies.</p>
<label for="cookie1">FebBox cookie 1 (ui token)</label>
<input id="cookie1" type="password" autocomplete="off" placeholder="Paste the value of ui= (token only)">
<label for="cookie2">FebBox cookie 2 (ui token)</label>
<input id="cookie2" type="password" autocomplete="off" placeholder="Paste second ui token (optional)">
<p class="muted">Paste only the value after ui=, not the text "ui=". You can paste a full Cookie header too; the page removes a leading ui= automatically.</p>
<button id="save">Save cookies securely</button>
<pre id="saveResult" aria-live="polite"></pre>
</section>
<section class="card">
<h2>Test movies and TV episodes</h2>
<label for="kind">Content type</label>
<select id="kind"><option value="movie">Movie</option><option value="series">TV show episode</option></select>
<label for="imdb">IMDb ID</label><input id="imdb" placeholder="tt1234567">
<div id="episodeFields" hidden><label for="season">Season</label><input id="season" type="number" min="0" value="1"><label for="episode">Episode</label><input id="episode" type="number" min="1" value="1"></div>
<button id="fallback">Test cookie fallback</button><button class="secondary" id="compare">Test cookies separately</button>
<pre id="testResult" aria-live="polite"></pre>
</section>
<section class="card"><h2>Install in Stremio</h2><p id="manifest"></p><a class="btn" href="/api/manifest">Open manifest</a><button class="secondary" id="copy">Copy manifest URL</button></section>
</main>
<script>
const $=id=>document.getElementById(id);
const manifest=location.origin+"/api/manifest";
$("manifest").textContent=manifest;
$("kind").addEventListener("change",()=>{$("episodeFields").hidden=$("kind").value!=="series";});
async function refreshStatus(){
 try{
  const r=await fetch("/api/settings",{cache:"no-store"});
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||"Secure storage is not available.");
  $("status").textContent=d.initialized
   ? "Secure storage ready · "+d.cookieCount+" of 2 cookies saved. Cookie values are hidden."
   : "Secure storage ready · Create your configuration password and save your first cookie(s).";
 }catch(e){
  $("status").innerHTML='<span class="warning"></span>';
  $("status").textContent="Storage not connected: "+e.message+" Add REDIS_URL in Vercel Environment Variables (this is storage access only; do not add FebBox cookies there).";
 }
}
$("save").addEventListener("click",async()=>{
 $("saveResult").textContent="Saving securely…";
 try{
  const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("password").value,cookie1:$("cookie1").value,cookie2:$("cookie2").value})});
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||"Save failed.");
  $("saveResult").textContent="Saved successfully. "+d.cookieCount+" cookie(s) stored securely.";
  $("cookie1").value="";$("cookie2").value="";
  await refreshStatus();
 }catch(e){$("saveResult").textContent="Could not save: "+e.message;}
});
$("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(manifest);$("testResult").textContent="Manifest URL copied.";}catch(e){$("testResult").textContent=manifest;}});
async function test(compare){
 const id=$("imdb").value.trim();
 if(!id){$("testResult").textContent="Enter an IMDb ID first.";return;}
 const params=new URLSearchParams({type:$("kind").value,id});
 if($("kind").value==="series"){params.set("season",$("season").value);params.set("episode",$("episode").value);}
 if(compare)params.set("compare","1");
 $("testResult").textContent="Testing saved FebBox cookies…";
 try{
  const r=await fetch("/api/stream?"+params.toString());
  const d=await r.json();
  $("testResult").textContent=JSON.stringify(d,null,2);
 }catch(e){$("testResult").textContent="Test failed: "+e.message;}
}
$("fallback").addEventListener("click",()=>test(false));
$("compare").addEventListener("click",()=>test(true));
refreshStatus();
</script></body></html>`);
};

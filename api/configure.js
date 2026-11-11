module.exports = function handler(req, res) {
  try {
    const one = Boolean(process.env.FEBBOX_COOKIE_1);
    const two = Boolean(process.env.FEBBOX_COOKIE_2);
    const count = Number(one) + Number(two);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Multi-Cookie FebBox</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:#0b1020;color:#eef2ff;font:16px system-ui,sans-serif}main{max-width:680px;margin:auto}.card{background:#151f35;border:1px solid #30405b;border-radius:16px;padding:20px;margin:16px 0}h1{font-size:26px}p{color:#bac7dc;line-height:1.5}label{display:block;margin:14px 0 6px}input,select{width:100%;padding:13px;border-radius:9px;border:1px solid #40516e;background:#0b1426;color:white;font-size:16px}button,a.btn{display:inline-block;padding:13px 16px;margin:12px 8px 0 0;border:0;border-radius:9px;background:#7185ff;color:white;font-weight:700;text-decoration:none}pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#dce5ff}
</style>
</head>
<body><main>
<h1>Multi-Cookie FebBox</h1>
<p>Configuration and stream testing dashboard.</p>
<section class="card">
<h2>Cookie status</h2>
<p><strong>${count} of 2 cookies configured</strong></p>
<p>Cookie 1: ${one ? "Configured" : "Missing"}<br>Cookie 2: ${two ? "Configured" : "Missing"}</p>
<p>Set FEBBOX_COOKIE_1 and FEBBOX_COOKIE_2 in Vercel Project Settings, then redeploy. Never paste session cookies into this page or GitHub.</p>
</section>
<section class="card">
<h2>Test stream scraper</h2>
<label for="kind">Content type</label>
<select id="kind"><option value="movie">Movie</option><option value="series">Series episode</option></select>
<label for="imdb">IMDb ID</label>
<input id="imdb" placeholder="tt1234567">
<div id="episodeFields" hidden>
<label for="season">Season</label><input id="season" type="number" min="0" value="1">
<label for="episode">Episode</label><input id="episode" type="number" min="1" value="1">
</div>
<button id="fallback">Test cookie fallback</button>
<button id="compare">Compare cookies separately</button>
<pre id="output" aria-live="polite"></pre>
</section>
<section class="card">
<h2>Stremio installation</h2>
<p>Manifest URL: <span id="manifest"></span></p>
<a class="btn" href="/api/manifest">Open manifest</a>
<button id="copy">Copy manifest URL</button>
</section>
</main>
<script>
const kind=document.getElementById("kind");
const fields=document.getElementById("episodeFields");
const output=document.getElementById("output");
const manifest=location.origin+"/api/manifest";
document.getElementById("manifest").textContent=manifest;
kind.addEventListener("change",function(){fields.hidden=kind.value!=="series";});
document.getElementById("copy").addEventListener("click",function(){
 if(navigator.clipboard){navigator.clipboard.writeText(manifest).then(function(){output.textContent="Manifest URL copied.";}).catch(function(){output.textContent=manifest;});}
 else{output.textContent=manifest;}
});
async function test(compare){
 const id=document.getElementById("imdb").value.trim();
 if(!id){output.textContent="Enter an IMDb ID.";return;}
 const params=new URLSearchParams({type:kind.value,id:id});
 if(kind.value==="series"){
  params.set("season",document.getElementById("season").value);
  params.set("episode",document.getElementById("episode").value);
 }
 if(compare){params.set("compare","1");}
 output.textContent="Testing FebBox cookies...";
 try{
  const response=await fetch("/api/stream?"+params.toString());
  const data=await response.json();
  output.textContent=JSON.stringify(data,null,2);
 }catch(error){output.textContent="Request failed: "+error.message;}
}
document.getElementById("fallback").addEventListener("click",function(){test(false);});
document.getElementById("compare").addEventListener("click",function(){test(true);});
</script>
</body></html>`);
  } catch (error) {
    console.error("Configure page failed:", error);
    return res.status(500).send("Configuration page error. Check Vercel function logs.");
  }
};

module.exports = function handler(req, res) {
  const cookies = [
    process.env.FEBBOX_COOKIE_1,
    process.env.FEBBOX_COOKIE_2,
    ...(process.env.FEBBOX_COOKIES || "").split(/\r?\n|\|\|/)
  ].map(v => String(v || "").trim()).filter(Boolean);
  const count = [...new Set(cookies)].slice(0, 2).length;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Multi-Cookie FebBox Add-on</title>
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#0b1020;color:#eef2ff}
*{box-sizing:border-box}body{margin:0;padding:28px 16px;background:radial-gradient(circle at top,#18264a,#0b1020 55%);min-height:100vh}
main{max-width:720px;margin:0 auto}.panel{background:#121a2e;border:1px solid #293653;border-radius:18px;padding:22px;margin:16px 0;box-shadow:0 12px 35px #0005}
h1{font-size:26px;margin:0 0 8px}.muted{color:#aab6d0;line-height:1.5}.status{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:#0b1428;margin-top:16px}
.dot{width:10px;height:10px;border-radius:50%;background:${count ? "#35d399" : "#f59e0b"}}
label{display:block;font-size:14px;margin:14px 0 7px;color:#cbd5e1}
input,select{width:100%;padding:13px;border-radius:10px;border:1px solid #3a4968;background:#0b1428;color:white;font-size:16px}
button,.link{display:inline-block;border:0;border-radius:10px;padding:13px 16px;background:#6d7cff;color:white;font-weight:700;text-decoration:none;margin:12px 8px 0 0;cursor:pointer}
button.secondary,.link.secondary{background:#263653;color:#e7edff}
#result{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;color:#c8d5ef;line-height:1.55}
.stream{padding:12px;border:1px solid #30405e;border-radius:10px;margin:9px 0;overflow-wrap:anywhere}
.stream a{color:#9db1ff}.small{font-size:12px;color:#93a4c3}
</style></head>
<body><main>
<h1>Multi-Cookie FebBox</h1>
<p class="muted">Configuration and live stream-scraper test page. Your FebBox cookies stay on the server in Vercel Environment Variables; they are never entered into this page or exposed in the browser.</p>
<section class="panel">
<h2>Provider status</h2>
<div class="status"><span class="dot"></span><div><b>${count}/2 FebBox cookies configured</b><div class="small">The scraper tries cookie 1, then cookie 2 when the first returns no streams.</div></div></div>
<p class="muted">Set these in Vercel → Project → Settings → Environment Variables, then redeploy:</p>
<ul><li><code>FEBBOX_COOKIE_1</code> — first FebBox <code>ui</code> token</li><li><code>FEBBOX_COOKIE_2</code> — second FebBox <code>ui</code> token</li><li><code>FEBBOX_REGION</code> — optional; defaults to <code>USA7</code></li></ul>
<p class="small">Do not paste cookies into chat, a public form, or GitHub. If a cookie was committed publicly, revoke that session and create a fresh one.</p>
</section>
<section class="panel">
<h2>Test stream scraping</h2>
<p class="muted">Enter an IMDb ID. For a TV episode, choose Series and enter its season and episode.</p>
<label for="type">Content type</label><select id="type"><option value="movie">Movie</option><option value="series">Series episode</option></select>
<label for="imdb">IMDb ID</label><input id="imdb" placeholder="tt1234567" autocomplete="off">
<div id="episodeFields" hidden><label for="season">Season</label><input id="season" type="number" min="0" value="1"><label for="episode">Episode</label><input id="episode" type="number" min="1" value="1"></div>
<button id="test">Test scraper (fallback)</button><button class="secondary" id="compare">Test each cookie separately</button><div id="result" aria-live="polite"></div>
</section>
<section class="panel">
<h2>Install in Stremio</h2>
<p class="muted">Once both cookies are configured and the deployment is ready, use the manifest URL below.</p>
<a class="link" href="/api/manifest">Open manifest</a>
<button class="secondary" id="copy">Copy manifest URL</button>
<p class="small" id="manifestUrl"></p>
</section>
</main>
<script>
const type=document.getElementById('type'), fields=document.getElementById('episodeFields'), result=document.getElementById('result');
type.addEventListener('change',()=>fields.hidden=type.value!=='series');
const manifest=location.origin+'/api/manifest';
document.getElementById('manifestUrl').textContent=manifest;
document.getElementById('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(manifest);result.textContent='Manifest URL copied.'}catch(e){result.textContent=manifest}});
async function runTest(compare){
 const id=document.getElementById('imdb').value.trim();
 if(!id){result.textContent='Enter an IMDb ID first.';return}
 const params=new URLSearchParams({type:type.value,id});
 if(type.value==='series'){params.set('season',document.getElementById('season').value);params.set('episode',document.getElementById('episode').value)}
 result.textContent='Scraping with the configured FebBox cookies…';
 try{
  if(compare)params.set('compare','1');\n  const response=await fetch('/api/stream?'+params.toString());
  const data=await response.json();
  result.textContent='';
  if(data.error){result.textContent='Error: '+data.error;return}
  const streams=Array.isArray(data.streams)?data.streams:[];
  const summary=document.createElement('p');summary.textContent=streams.length+' stream(s) returned; '+(data.testedCookies||0)+' cookie(s) configured.';result.appendChild(summary);\n  (data.cookieResults||[]).forEach(item=>{const row=document.createElement('p');row.textContent='Cookie '+item.cookie+': '+item.streamCount+' stream(s)';result.appendChild(row)});
  streams.forEach((stream,index)=>{
   const item=document.createElement('div');item.className='stream';
   const title=document.createElement('b');title.textContent=(stream.title||stream.name||'FebBox stream')+' · '+(stream.quality||'Unknown quality');item.appendChild(title);
   const link=document.createElement('p');const a=document.createElement('a');a.href=stream.url||'#';a.textContent='Open stream';a.target='_blank';a.rel='noopener noreferrer';link.appendChild(a);item.appendChild(link);result.appendChild(item);
  });
  if(!streams.length){const empty=document.createElement('p');empty.textContent='No streams found. Check the Vercel function logs for cookie/authentication or source-discovery errors.';result.appendChild(empty)}
 }catch(error){result.textContent='Request failed: '+error.message}
});
</script></body></html>`);
};

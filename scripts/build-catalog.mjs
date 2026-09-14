import { writeFile } from "node:fs/promises";

const query = '*[_type == "categoryPage"] | order(title asc) {title,"slug":slug.current,"groups":categoryProducts[]->{title,"products":contentArea[]->{_id,name,productKey,package,"image":image.asset->url}}}';
const endpoint = new URL("https://xkw8ym5s.apicdn.sanity.io/v2021-03-04/data/query/production");
endpoint.searchParams.set("query", query);

const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
if (!response.ok) throw new Error("Sanity query failed: " + response.status + " " + response.statusText);

const payload = await response.json();
const categories = Array.isArray(payload.result) ? payload.result : [];
const productCount = categories.reduce(function(total, category) {
  return total + (category.groups || []).reduce(function(sum, group) {
    return sum + (group.products || []).length;
  }, 0);
}, 0);

await writeFile("catalog-data.json", JSON.stringify({
  updatedAt: new Date().toISOString(),
  categories: categories
}, null, 2));

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
  });
}

function productCard(product) {
  const image = product.image
    ? '<img src="' + esc(product.image) + '?w=600&h=600&fit=max&auto=format" alt="">'
    : '<div class="placeholder">MARBOK</div>';
  return '<article class="product"><div class="photo">' + image + '</div><div class="info"><span class="code">' + esc(product.productKey || "") + '</span><h3>' + esc(product.name || "Proizvod") + '</h3><p>' + esc(product.package || "Pakovanje na upit") + '</p></div></article>';
}

const allProducts = categories.flatMap(function(category) {
  return (category.groups || []).flatMap(function(group) {
    return (group.products || []).filter(Boolean);
  });
}).filter(function(product) { return product.image; });

const coverImages = allProducts.slice(0, 7).map(function(product, index) {
  return '<div class="cover-product cp' + (index + 1) + '"><img src="' + esc(product.image) + '?w=700&h=700&fit=max&auto=format" alt=""></div>';
}).join("");

const sectionPages = categories.map(function(category, categoryIndex) {
  const groups = (category.groups || []).map(function(group) {
    const products = (group.products || []).filter(Boolean);
    const pages = [];
    for (let i = 0; i < products.length; i += 12) {
      const chunk = products.slice(i, i + 12);
      pages.push('<section class="page products-page theme-' + (categoryIndex % 3) + '"><header class="page-head"><div><span>' + esc(category.title) + '</span><h2>' + esc(group.title || category.title) + '</h2></div><b>MARBOK</b></header><div class="products-grid">' + chunk.map(productCard).join("") + '</div><footer>MARBOK DOO · Katalog proizvoda · marbok.com</footer></section>');
    }
    return pages.join("");
  }).join("");
  const categoryTotal = (category.groups || []).reduce(function(sum, group) { return sum + (group.products || []).length; }, 0);
  return '<section class="page category-page theme-' + (categoryIndex % 3) + '"><div class="category-copy"><span>KATEGORIJA ' + String(categoryIndex + 1).padStart(2, "0") + '</span><h2>' + esc(category.title) + '</h2><p>' + categoryTotal + ' proizvoda u aktuelnoj ponudi</p></div><div class="category-shapes"><i></i><i></i><i></i></div></section>' + groups;
}).join("");

const catalogHtml = '<!doctype html><html lang="sr"><head><meta charset="utf-8"><title>Marbok katalog proizvoda</title><style>' +
'@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a;background:#fff}.page{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;padding:14mm}.cover{background:linear-gradient(145deg,#fff6df 0%,#ffd4dc 45%,#bce6ff 100%)}.logo{display:inline-flex;align-items:center;justify-content:center;width:65mm;height:19mm;border-radius:12mm;background:#e51b2b;color:#fff;font-weight:900;font-size:34px;letter-spacing:2px;box-shadow:0 8px 22px rgba(229,27,43,.25)}.cover-copy{position:relative;z-index:3;width:105mm;margin-top:35mm}.cover-copy small{font-size:12px;font-weight:800;letter-spacing:3px;color:#e51b2b}.cover h1{font-size:55px;line-height:.95;letter-spacing:-3px;margin:8mm 0 6mm}.cover p{font-size:18px;line-height:1.5;color:#536176}.cover-year{position:absolute;left:14mm;bottom:14mm;font-weight:800}.cover-product{position:absolute;width:57mm;height:57mm;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.78);box-shadow:0 12px 35px rgba(7,20,40,.13)}.cover-product img{width:88%;height:88%;object-fit:contain}.cp1{right:13mm;top:22mm}.cp2{right:56mm;top:75mm;width:43mm;height:43mm}.cp3{right:7mm;top:101mm;width:49mm;height:49mm}.cp4{right:54mm;top:139mm;width:54mm;height:54mm}.cp5{right:5mm;top:174mm;width:55mm;height:55mm}.cp6{right:55mm;top:220mm;width:43mm;height:43mm}.cp7{right:9mm;top:245mm;width:39mm;height:39mm}.category-page{display:flex;align-items:center;background:#fff0f2}.category-page.theme-1{background:#eaf7ff}.category-page.theme-2{background:#fff7d6}.category-copy{position:relative;z-index:2;width:150mm}.category-copy span{font-size:13px;font-weight:900;letter-spacing:3px;color:#e51b2b}.category-copy h2{font-size:57px;line-height:.98;letter-spacing:-3px;margin:8mm 0}.category-copy p{font-size:20px;color:#526075}.category-shapes i{position:absolute;border-radius:50%;background:#e51b2b}.category-shapes i:nth-child(1){width:100mm;height:100mm;right:-35mm;top:-25mm}.category-shapes i:nth-child(2){width:60mm;height:60mm;right:20mm;bottom:25mm;background:#f3bd35}.category-shapes i:nth-child(3){width:35mm;height:35mm;right:72mm;top:75mm;background:#168cf0}.products-page{background:linear-gradient(180deg,#fff,#fff 82%,#fff1f3)}.products-page.theme-1{background:linear-gradient(180deg,#fff,#fff 82%,#eaf7ff)}.products-page.theme-2{background:linear-gradient(180deg,#fff,#fff 82%,#fff8dd)}.page-head{height:21mm;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #dfe5ec;margin-bottom:7mm}.page-head span{font-size:9px;letter-spacing:1.5px;font-weight:800;color:#e51b2b}.page-head h2{font-size:24px;margin:2mm 0 0;line-height:1}.page-head b{display:flex;align-items:center;justify-content:center;width:35mm;height:10mm;border-radius:6mm;background:#e51b2b;color:#fff;font-size:14px}.products-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,56mm);gap:4mm}.product{overflow:hidden;border:1px solid #e2e7ed;border-radius:5mm;background:#fff;box-shadow:0 2mm 5mm rgba(7,20,40,.05)}.photo{height:36mm;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#fff,#f2f5f8)}.photo img{width:94%;height:94%;object-fit:contain}.placeholder{font-size:10px;font-weight:900;color:#a8b2be}.info{padding:3mm}.code{float:right;font-size:7px;font-weight:800;color:#768294}.product h3{font-size:10px;line-height:1.15;margin:0 0 2mm;padding-right:12mm;max-height:8mm;overflow:hidden}.product p{font-size:8px;color:#647184;margin:0}footer{position:absolute;left:14mm;right:14mm;bottom:7mm;padding-top:3mm;border-top:1px solid #dfe5ec;font-size:7px;color:#7b8796;letter-spacing:.5px}.last{display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,#071428,#153b69);color:#fff}.last h2{font-size:43px;line-height:1;margin:0 0 8mm}.last p{font-size:17px;color:#cbd6e4;line-height:1.6}.last .register{display:inline-block;margin-top:10mm;padding:5mm 9mm;border-radius:10mm;background:#e51b2b;font-weight:800}.last small{display:block;margin-top:15mm;color:#9fb0c3}' +
'</style></head><body><section class="page cover"><div class="logo">MARBOK</div><div class="cover-copy"><small>AKTUELNA PONUDA</small><h1>Katalog<br>proizvoda</h1><p>Konditorski proizvodi, kućna i lična higijena za poslovne kupce širom Srbije.</p></div>' + coverImages + '<div class="cover-year">MARBOK DOO · ' + new Date().getFullYear() + '</div></section>' + sectionPages + '<section class="page last"><div><h2>Postanite<br>Marbok kupac.</h2><p>Registrujte firmu za pristup veleprodajnim cenama<br>i jednostavno online poručivanje.</p><div class="register">marbok.vercel.app/auth/signup</div><small>marbok.com · marbok.bgd@gmail.com · 011 3472 890</small></div></section></body></html>';

await writeFile("katalog-print.html", catalogHtml);
console.log("Catalog prepared: " + categories.length + " categories, " + productCount + " products.");

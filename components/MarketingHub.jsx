"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import AssetLibrary from "./AssetLibrary";

// Storage layer — shared keys go to Supabase via /api/store, local keys use localStorage
// Always override window.storage so the API-calling version is never blocked by a pre-existing stub
if (typeof window !== 'undefined') {
  window.storage = {
    get: async (key, shared) => {
      if (shared) {
        try {
          const r = await fetch(`/api/store?key=${encodeURIComponent(key)}`);
          const d = await r.json();
          if (d.value !== null && d.value !== undefined) return { value: d.value };
        } catch {}
      }
      try { const v = localStorage.getItem('shared_ns_' + key); return v ? { value: v } : null; } catch { return null; }
    },
    set: async (key, value, shared) => {
      if (shared) {
        try {
          await fetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
        } catch {}
      }
      try { localStorage.setItem('shared_ns_' + key, value); return { value }; } catch { return null; }
    },
    delete: async (key) => { try { localStorage.removeItem('shared_ns_' + key); } catch {} return null; },
    list: async () => ({ keys: [] })
  };
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;

const ORG_ROLES = [
  {id:"exec",       title:"Executive Decision Team", parentId:null},
  {id:"ceo",        title:"Founder / CEO",           parentId:null},
  {id:"packaging",  title:"Packaging Dept.",         parentId:"exec"},
  {id:"creative",   title:"Marketing Creative Director", parentId:"ceo"},
  {id:"sales",      title:"Sales Lead",              parentId:"ceo"},
  {id:"content",    title:"Content Creator",         parentId:"creative"},
  {id:"agencies",   title:"Agencies",                parentId:"creative"},
  {id:"coordinator",title:"Marketing Coordinator",   parentId:"creative"},
  {id:"puff",       title:"Puff Creative",           parentId:"agencies"},
  {id:"studio",     title:"Studio Linear",           parentId:"agencies"},
  {id:"field",      title:"Field Team",              parentId:"sales"},
];

const DEFAULT_BRANDS = {
  headchange:{
    id:"headchange",
    name:"Headchange",
    color:"#A31C1C",
    tagline:"Change Your Head. Change Your Life.",
    story:"Missouri's premium craft hashmakers — born and raised in St. Louis, serving communities across Missouri since 2020. Headchange exists to capture the most honest expression the plant can truly provide. Input material is carefully inspected and hand-selected for quality and aroma, then fresh-frozen to perfectly preserve naturally-occurring cannabinoids and terpenes. The result: big aromas, exotic drops, and a dab experience defined by terpene integrity. No shortcuts.",
    mission:"Curate the best possible cannabis experiences — through craft extraction, terpene preservation, and uncompromising process standards.",
    values:["Terpene Integrity","Fresh-Frozen Process","Craft Over Commodity","Locally-Grown Input"],
    audience:"Concentrate enthusiasts and hash heads, 25–45, who prioritize terpene quality, extraction method, and authenticity. Budtenders and industry insiders. Consumers who research before they buy.",
    tone:"Confident, craft-forward, with a street-level personality. Direct and honest — 'Premium Hash. No BS.' Speaks to enthusiasts without being inaccessible. Can be playful (Flavorful AF) while staying technically credible.",
    typography:"DM Serif Display / DM Sans",
    secondary:"#F5E6C8",
    products:"Live Rosin Concentrate — award-winning, hand-washed, terpiest dab experience · Live Sugar Concentrate — THCa diamonds in terp sauce · Live Badder Concentrate — hand-whipped, terp-rich cake batter consistency · Live Sauce Carts — liquid diamonds & sauce in a cart · Live Rosin Cart — full-spectrum rosin in a cart · Live Resin AIO — live resin all-in-one · Live Rosin AIO — live rosin all-in-one · Mini Hash Holes — mini hash hole pre-rolls",
    positioning:"Flagship / Connoisseur — Missouri's recognized hash leader. Sets quality ceiling for the CÚRADOR portfolio.",
    website:"https://www.headchange710.com"
  },
  safebet:{
    id:"safebet",
    name:"SafeBet",
    color:"#C97820",
    tagline:"It's a Safe Bet.",
    story:"SafeBet is reliability without compromise. Built for consumers who want quality pre-rolls, blunts, and carts they can always count on — rolled tight, packed right, and priced fair. Every joint, cart, and blunt hits the same: clean, smooth, and just right. No guesswork, no surprises. SafeBet's promise is simple: you always know what you're getting. For people who like their smoke smooth and their choices easy.",
    mission:"Deliver reliable quality every time — clean, consistent, and priced fair. Be the brand consumers reach for without thinking twice.",
    values:["Consistency Every Time","Priced Fair","Clean & Smooth","No Surprises","Simple Done Right"],
    audience:"Everyday cannabis consumers who value reliability, consistency, and fair pricing over novelty or connoisseur credentials. Daily-driver buyers, 21–50, who want authentic strain profiles without premium price tags. Pre-roll and cart loyalists.",
    tone:"Straightforward, warm, unpretentious. Let the product do the talking. No hype, no jargon. 'Rolled tight, packed right, priced fair' — honest and direct. Approachable authority.",
    typography:"DM Serif Display / DM Sans",
    secondary:"#FFF4E0",
    products:"Rolls — hand-crafted pre-rolls, top-shelf flower, perfectly ground, smooth even burn · Carts — high-purity distillate, real strain-specific cannabis terpenes (CDTs), consistent potency · FECO — full-spectrum cannabis oil, full-spectrum cannabinoids & terpenes, flexible format, rigorously tested per Missouri DCR · Infused Pre Rolls — premium infused pre-rolls · Bubble Hash Infused — bubble hash infused pre-rolls · Live Resin Infused — live resin infused pre-rolls · Diamond Infused — diamond infused pre-rolls · Safe Bet 1g All in One — 1g all-in-one device · FECO Plus CBN — full-spectrum FECO with added CBN",
    positioning:"Mid-tier / everyday — cannabis-authentic CDT experience at fair price. The dependable daily-driver between Bubbles (flavor/convenience) and Headchange (premium connoisseur).",
    website:"https://www.safebetofficial.com",
    instagram:"@SafeBet_Rolls"
  },
  bubbles:{
    id:"bubbles",
    name:"Bubbles",
    color:"#7B68B5",
    tagline:"Hi, Bubbs!",
    story:"Bubbles is all about bright, juicy flavors that burst across your taste buds in waves of sweet, tangy bliss. From the first inhale to the last draw, you'll be met with mouth-watering terp profiles you'll want to keep coming back to. A flavor-forward vape brand with colorful devices and an uplifting experience that's as fun as it is flavorful. With Bubbles, there's a flavor for every mood — whether you need something energizing, balanced, mellow, or exotic. Meet your new favorite.",
    mission:"Make every pull an experience — bold flavor, vibrant energy, and a vibe that keeps people coming back.",
    values:["Flavor First","Vibrant & Colorful","Uplifting Energy","Mood-Matched Experience","Fun & Accessible"],
    audience:"Casual and recreational consumers, 21–35, who choose by flavor and mood rather than strain science. New-to-cannabis and discretion-forward users. Anyone who wants their cannabis experience to feel fun, bright, and easy.",
    tone:"Bubbly, energetic, sensory-forward. Playful without being juvenile. Speaks in flavor and feeling — 'like a sparkler for your taste buds' / 'a getaway in every hit.' Light, inviting, zero barriers.",
    typography:"Cormorant Garamond / DM Sans",
    secondary:"#F0EBF8",
    products:"Atomic Burst (Sativa) — cherry, blue raspberry & lime · Blue Raz (Indica) — ripened raspberry with tangy citrus · Sweet Dreamz (Indica) — smooth fruity sweetness, mellow vibes · Tiger's Blood (Hybrid) — juicy watermelon & bright citrus · Watermelon Ice (Hybrid) — fresh juicy watermelon, cooled & refreshing · Breezy Blast (Exotic) — tropical lime, crisp & zesty",
    positioning:"Flavor & convenience — captures discretion-focused and casual vape consumers. Non-CDT distillate contrast to SafeBet's cannabis-authentic positioning.",
    website:"https://www.bubblesvape.com"
  },
  airo:{
    id:"airo",
    name:"Airo",
    color:"#00B4D8",
    tagline:"Elevate Your Experience.",
    story:"Airo Brands is a licensed partner brand produced by CÚRADOR. Known for their proprietary AiroPro vaporizer technology, Airo delivers a premium, consistent vape experience with strain-specific live flower and live resin options. We manufacture their carts locally and carry their full line of batteries and flavors.",
    mission:"Deliver a best-in-class vaporizer experience through proprietary hardware and premium oil.",
    values:["Proprietary Hardware","Strain-Specific","Premium Oil","Consistent Experience"],
    audience:"Vape-forward consumers who value hardware quality, flavor consistency, and a premium pull. Tech-savvy cannabis users, 21–40.",
    tone:"Clean, modern, tech-forward. Premium without pretension. Let the hardware and oil speak for themselves.",
    typography:"Inter / DM Sans",
    secondary:"#E0F7FA",
    products:"Airo Batteries — proprietary magnetic snap-in battery devices · Airo Carts — strain-specific live flower and live resin cartridges in all available flavors",
    positioning:"Licensed Partner — premium vape hardware brand manufactured under CÚRADOR license. Distinct from in-house brands.",
    website:"https://www.airobrands.com",
    licensed: true,
  },
};

const DEFAULT_COMPANY = {
  name:"CÚRADOR",
  tagline:"Quality. Craft. Culture.",
  ethos:"CÚRADOR is a Missouri-licensed cannabis manufacturing company operating under a house of brands model — awarded a manufacturing license in the first round of Missouri medical cannabis licensing. Operating as a micro-scale manufacturing lab, CÚRADOR competes not on volume but on quality, execution, and cultural credibility. The company's philosophy is rooted in the belief that craft craftsmanship and internal culture are sustainable competitive advantages in saturated markets: smaller batches, higher standards, and brands built through reputation rather than hype. CÚRADOR also manufactures and distributes AiroPro, a third-party licensed brand using proprietary cartridge technology, providing additional manufacturing throughput and operational leverage.",
  mission:"Sustainable growth through reputation, consistency, and disciplined brand management — building brands that earn long-term consumer trust across every tier of the Missouri cannabis market.",
  values:["Craft Over Volume","Brand Stewardship","Operational Consistency","Cultural Credibility","Disciplined Portfolio Management"],
  model:"Hybrid: proprietary brand development (Headchange, SafeBet, Bubbles) + licensed manufacturing & distribution (AiroPro). Each brand serves a distinct consumer segment with no internal overlap.",
  context:"Missouri's cannabis market is highly competitive — characterized by rapid brand proliferation, price compression, and increasing pressure to differentiate beyond packaging. CÚRADOR's response: quality-driven manufacturing, not commodity production."
};

const DEFAULT_STRATEGY = {brand:"Curador Brands",tagline:"Marketing that moves people.",vision:"Our North Star is to build a connected, insight-driven marketing ecosystem that turns brand moments into lasting cultural relevance — for brands that heal, inspire, and endure.",pillars:["Brand & Identity","Content & Storytelling","Paid & Performance","Community & Partnerships"]};

const DEFAULT_GANTT_URL = "/concepts/gantt.html";

const DEFAULT_FIELDTEAM_TREE = [
  { id:"ft-1", parentId:null, type:"doc", name:"2026 Weekly Drops Menu", sortOrder:0, notes:"", link:"", attachments:[] },
  { id:"ft-2", parentId:null, type:"folder", name:"Sales", sortOrder:1, notes:"", link:"", attachments:[] },
  { id:"ft-2a", parentId:"ft-2", type:"doc", name:"Credit Memo Requests", sortOrder:0, notes:"", link:"", attachments:[] },
  { id:"ft-2b", parentId:"ft-2", type:"doc", name:"Sales Contact List", sortOrder:1, notes:"", link:"", attachments:[] },
  { id:"ft-2c", parentId:"ft-2", type:"doc", name:"Promo Calendar- Work In Progress", sortOrder:2, notes:"", link:"", attachments:[] },
  { id:"ft-3", parentId:null, type:"folder", name:"CRM", sortOrder:2, notes:"", link:"", attachments:[] },
  { id:"ft-3a", parentId:"ft-3", type:"doc", name:"Tier List Tracker", sortOrder:0, notes:"", link:"", attachments:[] },
  { id:"ft-3b", parentId:"ft-3", type:"doc", name:"Centralized Contacts", sortOrder:1, notes:"", link:"", attachments:[] },
  { id:"ft-4", parentId:null, type:"folder", name:"Field Marketing", sortOrder:3, notes:"", link:"", attachments:[] },
  { id:"ft-4a", parentId:"ft-4", type:"doc", name:"Popups and Blitz Calendar", sortOrder:0, notes:"", link:"", attachments:[] },
  { id:"ft-4b", parentId:"ft-4", type:"doc", name:"Events & Event Support", sortOrder:1, notes:"", link:"", attachments:[] },
  { id:"ft-4c", parentId:"ft-4", type:"doc", name:"Field Marketing Weekly", sortOrder:2, notes:"", link:"", attachments:[] },
  { id:"ft-5", parentId:null, type:"folder", name:"Jerry's Folder", sortOrder:4, notes:"", link:"", attachments:[] },
  { id:"ft-5a", parentId:"ft-5", type:"doc", name:"Newsletter - B2B", sortOrder:0, notes:"", link:"", attachments:[] },
  { id:"ft-5b", parentId:"ft-5", type:"doc", name:"Customer Service Board", sortOrder:1, notes:"", link:"", attachments:[] },
  { id:"ft-6", parentId:null, type:"folder", name:"Miscellaneous", sortOrder:5, notes:"", link:"", attachments:[] },
  { id:"ft-7", parentId:null, type:"folder", name:"Archive", sortOrder:6, notes:"", link:"", attachments:[] },
  { id:"ft-8", parentId:null, type:"doc", name:"2026 Field Team 5-15-30 Review", sortOrder:7, notes:"", link:"", attachments:[] },
];

const DEFAULT_INITIATIVES = [
  {id:"init-h2h",     title:"How to Hash Guide",           description:"Branded 'How to Hash' educational booklet placed at point of sale across all partner dispensaries. Covers concentrate types, consumption methods, dosing guidance, and strain profiles. Positions Headchange and CÚRADOR as the authority on craft concentrates in Missouri.", owner:"Brand Team", channel:"12 · In-Store Consumer Education", startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:"headchange", htmlConcept:null, htmlConceptName:"How to Hash Guide", _conceptUrl:"/concepts/how-to-hash.html"},
  {id:"init-buddrops", title:"Bud Drops",                  description:"BudDrops is CÚRADOR's exclusive verified limited-allocation program for top budtenders and cannabis connoisseurs across all brands. Quarterly drops of premium products, early access to new strains, and a direct connection between CÚRADOR brands and their most passionate advocates.",    owner:"Brand Team", channel:"11 · Budtender Appreciation Program",  startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:null, htmlConcept:null, htmlConceptName:"Bud Drops",         _conceptUrl:"/concepts/bud-drops.html"},
  {id:"init-hashnotes",title:"HashNotes",                  description:"HashNotes is Headchange's digital content platform and newsletter — a direct line to concentrate connoisseurs covering craft rosin culture, strain profiles, terpene education, and behind-the-scenes from the lab.",                                                                    owner:"Brand Team", channel:"06 · Social Media Strategy",            startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:"headchange", htmlConcept:null, htmlConceptName:"HashNotes",         _conceptUrl:"/concepts/hashnotes.html"},
  {id:"init-hq",       title:"Hash Headquarters",          description:"Hash Headquarters is Headchange's flagship experiential concept — a physical and digital hub for craft concentrate culture in Missouri. Part education center, part brand immersion, part community gathering space.",                                                                     owner:"Brand Team", channel:"07 · Reimagined Events",               startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:"headchange", htmlConcept:null, htmlConceptName:"Hash Headquarters",  _conceptUrl:"/concepts/hash-headquarters.html"},
  {id:"init-hc-social",title:"Headchange Social Strategy", description:"A comprehensive social media strategy for Headchange — defining the brand voice, content pillars, posting cadence, and platform approach for Instagram-first connoisseur culture.",                                                                                                    owner:"Brand Team", channel:"06 · Social Media Strategy",            startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:"headchange", htmlConcept:null, htmlConceptName:"HC Social Strategy", _conceptUrl:"/concepts/hc-social.html"},
  {id:"init-hc-drop",  title:"Head Change Drop Program",  description:"A limited-release merchandise and product ecosystem inspired by streetwear culture, scarcity marketing, and collectible design. Each drop is treated as a cultural moment — not a product release. Drop access is tied directly into Head Change loyalty, making early access the reward.", owner:"Brand Team", channel:"13 · Brand Merchandise Programs",       startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:"headchange", htmlConcept:null, htmlConceptName:"Head Change Drop Program", _conceptUrl:"/concepts/hc-drop-program.html"},
  {id:"init-hc-sesh",  title:"Quarterly Sesh Playbook",   description:"Full operations and content strategy SOP for the HeadChange Sesh — a quarterly brand event treated as a cultural asset. Covers the discovery gate, admin lockdown, inventory pull, final sprint, content capture shot list, and post-event recycling workflow.", owner:"Brand Team", channel:"07 · Reimagined Events",               startDate:"2026-01-01", endDate:"", revolving:true,  fileUrl:null, fileName:null, _brief:null, brandId:"headchange", htmlConcept:null, htmlConceptName:"Quarterly Sesh Playbook",   _conceptUrl:"/concepts/hc-sesh-playbook.html"},
  {id:"init-email-sms", title:"Email & SMS Marketing",      description:"Direct-to-consumer and B2B email and SMS marketing across all three CÚRADOR brands. Covers product drops, loyalty updates, events, dispensary sell-through communications, and brand newsletters. Segmented by brand, customer tier, and purchase behavior. Positions CÚRADOR as a communication partner with both consumers and dispensary partners — not just a vendor.", owner:"Brand Team", channel:"03 · Email & SMS Marketing", startDate:"2026-01-01", endDate:"", revolving:true, fileUrl:null, fileName:null, _brief:null, brandId:null, htmlConcept:null, htmlConceptName:null},
  {id:"init-sb-float", title:"Float On. Smoke On.", description:"Summer 2026 giveaway campaign tying Safe Bet to Missouri river float culture. Grand prize is a full float weekend — cabin stay, guided float trip, custom Safe Bet raft, branded gear, and product bundle. Entry via Alpine IQ landing page captures email/SMS for CRM growth. Partnered with dispensary chain for in-store activation and fulfillment. 4-phase rollout: tease, launch, amplify, urgency.", owner:"Brand Team", channel:"07 · Reimagined Events", startDate:"2026-06-01", endDate:"2026-08-31", revolving:false, fileUrl:null, fileName:null, _brief:null, brandId:"safebet", htmlConcept:null, htmlConceptName:"Float On Campaign Brief", _conceptUrl:null},
  {id:"init-bb-social", title:"Bubbles Social Media Strategy", description:"Full 2026 social media strategy for Bubbles — content pillars, 3x feed per week cadence, daily stories, 3 influencer verticals (Athlete, Raver, Rebel), 6 festival activations, and Instagram/TikTok playbook. Positions Bubbles as the sensory-first, flavor-chasing vape brand.", owner:"Brand Team", channel:"06 · Social Media Strategy", startDate:"2026-01-01", endDate:"", revolving:true, fileUrl:null, fileName:null, _brief:null, brandId:"bubbles", htmlConcept:null, htmlConceptName:"Bubbles Social Media Strategy 2026", _conceptUrl:null},
  {id:"init-bb-charm", title:"The Charm Initiative", description:"Limited production bag charm and wrist strap program — free with purchase at dispensaries, distributed as swag by field team, and seeded in influencer kits. Taps into rave bag and festival charm culture. Includes carabiner + ball charm design, 3 distribution channels, #CharmTheBag UGC content series, and persona-matched activations.", owner:"Brand Team", channel:"13 · Brand Merchandise Programs", startDate:"2026-01-01", endDate:"", revolving:true, fileUrl:null, fileName:null, _brief:null, brandId:"bubbles", htmlConcept:null, htmlConceptName:"The Charm Initiative 2026", _conceptUrl:null},
];

const DEFAULT_CAMPAIGNS = [
  { id:"cmp-hc-julian", title:"HC × Julian Bast Collab", concept:"Artist Collaboration Series Vol. 01 — a limited-run merchandise capsule with multidisciplinary artist Julian Bast (Name Brand Tattoo, Ann Arbor MI).", brand:"Headchange", objective:"Launch the Head Change Artist Collaboration Series with a limited pre-sale drop featuring 2 original graphics, co-branded apparel, and collectible packaging. Target June 2025.", brief:null, status:"idea", createdBy:"Brand Team", createdAt:"2026-01-01T00:00:00.000Z", _briefFile:null, _briefFileData:null, _briefFileType:null, _fromConcept:null, _htmlName:"HC × Julian Bast Collab Brief", _conceptUrl:"/concepts/hc-julian-bast.html" },
];

const DEFAULT_CAMPAIGN_TIMELINE = [
  {
    id: "ctl-hc-julian",
    campaignId: "cmp-hc-julian",
    title: "HC × Julian Bast",
    brand: "Headchange",
    color: "#c9a84c",
    cost: 0,
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    elements: [
      { id: "el-julian-prod", label: "Production Lead Time", startDate: "2026-04-01", endDate: "2026-04-20", cost: 0 },
      { id: "el-julian-design", label: "Design & Approvals", startDate: "2026-04-21", endDate: "2026-05-15", cost: 0 },
    ],
  },
];

const CHANNELS = [
  "01 · Packaging & QR Journey",
  "02 · In-House Loyalty & Rewards",
  "03 · Email & SMS Marketing",
  "04 · SEO & Web Ecosystem",
  "05 · Online Menu Advertising",
  "06 · Social Media Strategy",
  "07 · Reimagined Events",
  "08 · PR Strategy",
  "09 · Field Marketing Rework",
  "10 · Tiered In-Store Display",
  "11 · Budtender Appreciation Program",
  "12 · In-Store Consumer Education",
  "13 · Brand Merchandise Programs",
];
const CHANNEL_COLORS = ["#c9a84c","#4d9e8e","#8b7fc0","#5a9ed4","#a0624a","#e07b6a","#c9a84c","#4d9e8e","#8b7fc0","#5a9ed4","#a0624a","#e07b6a","#c9a84c"];
const PILLAR_ACCENTS = [{grad:"linear-gradient(135deg,#c9a84c,#a07030)",solid:"#c9a84c"},{grad:"linear-gradient(135deg,#8b7fc0,#5a4e8a)",solid:"#8b7fc0"},{grad:"linear-gradient(135deg,#4d9e8e,#2e6e61)",solid:"#4d9e8e"},{grad:"linear-gradient(135deg,#a0624a,#6e3820)",solid:"#a0624a"}];

function getChannelColor(channel) {
  const idx = CHANNELS.indexOf(channel);
  return idx >= 0 ? CHANNEL_COLORS[idx] : "#c9a84c";
}
const USER_COLORS = [{bg:"#e8c547",text:"#1a1400",label:"Amber"},{bg:"#7ec8a4",text:"#0a1f14",label:"Sage"},{bg:"#e07b6a",text:"#1f0b08",label:"Coral"},{bg:"#89a8e0",text:"#080f20",label:"Slate"},{bg:"#c47eb5",text:"#1a0b18",label:"Mauve"},{bg:"#68c4c4",text:"#062020",label:"Teal"},{bg:"#e09e5a",text:"#1f1008",label:"Ochre"},{bg:"#a8c46a",text:"#111a04",label:"Fern"}];

function colorForName(n){let h=0;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))%USER_COLORS.length;return USER_COLORS[h];}
function initials(n){return n.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);}
function relativeTime(ts){const d=Date.now()-new Date(ts).getTime(),m=Math.floor(d/60000);if(m<1)return"just now";if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function fmtDate(d){if(!d)return"";try{const dt=new Date(d+"T12:00:00");return dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"});}catch{return d;}}
function dateProgress(start,end){
  if(!start||!end) return null;
  const s=new Date(start).getTime(), e=new Date(end).getTime(), n=Date.now();
  if(n<=s) return 0;
  if(n>=e) return 100;
  return Math.round((n-s)/(e-s)*100);
}

const css = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f4f2ee;--surface:#ffffff;--surface2:#f9f8f5;--surface3:#efeee9;
  --border:rgba(0,0,0,.08);--border2:rgba(0,0,0,.04);
  --gold:#b8963a;--gold-light:#d4b155;--gold-dim:rgba(184,150,58,.08);
  --text:#1a1a1f;--text-dim:#4a4a56;--text-muted:#8a8a96;
  --df:'Cormorant Garamond',Georgia,serif;--bf:'Inter',system-ui,sans-serif;--mf:'JetBrains Mono',monospace;
  --lsb:272px;--nw:318px;
}
html,body{background:var(--bg);min-height:100vh;overflow:hidden;}
.page{display:flex;flex-direction:column;height:100vh;max-height:100vh;background:linear-gradient(160deg, #f4f2ee 0%, #eae7e0 40%, #f0ede6 100%);position:relative;overflow:hidden;}
.page::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 30% 20%, rgba(184,150,58,.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(120,100,200,.03) 0%, transparent 50%);}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,177,85,0)}50%{box-shadow:0 0 0 3px rgba(212,177,85,.15)}}
@keyframes cardSweep{from{left:-100%}to{left:200%}}
.skeleton{background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.8s ease-in-out infinite;border-radius:8px;}

/* HEADER */
.hdr{display:flex;align-items:center;justify-content:space-between;padding:13px 24px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.72);position:sticky;top:0;z-index:70;backdrop-filter:blur(20px) saturate(1.6);flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.04);}
.hdr-brand{display:flex;align-items:center;gap:11px;}
.hdr-logo{width:30px;height:30px;background:linear-gradient(135deg,var(--gold),#a07030);border-radius:7px;display:grid;place-items:center;font-family:var(--df);font-size:16px;color:#fff;font-weight:600;flex-shrink:0;}
.hdr-name{font-family:var(--df);font-size:17px;font-weight:500;letter-spacing:.02em;}
.hdr-sub{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.13em;margin-top:1px;}
.hdr-right{display:flex;gap:7px;align-items:center;}
.tz-bar{display:flex;gap:10px;align-items:center;padding:5px 14px;margin:0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;backdrop-filter:blur(12px);}
.tz-date{font-size:11px;color:var(--gold);font-family:var(--mf);font-weight:600;letter-spacing:.06em;white-space:nowrap;}
.tz-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px 6px;border-radius:6px;transition:background .15s;}
.tz-item:hover{background:rgba(255,255,255,.04);}
.tz-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);font-weight:600;}
.tz-time{font-size:13px;color:var(--text);font-family:var(--mf);font-weight:500;letter-spacing:.04em;}
.tz-sep{width:1px;height:22px;background:rgba(255,255,255,.08);flex-shrink:0;}

/* BODY */
.body-row{display:flex;flex:1;height:calc(100vh - 57px);overflow:hidden;}

/* LEFT SIDEBAR */
.lsb{width:var(--lsb);flex-shrink:0;border-right:1px solid var(--border);background:rgba(255,255,255,.55);backdrop-filter:blur(20px) saturate(1.4);display:flex;flex-direction:column;transition:width .3s cubic-bezier(.4,0,.2,1);overflow-x:hidden;overflow-y:hidden;height:100%;}
.lsb.collapsed{width:48px;}
.lsb-top{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 10px;border-bottom:1px solid var(--border2);flex-shrink:0;min-height:46px;}
.lsb-top-title{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-muted);font-weight:500;white-space:nowrap;overflow:hidden;}
.lsb-cb{width:22px;height:22px;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;display:grid;place-items:center;font-size:10px;flex-shrink:0;transition:all .15s;}
.lsb-cb:hover{border-color:var(--gold);color:var(--gold);}
.lsb-nav{display:flex;flex-direction:column;gap:2px;padding:8px 7px;border-bottom:1px solid var(--border2);flex-shrink:0;}
.lsb-tab{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:7px;border:none;background:transparent;color:var(--text-dim);cursor:pointer;font-family:var(--bf);font-size:11px;font-weight:500;text-align:left;transition:all .15s;white-space:nowrap;width:100%;}
.lsb-tab:hover{background:rgba(0,0,0,.04);color:var(--text);transform:scale(1.03);}
.lsb-tab.on{background:var(--gold-dim);color:var(--gold);box-shadow:0 1px 3px rgba(184,150,58,.1);}
.lsb-icon{font-size:13px;flex-shrink:0;width:18px;text-align:center;}
.lsb-lbl{overflow:hidden;white-space:nowrap;}
.lsb-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;-webkit-overflow-scrolling:touch;}

/* ── COMPANY PANEL TABS ── */
.cp-nav{display:flex;flex-direction:column;padding:10px 8px;gap:4px;}
.cp-master-tab{width:100%;padding:11px 13px;border:none;border-radius:9px;background:var(--surface2);cursor:pointer;font-family:var(--bf);text-align:left;transition:all .18s;border:1px solid var(--border2);display:flex;align-items:center;gap:10px;}
.cp-master-tab:hover{border-color:rgba(201,168,76,.3);background:rgba(201,168,76,.04);}
.cp-master-tab.on{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.07);}
.cp-master-tab-logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--gold),#a07030);display:grid;place-items:center;font-family:var(--df);font-size:15px;color:#fff;font-weight:600;flex-shrink:0;}
.cp-master-tab-name{font-family:var(--df);font-size:15px;font-weight:400;color:var(--text);line-height:1.1;}
.cp-master-tab-sub{font-size:9px;color:var(--text-muted);letter-spacing:.09em;text-transform:uppercase;margin-top:1px;}
.cp-master-tab.on .cp-master-tab-name{color:var(--gold);}
.cp-brands-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);padding:8px 6px 4px;font-weight:500;}
.cp-brand-tab{width:100%;padding:8px 10px;border:none;border-radius:8px;background:transparent;cursor:pointer;font-family:var(--bf);text-align:left;transition:all .15s;border:1px solid transparent;display:flex;align-items:center;gap:9px;}
.cp-brand-tab:hover{background:var(--surface2);border-color:var(--border2);}
.cp-brand-tab.on{background:var(--surface2);}
.cp-brand-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.cp-brand-name{font-size:12px;font-weight:500;color:var(--text);}
.cp-brand-tagline{font-size:10px;color:var(--text-muted);font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cp-brand-arr{font-size:11px;margin-left:auto;flex-shrink:0;}
.cp-brand-chevron{font-size:9px;flex-shrink:0;transition:transform .18s;color:var(--text-muted);}
.cp-brand-chevron.open{transform:rotate(90deg);}
/* Brand initiative dropdown in sidebar */
.cp-brand-inits{padding:4px 6px 6px 14px;display:flex;flex-direction:column;gap:3px;}
.cp-init-row{display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:7px;cursor:pointer;border:1px solid transparent;transition:all .13s;background:transparent;}
.cp-init-row:hover{background:var(--surface2);border-color:var(--border2);}
.cp-init-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0;}
.cp-init-title{font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cp-init-qtr{font-size:9px;color:var(--text-muted);flex-shrink:0;}
.cp-brand-add{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;border:1px dashed rgba(255,255,255,.07);background:transparent;color:var(--text-muted);font-family:var(--bf);font-size:10px;cursor:pointer;width:100%;margin-top:2px;transition:all .13s;text-align:left;}
.cp-brand-add:hover{border-color:rgba(201,168,76,.3);color:var(--gold);}
/* Brand initiative grid in detail view */
.bi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;padding:0;}
.bi-card{background:rgba(255,255,255,.7);backdrop-filter:blur(8px);border-radius:10px;padding:14px 15px;cursor:pointer;transition:all .2s cubic-bezier(.4,0,.2,1);border:1px solid var(--border);border-left-width:2px;display:flex;flex-direction:column;gap:6px;box-shadow:0 1px 4px rgba(0,0,0,.04);}
.bi-card:hover{background:rgba(255,255,255,.9);border-color:rgba(0,0,0,.1);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08);}
.bi-pillar{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);}
.bi-title{font-size:13px;font-weight:500;color:var(--text);line-height:1.35;}
.bi-desc{font-size:11px;color:var(--text-muted);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.bi-foot{display:flex;align-items:center;justify-content:space-between;margin-top:2px;}
.bi-owner{font-size:10px;color:var(--text-muted);}
.bi-qtr{font-size:10px;color:var(--text-muted);}
/* Brand selector in Add Initiative modal */
.brand-sel-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;}
.brand-sel-chip{padding:5px 11px;border-radius:100px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-family:var(--bf);font-size:11px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;}
.brand-sel-chip:hover{border-color:rgba(255,255,255,.15);color:var(--text);}
.brand-sel-chip.on{color:var(--text);}
.brand-sel-pip{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
/* Brief upload */
.bu-zone{border:2px dashed rgba(0,0,0,.1);border-radius:12px;padding:24px 20px;text-align:center;cursor:pointer;transition:all .18s;background:rgba(0,0,0,.01);}
.bu-zone:hover,.bu-zone.drag{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.04);}
.bu-icon{font-size:26px;margin-bottom:8px;display:block;opacity:.5;}
.bu-title{font-size:14px;color:var(--text-dim);margin-bottom:3px;}
.bu-sub{font-size:11px;color:var(--text-muted);}
.bu-file-row{display:flex;align-items:center;gap:9px;padding:9px 12px;background:rgba(201,168,76,.07);border:1px solid rgba(201,168,76,.2);border-radius:8px;margin-bottom:10px;}
.bu-file-name{font-size:12px;color:var(--gold);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bu-file-rm{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:15px;line-height:1;transition:color .13s;padding:0 2px;}
.bu-file-rm:hover{color:var(--text);}
.bu-processing{display:flex;align-items:center;gap:10px;padding:14px;background:var(--surface2);border-radius:9px;border:1px solid var(--border2);margin-bottom:12px;}
.bu-proc-txt{font-size:12px;color:var(--text-dim);}
.bu-preview{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:14px 15px;margin-bottom:12px;}
.bu-prev-title{font-family:var(--df);font-size:17px;color:var(--text);margin-bottom:6px;line-height:1.2;}
.bu-prev-body{font-size:12px;color:var(--text-dim);line-height:1.7;}
.bu-prev-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;}
.bu-prev-chip{font-size:10px;padding:2px 8px;border-radius:100px;background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.15);}
.bi-card.from-brief{border-top:2px solid var(--gold);}
.bi-brief-badge{font-size:8px;padding:1px 6px;border-radius:100px;background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.15);font-weight:600;letter-spacing:.04em;text-transform:uppercase;}
.cp-hero{padding:16px 14px 12px;border-bottom:1px solid var(--border2);}
.cp-eyebrow{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:7px;font-weight:600;}
.cp-name{font-family:var(--df);font-size:21px;font-weight:300;color:var(--text);line-height:1.1;margin-bottom:4px;}
.cp-tagline{font-size:11px;color:var(--text-dim);font-style:italic;margin-bottom:10px;}
.cp-txt{font-size:11.5px;color:var(--text-dim);line-height:1.8;}
.cp-section{padding:11px 14px;border-bottom:1px solid var(--border2);}
.cp-sec-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:7px;font-weight:500;}
.cp-val{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text-dim);padding:3px 0;}
.cp-val::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--gold);flex-shrink:0;}
.cp-mission-txt{font-size:11.5px;color:var(--text-dim);line-height:1.75;font-style:italic;}

/* ── BRAND CARD (full) ── */
.bc-header{padding:0;margin-bottom:0;}
.bc-banner{height:5px;width:100%;flex-shrink:0;}
.bc{padding:14px 14px 18px;}
.bc-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border2);}
.bc-swatch{width:28px;height:28px;border-radius:8px;flex-shrink:0;}
.bc-name{font-family:var(--df);font-size:19px;font-weight:400;color:var(--text);}
.bc-tagline{font-size:11px;font-style:italic;}
.bc-sec{margin-bottom:13px;}
.bc-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;font-weight:500;}
.bc-txt{font-size:11.5px;color:var(--text-dim);line-height:1.78;}
.bc-pills{display:flex;flex-wrap:wrap;gap:4px;}
.bc-pill{font-size:10px;padding:3px 9px;border-radius:100px;font-weight:500;border:1px solid;}
.bc-gr{display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--border2);font-size:11px;}
.bc-gr:last-child{border:none;}
.bc-gk{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;width:70px;flex-shrink:0;padding-top:1px;}
.bc-gv{color:var(--text-dim);flex:1;}
.bc-cswatch{width:13px;height:13px;border-radius:3px;flex-shrink:0;margin-top:1px;}
.bc-color-row{display:flex;align-items:center;gap:7px;}

/* ── TEAM PANEL ── */
.tp{padding:0;}
.tp-org{padding:14px 12px 8px;border-bottom:1px solid var(--border2);}
.org-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;font-weight:500;}
.org-chart{display:flex;flex-direction:column;align-items:center;gap:0;}
.org-level{display:flex;justify-content:center;gap:5px;padding:0 4px;}
.org-level-gap{height:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.org-vert{width:1px;background:var(--border);flex:1;}
.org-horiz{display:flex;align-items:center;width:100%;}
.org-horiz-line{height:1px;background:var(--border);flex:1;}
.org-node{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transition:transform .15s;}
.org-node:hover{transform:translateY(-1px);}
.org-box{padding:5px 9px;border-radius:7px;border:1px solid var(--border);background:var(--surface2);font-size:9px;font-weight:500;color:var(--text-dim);text-align:center;transition:all .15s;white-space:nowrap;line-height:1.3;}
.org-node:hover .org-box{border-color:rgba(201,168,76,.35);color:var(--text);background:rgba(201,168,76,.04);}
.org-node.populated .org-box{border-color:rgba(201,168,76,.25);background:rgba(201,168,76,.05);color:var(--text);}
.org-node.me .org-box{border-color:var(--gold);color:var(--gold);background:rgba(201,168,76,.07);}
.org-avs{display:flex;justify-content:center;margin-top:1px;}
.org-av{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--surface);display:grid;place-items:center;font-size:7px;font-weight:700;margin-left:-3px;}
.org-av:first-child{margin-left:0;}
.tp-members{padding:10px 10px 6px;}
.team-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;font-weight:500;}
.member-row{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;border:1px solid var(--border2);cursor:pointer;transition:all .15s;margin-bottom:5px;}
.member-row:hover{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.02);}
.member-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0;}
.member-info{flex:1;min-width:0;}
.member-name{font-size:12px;font-weight:500;color:var(--text);}
.member-role{font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.me-badge{font-size:9px;padding:2px 6px;border-radius:100px;background:var(--gold-dim);color:var(--gold);border:1px solid rgba(201,168,76,.2);margin-left:auto;flex-shrink:0;}
.empty-team{padding:20px 8px;text-align:center;color:var(--text-muted);font-size:12px;line-height:1.75;}
.tp-add-btn{margin:4px 10px 10px;width:calc(100% - 20px);padding:8px;border-radius:8px;border:1px dashed rgba(255,255,255,.08);background:transparent;color:var(--text-muted);font-family:var(--bf);font-size:11px;cursor:pointer;transition:all .15s;}
.tp-add-btn:hover{border-color:rgba(201,168,76,.3);color:var(--gold);}

/* ── CHANNELS PANEL ── */
.ch-hdr{padding:11px 12px 8px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;}
.ch-hdr-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);font-weight:500;}
.ch-hdr-ct{font-size:10px;color:var(--text-muted);}
.ch-pillar{padding:8px 10px 4px;}
.ch-p-hdr{display:flex;align-items:center;gap:7px;margin-bottom:6px;padding:5px 6px;border-radius:6px;}
.ch-p-stripe{width:3px;height:28px;border-radius:2px;flex-shrink:0;}
.ch-p-name{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--text-dim);flex:1;}
.ch-p-ct{font-size:9px;color:var(--text-muted);background:var(--surface2);padding:2px 6px;border-radius:100px;border:1px solid var(--border2);}
.ch-card{padding:9px 10px;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;margin-bottom:4px;cursor:pointer;transition:all .15s;border-left-width:2px;}
.ch-card:hover{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.02);}
.ch-card.active{background:var(--gold-dim);}
.ch-card-title{font-size:11.5px;font-weight:500;color:var(--text);line-height:1.35;margin-bottom:3px;}
.ch-card-desc{font-size:10.5px;color:var(--text-muted);line-height:1.55;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.ch-card-meta{display:flex;align-items:center;justify-content:space-between;font-size:10px;color:var(--text-muted);}
.ch-card-badge{font-size:9px;padding:1px 6px;border-radius:100px;background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.15);}

/* ── CAMPAIGNS PANEL ── */
.cmp-hdr{padding:11px 12px 9px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;}
.cmp-hdr-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);font-weight:500;}
.cmp-list{padding:8px 8px;display:flex;flex-direction:column;gap:5px;}
.cmp-card{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:11px 12px;cursor:pointer;transition:all .15s;border-left-width:2px;}
.cmp-card:hover{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.015);}
.cmp-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:5px;}
.cmp-card-title{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;flex:1;}
.cmp-status{font-size:8.5px;padding:2px 7px;border-radius:100px;font-weight:600;letter-spacing:.05em;flex-shrink:0;text-transform:uppercase;}
.cmp-status.idea{background:rgba(201,168,76,.12);color:var(--gold);border:1px solid rgba(201,168,76,.2);}
.cmp-status.brief{background:rgba(139,127,192,.12);color:#8b7fc0;border:1px solid rgba(139,127,192,.2);}
.cmp-status.approved{background:rgba(77,158,142,.12);color:#4d9e8e;border:1px solid rgba(77,158,142,.2);}
.cmp-card-desc{font-size:11px;color:var(--text-dim);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.cmp-card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:6px;}
.cmp-card-brand{font-size:10px;color:var(--text-muted);}
.cmp-card-arr{font-size:11px;color:var(--text-muted);}
.cmp-empty{padding:32px 14px;text-align:center;color:var(--text-muted);font-size:12px;line-height:1.75;}
.cmp-empty-icon{font-size:28px;display:block;margin-bottom:10px;opacity:.4;}

/* MAIN */
.main{flex:1;min-width:0;min-height:0;overflow:auto;transition:margin-right .35s cubic-bezier(.4,0,.2,1);overscroll-behavior:none;-webkit-overflow-scrolling:touch;}
.main.nr{margin-right:var(--nw);}
/* ── ASSET LIBRARY (DAM) ── */
.dam-wrap{display:flex;height:100%;min-height:calc(100vh - 57px);}
.dam-sb{width:210px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;background:var(--surface);}
.dam-sb::-webkit-scrollbar{width:3px;}
.dam-sb::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);}
.dam-sb-hdr{padding:14px 14px 5px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--text-muted);font-weight:700;}
.dam-sb-btn{display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;border:none;background:transparent;width:100%;text-align:left;font-family:var(--bf);font-size:13px;color:var(--text-dim);transition:all .13s;}
.dam-sb-btn:hover{background:rgba(255,255,255,.04);color:var(--text);}
.dam-sb-btn.on{background:var(--gold-dim);color:var(--gold);}
.dam-sb-ico{font-size:11px;width:15px;text-align:center;flex-shrink:0;}
.dam-sb-cnt{margin-left:auto;font-size:9px;opacity:.32;}
.dam-sb-div{height:1px;background:var(--border2);margin:6px 12px;}
.dam-sb-btn.sub{padding-left:30px;font-size:12px;color:var(--text-muted);}
.dam-sb-btn.sub.on{color:var(--gold);background:var(--gold-dim);}
.dam-chev{margin-left:auto;font-size:9px;opacity:.4;transition:transform .2s;}
.dam-chev.open{transform:rotate(90deg);}
.dam-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.dam-bar{padding:11px 18px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--border2);flex-shrink:0;}
.dam-sw{position:relative;flex:1;}
.dam-si{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--text-muted);pointer-events:none;}
.dam-search{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px 8px 32px;color:var(--text);font-family:var(--bf);font-size:14px;outline:none;transition:border-color .15s;box-sizing:border-box;}
.dam-search:focus{border-color:rgba(201,168,76,.3);}
.dam-vbtn{width:27px;height:27px;display:grid;place-items:center;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;font-size:12px;transition:all .12s;}
.dam-vbtn.on{border-color:rgba(201,168,76,.4);color:var(--gold);background:var(--gold-dim);}
.dam-add{display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:7px;border:1px solid rgba(201,168,76,.28);background:var(--gold-dim);color:var(--gold);font-family:var(--bf);font-size:11px;font-weight:600;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;transition:all .14s;white-space:nowrap;}
.dam-add:hover{background:rgba(201,168,76,.18);}
.dam-body{flex:1;overflow-y:auto;padding:16px 18px;}
.dam-cnt{font-size:10px;color:var(--text-muted);margin-bottom:12px;}
.dam-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;}
.dam-list{display:flex;flex-direction:column;gap:4px;}
.dam-card{background:var(--surface);border:1px solid var(--border2);border-radius:11px;overflow:hidden;cursor:pointer;transition:all .17s;position:relative;}
.dam-card:hover{border-color:rgba(255,255,255,.13);background:var(--surface2);transform:translateY(-2px);box-shadow:0 8px 26px rgba(0,0,0,.28);}
.dam-card-thumb{aspect-ratio:4/3;background:var(--surface2);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
.dam-card-thumb img{width:100%;height:100%;object-fit:cover;opacity:.88;position:absolute;inset:0;}
.dam-card-fb{font-size:36px;opacity:.18;}
.dam-card-acts{position:absolute;top:6px;right:6px;display:flex;gap:3px;opacity:0;transition:opacity .13s;}
.dam-card:hover .dam-card-acts{opacity:1;}
.dam-iact{width:22px;height:22px;border-radius:5px;border:none;background:rgba(7,7,15,.85);color:rgba(255,255,255,.7);cursor:pointer;display:grid;place-items:center;font-size:10px;backdrop-filter:blur(8px);transition:all .11s;}
.dam-iact:hover{background:var(--gold);color:var(--bg);}
.dam-iact.del:hover{background:#e07b6a;color:#fff;}
.dam-card-body{padding:8px 10px;}
.dam-card-name{font-size:13px;color:var(--text);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.dam-card-meta{display:flex;align-items:center;gap:5px;}
.dam-bchip{font-size:8px;padding:1px 5px;border-radius:3px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}
.dam-row{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:rgba(255,255,255,.02);cursor:pointer;transition:all .12s;}
.dam-row:hover{background:var(--surface2);border-color:rgba(255,255,255,.1);}
.dam-row-thumb{width:34px;height:34px;border-radius:6px;background:var(--surface2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:15px;position:relative;}
.dam-row-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85;}
.dam-row-name{flex:1;font-size:14px;color:var(--text);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dam-row-type{font-size:10px;color:var(--text-muted);min-width:120px;}
.dam-row-date{font-size:10px;color:var(--text-muted);min-width:78px;text-align:right;}
.dam-row-acts{display:flex;gap:3px;opacity:0;transition:opacity .12s;}
.dam-row:hover .dam-row-acts{opacity:1;}
.dam-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;color:var(--text-muted);gap:12px;text-align:center;}
/* DAM Preview overlay */
.dam-preview{position:fixed;inset:0;z-index:200;background:rgba(7,7,15,.97);display:flex;flex-direction:column;}
.dam-phdr{padding:11px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;}
.dam-ptitle{flex:1;font-size:13px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dam-pwrap{flex:1;display:flex;overflow:hidden;}
.dam-pbody{flex:1;position:relative;overflow:hidden;background:#08080f;display:flex;align-items:center;justify-content:center;}
.dam-pbody iframe{position:absolute;inset:0;width:100%;height:100%;border:none;}
.dam-ghost{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.dam-ghost img{width:100%;height:100%;object-fit:contain;filter:blur(3px) brightness(.55);opacity:.18;}
.dam-ploading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;pointer-events:none;z-index:2;}
.dam-noembed{display:flex;flex-direction:column;align-items:center;gap:18px;}
@keyframes damSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.dam-spin{animation:damSpin 2s linear infinite;font-size:30px;opacity:.22;}
.dam-psb{width:236px;border-left:1px solid var(--border);padding:16px;overflow-y:auto;flex-shrink:0;}
.dam-mlbl{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:3px;font-weight:700;}
.dam-mval{font-size:12px;color:var(--text-dim);margin-bottom:12px;}
.dam-ptag{display:inline-block;font-size:9px;padding:2px 7px;border-radius:100px;background:var(--surface2);color:var(--text-muted);border:1px solid var(--border);margin:2px 2px 0 0;}
.dam-plink{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:7px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text-dim);font-family:var(--bf);font-size:11px;cursor:pointer;transition:all .12s;margin-bottom:6px;box-sizing:border-box;}
.dam-plink:hover{background:var(--surface3);border-color:rgba(255,255,255,.15);}
.dam-pnote{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:7px;border-radius:8px;border:1px solid rgba(201,168,76,.2);background:var(--gold-dim);color:var(--gold);font-family:var(--bf);font-size:11px;cursor:pointer;transition:all .12s;margin-bottom:6px;box-sizing:border-box;}
.dam-pnote:hover{background:rgba(201,168,76,.18);}
.dam-pdel{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:7px;border-radius:8px;border:1px solid rgba(224,123,106,.2);background:transparent;color:rgba(224,123,106,.6);font-family:var(--bf);font-size:11px;cursor:pointer;transition:all .12s;box-sizing:border-box;}
.dam-pdel:hover{background:rgba(224,123,106,.06);}
/* DAM Add/Settings modal */
.dam-overlay{position:fixed;inset:0;z-index:300;background:rgba(7,7,15,.88);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);}
.dam-modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;}
.dam-mhdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.dam-mtitle{font-size:18px;font-weight:400;color:var(--text);font-family:var(--df);}
.dam-mclose{width:27px;height:27px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;font-size:16px;display:grid;place-items:center;}
.dam-field{margin-bottom:12px;}
.dam-field label{display:block;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px;font-weight:700;}
.dam-fi,.dam-fsel,.dam-fta{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 11px;color:var(--text);font-family:var(--bf);font-size:13px;outline:none;transition:border-color .15s;box-sizing:border-box;}
.dam-fi:focus,.dam-fsel:focus,.dam-fta:focus{border-color:rgba(201,168,76,.4);}
.dam-fsel option,.dam-fsel optgroup{background:var(--surface);}
.dam-frow{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.dam-mfoot{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;}
.dam-btn{padding:7px 15px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-family:var(--bf);font-size:12px;cursor:pointer;transition:all .12s;}
.dam-btn:hover{background:var(--surface2);}
.dam-btn-gold{background:var(--gold-dim);border-color:rgba(201,168,76,.3);color:var(--gold);font-weight:600;}
.dam-btn-gold:hover{background:rgba(201,168,76,.18);}
.dam-btn-gold:disabled{opacity:.35;cursor:not-allowed;}
.dam-folder-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.dam-folder-lbl{font-size:11px;color:var(--text-dim);width:90px;flex-shrink:0;}
/* DAM inline note */
.dam-innote{padding:10px 18px;border-bottom:1px solid var(--border2);background:rgba(201,168,76,.03);flex-shrink:0;}
.dam-inlbl{font-size:9px;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;font-weight:700;margin-bottom:5px;}
.dam-inrow{display:flex;gap:7px;}
.dam-inta{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 9px;color:var(--text);font-family:var(--bf);font-size:12px;line-height:1.55;resize:none;outline:none;min-height:48px;transition:border-color .13s;}
.dam-inta:focus{border-color:rgba(201,168,76,.36);}
.dam-inpost{align-self:flex-end;padding:6px 11px;border-radius:7px;border:none;background:var(--gold);color:var(--bg);font-family:var(--bf);font-size:11px;font-weight:700;cursor:pointer;}
.dam-inpost:disabled{opacity:.35;cursor:not-allowed;}

.hub{background:var(--bg);color:var(--text);font-family:var(--bf);font-size:14px;line-height:1.5;}

/* HERO */
.hero{position:relative;overflow:hidden;}
.hero-glow{position:absolute;top:-200px;left:35%;transform:translateX(-50%);width:800px;height:600px;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.07) 0%,transparent 65%);pointer-events:none;}
.hero-glow2{position:absolute;bottom:-80px;right:-60px;width:450px;height:450px;background:radial-gradient(ellipse at 80% 80%,rgba(139,127,192,.05) 0%,transparent 65%);pointer-events:none;}
.hero-line{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(201,168,76,.7) 20%,rgba(201,168,76,.3) 60%,transparent 100%);}
.hero-edit{position:absolute;top:20px;right:36px;z-index:5;}
.hero-inner{position:relative;padding:56px 44px 48px;}
.hero-kicker{display:flex;align-items:center;gap:14px;margin-bottom:32px;opacity:0;animation:fadeUp .5s .05s ease forwards;}
.hero-kicker-line{height:1px;width:40px;background:var(--gold);flex-shrink:0;}
.hero-kicker-txt{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);font-weight:600;}
.hero-kicker-sep{width:3px;height:3px;border-radius:50%;background:var(--text-muted);flex-shrink:0;}
.hero-kicker-brand{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-muted);}
.hero-hl{font-family:var(--df);font-size:clamp(44px,5.5vw,82px);font-weight:300;line-height:.9;letter-spacing:-.01em;margin-bottom:40px;opacity:0;animation:fadeUp .6s .13s ease forwards;}
.hero-hl span{display:block;color:var(--text);}
.hero-hl em{display:block;font-style:italic;color:var(--gold);}
.hero-body{display:grid;grid-template-columns:1fr 220px;gap:56px;align-items:start;opacity:0;animation:fadeUp .6s .22s ease forwards;}
.hero-vlbl{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;}
.hero-vtxt{font-size:13px;color:var(--text-dim);line-height:2;}
.hero-albl{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--text-muted);margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--border2);}
.hnum{display:flex;align-items:baseline;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border2);}
.hnum:last-child{border:none;}
.hnum-val{font-family:var(--df);font-size:38px;font-weight:300;color:var(--text);line-height:1;}
.hnum-lbl{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;text-align:right;}
.pillars{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--border);opacity:0;animation:fadeUp .6s .3s ease forwards;}
.pillar-cell{padding:22px 22px 20px;border-right:1px solid var(--border);position:relative;overflow:hidden;cursor:pointer;transition:background .25s;}
.pillar-cell:last-child{border-right:none;}
.pillar-cell:hover{background:rgba(255,255,255,.014);}
.pillar-cell.active{background:rgba(201,168,76,.025);}
.pillar-num{font-family:var(--df);font-size:48px;font-weight:300;line-height:1;margin-bottom:8px;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.pillar-name{font-size:11px;font-weight:500;color:var(--text);line-height:1.45;}
.pillar-count{margin-top:8px;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;}
.pillar-bar{position:absolute;bottom:0;left:0;height:2px;transition:width .55s ease;}
.ctrl{padding:14px 44px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:1px solid var(--border2);}
.fchip{font-size:11px;padding:5px 13px;border-radius:100px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--bf);transition:all .15s;letter-spacing:.04em;}
.fchip:hover,.fchip.on{background:var(--gold-dim);border-color:rgba(201,168,76,.3);color:var(--gold);}
.vtog{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;}
.vbtn{padding:5px 15px;font-size:11px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--bf);transition:all .15s;letter-spacing:.06em;text-transform:uppercase;}
.vbtn.on{background:var(--gold-dim);color:var(--gold);}
.board{padding:20px 44px 50px;display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:13px;}
.card{background:rgba(10,11,20,.8);backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:14px;padding:22px;cursor:pointer;transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s,border-color .25s;position:relative;overflow:hidden;animation:fadeUp .4s ease both;}
.card::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.03),transparent);transition:none;pointer-events:none;}
.card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06);border-color:rgba(255,255,255,.1);}
.card:hover::after{animation:cardSweep .6s ease forwards;}
.card.hl{border-color:var(--gold);box-shadow:0 0 0 1px rgba(212,177,85,.2);}
.card-bar{position:absolute;top:0;left:0;right:0;height:2px;}
.card-pillar{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:7px;}
.card-revolving{display:inline-flex;align-items:center;gap:4px;font-size:9px;padding:1px 7px;border-radius:100px;background:rgba(77,158,142,.1);color:#4d9e8e;border:1px solid rgba(77,158,142,.2);font-weight:600;letter-spacing:.05em;text-transform:uppercase;}
.card-date-bar{display:flex;align-items:center;gap:6px;padding:7px 0 4px;margin-top:2px;margin-bottom:4px;}
.card-date-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.09em;color:var(--text-muted);flex-shrink:0;}
.card-date-track{flex:1;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;position:relative;}
.card-date-fill{height:100%;border-radius:2px;transition:width .4s ease;}
.card-date-range{font-size:10px;color:var(--text-muted);white-space:nowrap;flex-shrink:0;}
/* Revolving toggle */
.rev-toggle{display:flex;align-items:center;gap:9px;padding:10px 13px;border-radius:9px;border:1px solid var(--border2);background:var(--surface2);cursor:pointer;transition:all .15s;user-select:none;}
.rev-toggle:hover{border-color:rgba(77,158,142,.3);}
.rev-toggle.on{border-color:rgba(77,158,142,.35);background:rgba(77,158,142,.07);}
.rev-knob{width:30px;height:16px;border-radius:100px;border:1px solid var(--border);background:var(--surface);position:relative;flex-shrink:0;transition:all .18s;}
.rev-toggle.on .rev-knob{background:rgba(77,158,142,.3);border-color:rgba(77,158,142,.5);}
.rev-pip{width:10px;height:10px;border-radius:50%;background:var(--text-muted);position:absolute;top:2px;left:2px;transition:all .18s;}
.rev-toggle.on .rev-pip{left:16px;background:#4d9e8e;}
.rev-icon{font-size:14px;flex-shrink:0;}
.rev-info{flex:1;}
.rev-lbl{font-size:12px;font-weight:500;color:var(--text);}
.rev-sub{font-size:10px;color:var(--text-muted);margin-top:1px;}
/* date input styling */
input[type="date"].fi{color-scheme:light;}
.card-title{font-family:var(--df);font-size:20px;font-weight:400;line-height:1.15;color:var(--text);margin-bottom:8px;}
.card-desc{font-size:13px;color:var(--text-dim);line-height:1.72;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.card-foot{display:flex;align-items:center;justify-content:space-between;padding-top:15px;margin-top:15px;border-top:1px solid var(--border2);}
.card-owner{font-size:12px;color:var(--text-muted);}
.card-qtr{font-size:11px;color:var(--text-muted);margin-top:2px;}
.fbtn{font-size:11px;padding:4px 11px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--bf);transition:all .15s;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;}
.fbtn:hover{border-color:var(--gold);color:var(--gold);}
.fbtn.has{border-color:rgba(201,168,76,.3);color:var(--gold);background:var(--gold-dim);}
.cmp-badge{font-size:9px;padding:2px 7px;border-radius:100px;background:rgba(139,127,192,.1);color:#8b7fc0;border:1px solid rgba(139,127,192,.2);}

/* BUTTONS */
.btn{font-family:var(--bf);font-size:11px;font-weight:500;padding:7px 14px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:all .2s cubic-bezier(.4,0,.2,1);}
.btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-dim);box-shadow:0 0 0 3px rgba(212,177,85,.06);}
.btn-gold{background:linear-gradient(135deg,var(--gold),#c8a840);color:#fff;border-color:var(--gold);font-weight:600;box-shadow:0 2px 8px rgba(184,150,58,.2);}
.btn-gold:hover{background:var(--gold-light);border-color:var(--gold-light);color:var(--bg);box-shadow:0 4px 16px rgba(212,177,85,.25);}
.btn-sm{padding:5px 10px;font-size:10px;}
.btn:disabled{opacity:.4;cursor:not-allowed;}

/* NOTES TOGGLE */
.notes-toggle{display:flex;align-items:center;gap:7px;font-family:var(--bf);font-size:11px;font-weight:500;padding:7px 13px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:all .18s;}
.notes-toggle:hover{border-color:rgba(255,255,255,.14);color:var(--text);}
.notes-toggle.open{border-color:var(--gold);color:var(--gold);background:var(--gold-dim);}
.notes-count{font-size:10px;background:var(--gold);color:var(--bg);border-radius:100px;padding:1px 6px;font-weight:700;line-height:1.4;}

/* NOTES PANEL */
.notes-panel{position:fixed;top:52px;right:0;width:var(--nw);height:calc(100vh - 52px);background:rgba(255,255,255,.88);backdrop-filter:blur(20px) saturate(1.4);border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:65;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);box-shadow:-4px 0 20px rgba(0,0,0,.06);}
.notes-panel.open{transform:translateX(0);}
.notes-hdr{padding:14px 14px 10px;border-bottom:1px solid var(--border);flex-shrink:0;}
.notes-hdr-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}
.notes-title{font-family:var(--df);font-size:17px;font-weight:400;color:var(--text);}
.notes-close{width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;font-size:15px;display:grid;place-items:center;transition:all .15s;line-height:1;}
.notes-close:hover{border-color:var(--gold);color:var(--gold);}
.user-chip{display:flex;align-items:center;gap:7px;padding:5px 9px;border-radius:100px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;transition:border-color .15s;}
.user-chip:hover{border-color:rgba(255,255,255,.12);}
.user-marker{border-radius:50%;display:grid;place-items:center;font-weight:700;flex-shrink:0;}
.user-name-sm{font-size:11px;color:var(--text-dim);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.notes-list{flex:1;overflow-y:auto;padding:8px 0;}
.note-item{padding:10px 14px;border-bottom:1px solid var(--border2);transition:background .15s;animation:slideIn .2s ease both;}
.note-item:hover{background:rgba(255,255,255,.012);}
.note-item:last-child{border-bottom:none;}
.note-top{display:flex;align-items:center;gap:7px;margin-bottom:5px;}
.note-marker{border-radius:50%;display:grid;place-items:center;font-weight:700;flex-shrink:0;}
.note-author{font-size:11px;font-weight:600;color:var(--text);}
.note-time{font-size:10px;color:var(--text-muted);margin-left:auto;white-space:nowrap;}
.note-body{font-size:13px;color:var(--text-dim);line-height:1.65;padding-left:28px;}
.note-del{opacity:0;font-size:10px;color:var(--text-muted);cursor:pointer;background:none;border:none;font-family:var(--bf);transition:opacity .15s,color .15s;padding:0;margin-left:4px;}
.note-item:hover .note-del{opacity:1;}
.note-del:hover{color:#e07b6a;}
.note-expand-btn{opacity:0;font-size:10px;color:var(--text-muted);cursor:pointer;background:none;border:none;font-family:var(--bf);transition:opacity .15s,color .15s;padding:0 0 0 4px;}
.note-item:hover .note-expand-btn{opacity:1;}
.note-expand-btn:hover{color:var(--gold);}
.note-reply-btn{opacity:0;font-size:10px;color:var(--text-muted);cursor:pointer;background:none;border:none;font-family:var(--bf);transition:opacity .15s,color .15s;padding:0 0 0 4px;}
.note-item:hover .note-reply-btn{opacity:1;}
.note-reply-btn:hover{color:var(--gold);}
.note-replies{margin-top:6px;padding-left:28px;display:flex;flex-direction:column;gap:6px;}
.note-reply{display:flex;gap:8px;align-items:flex-start;}
.note-reply-body{font-size:12px;color:var(--text-dim);line-height:1.5;}
.note-reply-author{font-size:10px;font-weight:600;color:var(--text-muted);}
.note-reply-time{font-size:9px;color:var(--text-muted);}
.note-reply-input{display:flex;gap:6px;margin-top:4px;padding-left:28px;}
.note-reply-input input{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:6px 10px;color:var(--text);font-family:var(--bf);font-size:12px;outline:none;}
.note-reply-input input:focus{border-color:rgba(201,168,76,.35);}
.note-reply-input button{padding:6px 12px;border-radius:7px;border:none;background:var(--gold);color:var(--bg);font-family:var(--bf);font-size:10px;font-weight:600;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;}
.note-detail{margin-top:8px;padding:8px 10px;background:rgba(255,255,255,.03);border-left:2px solid rgba(201,168,76,.25);border-radius:0 6px 6px 0;font-size:12px;color:var(--text-dim);line-height:1.65;white-space:pre-wrap;}
.note-detail-ta{width:100%;background:var(--surface2);border:1px solid rgba(201,168,76,.3);border-radius:7px;padding:7px 10px;color:var(--text);font-family:var(--bf);font-size:12px;line-height:1.6;resize:none;outline:none;min-height:72px;margin-top:6px;}
.note-detail-ta:focus{border-color:rgba(201,168,76,.55);}
.note-detail-actions{display:flex;gap:6px;margin-top:6px;justify-content:flex-end;}
.notes-empty{padding:32px 14px;text-align:center;color:var(--text-muted);font-size:12px;line-height:1.75;}
.notes-ia{padding:11px 14px;border-top:1px solid var(--border);flex-shrink:0;}
.note-ta{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:8px 11px;color:var(--text);font-family:var(--bf);font-size:13px;line-height:1.6;resize:none;outline:none;transition:border-color .15s;min-height:64px;}
.note-ta:focus{border-color:rgba(212,177,85,.4);box-shadow:0 0 0 3px rgba(212,177,85,.08);}
.note-ta::placeholder{color:var(--text-muted);}
.note-sr{display:flex;align-items:center;justify-content:space-between;margin-top:7px;}
.note-hint{font-size:10px;color:var(--text-muted);}
.note-submit{font-family:var(--bf);font-size:11px;font-weight:600;padding:5px 14px;border-radius:6px;border:none;background:var(--gold);color:var(--bg);cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:background .15s;}
.note-submit:hover{background:var(--gold-light);}
.note-submit:disabled{opacity:.4;cursor:not-allowed;}

/* MARKERS */
.marker-bar{display:flex;align-items:center;}
.marker-bubble{width:22px;height:22px;border-radius:50%;border:2px solid var(--bg);display:grid;place-items:center;font-size:8px;font-weight:700;margin-left:-5px;transition:transform .15s;cursor:default;}
.marker-bubble:first-child{margin-left:0;}
.marker-bubble:hover{transform:scale(1.15) translateY(-2px);z-index:2;}

/* MARKER MODE */
.main.marker-active{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23c9a84c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E") 12 24, crosshair;}
.main.marker-active [data-tag-type]{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23c9a84c' stroke='%23c9a84c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/%3E%3Ccircle cx='12' cy='10' r='3' fill='%2307070f'/%3E%3C/svg%3E") 12 24, crosshair;transition:box-shadow .15s,border-color .15s;}
.main.marker-active [data-tag-type]:hover{box-shadow:0 0 0 2px rgba(201,168,76,.5);border-color:rgba(201,168,76,.4) !important;border-radius:10px;}
.marker-hint{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100;display:flex;align-items:center;gap:12px;padding:10px 20px;border-radius:10px;background:rgba(201,168,76,.12);backdrop-filter:blur(12px);border:1px solid rgba(201,168,76,.3);color:var(--gold);font-family:var(--bf);font-size:12px;font-weight:500;letter-spacing:.04em;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:markerHintIn .25s ease;}
.marker-hint button{padding:4px 12px;border-radius:6px;border:1px solid rgba(201,168,76,.3);background:transparent;color:var(--gold);font-family:var(--bf);font-size:11px;cursor:pointer;transition:all .15s;}
.marker-hint button:hover{background:rgba(201,168,76,.15);}
@keyframes markerHintIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.pending-tag{display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:8px;border-radius:8px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);}
.pending-tag-label{font-size:11px;color:var(--gold);font-weight:600;}
.pending-tag-sub{font-size:10px;color:var(--text-muted);}
.pending-tag-clear{margin-left:auto;padding:2px 8px;border-radius:5px;border:1px solid rgba(201,168,76,.2);background:transparent;color:var(--text-muted);font-size:10px;cursor:pointer;font-family:var(--bf);transition:all .15s;}
.pending-tag-clear:hover{color:var(--gold);border-color:rgba(201,168,76,.4);}
.marker-btn{display:flex;align-items:center;gap:5px;font-family:var(--bf);font-size:11px;font-weight:500;padding:7px 11px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:all .18s;}
.marker-btn:hover{border-color:rgba(255,255,255,.14);color:var(--text);}
.marker-btn.active{border-color:var(--gold);color:var(--gold);background:var(--gold-dim);}

/* MODALS */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);backdrop-filter:blur(12px) saturate(1.3);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px;}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;width:100%;max-width:500px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.12),0 4px 16px rgba(0,0,0,.06);}
.modal.wide{max-width:580px;}
.modal.xwide{max-width:700px;}
.mhdr{padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;}
.mtitle{font-family:var(--df);font-size:22px;font-weight:400;color:var(--text);}
.msub{font-size:12px;color:var(--text-muted);margin-top:3px;}
.mclose{width:28px;height:28px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;font-size:17px;display:grid;place-items:center;transition:all .15s;flex-shrink:0;line-height:1;}
.mclose:hover{border-color:var(--gold);color:var(--gold);}
.mbody{padding:20px 24px;overflow-y:auto;flex:1;}
.mfoot{padding:13px 24px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;}

/* FORMS */
.ff{margin-bottom:13px;}
.fl{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);font-weight:500;margin-bottom:5px;}
.fi,.fsel,.fta{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-family:var(--bf);font-size:13px;transition:border-color .2s,box-shadow .2s;outline:none;}
.fi:focus,.fsel:focus,.fta:focus{border-color:rgba(212,177,85,.4);box-shadow:0 0 0 3px rgba(212,177,85,.08);}
.fi::placeholder,.fta::placeholder{color:var(--text-muted);}
.fsel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238a86a0'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;background-size:16px;padding-right:34px;cursor:pointer;}
.fsel option{background:var(--surface2);}
.fta{resize:vertical;min-height:74px;line-height:1.65;}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:11px;}

/* TEAM MEMBER MODAL */
.tm-hdr{display:flex;align-items:center;gap:14px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--border2);}
.tm-av{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-size:17px;font-weight:700;flex-shrink:0;}
.tm-name{font-family:var(--df);font-size:21px;font-weight:400;color:var(--text);}
.tm-role{font-size:12px;color:var(--text-muted);margin-top:2px;}
.tm-sec{margin-bottom:14px;}
.tm-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;}
.tm-bio{font-size:13px;color:var(--text-dim);line-height:1.75;}
.tm-str{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);padding:5px 0;border-bottom:1px solid var(--border2);}
.tm-str:last-child{border:none;}
.tm-str::before{content:"✦";color:var(--gold);font-size:8px;flex-shrink:0;}
.tm-kp{font-size:12px;color:var(--text-dim);padding:4px 0 4px 12px;border-left:2px solid var(--border2);margin-bottom:5px;}
.edit-toggle{font-size:10px;padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--bf);transition:all .15s;text-transform:uppercase;letter-spacing:.06em;margin-left:auto;}
.edit-toggle:hover{border-color:var(--gold);color:var(--gold);}

/* BRIEF / AI */
.brief-sec{margin-bottom:14px;padding:11px 13px;background:var(--surface2);border-radius:9px;border:1px solid var(--border2);}
.brief-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:5px;}
.brief-val{font-size:13px;color:var(--text);line-height:1.65;}
.brief-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px;}
.brief-chip{font-size:11px;padding:3px 9px;border-radius:100px;background:rgba(201,168,76,.08);color:var(--gold);border:1px solid rgba(201,168,76,.15);}
.ai-loading{display:flex;align-items:center;gap:8px;padding:20px;color:var(--text-dim);font-size:13px;}
.ai-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);animation:pulse 1s ease-in-out infinite;}
.ai-dot:nth-child(2){animation-delay:.15s;}
.ai-dot:nth-child(3){animation-delay:.3s;}

/* WHO MODAL */
.who-inner{padding:26px 28px;}
.who-title{font-family:var(--df);font-size:24px;font-weight:400;color:var(--text);margin-bottom:6px;}
.who-sub{font-size:13px;color:var(--text-dim);margin-bottom:20px;line-height:1.65;}
.who-colors{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
.who-swatch{width:24px;height:24px;border-radius:50%;cursor:default;border:2px solid transparent;flex-shrink:0;}

/* DROP / FILE */
.dzone{border:2px dashed var(--border);border-radius:11px;padding:34px 18px;text-align:center;cursor:pointer;transition:all .15s;margin-bottom:12px;}
.dzone:hover,.dzone.drag{border-color:rgba(201,168,76,.45);background:rgba(201,168,76,.03);}
.dicon{font-size:26px;margin-bottom:9px;}
.dtxt{font-size:14px;color:var(--text-dim);margin-bottom:4px;}
.dsub{font-size:12px;color:var(--text-muted);}
.divdr{display:flex;align-items:center;gap:10px;color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:12px 0;}
.divdr::before,.divdr::after{content:'';flex:1;height:1px;background:var(--border);}
.url-in{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-family:var(--bf);font-size:13px;margin-bottom:9px;transition:border-color .15s;outline:none;}
.url-in:focus{border-color:rgba(201,168,76,.4);}
.url-in::placeholder{color:var(--text-muted);}
.fpbar{display:flex;align-items:center;gap:9px;padding:9px 12px;background:var(--gold-dim);border:1px solid rgba(201,168,76,.2);border-radius:8px;margin-bottom:12px;}
.fpname{font-size:13px;color:var(--gold);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fpact{font-size:11px;padding:3px 10px;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.22);color:var(--gold);border-radius:5px;cursor:pointer;font-family:var(--bf);white-space:nowrap;transition:background .15s;}
.fpact:hover{background:rgba(201,168,76,.22);}

/* DETAIL */
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:16px;padding:11px 13px;background:var(--surface2);border-radius:9px;border:1px solid var(--border2);}
.dfield-lbl{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:3px;}
.dfield-val{font-size:13px;color:var(--text);}

/* ── CAMPAIGN TIMELINE PANEL ── */
.ctl-wrap{display:flex;flex-direction:column;gap:0;}
.ctl-grid-hdr{display:flex;border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:5;}
.ctl-label-col{width:290px;flex-shrink:0;padding:10px 16px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);font-weight:500;border-right:1px solid var(--border);}
.ctl-cost-col{width:140px;flex-shrink:0;padding:10px 14px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);font-weight:500;text-align:right;border-right:1px solid var(--border);}
.ctl-bar-area{flex:1;display:flex;}
.ctl-month-cell{flex:1;padding:10px 0;font-size:11px;text-align:center;color:var(--text-muted);letter-spacing:.06em;text-transform:uppercase;border-right:1px solid var(--border2);font-weight:500;}
.ctl-month-cell:last-child{border-right:none;}
.ctl-row{display:flex;align-items:center;border-bottom:1px solid var(--border2);min-height:56px;}
.ctl-row:hover{background:rgba(255,255,255,.012);}
.ctl-row.el-row{min-height:46px;background:rgba(255,255,255,.005);}
.ctl-row-label{width:290px;flex-shrink:0;padding:10px 16px;border-right:1px solid var(--border);display:flex;align-items:center;gap:8px;min-height:inherit;}
.ctl-row.el-row .ctl-row-label{padding-left:32px;}
.ctl-row-cost{width:140px;flex-shrink:0;border-right:1px solid var(--border);padding:5px 12px;text-align:right;}
.ctl-cost-input{width:100%;background:transparent;border:none;outline:none;color:var(--gold);font-family:var(--bf);font-size:13px;font-weight:600;text-align:right;cursor:text;}
.ctl-cost-input::placeholder{color:var(--text-muted);font-weight:400;}
.ctl-bar-track{flex:1;position:relative;height:100%;min-height:inherit;cursor:default;overflow:hidden;}
.ctl-month-grid{position:absolute;inset:0;display:flex;pointer-events:none;}
.ctl-month-stripe{flex:1;border-right:1px solid var(--border2);}
.ctl-month-stripe:nth-child(even){background:rgba(255,255,255,.008);}
.ctl-month-stripe:last-child{border-right:none;}
.ctl-bar{position:absolute;top:50%;transform:translateY(-50%);height:24px;border-radius:5px;display:flex;align-items:center;user-select:none;}
.ctl-row.el-row .ctl-bar{height:16px;border-radius:4px;opacity:.85;}
.ctl-handle{position:absolute;top:0;bottom:0;width:10px;cursor:ew-resize;display:flex;align-items:center;justify-content:center;z-index:2;}
.ctl-handle-l{left:-1px;border-radius:4px 0 0 4px;}
.ctl-handle-r{right:-1px;border-radius:0 4px 4px 0;}
.ctl-handle-pip{width:2px;height:12px;background:rgba(255,255,255,.55);border-radius:1px;}
.ctl-date-label{position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 2px);font-size:10px;color:var(--text-muted);white-space:nowrap;pointer-events:none;}
.ctl-row-name{font-size:14px;font-weight:500;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ctl-row.el-row .ctl-row-name{font-size:13px;color:var(--text-dim);font-weight:400;}
.ctl-el-label-input{background:transparent;border:none;outline:none;color:var(--text-dim);font-family:var(--bf);font-size:13px;width:100%;cursor:text;}
.ctl-el-label-input:focus{color:var(--text);}
.ctl-add-el-btn{font-size:11px;padding:3px 9px;border-radius:5px;border:1px dashed rgba(255,255,255,.1);background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--bf);transition:all .13s;flex-shrink:0;}
.ctl-add-el-btn:hover{border-color:rgba(201,168,76,.35);color:var(--gold);}
.ctl-del-btn{width:20px;height:20px;border-radius:4px;border:1px solid rgba(224,123,106,.25);background:transparent;color:rgba(224,123,106,.5);cursor:pointer;font-size:11px;display:grid;place-items:center;flex-shrink:0;transition:all .12s;line-height:1;}
.ctl-del-btn:hover{border-color:rgba(224,123,106,.6);color:#e07b6a;background:rgba(224,123,106,.06);}
.ctl-brand-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
/* GANTT */
.gv-wrap{display:flex;flex-direction:column;height:calc(100vh - 57px);}
.gv-bar{display:flex;align-items:center;justify-content:space-between;padding:11px 44px 9px;border-bottom:1px solid var(--border);flex-shrink:0;}
.gv-title{font-family:var(--df);font-size:16px;font-weight:400;color:var(--text);}
.gv-title span{font-size:10px;color:var(--text-muted);font-family:var(--bf);letter-spacing:.1em;text-transform:uppercase;margin-left:9px;}
.gv-frame{flex:1;border:none;background:#fff;}
.gv-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px;min-height:420px;}
.gv-drop-box{width:100%;max-width:440px;border:2px dashed rgba(255,255,255,.08);border-radius:18px;padding:48px 32px;text-align:center;transition:all .2s;cursor:pointer;}
.gv-drop-box:hover,.gv-drop-box.drag{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.03);}
.gv-di{font-size:38px;margin-bottom:14px;display:block;opacity:.5;}
.gv-dt{font-family:var(--df);font-size:26px;font-weight:300;color:var(--text);margin-bottom:8px;}
.gv-ds{font-size:13px;color:var(--text-dim);line-height:1.75;margin-bottom:22px;}
.gv-db{font-family:var(--bf);font-size:11px;font-weight:600;padding:8px 18px;border-radius:7px;background:var(--gold);color:var(--bg);letter-spacing:.07em;text-transform:uppercase;cursor:pointer;border:none;transition:background .15s;}
.gv-db:hover{background:var(--gold-light);}
.gv-dh{margin-top:14px;font-size:11px;color:var(--text-muted);letter-spacing:.06em;text-transform:uppercase;}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(9px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
@keyframes revolveShift{0%{background-position:0% 50%}100%{background-position:200% 50%}}
.card:nth-child(1){animation-delay:0ms}.card:nth-child(2){animation-delay:55ms}.card:nth-child(3){animation-delay:110ms}.card:nth-child(4){animation-delay:165ms}.card:nth-child(5){animation-delay:220ms}.card:nth-child(6){animation-delay:275ms}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.13)}
`;

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function MarketingHub({ initialUserName, isSessionAdmin }) {

  // Core state
  const [strategy, setStrategy] = useState(DEFAULT_STRATEGY);
  const [initiatives, setInitiatives] = useState(DEFAULT_INITIATIVES);
  const [view, setView] = useState("grid");
  const [filterChannel, setFilterChannel] = useState("All");
  const [detail, setDetail] = useState(null);
  const [fileModal, setFileModal] = useState(null);
  const [conceptModal, setConceptModal] = useState(null);   // init id to view HTML concept
  const [briefViewer, setBriefViewer] = useState(null);     // { data, name, type, title }
  const [conceptUpload, setConceptUpload] = useState(null); // init id to upload HTML concept
  const [showAddInit, setShowAddInit] = useState(false);
  const [showEditStrategy, setShowEditStrategy] = useState(false);
  const [ganttHtml, setGanttHtml] = useState(null);
  const [complianceCards, setComplianceCards] = useState([]);
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [complianceLinks, setComplianceLinks] = useState([]);
  const [complianceOverview, setComplianceOverview] = useState("");
  const [timelineItems, setTimelineItems] = useState([]);
  const [ready, setReady] = useState(false);

  // Time zones
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClockTick(c => c + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const tzNow = (tz) => new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true });
  const tzDate = (tz) => new Date().toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
  const [weather, setWeather] = useState({});
  useEffect(() => {
    const cities = {
      "America/Los_Angeles": "Los+Angeles",
      "America/Chicago": "St+Louis,MO",
      "America/New_York": "New+York",
      "America/Puerto_Rico": "San+Juan"
    };
    Object.entries(cities).forEach(([tz, city]) => {
      fetch(`https://wttr.in/${city}?format=j1`).then(r => r.json()).then(d => {
        const cur = d?.current_condition?.[0];
        if (cur) {
          const temp = cur.temp_F ? `${cur.temp_F}°F` : "";
          const desc = cur.weatherDesc?.[0]?.value || "";
          setWeather(p => ({ ...p, [tz]: `${temp} ${desc}`.trim() }));
        }
      }).catch(() => {});
    });
  }, []);

  // Notes
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [noteDetailDraft, setNoteDetailDraft] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [confirmClearId, setConfirmClearId] = useState(null);
  const [markerMode, setMarkerMode] = useState(false);
  const [pendingTag, setPendingTag] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => { try { const v = localStorage.getItem("ns_ns-user"); return v ? JSON.parse(v) : null; } catch { return null; } });
  const isAdmin = isSessionAdmin || currentUser?.name?.toLowerCase() === "sean" || currentUser?.name?.toLowerCase() === "bobby g";
  const canEdit = isAdmin;
  const canAddContent = true; // everyone can add campaigns, concepts, notes, download
  const [showWhoModal, setShowWhoModal] = useState(() => {
    if (initialUserName) return false;
    try { return !localStorage.getItem("ns_ns-user"); } catch { return true; }
  });
  const [whoName, setWhoName] = useState("");
  const [whoRole, setWhoRole] = useState("content");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "content", title: "", bio: "", skills: "", strengths: "", keyPoints: "" });
  const updateNewMember = (k, v) => setNewMember(prev => ({ ...prev, [k]: v }));
  const resetNewMember = () => setNewMember({ name: "", role: "content", title: "", bio: "", skills: "", strengths: "", keyPoints: "" });
  const addTeamMember = () => {
    if (!newMember.name.trim()) return;
    const color = colorForName(newMember.name.trim());
    const toArr = (s) => s.split(",").map(x => x.trim()).filter(Boolean);
    setTeamMembers(prev => {
      if (prev.find(m => m.name.toLowerCase() === newMember.name.trim().toLowerCase())) return prev;
      return [...prev, { name: newMember.name.trim(), color, role: newMember.role, title: newMember.title.trim(), bio: newMember.bio.trim(), skills: toArr(newMember.skills), strengths: toArr(newMember.strengths), keyPoints: toArr(newMember.keyPoints), joinedAt: new Date().toISOString() }];
    });
    resetNewMember(); setShowAddMember(false);
  };

  // Map Gmail names to team member names
  const NAME_MAP = { "Sean Baltzell": "Sean" };

  // Auto-set user from login — restore profile immediately
  useEffect(() => {
    if (initialUserName) {
      const mappedName = NAME_MAP[initialUserName] || initialUserName;
      try {
        const existing = localStorage.getItem("ns_ns-user");
        const parsed = existing ? JSON.parse(existing) : null;
        // If stored name matches mapped name or original, use it
        if (parsed?.name && (parsed.name === mappedName || parsed.name === initialUserName)) {
          // Update to mapped name if different
          if (parsed.name !== mappedName) {
            parsed.name = mappedName;
            localStorage.setItem("ns_ns-user", JSON.stringify(parsed));
          }
          setCurrentUser(parsed);
          setShowWhoModal(false);
          return;
        }
      } catch {}
      // No profile yet — pre-fill with mapped name and show the select/create modal
      setWhoName(mappedName);
      setShowWhoModal(true);
    }
  }, [initialUserName]);

  // After data loads, ensure current user is in team list
  useEffect(() => {
    if (!ready || !currentUser?.name) return;
    setTeamMembers(prev => {
      if (prev.find(m => m.name === currentUser.name)) return prev;
      return [...prev, { name: currentUser.name, color: currentUser.color || colorForName(currentUser.name), role: currentUser.role || "content", title: "", bio: "", strengths: [], skills: [], keyPoints: [], joinedAt: new Date().toISOString() }];
    });
  }, [ready, currentUser?.name]);

  // Left panel
  const [lsbOpen, setLsbOpen] = useState(true);
  const [leftTab, setLeftTab] = useState("company");
  const [activeBrand, setActiveBrand] = useState(null); // null = company view
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [brands, setBrands] = useState(DEFAULT_BRANDS);
  const [teamMembers, setTeamMembers] = useState([]);
  const [orgRoles, setOrgRoles] = useState(ORG_ROLES);
  const [selectedMember, setSelectedMember] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignTimeline, setCampaignTimeline] = useState(DEFAULT_CAMPAIGN_TIMELINE);
  const [campaignView, setCampaignView] = useState("briefs"); // "briefs" | "timeline"
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [hlInitId, setHlInitId] = useState(null);
  const [showAddBrandInit, setShowAddBrandInit] = useState(null);
  const [showBriefUpload, setShowBriefUpload] = useState(null);
  // ── ASSET LIBRARY STATE ──────────────────────────────────────────────────────
  const [damAssets,    setDamAssets]    = useState(() => { try { const s = localStorage.getItem("dam_v2_assets"); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [damType,      setDamType]      = useState("all");
  const [damBrand,     setDamBrand]     = useState("all");
  const [damSearch,    setDamSearch]    = useState("");
  const [damView,      setDamView]      = useState("grid");
  const [damMerchOpen,     setDamMerchOpen]     = useState(false);
  const [damPackagingOpen, setDamPackagingOpen] = useState(false);
  const [damAddOpen,   setDamAddOpen]   = useState(false);
  const [damPreview,   setDamPreview]   = useState(null);
  const [damConfig,    setDamConfig]    = useState(() => { try { const s = localStorage.getItem("dam_config"); return s ? JSON.parse(s) : {clientId:""}; } catch { return {clientId:""}; } });
  const [damFolders,   setDamFolders]   = useState(() => { try { const s = localStorage.getItem("dam_folders"); return s ? JSON.parse(s) : {}; } catch { return {}; } });
  const [damConnected, setDamConnected] = useState(false);
  const [damSyncing,   setDamSyncing]   = useState(false);
  const [damDriveAssets, setDamDriveAssets] = useState([]);
  const [damSettingsOpen, setDamSettingsOpen] = useState(false);
  const [teamView, setTeamView] = useState(null); // "orgchart" | "members"
  const [concepts, setConcepts] = useState([]); // [{id, name, html, createdAt}]
  const [activeConceptId, setActiveConceptId] = useState(null);
  // ── DESIGN PORTAL STATE ─────────────────────────────────────────────────────
  const [designRequests, setDesignRequests] = useState([]);
  const [designView, setDesignView] = useState("queue"); // "queue" | "submit"
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [selectedDesignReq, setSelectedDesignReq] = useState(null);
  // ── FIELD TEAM STATE ────────────────────────────────────────────────────────
  const [fieldTeamTree, setFieldTeamTree] = useState(DEFAULT_FIELDTEAM_TREE);
  const [centralizedContacts, setCentralizedContacts] = useState([]);
  const [tierListData, setTierListData] = useState([]);
  const [weeklyDrops, setWeeklyDrops] = useState([]);
  const [creditMemos, setCreditMemos] = useState([]);
  const [salesContacts, setSalesContacts] = useState([]);
  const [promoCalendar, setPromoCalendar] = useState([]);
  const [popupsData, setPopupsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [csBoardData, setCsBoardData] = useState([]);
  const [packagingTracker, setPackagingTracker] = useState([]);
  const [packagingConfirmed, setPackagingConfirmed] = useState([]);
  const [packagingEvolutionTracker, setPackagingEvolutionTracker] = useState([]);
  const [packagingEvolutionConfirmed, setPackagingEvolutionConfirmed] = useState([]);
  const [agencySubmissions, setAgencySubmissions] = useState([]);
  const [fieldAgenda, setFieldAgenda] = useState([]);


  // Load
  useEffect(() => {
    (async () => {
      // Small delay to ensure window.storage is injected
      await new Promise(r => setTimeout(r, 50));
      try {
        const [s, i, n, u, g, co, br, tm, ca, tl] = await Promise.all([
          window.storage.get("ns-strategy", true),
          window.storage.get("ns-initiatives", true),
          window.storage.get("ns-notes", true),
          window.storage.get("ns-user"),
          window.storage.get("ns-gantt", true),
          window.storage.get("ns-company", true),
          window.storage.get("ns-brands", true),
          window.storage.get("ns-team", true),
          window.storage.get("ns-campaigns", true),
          window.storage.get("ns-concepts", true),
          window.storage.get("ns-timeline", true),
        ]);
        if (s) setStrategy(JSON.parse(s.value));
        if (i) {
          const parsed = JSON.parse(i.value);
          const RESTORE_IDS = ["init-email-sms","init-hc-sesh","init-sb-float","init-bb-social","init-bb-charm"];
          const restored = RESTORE_IDS.flatMap(id => parsed.some(p => p.id === id) ? [] : (DEFAULT_INITIATIVES.find(d => d.id === id) ? [DEFAULT_INITIATIVES.find(d => d.id === id)] : []));
          setInitiatives([...parsed, ...restored]);
        }
        if (n) setNotes(JSON.parse(n.value));
        if (g) setGanttHtml(g.value);
        if (tl) setTimelineItems(JSON.parse(tl.value));
        if (co) setCompany(JSON.parse(co.value));
        if (br) setBrands(JSON.parse(br.value));
        if (tm) setTeamMembers(JSON.parse(tm.value));
        const or = await window.storage.get("ns-orgroles", true);
        if (or) setOrgRoles(JSON.parse(or.value));
        // Load shared org chart positions
        const op = await window.storage.get("ns-orgpos", true).catch(()=>null);
        const oc = await window.storage.get("ns-orgconns", true).catch(()=>null);
        if (op) window.__savedOrgPos = JSON.parse(op.value);
        if (oc) window.__savedOrgConns = JSON.parse(oc.value);
        if (ca) {
          const loadedCamps = JSON.parse(ca.value);
          const mergedCamps = [...loadedCamps];
          DEFAULT_CAMPAIGNS.forEach(def => { if (!mergedCamps.find(x => x.id === def.id)) mergedCamps.push(def); });
          setCampaigns(mergedCamps);
        } else {
          setCampaigns(DEFAULT_CAMPAIGNS);
        }
        const ctlRaw = await window.storage.get("ns-camp-timeline", true).catch(() => null);
        if (ctlRaw) {
          const loadedCtl = JSON.parse(ctlRaw.value);
          const mergedCtl = [...loadedCtl];
          DEFAULT_CAMPAIGN_TIMELINE.forEach(def => { if (!mergedCtl.find(x => x.id === def.id)) mergedCtl.push(def); });
          setCampaignTimeline(mergedCtl);
        }
        if (u) { setCurrentUser(JSON.parse(u.value)); }
        else if (!initialUserName) setShowWhoModal(true);
        const [,,,,,,,,, cn, dr, ftt] = await Promise.all([
          window.storage.get("ns-strategy", true),
          window.storage.get("ns-initiatives", true),
          window.storage.get("ns-notes", true),
          window.storage.get("ns-user"),
          window.storage.get("ns-gantt", true),
          window.storage.get("ns-company", true),
          window.storage.get("ns-brands", true),
          window.storage.get("ns-team", true),
          window.storage.get("ns-campaigns", true),
          window.storage.get("ns-concepts", true),
          window.storage.get("ns-design-requests", true),
          window.storage.get("ns-fieldteam-tree", true),
        ]);
        if (cn) setConcepts(JSON.parse(cn.value));
        if (dr) {
          const parsed = JSON.parse(dr.value);
          // Merge: keep user-created requests, add any missing defaults
          const existingIds = new Set(parsed.map(r => r.id));
          const missing = DEFAULT_DESIGN_REQUESTS.filter(d => !existingIds.has(d.id));
          setDesignRequests([...parsed, ...missing]);
        } else {
          setDesignRequests(DEFAULT_DESIGN_REQUESTS);
        }
        if (ftt) {
          const parsed = JSON.parse(ftt.value);
          const existingIds = new Set(parsed.map(n => n.id));
          const missing = DEFAULT_FIELDTEAM_TREE.filter(d => !existingIds.has(d.id));
          setFieldTeamTree([...parsed, ...missing]);
        }
      } catch (_) { if (!initialUserName) setShowWhoModal(true); }
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) window.storage.set("ns-strategy", JSON.stringify(strategy), true).catch(() => {}); }, [strategy, ready]);
  // Save initiatives — write to both localStorage and Supabase
  useEffect(() => {
    if (!ready) return;
    const toSave = initiatives.map(i => ({...i, htmlConcept: null}));
    try { localStorage.setItem("shared_ns_ns-initiatives", JSON.stringify(toSave)); } catch {}
    window.storage.set("ns-initiatives", JSON.stringify(toSave), true).catch(() => {});
  }, [initiatives, ready]);

  // Concept HTML cache — stored separately so it never triggers the initiatives save effect
  const conceptHtmlCache = useRef({});
  const [conceptCacheVersion, setConceptCacheVersion] = useState(0);
  const campaignHtmlCache = useRef({});
  const [campaignCacheVersion, setCampaignCacheVersion] = useState(0);
  useEffect(() => {
    if (!ready) return;
    initiatives.forEach(init => {
      if (init._conceptUrl && !conceptHtmlCache.current[init.id]) {
        fetch(init._conceptUrl)
          .then(r => r.ok ? r.text() : Promise.reject(r.status))
          .then(html => { conceptHtmlCache.current[init.id] = html; setConceptCacheVersion(v => v + 1); })
          .catch(() => {});
      }
      // Load user-uploaded HTML concepts from Supabase
      if (!init._conceptUrl && init.htmlConceptName && !conceptHtmlCache.current[init.id]) {
        window.storage.get(`ns-concept-html-${init.id}`, true)
          .then(res => { if (res?.value) { conceptHtmlCache.current[init.id] = res.value; setConceptCacheVersion(v => v + 1); } })
          .catch(() => {});
      }
    });
  }, [ready, initiatives]);
  // Load campaign HTML concepts from storage or _conceptUrl on startup
  useEffect(() => {
    if (!ready) return;
    campaigns.forEach(c => {
      if (campaignHtmlCache.current[c.id]) return;
      if (c._conceptUrl) {
        fetch(c._conceptUrl)
          .then(r => r.ok ? r.text() : Promise.reject(r.status))
          .then(html => { campaignHtmlCache.current[c.id] = html; setCampaignCacheVersion(v => v + 1); })
          .catch(() => {});
      } else if (c._htmlName) {
        window.storage.get(`ns-camp-html-${c.id}`, true)
          .then(res => { if (res?.value) { campaignHtmlCache.current[c.id] = res.value; setCampaignCacheVersion(v => v + 1); } })
          .catch(() => {});
      }
    });
  }, [ready]);

  useEffect(() => { if (ready) window.storage.set("ns-notes", JSON.stringify(notes), true).catch(() => {}); }, [notes, ready]);

  // Poll shared notes every 15s so teammates' notes appear without a refresh
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const n = await window.storage.get("ns-notes", true);
        if (n) {
          const fresh = JSON.parse(n.value);
          setNotes(prev => JSON.stringify(prev) !== JSON.stringify(fresh) ? fresh : prev);
        }
      } catch {}
    }, 15000);
    return () => clearInterval(poll);
  }, []);
  useEffect(() => { if (ready && ganttHtml) window.storage.set("ns-gantt", ganttHtml, true).catch(() => {}); }, [ganttHtml, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-timeline", JSON.stringify(timelineItems), true).catch(() => {}); }, [timelineItems, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-company", JSON.stringify(company), true).catch(() => {}); }, [company, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-brands", JSON.stringify(brands), true).catch(() => {}); }, [brands, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-team", JSON.stringify(teamMembers), true).catch(() => {}); }, [teamMembers, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-orgroles", JSON.stringify(orgRoles), true).catch(() => {}); }, [orgRoles, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-campaigns", JSON.stringify(campaigns), true).catch(() => {}); }, [campaigns, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-camp-timeline", JSON.stringify(campaignTimeline), true).catch(() => {}); }, [campaignTimeline, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-compliance-cards", JSON.stringify(complianceCards), true).catch(() => {}); }, [complianceCards, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-compliance-docs", JSON.stringify(complianceDocs), true).catch(() => {}); }, [complianceDocs, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-compliance-links", JSON.stringify(complianceLinks), true).catch(() => {}); }, [complianceLinks, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-compliance-overview", complianceOverview, true).catch(() => {}); }, [complianceOverview, ready]);
  useEffect(() => {
    if (!ready) return;
    // Save metadata only (no html) to shared storage
    const meta = concepts.map(({ html, ...rest }) => rest);
    window.storage.set("ns-concepts", JSON.stringify(meta), true).catch(() => {});
  }, [concepts, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-design-requests", JSON.stringify(designRequests), true).catch(() => {}); }, [designRequests, ready]);
  useEffect(() => { if (ready) window.storage.set("ns-fieldteam-tree", JSON.stringify(fieldTeamTree), true).catch(() => {}); }, [fieldTeamTree, ready]);
  useEffect(() => { if (ready && centralizedContacts.length > 0) window.storage.set("ns-centralized-contacts", JSON.stringify(centralizedContacts), true).catch(() => {}); }, [centralizedContacts, ready]);
  // Load centralized contacts — from storage or default JSON
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const stored = await window.storage.get("ns-centralized-contacts", true).catch(() => null);
      if (stored) { setCentralizedContacts(JSON.parse(stored.value)); return; }
      try { const r = await fetch("/data/contacts-default.json"); const d = await r.json(); setCentralizedContacts(d); } catch {}
    })();
  }, [ready]);
  // Load tier list tracker — from storage or default JSON
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const stored = await window.storage.get("ns-tierlist", true).catch(() => null);
      if (stored) { setTierListData(JSON.parse(stored.value)); return; }
      try { const r = await fetch("/data/tierlist-default.json"); const d = await r.json(); setTierListData(d); } catch {}
    })();
  }, [ready]);
  useEffect(() => { if (ready && tierListData.length > 0) window.storage.set("ns-tierlist", JSON.stringify(tierListData), true).catch(() => {}); }, [tierListData, ready]);
  // Load weekly drops
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const stored = await window.storage.get("ns-weekly-drops", true).catch(() => null);
      if (stored) { setWeeklyDrops(JSON.parse(stored.value)); return; }
      try { const r = await fetch("/data/drops-default.json"); const d = await r.json(); setWeeklyDrops(d); } catch {}
    })();
  }, [ready]);
  useEffect(() => { if (ready && weeklyDrops.length > 0) window.storage.set("ns-weekly-drops", JSON.stringify(weeklyDrops), true).catch(() => {}); }, [weeklyDrops, ready]);
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const stored = await window.storage.get("ns-credit-memos", true).catch(() => null);
      if (stored) { setCreditMemos(JSON.parse(stored.value)); return; }
      try { const r = await fetch("/data/creditmemos-default.json"); const d = await r.json(); setCreditMemos(d); } catch {}
    })();
  }, [ready]);
  useEffect(() => { if (ready && creditMemos.length > 0) window.storage.set("ns-credit-memos", JSON.stringify(creditMemos), true).catch(() => {}); }, [creditMemos, ready]);
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const stored = await window.storage.get("ns-sales-contacts", true).catch(() => null);
      if (stored) { setSalesContacts(JSON.parse(stored.value)); return; }
      try { const r = await fetch("/data/salescontacts-default.json"); const d = await r.json(); setSalesContacts(d); } catch {}
    })();
  }, [ready]);
  useEffect(() => { if (ready && salesContacts.length > 0) window.storage.set("ns-sales-contacts", JSON.stringify(salesContacts), true).catch(() => {}); }, [salesContacts, ready]);
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const stored = await window.storage.get("ns-promo-calendar", true).catch(() => null);
      if (stored) {
        const parsed = JSON.parse(stored.value);
        // Check if data needs migration (Feb/March stuck in January)
        const needsFix = parsed.some(p => p.section === "January 2026" && /^(February|March)$/i.test(p.name));
        if (needsFix) {
          // Reload from corrected defaults, merge any user-added items
          try {
            const r = await fetch("/data/promocalendar-default.json");
            const defaults = await r.json();
            const defaultIds = new Set(defaults.map(d => d.id));
            const userAdded = parsed.filter(p => !defaultIds.has(p.id) && !(/^(February|March)$/i.test(p.name) && !p.discountType));
            setPromoCalendar([...defaults, ...userAdded]);
          } catch { setPromoCalendar(parsed); }
          return;
        }
        setPromoCalendar(parsed);
        return;
      }
      try { const r = await fetch("/data/promocalendar-default.json"); const d = await r.json(); setPromoCalendar(d); } catch {}
    })();
  }, [ready]);
  useEffect(() => { if (ready && promoCalendar.length > 0) window.storage.set("ns-promo-calendar", JSON.stringify(promoCalendar), true).catch(() => {}); }, [promoCalendar, ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-popups-blitz", true).catch(() => null); if (s) { setPopupsData(JSON.parse(s.value)); return; } try { const r = await fetch("/data/popups-default.json"); setPopupsData(await r.json()); } catch {} })(); }, [ready]);
  useEffect(() => { if (ready && popupsData.length > 0) window.storage.set("ns-popups-blitz", JSON.stringify(popupsData), true).catch(() => {}); }, [popupsData, ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-events-cal", true).catch(() => null); if (s) { setEventsData(JSON.parse(s.value)); return; } try { const r = await fetch("/data/events-default.json"); setEventsData(await r.json()); } catch {} })(); }, [ready]);
  useEffect(() => { if (ready && eventsData.length > 0) window.storage.set("ns-events-cal", JSON.stringify(eventsData), true).catch(() => {}); }, [eventsData, ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-cs-board", true).catch(() => null); if (s) { setCsBoardData(JSON.parse(s.value)); return; } try { const r = await fetch("/data/csboard-default.json"); setCsBoardData(await r.json()); } catch {} })(); }, [ready]);
  useEffect(() => { if (ready && csBoardData.length > 0) window.storage.set("ns-cs-board", JSON.stringify(csBoardData), true).catch(() => {}); }, [csBoardData, ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-packaging-tracker", true).catch(() => null); if (s) setPackagingTracker(JSON.parse(s.value)); })(); }, [ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-packaging-confirmed", true).catch(() => null); if (s) setPackagingConfirmed(JSON.parse(s.value)); })(); }, [ready]);
  useEffect(() => { if (ready && packagingTracker.length > 0) window.storage.set("ns-packaging-tracker", JSON.stringify(packagingTracker), true).catch(() => {}); }, [packagingTracker, ready]);
  useEffect(() => { if (ready && packagingConfirmed.length > 0) window.storage.set("ns-packaging-confirmed", JSON.stringify(packagingConfirmed), true).catch(() => {}); }, [packagingConfirmed, ready]);
  const pkgEvoTrackerLoadedRef = useRef(false);
  const pkgEvoConfirmedLoadedRef = useRef(false);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-packaging-evolution-tracker", true).catch(() => null); if (s) { try { setPackagingEvolutionTracker(JSON.parse(s.value)); } catch {} } pkgEvoTrackerLoadedRef.current = true; })(); }, [ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-packaging-evolution-confirmed", true).catch(() => null); if (s) { try { setPackagingEvolutionConfirmed(JSON.parse(s.value)); } catch {} } pkgEvoConfirmedLoadedRef.current = true; })(); }, [ready]);
  useEffect(() => { if (!ready || !pkgEvoTrackerLoadedRef.current) return; window.storage.set("ns-packaging-evolution-tracker", JSON.stringify(packagingEvolutionTracker), true).catch(() => {}); }, [packagingEvolutionTracker, ready]);
  useEffect(() => { if (!ready || !pkgEvoConfirmedLoadedRef.current) return; window.storage.set("ns-packaging-evolution-confirmed", JSON.stringify(packagingEvolutionConfirmed), true).catch(() => {}); }, [packagingEvolutionConfirmed, ready]);
  const agencyLoadedRef = useRef(false);
  const normalizeAgencySubs = (raw) => Array.isArray(raw) ? raw.filter(s => s && typeof s === "object" && typeof s.id === "string").map(s => ({ ...s, answers: s.answers && typeof s.answers === "object" ? s.answers : {} })) : [];
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-agency-submissions", true).catch(() => null); if (s) { try { setAgencySubmissions(normalizeAgencySubs(JSON.parse(s.value))); } catch {} } agencyLoadedRef.current = true; })(); }, [ready]);
  useEffect(() => { if (!ready || !agencyLoadedRef.current) return; window.storage.set("ns-agency-submissions", JSON.stringify(agencySubmissions), true).catch(() => {}); }, [agencySubmissions, ready]);
  useEffect(() => { if (!ready) return; (async () => { const s = await window.storage.get("ns-field-agenda-v2", true).catch(() => null); if (s) { setFieldAgenda(JSON.parse(s.value)); return; } try { const r = await fetch("/data/fieldagenda-v2.json"); setFieldAgenda(await r.json()); } catch {} })(); }, [ready]);
  useEffect(() => { if (ready && fieldAgenda?.meetings) window.storage.set("ns-field-agenda-v2", JSON.stringify(fieldAgenda), true).catch(() => {}); }, [fieldAgenda, ready]);

  useEffect(() => {
    const handler = () => { setLeftTab("initiatives"); setActiveBrand(null); };
    window.addEventListener("switch-to-board", handler);
    return () => window.removeEventListener("switch-to-board", handler);
  }, []);

  // Auto-refresh shared data when tab gains focus
  useEffect(() => {
    const reload = async () => {
      if (!ready || !window.storage) return;
      try {
        const [i, ca, cn, dr, ft, ct, tl, cm, sc, pc, pb, ev, fa, cs2, ag] = await Promise.all([
          window.storage.get("ns-initiatives", true).catch(() => null),
          window.storage.get("ns-campaigns", true).catch(() => null),
          window.storage.get("ns-concepts", true).catch(() => null),
          window.storage.get("ns-design-requests", true).catch(() => null),
          window.storage.get("ns-fieldteam-tree", true).catch(() => null),
          window.storage.get("ns-centralized-contacts", true).catch(() => null),
          window.storage.get("ns-tierlist", true).catch(() => null),
          window.storage.get("ns-credit-memos", true).catch(() => null),
          window.storage.get("ns-sales-contacts", true).catch(() => null),
          window.storage.get("ns-promo-calendar", true).catch(() => null),
          window.storage.get("ns-popups-blitz", true).catch(() => null),
          window.storage.get("ns-events-cal", true).catch(() => null),
          window.storage.get("ns-field-agenda-v2", true).catch(() => null),
          window.storage.get("ns-cs-board", true).catch(() => null),
          window.storage.get("ns-agency-submissions", true).catch(() => null),
        ]);
        if (i) setInitiatives(JSON.parse(i.value));
        if (ca) setCampaigns(JSON.parse(ca.value));
        if (cn) setConcepts(JSON.parse(cn.value).map(c => ({ ...c })));
        if (dr) setDesignRequests(JSON.parse(dr.value));
        if (ft) setFieldTeamTree(JSON.parse(ft.value));
        if (ct) setCentralizedContacts(JSON.parse(ct.value));
        if (tl) setTierListData(JSON.parse(tl.value));
        if (cm) setCreditMemos(JSON.parse(cm.value));
        if (sc) setSalesContacts(JSON.parse(sc.value));
        if (pc) setPromoCalendar(JSON.parse(pc.value));
        if (pb) setPopupsData(JSON.parse(pb.value));
        if (ev) setEventsData(JSON.parse(ev.value));
        if (fa) setFieldAgenda(JSON.parse(fa.value));
        if (cs2) setCsBoardData(JSON.parse(cs2.value));
        if (ag) { try { setAgencySubmissions(normalizeAgencySubs(JSON.parse(ag.value))); } catch {} }
      } catch {}
    };
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    // Also refresh every 60 seconds
    const interval = setInterval(reload, 60000);
    return () => { window.removeEventListener("focus", onFocus); clearInterval(interval); };
  }, [ready]);

  // Scroll content to top when switching tabs
  useEffect(() => {
    const el = document.querySelector(".main");
    if (el) el.scrollTo(0, 0);
    // Also scroll after a tick in case content renders late
    setTimeout(() => { const el2 = document.querySelector(".main"); if (el2) el2.scrollTo(0, 0); }, 50);
  }, [leftTab]);

  const saveUser = (name, role) => {
    const color = colorForName(name);
    const user = { name, color, role };
    setCurrentUser(user);
    window.storage.set("ns-user", JSON.stringify(user)).catch(() => {});
    // Register in shared team
    setTeamMembers(prev => {
      const exists = prev.find(m => m.name === name);
      if (exists) return prev.map(m => m.name === name ? { ...m, color, role } : m);
      return [...prev, { name, color, role, title: "", bio: "", strengths: [], skills: [], keyPoints: [], joinedAt: new Date().toISOString() }];
    });
    setShowWhoModal(false);
  };


  useEffect(() => { try { localStorage.setItem("dam_v2_assets", JSON.stringify(damAssets)); } catch {} }, [damAssets]);
  useEffect(() => { try { localStorage.setItem("dam_config", JSON.stringify(damConfig)); } catch {} }, [damConfig]);
  useEffect(() => { try { localStorage.setItem("dam_folders", JSON.stringify(damFolders)); } catch {} }, [damFolders]);
  const addNote = () => {
    if (!noteText.trim() || !currentUser) return;
    setNotes(p => [{ id: `n-${Date.now()}`, author: currentUser.name, color: currentUser.color, text: noteText.trim(), detail: "", ts: new Date().toISOString() }, ...p]);
    setNoteText("");
  };
  const updateNoteDetail = (id, detail) => {
    setNotes(p => p.map(n => n.id === id ? { ...n, detail } : n));
    setExpandedNoteId(null);
    setNoteDetailDraft("");
  };
  const addReply = (noteId) => {
    if (!replyText.trim() || !currentUser) return;
    setNotes(p => p.map(n => n.id === noteId ? { ...n, replies: [...(n.replies || []), { id: `r-${Date.now()}`, author: currentUser.name, color: currentUser.color, text: replyText.trim(), ts: new Date().toISOString() }] } : n));
    setReplyText("");
    setReplyingToId(null);
  };
  const saveNoteEdit = (noteId) => {
    if (!editNoteText.trim()) return;
    setNotes(p => p.map(n => n.id === noteId ? { ...n, text: editNoteText.trim() } : n));
    setEditingNoteId(null);
    setEditNoteText("");
  };
  const clearNote = (noteId) => {
    setNotes(p => p.filter(n => n.id !== noteId));
    if (editingNoteId === noteId) { setEditingNoteId(null); setEditNoteText(""); }
    if (replyingToId === noteId) { setReplyingToId(null); setReplyText(""); }
  };
  const addNoteWithContext = (ctx) => {
    if (!ctx || !currentUser) return;
    const text = ctx.prefill || ctx.text || "";
    if (!text.trim()) { setNotesOpen(true); return; }
    setNotes(p => [{
      id: `n-${Date.now()}`, author: currentUser.name, color: currentUser.color,
      text: text.trim(), ts: new Date().toISOString(),
      context: ctx.label ? `${ctx.type || ctx.section || "Note"}: ${ctx.label}` : (ctx.context || null),
      section: ctx.section || null, brand: ctx.brand || null,
    }, ...p]);
    setNotesOpen(true);
  };

  // Marker mode: post note with or without pending tag
  const postNote = () => {
    if (!noteText.trim() || !currentUser) return;
    if (pendingTag) {
      setNotes(p => [{
        id: `n-${Date.now()}`, author: currentUser.name, color: currentUser.color,
        text: noteText.trim(), detail: "", ts: new Date().toISOString(),
        context: pendingTag.label ? `${pendingTag.type || pendingTag.section || "Note"}: ${pendingTag.label}` : null,
        section: pendingTag.section || null, brand: pendingTag.brand || null,
      }, ...p]);
      setPendingTag(null);
    } else {
      setNotes(p => [{ id: `n-${Date.now()}`, author: currentUser.name, color: currentUser.color, text: noteText.trim(), detail: "", ts: new Date().toISOString() }, ...p]);
    }
    setNoteText("");
    // Re-enable marker mode for the next note
    setMarkerMode(true);
  };

  // Marker mode: native capture-phase click handler on <main>
  const mainRef = useRef(null);
  useEffect(() => {
    if (!markerMode) return;
    const main = mainRef.current;
    if (!main) return;
    const handler = (e) => {
      const el = e.target.closest("[data-tag-type]");
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const tag = { type: el.dataset.tagType, label: el.dataset.tagLabel, section: el.dataset.tagSection, brand: el.dataset.tagBrand || "" };
      setPendingTag(tag);
      setMarkerMode(false);
      setNotesOpen(true);
      el.style.boxShadow = "0 0 0 3px rgba(201,168,76,.6)";
      setTimeout(() => { el.style.boxShadow = ""; }, 800);
    };
    main.addEventListener("click", handler, true);
    const keyHandler = (e) => { if (e.key === "Escape") setMarkerMode(false); };
    window.addEventListener("keydown", keyHandler);
    return () => { main.removeEventListener("click", handler, true); window.removeEventListener("keydown", keyHandler); };
  }, [markerMode]);

  const saveFile = (id, url, name) => { setInitiatives(p => p.map(x => x.id !== id ? x : { ...x, fileUrl: url, fileName: name })); setFileModal(null); };
  const saveConceptHtml = (id, html, name) => {
    setInitiatives(p => p.map(x => x.id !== id ? x : { ...x, htmlConcept: html, htmlConceptName: name }));
    conceptHtmlCache.current[id] = html;
    setConceptCacheVersion(v => v + 1);
    window.storage.set(`ns-concept-html-${id}`, html, true).catch(() => {});
    setConceptUpload(null);
  };
  const addInit = (init) => { setInitiatives(p => [...p, init]); setShowAddInit(false); };
  const deleteInit = (id) => {
    const updated = initiatives.filter(x => x.id !== id);
    const toSave = updated.map(i => ({...i, htmlConcept: null}));
    try {
      localStorage.setItem("shared_ns_ns-initiatives", JSON.stringify(toSave));
    } catch(e) {}
    setInitiatives(updated);
  };
  const updateInit = (id, updates) => setInitiatives(p => p.map(x => x.id === id ? { ...x, ...updates } : x));
  const deleteCampaign = (id) => setCampaigns(p => p.filter(x => x.id !== id));
  const saveStrategy = (s) => { setStrategy(s); setShowEditStrategy(false); };
  const saveCampaignAsInit = (init) => { setInitiatives(p => [...p, init]); };
  const [initToCampaign, setInitToCampaign] = useState(null);
  const createCampaignFromInit = (init, campaignData) => {
    const campId = `cmp-${Date.now()}`;
    const camp = {
      id: campId,
      title: campaignData.title,
      brand: campaignData.brand,
      concept: campaignData.concept,
      objective: campaignData.concept,
      status: campaignData.status || "brief",
      brief: null,
      createdBy: campaignData.createdBy,
      createdAt: new Date().toISOString(),
      _fromInitiative: init.id,
    };
    setCampaigns(p => [camp, ...p]);
    const brandEntry = Object.values(brands).find(b => b.name === campaignData.brand);
    setCampaignTimeline(p => [{
      id: `ctl-${Date.now()}`,
      campaignId: campId,
      title: campaignData.title,
      brand: campaignData.brand || "CÚRADOR",
      color: brandEntry?.color || "#c9a84c",
      cost: campaignData.cost || 0,
      startDate: campaignData.startDate || new Date().toISOString().slice(0, 10),
      endDate: campaignData.endDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      elements: (campaignData.elements || []).map(el => ({ ...el, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })),
    }, ...p]);
    setInitiatives(p => p.map(i => i.id === init.id ? { ...i, _campaignId: campId, _campaignTitle: campaignData.title } : i));
    setInitToCampaign(null);
  };

  const updateMemberProfile = (name, updates) => {
    setTeamMembers(p => p.map(m => m.name === name ? { ...m, ...updates } : m));
    if (selectedMember?.name === name) setSelectedMember(prev => prev ? { ...prev, ...updates } : prev);
  };

  const filtered = initiatives.filter(i => filterChannel === "All" || i.channel === filterChannel);
  const getAccent = (pillar) => PILLAR_ACCENTS[strategy.pillars.indexOf(pillar) % PILLAR_ACCENTS.length] || PILLAR_ACCENTS[0];
  const headlineWords = strategy.tagline.replace(/\.$/, "").split(" ");
  const mid = Math.ceil(headlineWords.length / 2);
  const activeAuthors = [...new Map(notes.map(n => [n.author, n.color])).entries()].slice(0, 5);

  // When clicking a channel init, highlight it in the board
  const onChannelInitClick = (init) => {
    setHlInitId(init.id);
    setFilterChannel("All");
    setView("grid");
    setTimeout(() => { document.getElementById(`card-${init.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
    setTimeout(() => setHlInitId(null), 2000);
  };

  return (
    <>
      <style>{css}</style>
      {showWhoModal && <WhoModal whoName={whoName} setWhoName={setWhoName} whoRole={whoRole} setWhoRole={setWhoRole} onSave={saveUser} orgRoles={orgRoles} teamMembers={teamMembers} />}
      {selectedMember && <TeamMemberModal member={selectedMember} currentUser={currentUser} onClose={() => setSelectedMember(null)} onUpdate={updateMemberProfile} onDelete={(name) => { setTeamMembers(p => p.filter(m => m.name !== name)); setSelectedMember(null); }} />}
      {showCampaignModal && <CampaignModal currentUser={currentUser} pillars={strategy.pillars} teamMembers={teamMembers} onClose={() => setShowCampaignModal(false)} onSave={(c) => {
        setCampaigns(p => [c, ...p]);
        const today = new Date().toISOString().slice(0, 10);
        const threeMonths = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
        const brandEntry = Object.values(brands).find(b => b.name === c.brand);
        setCampaignTimeline(p => [{
          id: `ctl-${Date.now()}`,
          campaignId: c.id,
          title: c.title,
          brand: c.brand || "CÚRADOR",
          color: brandEntry?.color || "#c9a84c",
          cost: 0,
          startDate: today,
          endDate: threeMonths,
          elements: [],
        }, ...p]);
        setShowCampaignModal(false);
      }} onSaveAsInit={saveCampaignAsInit} />}
      {selectedCampaign && <CampaignDetailModal campaign={selectedCampaign} pillars={strategy.pillars} onClose={() => setSelectedCampaign(null)} onNote={(ctx) => addNoteWithContext(ctx)} onSaveAsInit={(init) => { saveCampaignAsInit(init); setCampaigns(p => p.map(c => c.id === selectedCampaign.id ? { ...c, status: "approved" } : c)); setSelectedCampaign(null); }}
        onViewConcept={selectedCampaign._fromConcept ? () => { setLeftTab("concepts"); setActiveBrand(null); setActiveConceptId(selectedCampaign._fromConcept); setSelectedCampaign(null); } : null}
        campaignHtml={campaignCacheVersion >= 0 ? campaignHtmlCache.current[selectedCampaign.id] : null}
        onHtmlAttach={(id, html, name) => {
          campaignHtmlCache.current[id] = html;
          setCampaignCacheVersion(v => v + 1);
          window.storage.set(`ns-camp-html-${id}`, html, true).catch(() => {});
          setCampaigns(p => p.map(c => c.id === id ? { ...c, _htmlName: name } : c));
          setSelectedCampaign(prev => ({ ...prev, _htmlName: name }));
        }}
      />}

      <div className="page">
        {/* ── HEADER ── */}
        <header className="hdr">
          <div className="hdr-brand" style={{ gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: ".12em", color: "var(--text)", lineHeight: 1, textTransform: "uppercase" }}>
                C<span style={{ color: "#3bb54a" }}>Ú</span>RADOR
              </div>
              <div style={{ fontSize: 11, color: "#b8b4cc", textTransform: "uppercase", letterSpacing: ".18em", marginTop: 3 }}>Marketing OS</div>
            </div>
            <div className="tz-bar">
            <div className="tz-date">{tzDate("America/Chicago")}</div>
            <div className="tz-sep" />
            {[
              { label: "PT", tz: "America/Los_Angeles" },
              { label: "CT", tz: "America/Chicago" },
              { label: "ET", tz: "America/New_York" },
              { label: "AT", tz: "America/Puerto_Rico" },
            ].map((z, i) => (
              <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {i > 0 && <div className="tz-sep" />}
                <div className="tz-item">
                  <div className="tz-label">{z.label}</div>
                  <div className="tz-time">{tzNow(z.tz)}</div>
                  {weather[z.tz] && <div style={{ fontSize: 8, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80 }}>{weather[z.tz]}</div>}
                </div>
              </div>
            ))}
            </div>
          </div>
          <div className="hdr-right">
            {activeAuthors.length > 0 && (
              <div className="marker-bar" style={{ marginRight: 4 }}>
                {activeAuthors.map(([name, color]) => (
                  <div key={name} className="marker-bubble" style={{ background: color.bg, color: color.text }} title={name}>{initials(name)}</div>
                ))}
              </div>
            )}
            {!canEdit && (
              <div style={{ fontSize: 10, padding: "4px 10px", borderRadius: 100, background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "var(--text-muted)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                View Only
              </div>
            )}
            <button className={`notes-toggle ${notesOpen ? "open" : ""}`} onClick={() => { if (notesOpen) { setNotesOpen(false); setMarkerMode(false); } else { setNotesOpen(true); if (currentUser) setMarkerMode(true); } }}>
              ✏ Notes {notes.length > 0 && <span className="notes-count">{notes.length}</span>}
            </button>
            {currentUser && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => {
                  const me = teamMembers.find(m => m.name?.toLowerCase() === currentUser.name?.toLowerCase());
                  if (me) setSelectedMember(me);
                  else setSelectedMember({ name: currentUser.name, color: currentUser.color?.bg ? currentUser.color : colorForName(currentUser.name || "User"), role: currentUser.role || "content" });
                }}
                  style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: currentUser.color?.bg || "var(--gold)", color: currentUser.color?.text || "#07070f", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 12px ${currentUser.color?.bg || "var(--gold)"}55`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  title="Edit your profile">{initials(currentUser.name)}</button>
                <button onClick={() => { sessionStorage.removeItem("ch-auth"); sessionStorage.removeItem("ch-user"); import("next-auth/react").then(m => m.signOut({ callbackUrl: "/login" })); }}
                  style={{ padding:"5px 10px",borderRadius:100,border:"1px solid var(--border)",background:"transparent",color:"var(--text-muted)",fontSize:10,letterSpacing:".06em",textTransform:"uppercase",cursor:"pointer",fontFamily:"var(--bf)",transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(224,123,106,.4)"; e.currentTarget.style.color="#e07b6a"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}
                  title="Sign out">Sign Out</button>
              </div>
            )}
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="body-row">
          {/* LEFT SIDEBAR */}
          <aside className={`lsb ${lsbOpen ? "" : "collapsed"}`}>
            <div className="lsb-top">
              {lsbOpen && <div className="lsb-top-title">Navigation</div>}
              <button className="lsb-cb" onClick={() => setLsbOpen(o => !o)} title={lsbOpen ? "Collapse" : "Expand"}>{lsbOpen ? "◀" : "▶"}</button>
            </div>

            {lsbOpen && (
              <div className="lsb-body">
                {/* CÚRADOR + brands always visible at top */}
                <CompanyPanel company={company}
                  brands={brands}
                  activeBrand={activeBrand}
                  initiatives={initiatives}
                  onBrandSelect={(id) => { setActiveBrand(id); setLeftTab("company"); }}
                  onInitClick={(init, brandId) => { setActiveBrand(brandId); setDetail(init); }}
                  onAddBrandInit={(brandId) => { setShowAddBrandInit(brandId); }}
                />

                {/* Divider */}
                <div style={{ height: 1, background: "var(--border2)", margin: "4px 0" }} />

                {/* Nav tabs — below brands */}
                <nav className="lsb-nav" style={{ borderBottom: "none", borderTop: "none" }}>
                  {[
                    { id: "company",     icon: "✦",  label: "Marketing Vision" },
                    { id: "initiatives", icon: "📌", label: "Initiatives" },
                  ].map(t => (
                    <button key={t.id} className={`lsb-tab ${leftTab === t.id ? "on" : ""}`} onClick={() => { setLeftTab(t.id); setActiveBrand(null); }}>
                      <span className="lsb-icon">{t.icon}</span>
                      {lsbOpen && <span className="lsb-lbl">{t.label}</span>}
                    </button>
                  ))}

                  {/* Campaigns — with inline dropdown */}
                  <button className={`lsb-tab ${leftTab === "campaigns" ? "on" : ""}`} onClick={() => { if (leftTab === "campaigns") { setLeftTab("company"); } else { setLeftTab("campaigns"); } setActiveBrand(null); }}>
                    <span className="lsb-icon">🚀</span>
                    {lsbOpen && <span className="lsb-lbl">Campaigns</span>}
                    {lsbOpen && (
                      <span style={{ marginLeft: "auto", fontSize: 10, opacity: .5, transition: "transform .18s", display: "inline-block", transform: leftTab === "campaigns" ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    )}
                  </button>
                  {leftTab === "campaigns" && lsbOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 8, marginTop: 1 }}>
                      {[
                        { id: "briefs",    icon: "📋", label: "Briefs" },
                        { id: "timeline",  icon: "📅", label: "Timeline" },
                      ].map(item => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center" }}>
                          <button
                            onClick={() => setCampaignView(item.id)}
                            className={`lsb-tab ${campaignView === item.id ? "on" : ""}`}
                            style={{ flex: 1, paddingLeft: 20, fontSize: 11, opacity: campaignView === item.id ? 1 : .75 }}
                          >
                            <span className="lsb-icon" style={{ fontSize: 11 }}>{item.icon}</span>
                            <span className="lsb-lbl">{item.label}</span>
                          </button>
                          {item.id === "timeline" && (
                            <button
                              title="Pop out timeline"
                              onClick={() => window.open("/campaign-timeline", "_blank", "width=1500,height=800,resizable=yes,scrollbars=yes,noopener,noreferrer")}
                              style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "var(--text-muted)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 4, transition: "all .15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.color = "var(--gold)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                            >↗</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {[
                    { id: "concepts",    icon: "🎨", label: "Concepts" },
                    { id: "timeline",    icon: "📅", label: "Timeline" },
                  ].map(t => (
                    <button key={t.id} className={`lsb-tab ${leftTab === t.id ? "on" : ""}`} onClick={() => { setLeftTab(t.id); setActiveBrand(null); }}>
                      <span className="lsb-icon">{t.icon}</span>
                      {lsbOpen && <span className="lsb-lbl">{t.label}</span>}
                    </button>
                  ))}

                  {/* Design Portal — with inline dropdown */}
                  <button className={`lsb-tab ${leftTab === "design" ? "on" : ""}`} onClick={() => { if (leftTab === "design") { setLeftTab("company"); } else { setLeftTab("design"); } setActiveBrand(null); }}>
                    <span className="lsb-icon">🖌</span>
                    {lsbOpen && <span className="lsb-lbl">Design Portal</span>}
                    {lsbOpen && (
                      <span style={{ marginLeft: "auto", fontSize: 10, opacity: .5, transition: "transform .18s", display: "inline-block", transform: leftTab === "design" ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    )}
                  </button>
                  {leftTab === "design" && lsbOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 8, marginTop: 1 }}>
                      {[
                        { id: "queue",  icon: "📋", label: "Design Queue" },
                        { id: "submit", icon: "➕", label: "Submit Request" },
                      ].map(item => (
                        <button key={item.id}
                          onClick={() => { setDesignView(item.id); if (item.id === "submit") setShowDesignModal(true); }}
                          className={`lsb-tab ${designView === item.id ? "on" : ""}`}
                          style={{ paddingLeft: 20, fontSize: 11, opacity: designView === item.id ? 1 : .75 }}
                        >
                          <span className="lsb-icon" style={{ fontSize: 11 }}>{item.icon}</span>
                          <span className="lsb-lbl">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Field Team */}
                  <button className={`lsb-tab ${leftTab === "fieldteam" ? "on" : ""}`} onClick={() => { setLeftTab("fieldteam"); setActiveBrand(null); }}>
                    <span className="lsb-icon">📁</span>
                    {lsbOpen && <span className="lsb-lbl">Field Team</span>}
                  </button>

                  {/* Agency Portal */}
                  <button className={`lsb-tab ${leftTab === "agency" ? "on" : ""}`} onClick={() => { if (leftTab === "agency") { setLeftTab("company"); } else { setLeftTab("agency"); } setActiveBrand(null); }}>
                    <span className="lsb-icon">🏢</span>
                    {lsbOpen && <span className="lsb-lbl">Agency Portal</span>}
                    {lsbOpen && (
                      <span style={{ marginLeft: "auto", fontSize: 10, opacity: .5, transition: "transform .18s", display: "inline-block", transform: leftTab === "agency" ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    )}
                  </button>
                  {leftTab === "agency" && lsbOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 8, marginTop: 1 }}>
                      <button className="lsb-tab on" style={{ paddingLeft: 20, fontSize: 11 }}>
                        <span className="lsb-icon" style={{ fontSize: 11 }}>📋</span>
                        <span className="lsb-lbl">Headchange Strategy</span>
                      </button>
                    </div>
                  )}

                  {/* Packaging */}
                  <button className={`lsb-tab ${leftTab === "packaging" ? "on" : ""}`} onClick={() => { if (leftTab === "packaging") { setLeftTab("company"); } else { setLeftTab("packaging"); } setActiveBrand(null); }}>
                    <span className="lsb-icon">📦</span>
                    {lsbOpen && <span className="lsb-lbl">Packaging</span>}
                  </button>

                  {/* Team — with inline dropdown */}
                  <button className={`lsb-tab ${leftTab === "team" ? "on" : ""}`} onClick={() => { if (leftTab === "team") { setLeftTab("company"); } else { setLeftTab("team"); } setActiveBrand(null); }}>
                    <span className="lsb-icon">👥</span>
                    {lsbOpen && <span className="lsb-lbl">Team</span>}
                    {lsbOpen && (
                      <span style={{ marginLeft: "auto", fontSize: 10, opacity: .5, transition: "transform .18s", display: "inline-block", transform: leftTab === "team" ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    )}
                  </button>
                  {leftTab === "team" && lsbOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 8, marginTop: 1 }}>
                      {[
                        { id: "orgchart", icon: "🗂", label: "Org Chart" },
                        { id: "members",  icon: "👤", label: "Team Members" },
                      ].map(item => (
                        <button key={item.id}
                          onClick={() => setTeamView(teamView === item.id ? null : item.id)}
                          className={`lsb-tab ${teamView === item.id ? "on" : ""}`}
                          style={{ paddingLeft: 20, fontSize: 11, opacity: teamView === item.id ? 1 : .75 }}
                        >
                          <span className="lsb-icon" style={{ fontSize: 11 }}>{item.icon}</span>
                          <span className="lsb-lbl">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Asset Library — below Team */}
                  <div style={{ height: 1, background: "var(--border2)", margin: "4px 0" }} />
                  <button className={`lsb-tab ${leftTab === "dam" ? "on" : ""}`} onClick={() => { setLeftTab("dam"); setActiveBrand(null); }}>
                    <span className="lsb-icon">◈</span>
                    {lsbOpen && <span className="lsb-lbl">Asset Library</span>}
                  </button>

                  {/* Compliance */}
                  <div style={{ height: 1, background: "var(--border2)", margin: "4px 0" }} />
                  <button className={`lsb-tab ${leftTab === "compliance" ? "on" : ""}`} onClick={() => { setLeftTab("compliance"); setActiveBrand(null); }}>
                    <span className="lsb-icon">🛡</span>
                    {lsbOpen && <span className="lsb-lbl">Compliance</span>}
                  </button>

                  {/* Rebrand Timeline — external link */}
                  <div style={{ height: 1, background: "var(--border2)", margin: "4px 0" }} />
                  <a
                    href="https://seanmatw-glitch.github.io/brand-rebrand-gantt/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lsb-tab"
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: lsbOpen ? 8 : 0 }}
                    title="Rebrand Timeline"
                  >
                    <span className="lsb-icon">📊</span>
                    {lsbOpen && <span className="lsb-lbl" style={{ display: "flex", alignItems: "center", gap: 4 }}>Rebrand Timeline <span style={{ fontSize: 9, opacity: .5 }}>↗</span></span>}
                  </a>
                </nav>

                {/* Channels / Campaigns hint */}
                {(leftTab === "channels" || leftTab === "campaigns" || leftTab === "concepts" || leftTab === "initiatives" || leftTab === "timeline" || leftTab === "dam" || leftTab === "compliance" || leftTab === "design" || leftTab === "fieldteam" || leftTab === "packaging" || leftTab === "agency") && (
                  <div style={{ padding: "6px 16px 10px", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                    Content shown on the right →
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* MAIN */}
          <main ref={mainRef} className={`main ${notesOpen ? "nr" : ""} ${markerMode ? "marker-active" : ""}`}>
            <div className="hub">

            {/* ── TEAM VIEW ── */}
            {leftTab === "team" && !activeBrand && teamView && (
              <div style={{ padding: "28px 36px" }}>
                {teamView === "orgchart" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid var(--border2)", paddingBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6, fontWeight: 600 }}>Marketing Team</div>
                        <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)", lineHeight: 1, marginBottom: 6 }}>Org Chart</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: 480 }}>Your team structure at a glance. Drag and connect roles to visualize reporting lines. Changes save automatically and are visible to everyone.</div>
                      </div>
                    </div>
                    <OrgChartView teamMembers={teamMembers} currentUser={currentUser} orgRoles={orgRoles} onSelect={setSelectedMember} onRolesChange={canEdit ? setOrgRoles : null} canEdit={canEdit} />
                  </>
                )}
                {teamView === "members" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid var(--border2)", paddingBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6, fontWeight: 600 }}>Marketing Team</div>
                        <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)", lineHeight: 1, marginBottom: 6 }}>
                          Team Members <span style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 400 }}>· {teamMembers.length}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: 480 }}>Everyone on the marketing team in one place. Select who you are to personalize your view and unlock editing. Each member has their own role and profile.</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {!currentUser && <button className="btn" onClick={() => setShowWhoModal(true)}>+ Join Team</button>}
                        {isAdmin && <button className="btn btn-gold" onClick={() => setShowAddMember(true)}>+ Add Member</button>}
                      </div>
                    </div>

                    {/* Add Member Modal */}
                    {showAddMember && (
                      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 200 }} onClick={() => { setShowAddMember(false); resetNewMember(); }}>
                        <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 32px", width: 440, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}>
                          <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6, fontWeight: 600 }}>New Team Member</div>
                          <div style={{ fontFamily: "var(--df)", fontSize: 20, fontWeight: 300, color: "var(--text)", marginBottom: 20 }}>Add to Team</div>
                          {(() => {
                            const lblStyle = { fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4, display: "block" };
                            const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", outline: "none", boxSizing: "border-box" };
                            const hintStyle = { fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontStyle: "italic" };
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                  <div>
                                    <label style={lblStyle}>Name *</label>
                                    <input value={newMember.name} onChange={e => updateNewMember("name", e.target.value)} placeholder="Full name" style={inputStyle} autoFocus />
                                  </div>
                                  <div>
                                    <label style={lblStyle}>Title</label>
                                    <input value={newMember.title} onChange={e => updateNewMember("title", e.target.value)} placeholder="e.g. Marketing Coordinator" style={inputStyle} />
                                  </div>
                                </div>
                                <div>
                                  <label style={lblStyle}>Org Role</label>
                                  <select value={newMember.role} onChange={e => updateNewMember("role", e.target.value)} style={inputStyle}>
                                    {orgRoles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label style={lblStyle}>Bio</label>
                                  <textarea value={newMember.bio} onChange={e => updateNewMember("bio", e.target.value)} placeholder="Brief background or role description…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                                </div>
                                <div>
                                  <label style={lblStyle}>Skills</label>
                                  <input value={newMember.skills} onChange={e => updateNewMember("skills", e.target.value)} placeholder="e.g. Social Media, Copywriting, Analytics" style={inputStyle} />
                                  <div style={hintStyle}>Comma-separated</div>
                                </div>
                                <div>
                                  <label style={lblStyle}>Strengths</label>
                                  <input value={newMember.strengths} onChange={e => updateNewMember("strengths", e.target.value)} placeholder="e.g. Creative Direction, Team Leadership" style={inputStyle} />
                                  <div style={hintStyle}>Comma-separated</div>
                                </div>
                                <div>
                                  <label style={lblStyle}>Key Points</label>
                                  <input value={newMember.keyPoints} onChange={e => updateNewMember("keyPoints", e.target.value)} placeholder="e.g. Manages dispensary accounts, Leads field team" style={inputStyle} />
                                  <div style={hintStyle}>Comma-separated</div>
                                </div>
                              </div>
                            );
                          })()}
                          <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "flex-end" }}>
                            <button onClick={() => { setShowAddMember(false); resetNewMember(); }} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--bf)", cursor: "pointer" }}>Cancel</button>
                            <button onClick={addTeamMember} disabled={!newMember.name.trim()} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: newMember.name.trim() ? "var(--gold)" : "var(--surface2)", color: newMember.name.trim() ? "var(--bg)" : "var(--text-muted)", fontSize: 12, fontFamily: "var(--bf)", fontWeight: 600, cursor: newMember.name.trim() ? "pointer" : "default" }}>Add Member</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <MembersGridView teamMembers={teamMembers} currentUser={currentUser} orgRoles={orgRoles} onSelect={setSelectedMember} onChangeUser={() => setShowWhoModal(true)} />
                  </>
                )}
              </div>
            )}

            {/* ── TEAM: no selection yet ── */}
            {leftTab === "team" && !activeBrand && !teamView && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 32, marginBottom: 14, opacity: .3 }}>👥</div>
                  <div style={{ fontSize: 14, marginBottom: 6, color: "var(--text-dim)" }}>Select a section</div>
                  <div style={{ fontSize: 12 }}>Choose Org Chart or Team Members from the left panel</div>
                </div>
              </div>
            )}

            {leftTab === "channels" && !activeBrand && (
              <div style={{ padding: "32px 44px", minHeight: "100vh" }}>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8, fontWeight: 600 }}>Strategic Channels</div>
                  <div style={{ fontFamily: "var(--df)", fontSize: 36, fontWeight: 300, color: "var(--text)", marginBottom: 4 }}>Channels</div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)" }}>All initiatives grouped by strategic pillar. Click any to highlight it on the board.</div>
                </div>
                <ChannelsPanel initiatives={initiatives} pillars={strategy.pillars} pillarAccents={PILLAR_ACCENTS} onInitClick={onChannelInitClick} hlInitId={hlInitId} fullWidth />
              </div>
            )}

            {/* ── INITIATIVES EXPLAINER ── */}
            {leftTab === "initiatives" && !activeBrand && (
              <div style={{ padding: "36px 44px" }}>

                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 10 }}>Initiative Board</div>
                    <div style={{ fontFamily: "var(--df)", fontSize: 38, fontWeight: 300, lineHeight: .95, color: "var(--text)", marginBottom: 10 }}>
                      The work behind<br /><em style={{ color: "var(--gold)" }}>the strategy.</em>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 520 }}>
                      Each initiative maps to a marketing channel and drives toward a specific goal. Attach creative concepts, upload a brief, set dates, and push directly to a campaign when ready to activate. Use the <strong style={{ color: "var(--text)", fontWeight: 600 }}>→ Campaign</strong> button on any card to build a campaign and timeline entry from that initiative.
                    </div>
                  </div>
                  {canAddContent && <button className="btn btn-gold" style={{ marginTop: 8, flexShrink: 0 }} onClick={() => setShowAddInit(true)}>+ Add Initiative</button>}
                </div>

                {/* Initiative cards */}
                {initiatives.length === 0 ? (
                  <div style={{ padding: "60px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: 16 }}>
                    <div style={{ fontSize: 36, marginBottom: 14, opacity: .25 }}>📌</div>
                    <div style={{ fontSize: 15, color: "var(--text-dim)", marginBottom: 8 }}>No initiatives yet</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Add your first initiative and attach an HTML concept to bring the vision to life</div>
                    {canAddContent && <button className="btn btn-gold" onClick={() => setShowAddInit(true)}>+ Add Initiative</button>}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {initiatives.map(init => {
                      const color = getChannelColor(init.channel);
                      const channelShort = (init.channel || "").split(" · ")[1] || init.channel;
                      const cachedHtml = conceptHtmlCache.current[init.id] || init.htmlConcept || null;
                      const hasConcept = !!cachedHtml;
                      const hasConceptUrl = !!init._conceptUrl;
                      const isLoadingConcept = hasConceptUrl && !hasConcept;
                      const pct = dateProgress(init.startDate, init.endDate);
                      return (
                        <div key={init.id} data-tag-type="Initiative" data-tag-label={init.title} data-tag-section="Initiatives" data-tag-brand={init.brandId && brands[init.brandId] ? brands[init.brandId].name : ""} style={{
                          background: "var(--surface)", borderRadius: 14,
                          border: `1px solid ${hasConcept ? color + "33" : "var(--border)"}`,
                          borderTop: `2px solid ${color}`,
                          overflow: "hidden", display: "flex", flexDirection: "column",
                          transition: "all .18s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,.35)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                        >
                          {/* Concept preview thumbnail */}
                          {hasConcept && (
                            <div style={{ height: 120, overflow: "hidden", position: "relative", background: "var(--surface2)", cursor: "pointer" }} onClick={() => setConceptModal(init.id)}>
                              <iframe srcDoc={cachedHtml}
                                style={{ width: "200%", height: "200%", border: "none", transform: "scale(0.5)", transformOrigin: "0 0", pointerEvents: "none" }}
                                sandbox="allow-scripts"
                                title={`preview-${init.id}`}
                              />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(13,13,26,.9) 100%)" }} />
                              <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: "#fff", background: "rgba(0,0,0,.5)", padding: "2px 8px", borderRadius: 100, backdropFilter: "blur(4px)" }}>
                                🎨 Concept attached
                              </div>
                            </div>
                          )}
                          {isLoadingConcept && (
                            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.02)", gap: 8 }}>
                              <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
                              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Loading concept…</span>
                            </div>
                          )}

                          <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                            {/* Channel badge */}
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color, opacity: .85 }}>{channelShort}</div>

                            {/* Title */}
                            <div style={{ fontFamily: "var(--df)", fontSize: 20, fontWeight: 400, color: "var(--text)", lineHeight: 1.2 }}>{init.title}</div>

                            {/* Description */}
                            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>{init.description}</div>

                            {/* Date progress */}
                            {init.startDate && (
                              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{fmtDate(init.startDate)}</span>
                                <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,.06)", borderRadius: 1, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct ?? 0}%`, background: init.revolving ? "linear-gradient(90deg,#4d9e8e,#8b7fc0)" : color, borderRadius: 1 }} />
                                </div>
                                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{init.revolving ? "↻" : fmtDate(init.endDate)}</span>
                              </div>
                            )}

                            {/* Footer actions */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border2)", paddingTop: 10, marginTop: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{init.owner}</div>
                                {init._campaignTitle && <div style={{ fontSize: 9, color: "var(--gold)", letterSpacing: ".04em" }}>🚀 {init._campaignTitle}</div>}
                                {canAddContent && (
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button onClick={() => { setShowAddInit(init.id); }} title="Edit"
                                      style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>✏</button>
                                    <button onClick={() => { if (confirm(`Delete "${init.title}"?`)) deleteInit(init.id); }} title="Delete"
                                      style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(224,123,106,.3)", background: "transparent", color: "#e07b6a", cursor: "pointer" }}>✕</button>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", paddingLeft: 12 }}>
                                <button onClick={() => setInitToCampaign(init)}
                                  style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(201,168,76,.35)", background: "rgba(201,168,76,.09)", color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600, letterSpacing: ".04em", transition: "all .13s" }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,.2)"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,.09)"; }}
                                >🚀 → Campaign</button>
                                {(hasConcept || isLoadingConcept) ? (
                                  <button onClick={() => hasConcept ? setConceptModal(init.id) : null} style={{
                                    fontSize: 11, padding: "4px 12px", borderRadius: 6,
                                    border: `1px solid ${color}44`, background: color + "14",
                                    color: hasConcept ? color : "var(--text-muted)",
                                    cursor: hasConcept ? "pointer" : "default",
                                    fontFamily: "var(--bf)", fontWeight: 600,
                                    letterSpacing: ".04em", transition: "all .13s",
                                    opacity: isLoadingConcept ? .5 : 1,
                                  }}
                                    onMouseEnter={e => { if (hasConcept) e.currentTarget.style.background = color + "28"; }}
                                    onMouseLeave={e => { if (hasConcept) e.currentTarget.style.background = color + "14"; }}
                                  >{isLoadingConcept ? "Loading…" : "View Concept →"}</button>
                                ) : (
                                  <button onClick={() => setConceptUpload(init.id)} style={{
                                    fontSize: 11, padding: "4px 12px", borderRadius: 6,
                                    border: "1px dashed rgba(255,255,255,.12)", background: "transparent",
                                    color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)",
                                    letterSpacing: ".04em", transition: "all .13s"
                                  }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = color + "55"; e.currentTarget.style.color = color; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                  >+ Attach Concept</button>
                                )}
                                {init._briefFileData && (
                                  <button onClick={() => setBriefViewer({ data: init._briefFileData, name: init._briefFile, type: init._briefFileType, title: init.title })} style={{
                                    fontSize: 11, padding: "4px 12px", borderRadius: 6,
                                    border: "1px solid rgba(201,168,76,.3)", background: "rgba(201,168,76,.08)",
                                    color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600,
                                    letterSpacing: ".04em", transition: "all .13s"
                                  }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,.18)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,.08)"; }}
                                  >📄 View Brief →</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {leftTab === "campaigns" && !activeBrand && (
              <div style={{ padding: "32px 44px", minHeight: "100vh" }}>
                {campaignView === "briefs" && (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8, fontWeight: 600 }}>Campaign Pipeline</div>
                        <div style={{ fontFamily: "var(--df)", fontSize: 36, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>Campaigns</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 520 }}>Create and manage campaign briefs. Generate a brief with AI from a concept or idea, upload an existing document, or write one from scratch. Every campaign links to the Timeline automatically.</div>
                      </div>
                      {canAddContent && <button className="btn btn-gold" style={{ marginTop: 8 }} onClick={() => setShowCampaignModal(true)}>+ New Brief</button>}
                    </div>
                    <CampaignsPanel campaigns={campaigns} onNew={() => setShowCampaignModal(true)} onSelect={setSelectedCampaign} onDelete={canEdit ? deleteCampaign : null} fullWidth />
                  </>
                )}
                {campaignView === "timeline" && (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8, fontWeight: 600 }}>Campaign Pipeline</div>
                        <div style={{ fontFamily: "var(--df)", fontSize: 36, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>Timeline</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 520 }}>Visual Gantt schedule of every active campaign. Each row tracks budget, dates, and custom sub-elements. Drag bars to reschedule. Campaigns created from Initiative cards appear here automatically.</div>
                      </div>
                      <button
                        title="Open timeline in its own window"
                        onClick={() => window.open("/campaign-timeline", "_blank", "width=1500,height=800,resizable=yes,scrollbars=yes,noopener,noreferrer")}
                        style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--bf)", fontSize: 12, cursor: "pointer", letterSpacing: ".04em", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.color = "var(--gold)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                      >↗ Pop Out</button>
                    </div>
                    <CampaignTimelinePanel campaignTimeline={campaignTimeline} setCampaignTimeline={setCampaignTimeline} campaigns={campaigns} brands={brands} />
                  </>
                )}
              </div>
            )}

            {/* ── CONCEPTS ── */}
            {leftTab === "concepts" && !activeBrand && (
              <ConceptsPanel concepts={concepts}
                activeConceptId={activeConceptId}
                setActiveConceptId={setActiveConceptId}
                onAdd={(concept) => setConcepts(p => [...p, concept])}
                onRemove={(id) => { setConcepts(p => p.filter(c => c.id !== id)); if (activeConceptId === id) setActiveConceptId(null); }}
                onRename={(id, name) => setConcepts(p => p.map(c => c.id === id ? { ...c, name } : c))}
                onUpdateConcept={(id, updates) => setConcepts(p => p.map(c => c.id === id ? { ...c, ...updates } : c))}
                brands={brands}
                teamMembers={teamMembers}
                canEdit={canAddContent}
                onPushToCampaign={(concept) => {
                  const campId = `cmp-${Date.now()}`;
                  const campaign = {
                    id: campId, title: concept.name,
                    concept: concept.description || concept.name,
                    brand: brands[concept.brandId]?.name || "CÚRADOR",
                    objective: concept.description || "",
                    brief: null, status: "idea",
                    createdBy: currentUser?.name || "Team",
                    createdAt: new Date().toISOString(),
                    _briefFile: concept.briefFile || null,
                    _briefFileData: concept.briefFileData || null,
                    _briefFileType: concept.briefFileType || null,
                    _fromConcept: concept.id,
                  };
                  setCampaigns(p => [campaign, ...p]);
                  const today = new Date().toISOString().slice(0, 10);
                  const threeMonths = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
                  const brand = brands[concept.brandId];
                  setCampaignTimeline(p => [{
                    id: `ctl-${Date.now()}`,
                    campaignId: campId,
                    title: concept.name,
                    brand: brand?.name || "CÚRADOR",
                    color: brand?.color || "#c9a84c",
                    cost: 0,
                    startDate: today,
                    endDate: threeMonths,
                    elements: [],
                  }, ...p]);
                  // Delete the concept (move, not just status change)
                  window.storage.delete(`ns-ch-${concept.id}`, true).catch(() => {});
                  setConcepts(p => p.filter(c => c.id !== concept.id));
                  if (activeConceptId === concept.id) setActiveConceptId(null);
                }}
                onPushToInitiative={(concept, channel, html) => {
                  const initId = `init-${Date.now()}`;
                  const init = {
                    id: initId, title: concept.name,
                    description: concept.description || "",
                    owner: currentUser?.name || "Team",
                    channel, brandId: concept.brandId || null,
                    startDate: "", endDate: "", revolving: false,
                    fileUrl: null, fileName: null, _brief: null,
                    htmlConcept: html || null,
                    htmlConceptName: concept.name,
                    _briefFile: concept.briefFile || null,
                    _briefFileData: concept.briefFileData || null,
                    _briefFileType: concept.briefFileType || null,
                    _fromConcept: concept.id,
                  };
                  // Also create a campaign from this concept
                  const campId = `cmp-${Date.now() + 1}`;
                  const brand = brands[concept.brandId];
                  const today = new Date().toISOString().slice(0, 10);
                  const threeMonths = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
                  const campaign = {
                    id: campId, title: concept.name,
                    concept: concept.description || concept.name,
                    brand: brand?.name || "CÚRADOR",
                    objective: concept.description || "",
                    brief: concept.brief || null, status: "idea",
                    createdBy: currentUser?.name || "Team",
                    createdAt: new Date().toISOString(),
                    _fromInitiative: initId,
                    _fromConcept: concept.id,
                    _briefFile: concept.briefFile || null,
                    _briefFileData: concept.briefFileData || null,
                    _briefFileType: concept.briefFileType || null,
                  };
                  // Link initiative to campaign
                  init._campaignId = campId;
                  init._campaignTitle = concept.name;
                  setInitiatives(p => [...p, init]);
                  setCampaigns(p => [campaign, ...p]);
                  setCampaignTimeline(p => [{
                    id: `ctl-${Date.now() + 2}`,
                    campaignId: campId,
                    title: concept.name,
                    brand: brand?.name || "CÚRADOR",
                    color: brand?.color || "#c9a84c",
                    cost: 0,
                    startDate: today,
                    endDate: threeMonths,
                    elements: [],
                  }, ...p]);
                  // Delete the concept (move, not just status change)
                  window.storage.delete(`ns-ch-${concept.id}`, true).catch(() => {});
                  setConcepts(p => p.filter(c => c.id !== concept.id));
                  if (activeConceptId === concept.id) setActiveConceptId(null);
                }}
                onNote={(text, label) => {
                  if (!text.trim() || !currentUser) return;
                  setNotes(p => [{ id: `n-${Date.now()}`, author: currentUser.name, color: currentUser.color, text: text.trim(), ts: new Date().toISOString(), context: `Concept: ${label}` }, ...p]);
                  setNotesOpen(true);
                }}
              />
            )}

            {/* ── DESIGN PORTAL ── */}
            {leftTab === "design" && !activeBrand && (
              <DesignPortal
                requests={designRequests}
                setRequests={setDesignRequests}
                brands={brands}
                teamMembers={teamMembers}
                currentUser={currentUser}
                view={designView}
                setView={setDesignView}
                showModal={showDesignModal}
                setShowModal={setShowDesignModal}
                selectedReq={selectedDesignReq}
                setSelectedReq={setSelectedDesignReq}
              />
            )}

            {/* ── FIELD TEAM ── */}
            {leftTab === "fieldteam" && !activeBrand && (
              <FieldTeamPortal tree={fieldTeamTree} setTree={setFieldTeamTree} contacts={centralizedContacts} setContacts={setCentralizedContacts} tierList={tierListData} setTierList={setTierListData} drops={weeklyDrops} setDrops={setWeeklyDrops} creditMemos={creditMemos} setCreditMemos={setCreditMemos} salesContacts={salesContacts} setSalesContacts={setSalesContacts} promoCalendar={promoCalendar} setPromoCalendar={setPromoCalendar} popupsData={popupsData} setPopupsData={setPopupsData} eventsData={eventsData} setEventsData={setEventsData} csBoardData={csBoardData} setCsBoardData={setCsBoardData} fieldAgenda={fieldAgenda} setFieldAgenda={setFieldAgenda} currentUser={currentUser} />
            )}

            {/* ── AGENCY PORTAL ── */}
            {leftTab === "agency" && !activeBrand && (
              <AgencyPortal submissions={agencySubmissions} setSubmissions={setAgencySubmissions} currentUser={currentUser} />
            )}

            {/* ── PACKAGING ── */}
            {leftTab === "packaging" && !activeBrand && (
              <PackagingPortal
                tracker={packagingTracker} setTracker={setPackagingTracker}
                confirmed={packagingConfirmed} setConfirmed={setPackagingConfirmed}
                evolutionTracker={packagingEvolutionTracker} setEvolutionTracker={setPackagingEvolutionTracker}
                evolutionConfirmed={packagingEvolutionConfirmed} setEvolutionConfirmed={setPackagingEvolutionConfirmed}
                brands={brands} currentUser={currentUser}
              />
            )}

            {/* ── COMPLIANCE ── */}
            {leftTab === "compliance" && !activeBrand && (
              <CompliancePanel
                overview={complianceOverview}
                setOverview={setComplianceOverview}
                docs={complianceDocs}
                setDocs={setComplianceDocs}
                links={complianceLinks}
                setLinks={setComplianceLinks}
                cards={complianceCards}
                setCards={setComplianceCards}
                currentUser={currentUser}
              />
            )}

            {/* ── TIMELINE ── */}
            {leftTab === "timeline" && !activeBrand && (
              <GanttViewer ganttHtml={ganttHtml} onUpdate={setGanttHtml} canEdit={canEdit} timelineItems={timelineItems} setTimelineItems={setTimelineItems} currentUser={currentUser} initiatives={initiatives} campaigns={campaigns} canAddContent={canAddContent} />
            )}

            {/* ── ASSET LIBRARY ── */}
            {leftTab === "dam" && !activeBrand && (
              <AssetLibrary
                assets={damAssets} setAssets={setDamAssets}
                driveAssets={damDriveAssets} setDriveAssets={setDamDriveAssets}
                activeType={damType} setActiveType={setDamType}
                activeBrand={damBrand} setActiveBrand={setDamBrand}
                search={damSearch} setSearch={setDamSearch}
                view={damView} setView={setDamView}
                merchOpen={damMerchOpen} setMerchOpen={setDamMerchOpen}
                packagingOpen={damPackagingOpen} setPackagingOpen={setDamPackagingOpen}
                addOpen={damAddOpen} setAddOpen={setDamAddOpen}
                preview={damPreview} setPreview={setDamPreview}
                config={damConfig} setConfig={setDamConfig}
                folders={damFolders} setFolders={setDamFolders}
                connected={damConnected} setConnected={setDamConnected}
                syncing={damSyncing} setSyncing={setDamSyncing}
                settingsOpen={damSettingsOpen} setSettingsOpen={setDamSettingsOpen}
                currentUser={currentUser}
                hubBrands={brands}
                hubCampaigns={campaigns}
                onNote={(ctx) => addNoteWithContext(ctx)}
              />
            )}

            {/* ── COMPANY / BRAND DETAIL FULL VIEW ── */}
            {activeBrand && (() => {

              // ── CURADOR BRANDS MASTER VIEW ──
              if (activeBrand === "curador") return (
                <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
                  <div style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(18px)", background: "rgba(7,7,15,.92)", borderBottom: "1px solid var(--border)", padding: "12px 44px", display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => setActiveBrand(null)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, fontFamily: "var(--bf)", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                      ← Back
                    </button>
                    <div style={{ width: 1, height: 20, background: "var(--border)" }} />
                    <div style={{ fontFamily: "var(--df)", fontSize: 17, fontWeight: 400, color: "var(--gold)" }}>{company.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{company.tagline}</div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
                      {Object.values(brands).map(br => (
                        <button key={br.id} onClick={() => setActiveBrand(br.id)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${br.color}44`, background: "transparent", color: br.color, fontSize: 11, fontFamily: "var(--bf)", cursor: "pointer", transition: "all .15s", fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = br.color + "18"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          {br.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hero */}
                  <div data-tag-type="Section" data-tag-label="Marketing Vision" data-tag-section="Company" style={{ position: "relative", padding: "56px 44px 48px", borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,.08) 0%, transparent 60%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold), #a07030)" }} />
                    <div style={{ position: "relative" }}>
                      <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 12 }}>Marketing Vision</div>
                      <div style={{ fontFamily: "var(--df)", fontSize: "clamp(40px,5vw,68px)", fontWeight: 300, color: "var(--text)", lineHeight: .92, marginBottom: 16 }}>{company.name}</div>
                      <div style={{ fontFamily: "var(--df)", fontSize: 22, fontStyle: "italic", color: "var(--gold)", marginBottom: 22 }}>"{company.tagline}"</div>
                      <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.9, maxWidth: 680 }}>{company.ethos}</div>
                    </div>
                  </div>

                  {/* Mission + Values */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ padding: "28px 36px", borderRight: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontWeight: 500 }}>Mission</div>
                      <div style={{ fontFamily: "var(--df)", fontSize: 21, fontStyle: "italic", color: "var(--text)", lineHeight: 1.55 }}>{company.mission}</div>
                    </div>
                    <div style={{ padding: "28px 36px" }}>
                      <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14, fontWeight: 500 }}>Core Values</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {company.values.map((v, i) => (
                          <div key={v} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 13px", borderRadius: 8, background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.12)" }}>
                            <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--gold)", lineHeight: 1, minWidth: 26 }}>{String(i + 1).padStart(2, "0")}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Brand family */}
                  <div style={{ padding: "28px 36px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16, fontWeight: 500 }}>Brand Family</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {Object.values(brands).map(b => (
                        <div key={b.id} onClick={() => setActiveBrand(b.id)} style={{ padding: "18px 18px", borderRadius: 12, background: "var(--surface2)", border: `1px solid ${b.color}22`, cursor: "pointer", transition: "all .18s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = b.color + "55"; e.currentTarget.style.background = b.color + "0e"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = b.color + "22"; e.currentTarget.style.background = "var(--surface2)"; }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: b.color, flexShrink: 0, boxShadow: `0 0 14px ${b.color}55` }} />
                            <div style={{ fontFamily: "var(--df)", fontSize: 18, color: "var(--text)", fontWeight: 400 }}>{b.name}</div>
                            {b.licensed && <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 100, background: "rgba(0,180,216,.1)", color: "#00B4D8", border: "1px solid rgba(0,180,216,.2)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, marginLeft: "auto" }}>Licensed</span>}
                          </div>
                          <div style={{ fontSize: 11, fontStyle: "italic", color: b.color, marginBottom: 8 }}>{b.tagline}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 8 }}>{b.story.slice(0, 100)}…</div>
                          {b.positioning && <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "5px 8px", background: b.color + "0a", borderRadius: 5, border: `1px solid ${b.color}18`, lineHeight: 1.5 }}>{b.positioning.split("—")[0].trim()}</div>}
                          <div style={{ marginTop: 10, fontSize: 10, color: b.color, letterSpacing: ".07em", textTransform: "uppercase" }}>View profile →</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business model + market context */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    {company.model && (
                      <div style={{ padding: "24px 36px", borderRight: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>Business Model</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.8 }}>{company.model}</div>
                      </div>
                    )}
                    {company.context && (
                      <div style={{ padding: "24px 36px" }}>
                        <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>Market Context</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.8 }}>{company.context}</div>
                      </div>
                    )}
                  </div>
                </div>
              );

              // ── INDIVIDUAL BRAND VIEW ──
              const b = brands[activeBrand];
              if (!b) return null;
              return (
                <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
                  <div style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(18px)", background: "rgba(7,7,15,.92)", borderBottom: "1px solid var(--border)", padding: "12px 44px", display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => setActiveBrand(null)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, fontFamily: "var(--bf)", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                      ← Back
                    </button>
                    <button onClick={() => setActiveBrand("curador")} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "1px solid rgba(201,168,76,.2)", color: "var(--gold)", cursor: "pointer", fontSize: 11, fontFamily: "var(--bf)", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, transition: "all .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,.07)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      Curador
                    </button>
                    <div style={{ width: 1, height: 20, background: "var(--border)" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color, flexShrink: 0, boxShadow: `0 0 8px ${b.color}88` }} />
                    <div style={{ fontFamily: "var(--df)", fontSize: 17, fontWeight: 400, color: "var(--text)" }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{b.tagline}</div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
                      {Object.values(brands).map(br => (
                        <button key={br.id} onClick={() => setActiveBrand(br.id)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${br.id === activeBrand ? br.color + "88" : "var(--border)"}`, background: br.id === activeBrand ? br.color + "18" : "transparent", color: br.id === activeBrand ? br.color : "var(--text-muted)", fontSize: 11, fontFamily: "var(--bf)", cursor: "pointer", transition: "all .15s", fontWeight: br.id === activeBrand ? 600 : 400 }}>
                          {br.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hero strip */}
                  <div data-tag-type="Brand" data-tag-label={b.name} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ position: "relative", padding: "52px 44px 44px", borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${b.color}12 0%, transparent 60%)`, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: b.color }} />
                    <div style={{ position: "relative" }}>
                      <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: b.color, fontWeight: 600, marginBottom: 10 }}>Brand Profile</div>
                      <div style={{ fontFamily: "var(--df)", fontSize: "clamp(38px,5vw,64px)", fontWeight: 300, color: "var(--text)", lineHeight: .95, marginBottom: 14 }}>{b.name}</div>
                      <div style={{ fontFamily: "var(--df)", fontSize: 22, fontStyle: "italic", color: b.color, marginBottom: 16 }}>"{b.tagline}"</div>
                      {b.website && (
                        <a href={b.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: b.color, fontSize: 12, fontFamily: "var(--mf)", fontWeight: 500, letterSpacing: ".03em", textDecoration: "none", marginBottom: 20, transition: "all .18s", backdropFilter: "blur(8px)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = b.color + "14"; e.currentTarget.style.borderColor = b.color + "44"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}>
                          <span style={{ fontSize: 13 }}>🔗</span> {b.website.replace("https://www.", "")} <span style={{ fontSize: 10, opacity: .5 }}>↗</span>
                        </a>
                      )}
                      <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.9, maxWidth: 680 }}>{b.story}</div>
                    </div>
                  </div>

                  {/* Mission + Audience */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--border)" }}>
                    <div data-tag-type="Mission" data-tag-label={`${b.name} Mission`} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ padding: "28px 36px", borderRight: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>Mission</div>
                      <div style={{ fontFamily: "var(--df)", fontSize: 20, fontStyle: "italic", color: "var(--text)", lineHeight: 1.55 }}>{b.mission}</div>
                    </div>
                    <div data-tag-type="Audience" data-tag-label={`${b.name} Target Audience`} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ padding: "28px 36px" }}>
                      <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>Target Audience</div>
                      <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.8 }}>{b.audience}</div>
                    </div>
                  </div>

                  {/* Values + Guidelines */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    <div data-tag-type="Values" data-tag-label={`${b.name} Core Values`} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ padding: "28px 36px", borderRight: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14, fontWeight: 500 }}>Core Values</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {b.values.map((v, i) => (
                          <div key={v} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 9, background: b.color + "0e", border: `1px solid ${b.color}22` }}>
                            <div style={{ fontFamily: "var(--df)", fontSize: 24, fontWeight: 300, color: b.color, lineHeight: 1, minWidth: 28 }}>{String(i + 1).padStart(2, "0")}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div data-tag-type="Guidelines" data-tag-label={`${b.name} Brand Guidelines`} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ padding: "28px 36px" }}>
                      <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14, fontWeight: 500 }}>Brand Guidelines</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[{ label: "Tone of Voice", value: b.tone }, { label: "Typography", value: b.typography }].map(row => (
                          <div key={row.label} style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 9, border: "1px solid var(--border2)" }}>
                            <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>{row.label}</div>
                            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65 }}>{row.value}</div>
                          </div>
                        ))}
                        <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 9, border: "1px solid var(--border2)" }}>
                          <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Color Palette</div>
                          <div style={{ display: "flex", gap: 12 }}>
                            {[{ hex: b.color, label: "Primary" }, { hex: b.secondary, label: "Secondary" }].map(c => (
                              <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
                                <div style={{ width: 52, height: 52, borderRadius: 10, background: c.hex, border: c.label === "Secondary" ? "1px solid rgba(255,255,255,.08)" : "none", boxShadow: c.label === "Primary" ? `0 0 16px ${c.hex}55` : "none" }} />
                                <div style={{ fontSize: 9, fontFamily: "monospace", color: "var(--text-muted)" }}>{c.hex}</div>
                                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{c.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products + Portfolio Role */}
                  {(b.products || b.positioning) && (
                    <div style={{ display: "grid", gridTemplateColumns: b.products && b.positioning ? "1fr 1fr" : "1fr", borderTop: "1px solid var(--border)" }}>
                      {b.products && (
                        <div data-tag-type="Products" data-tag-label={`${b.name} Product SKUs`} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ padding: "24px 36px", borderRight: b.positioning ? "1px solid var(--border)" : "none" }}>
                          <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontWeight: 500 }}>Product SKUs</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {b.products.split("·").map(p => p.trim()).filter(Boolean).map(p => (
                              <div key={p} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-dim)", padding: "5px 0", borderBottom: "1px solid var(--border2)" }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
                                {p}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {b.positioning && (
                        <div data-tag-type="Positioning" data-tag-label={`${b.name} Portfolio Role`} data-tag-section="Brand Profile" data-tag-brand={b.name} style={{ padding: "24px 36px" }}>
                          <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontWeight: 500 }}>Portfolio Role</div>
                          <div style={{ padding: "14px 16px", background: b.color + "0a", border: `1px solid ${b.color}22`, borderRadius: 10 }}>
                            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.75 }}>{b.positioning}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Brand-specific initiatives (hidden for licensed brands like Airo) */}
                  {b.id !== "airo" && (() => {
                    const brandInits = initiatives.filter(i => i.brandId === b.id || i.brandId === null);
                    return (
                      <div style={{ padding: "28px 36px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                          <div>
                            <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>{b.name} Initiatives</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{brandInits.length} initiative{brandInits.length !== 1 ? "s" : ""} specific to this brand</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setShowAddBrandInit(b.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${b.color}44`, background: b.color + "12", color: b.color, fontSize: 11, fontFamily: "var(--bf)", fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = b.color + "22"}
                              onMouseLeave={e => e.currentTarget.style.background = b.color + "12"}>
                              + Add Initiative
                            </button>
                          </div>
                        </div>
                        {brandInits.length === 0 ? (
                          <div onClick={() => setShowAddBrandInit(b.id)} style={{ border: `2px dashed ${b.color}22`, borderRadius: 12, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all .15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = b.color + "55"; e.currentTarget.style.background = b.color + "05"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = b.color + "22"; e.currentTarget.style.background = "transparent"; }}>
                            <div style={{ fontSize: 24, marginBottom: 8, opacity: .4 }}>＋</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>No {b.name} initiatives yet</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Click to add — you can attach a brief inside the form</div>
                          </div>
                        ) : (
                          <>
                            <div className="bi-grid">
                              {brandInits.map(init => {
                                const acc = PILLAR_ACCENTS[strategy.pillars.indexOf(init.channel) % PILLAR_ACCENTS.length] || PILLAR_ACCENTS[0];
                                return (
                                  <div key={init.id} className={`bi-card ${init._briefSource ? "from-brief" : ""}`} data-tag-type="Initiative" data-tag-label={init.title} data-tag-section="Initiatives" style={{ borderLeftColor: acc.solid }} onClick={() => setDetail(init)}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                                      <div className="bi-pillar" style={{ color: acc.solid }}>{init.channel}</div>
                                      {init._briefSource && <span className="bi-brief-badge">📎 Brief</span>}
                                    </div>
                                    <div className="bi-title">{init.title}</div>
                                    {init.description && <div className="bi-desc">{init.description}</div>}
                                    <div className="bi-foot">
                                      <div>
                                        <div className="bi-owner">{init.owner}</div>
                                        {init._campaignTitle && <div style={{ fontSize: 9, color: "var(--gold)", marginTop: 2 }}>🚀 {init._campaignTitle}</div>}
                                      </div>
                                      <div style={{ display: "flex", gap: 5 }}>
                                        {(conceptHtmlCache.current[init.id] || init.htmlConcept || init.htmlConceptName) && (
                                          <button onClick={e => { e.stopPropagation(); setConceptModal(init.id); }}
                                            style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "1px solid rgba(123,104,181,.35)", background: "rgba(123,104,181,.09)", color: "#8b7fc0", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600, letterSpacing: ".04em" }}>
                                            🎨 Concept
                                          </button>
                                        )}
                                        <button onClick={e => { e.stopPropagation(); setInitToCampaign(init); }}
                                          style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "1px solid rgba(201,168,76,.35)", background: "rgba(201,168,76,.09)", color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600, letterSpacing: ".04em" }}>
                                          🚀 → Campaign
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* ── NORMAL BOARD VIEW (only when company tab + no brand active) ── */}
            {leftTab === "company" && !activeBrand && (<>
              {/* MARKETING VISION */}
              <MarketingVisionSection strategy={strategy} initiatives={initiatives} campaigns={campaigns} teamMembers={teamMembers} onEdit={() => setShowEditStrategy(true)} />

              {/* CONTROLS */}
              <div className="ctrl">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className={`fchip ${filterChannel === "All" ? "on" : ""}`} onClick={() => setFilterChannel("All")}>All</button>
                  {CHANNELS.map(ch => (
                    <button key={ch} className={`fchip ${filterChannel === ch ? "on" : ""}`}
                      style={{ borderColor: filterChannel === ch ? getChannelColor(ch) : undefined, color: filterChannel === ch ? getChannelColor(ch) : undefined, background: filterChannel === ch ? getChannelColor(ch) + "18" : undefined }}
                      onClick={() => setFilterChannel(ch)}>
                      {ch.split(" · ")[1] || ch}
                    </button>
                  ))}
                </div>
                <div className="vtog">
                  <button className={`vbtn ${view === "grid" ? "on" : ""}`} onClick={() => setView("grid")}>Board</button>
                </div>
              </div>

              {/* BOARD */}
              {view === "grid" && (
                <div className="board">
                  {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>No initiatives in this pillar yet.</div>}
                  {filtered.map(init => {
                    const acc = getAccent(init.channel);
                    return (
                      <div key={init.id} id={`card-${init.id}`} className={`card ${hlInitId === init.id ? "hl" : ""}`} onClick={() => setDetail(init)}>
                        <div className="card-bar" style={{ background: acc.grad }} />
                        <div className="card-pillar">
                          {init.channel}
                          {init._brief && <span className="cmp-badge">Campaign</span>}
                          {init.revolving && <span className="card-revolving">↻ Revolving</span>}
                        </div>
                        <div className="card-title">{init.title}</div>
                        <div className="card-desc">{init.description}</div>
                        {/* Date progress bar */}
                        {(init.startDate || init.endDate) && (() => {
                          const pct = dateProgress(init.startDate, init.endDate);
                          const hasEnd = init.endDate && !init.revolving;
                          return (
                            <div className="card-date-bar">
                              <span className="card-date-lbl">{fmtDate(init.startDate)}</span>
                              <div className="card-date-track">
                                <div className="card-date-fill" style={{
                                  width: `${pct ?? 0}%`,
                                  background: init.revolving ? "linear-gradient(90deg,#4d9e8e,#8b7fc0)" : acc.solid,
                                  animation: init.revolving ? "revolveShift 3s linear infinite" : "none",
                                }} />
                              </div>
                              <span className="card-date-range">{init.revolving ? "Ongoing" : fmtDate(init.endDate)}</span>
                            </div>
                          );
                        })()}
                        <div className="card-foot">
                          <div>
                            <div className="card-owner">{init.owner}</div>
                            <div className="card-qtr" style={{ color: getChannelColor(init.channel), fontSize: 10 }}>{(init.channel || "").split(" · ")[1] || init.channel}</div>
                            {init._campaignTitle && <div style={{ fontSize: 9, color: "var(--gold)", marginTop: 2, letterSpacing: ".04em" }}>🚀 {init._campaignTitle}</div>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                            <button className={`fbtn ${init.fileUrl ? "has" : ""}`} onClick={e => { e.stopPropagation(); setFileModal(init.id); }}>
                              {init.fileUrl ? "📎 File" : "+ File"}
                            </button>
                            <button onClick={e => { e.stopPropagation(); setInitToCampaign(init); }}
                              style={{ fontSize: 9, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(201,168,76,.3)", background: "rgba(201,168,76,.07)", color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600, letterSpacing: ".04em", whiteSpace: "nowrap" }}>
                              → Campaign
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* GANTT */}
              {view === "timeline" && <GanttViewer ganttHtml={ganttHtml} onUpdate={setGanttHtml} canEdit={canEdit} timelineItems={timelineItems} setTimelineItems={setTimelineItems} currentUser={currentUser} initiatives={initiatives} campaigns={campaigns} canAddContent={canAddContent} />}
            </>)}
            </div>
          </main>

          {/* NOTES PANEL */}
          <aside className={`notes-panel ${notesOpen ? "open" : ""}`}>
            <div className="notes-hdr">
              <div className="notes-hdr-row">
                <div className="notes-title">Notes</div>
                <button className="notes-close" onClick={() => setNotesOpen(false)}>×</button>
              </div>
              {currentUser && (
                <div className="user-chip" onClick={() => setShowWhoModal(true)} title="Update profile">
                  <div className="user-marker" style={{ background: currentUser.color.bg, color: currentUser.color.text, width: 20, height: 20, fontSize: 8 }}>{initials(currentUser.name)}</div>
                  <span className="user-name-sm">{currentUser.name}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>Change</span>
                </div>
              )}
            </div>
            <div className="notes-list">
              {notes.length === 0 && <div className="notes-empty">No notes yet.<br />Be the first to leave one.</div>}
              {notes.map(note => {
                const isExpanded = expandedNoteId === note.id;
                const isAuthor = currentUser?.name === note.author;
                return (
                <div key={note.id} className="note-item">
                  <div className="note-top">
                    <div className="note-marker" style={{ background: note.color.bg, color: note.color.text, width: 22, height: 22, fontSize: 9 }}>{initials(note.author)}</div>
                    <div className="note-author">{note.author}</div>
                    <div className="note-time">{relativeTime(note.ts)}</div>
                    <button className="note-expand-btn" title="Add / view detail" onClick={e => { e.stopPropagation(); if (isExpanded) { setExpandedNoteId(null); } else { setExpandedNoteId(note.id); setNoteDetailDraft(note.detail || ""); } }}>{isExpanded ? "▲" : "▼"}</button>
                  </div>
                  {(note.context || note.section || note.brand) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4, marginTop: 2 }}>
                      {note.context && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(201,168,76,.12)", color: "var(--gold)", letterSpacing: ".04em", fontWeight: 600 }}>{note.context}</span>}
                      {note.brand && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,.06)", color: "var(--text-muted)", letterSpacing: ".04em" }}>{note.brand}</span>}
                      {note.section && !note.context?.includes(note.section) && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,.04)", color: "var(--text-muted)", letterSpacing: ".04em" }}>{note.section}</span>}
                    </div>
                  )}
                  {editingNoteId === note.id ? (
                    <div style={{ paddingLeft: 28, marginTop: 4 }}>
                      <textarea className="note-detail-ta" value={editNoteText} onChange={e => setEditNoteText(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNoteEdit(note.id); if (e.key === "Escape") { setEditingNoteId(null); setEditNoteText(""); } }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <button onClick={() => { setEditingNoteId(null); setEditNoteText(""); }} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 10, cursor: "pointer", fontFamily: "var(--bf)" }}>Cancel</button>
                        <button onClick={() => saveNoteEdit(note.id)} disabled={!editNoteText.trim()} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: "rgba(201,168,76,.15)", color: "var(--gold)", fontSize: 10, cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-body" style={{ cursor: "pointer" }} onClick={() => { if (isExpanded) { setExpandedNoteId(null); } else { setExpandedNoteId(note.id); setNoteDetailDraft(note.detail || ""); } }}>{note.text}</div>
                  )}
                  {note.detail && !isExpanded && (
                    <div style={{ paddingLeft: 28, marginTop: 4, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, borderLeft: "2px solid rgba(201,168,76,.2)", paddingTop: 2, paddingBottom: 2, paddingRight: 4, marginBottom: 2 }}>
                      {note.detail.length > 120 ? note.detail.slice(0, 120) + "…" : note.detail}
                    </div>
                  )}
                  {editingNoteId !== note.id && (
                  <div style={{ paddingLeft: 28, marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
                    {currentUser && replyingToId !== note.id && (
                      <button onClick={() => { setReplyingToId(note.id); setReplyText(""); }} style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--bf)", fontSize: 10, color: "var(--text-muted)", cursor: "pointer", letterSpacing: ".04em" }} onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                        Reply {(note.replies || []).length > 0 && <span style={{ color: "var(--gold)", fontWeight: 600 }}>({note.replies.length})</span>}
                      </button>
                    )}
                    {currentUser && (
                      <button onClick={() => { setEditingNoteId(note.id); setEditNoteText(note.text); }} style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--bf)", fontSize: 10, color: "var(--text-muted)", cursor: "pointer", letterSpacing: ".04em" }} onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                        Edit
                      </button>
                    )}
                    {currentUser && confirmClearId !== note.id && (
                      <button onClick={() => setConfirmClearId(note.id)} style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--bf)", fontSize: 10, color: "var(--text-muted)", cursor: "pointer", letterSpacing: ".04em" }} onMouseEnter={e => e.currentTarget.style.color = "#e07b6a"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                        Clear
                      </button>
                    )}
                    {confirmClearId === note.id && (
                      <button onClick={() => { clearNote(note.id); setConfirmClearId(null); }} style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--bf)", fontSize: 10, color: "#e07b6a", cursor: "pointer", letterSpacing: ".04em", fontWeight: 600 }}>
                        Confirm Clear
                      </button>
                    )}
                  </div>
                  )}
                  {isExpanded && (
                    <div style={{ paddingLeft: 28, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      {currentUser ? (
                        <>
                          <textarea className="note-detail-ta" value={noteDetailDraft} onChange={e => setNoteDetailDraft(e.target.value)} placeholder="Add more detail about this note…" />
                          <div className="note-detail-actions">
                            <button onClick={() => { setExpandedNoteId(null); setNoteDetailDraft(""); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "var(--bf)" }}>Cancel</button>
                            <button onClick={() => updateNoteDetail(note.id, noteDetailDraft)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "rgba(201,168,76,.15)", color: "var(--gold)", fontSize: 11, cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>Save Detail</button>
                          </div>
                        </>
                      ) : note.detail ? (
                        <div className="note-detail">{note.detail}</div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No additional detail.</div>
                      )}
                      {note.detail && currentUser && <div className="note-detail" style={{ marginTop: 8 }}><strong style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>Current detail:</strong><br />{note.detail}</div>}
                    </div>
                  )}
                  {(note.replies || []).length > 0 && (
                    <div className="note-replies">
                      {note.replies.map(r => (
                        <div key={r.id} className="note-reply">
                          <div className="note-marker" style={{ background: r.color.bg, color: r.color.text, width: 18, height: 18, fontSize: 7, flexShrink: 0 }}>{initials(r.author)}</div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="note-reply-author">{r.author}</span>
                              <span className="note-reply-time">{relativeTime(r.ts)}</span>
                            </div>
                            <div className="note-reply-body">{r.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {replyingToId === note.id && (
                    <div className="note-reply-input">
                      <input autoFocus placeholder="Reply…" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && replyText.trim()) addReply(note.id); if (e.key === "Escape") { setReplyingToId(null); setReplyText(""); } }} />
                      <button disabled={!replyText.trim()} onClick={() => addReply(note.id)}>Reply</button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            <div className="notes-ia">
              {pendingTag && (
                <div className="pending-tag">
                  <span className="pending-tag-label">{pendingTag.type}: {pendingTag.label}</span>
                  {pendingTag.brand && <span className="pending-tag-sub">{pendingTag.brand}</span>}
                  <button className="pending-tag-clear" onClick={() => setPendingTag(null)}>✕</button>
                </div>
              )}
              {markerMode && !pendingTag && (
                <div className="pending-tag" style={{ background: "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.1)" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>📌 Click on an element to pin what this note is about</span>
                </div>
              )}
              <textarea className="note-ta" placeholder={pendingTag ? `Note about ${pendingTag.label}…` : "Add a note for the team…"} value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postNote(); }} onFocus={() => { if (!pendingTag) setMarkerMode(true); }} />
              <div className="note-sr">
                <div className="note-hint">{pendingTag ? `Tagged: ${pendingTag.label}` : "⌘↵ to post"}</div>
                <button className="note-submit" disabled={!noteText.trim()} onClick={postNote}>Post</button>
              </div>
            </div>
          </aside>
          {markerMode && (
            <div className="marker-hint">
              📌 Click any item to tag your note
              <button onClick={() => setMarkerMode(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* Brief Viewer Modal */}
      {briefViewer && (
        <div className="overlay" onClick={() => setBriefViewer(null)} style={{ zIndex: 110 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "90vw", maxWidth: 1000, height: "85vh", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{briefViewer.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{briefViewer.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => { const a = document.createElement("a"); a.href = briefViewer.data; a.download = briefViewer.name; a.click(); }}
                  style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)" }}>↓ Download</button>
                <button onClick={() => setBriefViewer(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {(briefViewer.type || "").startsWith("image/") ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", overflow: "auto" }}>
                  <img src={briefViewer.data} alt={briefViewer.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              ) : (briefViewer.type || "").includes("pdf") ? (
                <iframe src={briefViewer.data} title={briefViewer.name} style={{ width: "100%", height: "100%", border: "none" }} />
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: .3 }}>📄</div>
                  <div style={{ fontSize: 14, marginBottom: 8 }}>{briefViewer.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>This file type can't be previewed inline</div>
                  <button onClick={() => { const a = document.createElement("a"); a.href = briefViewer.data; a.download = briefViewer.name; a.click(); }}
                    className="btn" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}>↓ Download File</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {detail && <DetailModal init={initiatives.find(i => i.id === detail.id) || detail} getAccent={getAccent} onClose={() => setDetail(null)} onFileClick={(id) => { setDetail(null); setFileModal(id); }} onCreateCampaign={(init) => { setDetail(null); setInitToCampaign(init); }} onViewConcept={(id) => { setDetail(null); setConceptModal(id); }} conceptHtml={conceptHtmlCache.current[detail.id] || (initiatives.find(i => i.id === detail.id) || detail).htmlConcept} />}
      {initToCampaign && <InitiativeToCampaignModal init={initToCampaign} brands={brands} onClose={() => setInitToCampaign(null)} onSave={(campaignData) => createCampaignFromInit(initToCampaign, campaignData)} />}
      {fileModal && <FileUploadModal initiative={initiatives.find(i => i.id === fileModal)} onClose={() => setFileModal(null)} onSave={(url, name) => saveFile(fileModal, url, name)} />}
      {conceptModal && (() => { const init = initiatives.find(i => i.id === conceptModal); if (!init) return null; const html = (conceptCacheVersion >= 0 && conceptHtmlCache.current[init.id]) || init.htmlConcept; return html ? <ConceptViewerModal init={{...init, htmlConcept: html}} onClose={() => setConceptModal(null)} onUpload={() => { setConceptModal(null); setConceptUpload(init.id); }} onNote={(ctx) => { setConceptModal(null); addNoteWithContext(ctx); }} /> : null; })()}
      {conceptUpload && <ConceptHtmlUploadModal initName={initiatives.find(i => i.id === conceptUpload)?.title || ""} onClose={() => setConceptUpload(null)} onSave={(html, name) => saveConceptHtml(conceptUpload, html, name)} />}
      {showAddInit && <AddInitiativeModal pillars={strategy.pillars} brands={brands} preselectedBrand={null} teamMembers={teamMembers}
        existing={typeof showAddInit === "string" ? (() => { const init = initiatives.find(i => i.id === showAddInit); return init ? { ...init, htmlConcept: conceptHtmlCache.current[init.id] || init.htmlConcept || null } : null; })() : null}
        onClose={() => setShowAddInit(false)}
        onSave={init => {
          if (typeof showAddInit === "string") {
            updateInit(showAddInit, init);
            setShowAddInit(false);
          } else {
            addInit(init);
          }
        }} />}
      {showAddBrandInit && <AddInitiativeModal pillars={strategy.pillars} brands={brands} preselectedBrand={showAddBrandInit} teamMembers={teamMembers} onClose={() => setShowAddBrandInit(null)} onSave={init => { addInit(init); setShowAddBrandInit(null); }} />}
      {showBriefUpload && <BriefUploadModal brandId={showBriefUpload} brand={brands[showBriefUpload]} pillars={strategy.pillars} onClose={() => setShowBriefUpload(null)} onSave={init => { addInit(init); setShowBriefUpload(null); }} />}
      {showEditStrategy && <EditStrategyModal strategy={strategy} onClose={() => setShowEditStrategy(false)} onSave={saveStrategy} />}
      {showEditStrategy && <EditStrategyModal strategy={strategy} onClose={() => setShowEditStrategy(false)} onSave={saveStrategy} />}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPANY PANEL — nav with collapsible brand initiative dropdowns
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// MARKETING VISION SECTION — replaces hero on the Marketing Vision tab
// ════════════════════════════════════════════════════════════════════════════
function MvSec({ label }) {
  return <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 10, marginTop: 2 }}>{label}</div>;
}
function MvDivider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "32px 0" }} />;
}
function MvCard({ children, color = "var(--gold)", style = {} }) {
  return (
    <div style={{ padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderTop: `2px solid ${color}`, borderRadius: 11, ...style }}>
      {children}
    </div>
  );
}

function MarketingVisionSection({ strategy, initiatives, campaigns, teamMembers, onEdit }) {
  const [activeSection, setActiveSection] = useState(null);

  const MV_CHANNELS = [
    { name: "Field Marketing",        status: "critical", note: "Low ROI — visits not converting" },
    { name: "Loyalty / QR Program",   status: "critical", note: "Broken — 1–3% scan conversion" },
    { name: "Social Media",           status: "partial",  note: "Partial — inconsistent narrative" },
    { name: "Websites",               status: "partial",  note: "Incomplete — no consumer journey" },
    { name: "Email / SMS",            status: "critical", note: "Not Active" },
    { name: "SEO / Digital",          status: "critical", note: "Not Active" },
    { name: "PR",                     status: "critical", note: "Not Active" },
    { name: "Events",                 status: "partial",  note: "Inconsistent — no data capture" },
    { name: "In-Store Displays",      status: "partial",  note: "Inconsistent — no tiered system" },
    { name: "Merch / Budtender",      status: "partial",  note: "Inconsistent" },
    { name: "Brand Reputation",       status: "strong",   note: "STRONG — core competitive advantage" },
  ];

  const DIGITAL_CHANNELS = [
    { num: "01", title: "Packaging & QR Journey", bullets: ["Redesign all packaging to brand standards", "QR on every product → mobile brand experience", "Product education, loyalty enrollment, review prompts", "Data capture begins at first scan"] },
    { num: "02", title: "In-House Loyalty & Rewards", bullets: ["Tiered structure: entry, mid, top tier", "Points via purchase, QR, referrals, events", "Redemption: discounts, merch, early access", "BudDrops: verified limited-allocation drops (Head Change)"] },
    { num: "03", title: "Email & SMS Marketing", bullets: ["Direct-to-consumer: product drops, events, loyalty", "B2B dispensary channel: new arrivals, sell-through tools", "Segmented by brand, tier, purchase behavior", "Positions Cúrador as partner, not just vendor"] },
    { num: "04", title: "SEO & Web Ecosystem", bullets: ["Complete brand websites — mobile-first architecture", "QR → Web → Loyalty: frictionless 3-step conversion", "Local SEO + product/strain content authority", "Retargeting pixels + analytics from Day 1"] },
    { num: "05", title: "Online Menu Advertising", bullets: ["Paid placements on Weedmaps, Leafly, and dispensary online menus", "Featured product listings tied to new drops, BudDrops launches", "Brand banner ads driving traffic to QR portal and web ecosystem", "Geo-targeted ads reaching active Missouri cannabis consumers", "Performance tracked by click-through, menu views, and attributed sell-through"] },
  ];
  const BRAND_FIELD = [
    { num: "06", title: "Social Media Strategy", bullets: ["Head Change: Instagram-first, connoisseur culture", "Safe Bet: broad reach, accessible lifestyle tone", "3–4 posts/week per brand; daily story cadence", "Content pillars: Product, Culture, Community, Education"] },
    { num: "07", title: "Reimagined Events", bullets: ["Annual calendar set at fiscal year start", "Every event has a defined data capture goal", "Content team at every event: photo, video, social", "Min. 1 major consumer event per quarter per brand"] },
    { num: "08", title: "PR Strategy", bullets: ["MO trade, lifestyle, business & national cannabis press", "Core narratives: manufacturing excellence, expansion", "Product launch PR tied to BudDrops & major SKUs", "Target: 4–5% of annual sales into marketing"] },
    { num: "09", title: "Field Marketing Rework", bullets: ["Every visit has a defined objective & 24-hr report", "Integrated with marketing calendar — not siloed", "Pop-ups tied to data capture goals only", "Target: 20–30% cost reduction vs. prior period"] },
  ];
  const INSTORE = [
    { num: "10", title: "Tiered In-Store Display", bullets: ["Tier 1: Full branded fixtures, panels, merch placement", "Tier 2: Core kit — shelf talkers, tent cards, signage", "Tier 3: Standard — shelf talkers, product info cards", "Each brand has distinct display visual language"] },
    { num: "11", title: "Budtender Appreciation Program", bullets: ["BudDrops: exclusive verified limited allocations", "Quarterly education sessions at partner stores", "Recognition & rewards tied to sell-through data", "Budtender CRM: contacts, preferences, event attendance"] },
    { num: "12", title: "In-Store Consumer Education", bullets: ["Branded \"How to Hash\" educational booklet at point of sale", "Covers concentrate types, consumption methods, dosing, strain profiles", "Positions Head Change as the authority on craft concentrates in Missouri", "Drives first-time concentrate buyers toward our brands with confidence"] },
  ];
  const PHASES = [
    { num: "01", title: "Foundation",  timing: "Days 1–60",    color: "#4d9e8e", bullets: ["Brand standards finalized (all 3 brands)", "QR portal redesign initiated", "Loyalty platform selected & scoped", "Website audits + rebuild begins", "Field program restructured"] },
    { num: "02", title: "Activation",  timing: "Days 61–120",  color: "#c9a84c", bullets: ["Loyalty + QR portal live", "Email/SMS first campaigns out", "Social calendars active (all 3)", "First major consumer event", "Tier 1 display program deployed"] },
    { num: "03", title: "Optimize",    timing: "Days 121–180", color: "#8b7fc0", bullets: ["SEO strategy in full execution", "PR program launched", "Merch program live (Head Change)", "First BudDrops cycle complete", "KPI review — scale what works"] },
    { num: "04", title: "Scale",       timing: "Month 7+",     color: "#a0624a", bullets: ["Team expands from learnings", "Expansion market prep initiated", "Playbooks documented for export", "Consumer LTV tracking active"] },
  ];
  const KPIS = [
    { area: "QR / Loyalty",     metric: "Scan-to-enrollment rate",    target: "1–3% → 20%+ within 90 days" },
    { area: "Email / SMS",       metric: "List size & open rate",       target: "1,000+ subs; 30%+ open rate" },
    { area: "Social",            metric: "Engagement rate",             target: "5%+ engagement" },
    { area: "Events",            metric: "Data captures per event",     target: "100+ contacts per event" },
    { area: "PR",                metric: "Earned media placements",     target: "2+ placements/quarter" },
    { area: "In-Store Display",  metric: "Tier 1 compliance",           target: "100% Tier 1 partners by Q2" },
    { area: "Budtender Program", metric: "Active CRM contacts",         target: "200+ members Year 1" },
    { area: "Field Marketing",   metric: "Cost-per-contact",            target: "20–30% cost reduction" },
    { area: "SEO",               metric: "Organic traffic",             target: "10+ ranked keywords Year 1" },
  ];
  const BUDGET = [
    { pct: "25–30%", cat: "Digital (SEO, Email, Web)",    color: "#c9a84c", note: "Highest compounding ROI. Owned channels that scale without proportional cost increases." },
    { pct: "20–25%", cat: "Events & Activations",          color: "#4d9e8e", note: "Drives data capture, content, and brand community simultaneously." },
    { pct: "15–20%", cat: "In-Store Display & Merch",      color: "#5a9ed4", note: "Point-of-sale impact with multi-cycle ROI on physical assets." },
    { pct: "15%",    cat: "Content Production",            color: "#8b7fc0", note: "Feeds social, web, email, and event channels — maximum leverage." },
    { pct: "4–5%",   cat: "PR",                            color: "#e07b6a", note: "Best practice target for CPG/cannabis at this growth stage." },
    { pct: "10%",    cat: "Field Marketing (Reworked)",    color: "#8a86a0", note: "Reduced from prior allocation — focused on high-yield activities only." },
  ];
  const CURRENT_TEAM = [
    "Marketing & Creative Director — Strategy, creative direction, brand leadership, EDMT",
    "Jr. Creative — Visual production, asset development, brand execution",
    "Field Marketing Coordinator — Field program, budtender relationships, in-store execution",
    "Product & Biz Dev Liaison — GTM coordination, product pipeline alignment",
    "External Creative Agency (Studio Liner) — Campaign production, content, design",
  ];
  const HIRING = [
    { role: "Digital Marketing Specialist",    desc: "SEO, email/SMS platform management, web analytics" },
    { role: "Content Producer / Videographer", desc: "In-house video & photo for events and social" },
    { role: "PR Manager or Retained Agency",   desc: "Executes PR strategy with accountability to coverage targets" },
    { role: "Loyalty & CRM Coordinator",       desc: "Owns loyalty platform, data analysis, retention programs" },
  ];

  const statusColor = { critical: "#e07b6a", partial: "#c9a84c", strong: "#4d9e8e" };
  const Sec = ({ label }) => <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 10 }}>{label}</div>;
  const Divider = () => <div style={{ height: 1, background: "var(--border)", margin: "32px 0" }} />;
  const ChannelCard = ({ item }) => (
    <div style={{ padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid var(--gold)", borderRadius: 11 }}>
      <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--gold)", lineHeight: 1, marginBottom: 6 }}>{item.num}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{item.title}</div>
      {item.bullets.map(b => (
        <div key={b} style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.55, paddingLeft: 10, position: "relative", marginBottom: 4 }}>
          <span style={{ position: "absolute", left: 0, color: "var(--gold)", opacity: .5 }}>·</span>{b}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "40px 44px 0", background: "var(--bg)" }}>

      {/* COVER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10, fontWeight: 600 }}>Marketing & Creative Division · Missouri Market · 2026–2027</div>
          <div style={{ fontFamily: "var(--df)", fontSize: 48, fontWeight: 300, lineHeight: .92, color: "var(--text)", marginBottom: 10 }}>
            CÚRADOR
          </div>
          <div style={{ fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 14 }}>House of Brands</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.75, maxWidth: 560, marginBottom: 16 }}>
            Brand Repositioning & Go-To-Market Strategy — a scalable blueprint for Missouri and every market that follows.
          </div>
          <div style={{ display: "inline-block", padding: "6px 14px", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.25)", borderRadius: 6, fontSize: 10, color: "var(--gold)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
            Confidential — Internal Use Only
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
          <button className="btn" onClick={onEdit}>Edit Strategy</button>
          {[{ v: initiatives.length, l: "Initiatives" }, { v: campaigns.length, l: "Campaigns" }, { v: teamMembers.length, l: "Team" }].map(x => (
            <div key={x.l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--df)", fontSize: 26, color: "var(--gold)", fontWeight: 300, lineHeight: 1 }}>{x.v}</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em" }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>
      <Divider />

      {/* EXECUTIVE SUMMARY */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Executive Summary" />
        <div style={{ fontFamily: "var(--df)", fontSize: 32, fontWeight: 300, color: "var(--text)", marginBottom: 12, lineHeight: 1.1 }}>Built on Quality.<br /><em style={{ color: "var(--gold)" }}>Ready to Activate.</em></div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.75, maxWidth: 680, marginBottom: 20 }}>Cúrador has earned its position through exceptional manufacturing and trusted dispensary relationships — achieved with minimal marketing investment. That changes now.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {[{n:"1",title:"Quality is the story",body:"Marketing's job is to tell it louder and more consistently across every channel."},{n:"2",title:"Every touchpoint converts",body:"Packaging, events, digital, in-store — each moment is a chance to earn loyalty."},{n:"3",title:"Missouri is the blueprint",body:"The systems built here travel with us into every new market we enter."}].map(c => (
            <div key={c.n} style={{ padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid var(--gold)", borderRadius: 11 }}>
              <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--gold)", lineHeight: 1, marginBottom: 8 }}>{c.n}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.65 }}>{c.body}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--gold)", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>Target Marketing Investment: 4–5% of Annual Sales</div>
      </div>
      <Divider />

      {/* CURRENT STATE */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Current State Snapshot — Where We Are Today" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
          {MV_CHANNELS.map(ch => (
            <div key={ch.name} style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: 3, alignSelf: "stretch", background: statusColor[ch.status], flexShrink: 0 }} />
              <div style={{ padding: "9px 13px", flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{ch.name}</div>
                <div style={{ fontSize: 10, color: statusColor[ch.status], fontWeight: 500, textAlign: "right" }}>{ch.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Divider />

      {/* VISION */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Vision & Strategic Direction" />
        <div style={{ fontFamily: "var(--df)", fontSize: 32, fontWeight: 300, color: "var(--text)", marginBottom: 8, lineHeight: 1.1 }}>Activate Everything.<br /><em style={{ color: "var(--gold)" }}>Own the Consumer.</em></div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.75, marginBottom: 20 }}>The most dynamic suite of cannabis brands in Missouri — and a scalable blueprint for expansion.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[{name:"Head Change",color:"#A31C1C",desc:"Premium craft concentrate. The connoisseur's brand. Built for the serious consumer who demands quality and provenance above all."},{name:"Safe Bet",color:"#C97820",desc:"Approachable, reliable, accessible. The everyday brand for the broad Missouri market — consistent quality without compromise."},{name:"Bubbles",color:"#7B68B5",desc:"Distinct identity. Specific consumer. Creative positioning refined through brand development — expressive and differentiated."}].map(b => (
            <div key={b.name} data-tag-type="Brand" data-tag-label={b.name} data-tag-section="Company" style={{ padding: "18px 20px", background: "var(--surface)", border: `1px solid ${b.color}33`, borderTop: `2px solid ${b.color}`, borderRadius: 11 }}>
              <div style={{ fontFamily: "var(--df)", fontSize: 20, fontWeight: 600, color: b.color, marginBottom: 8 }}>{b.name}</div>
              <div style={{ width: 32, height: 1, background: b.color, opacity: .5, marginBottom: 10 }} />
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <Divider />

      {/* ECOSYSTEM */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Consumer Ecosystem — The Closed-Loop" />
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: 14 }}>
          {[{label:"Packaging",desc:"First touchpoint. QR code on every product."},{label:"QR Portal",desc:"Brand-immersive mobile experience."},{label:"Loyalty",desc:"In-house rewards. Points, perks, access."},{label:"Web",desc:"Digital home. Education + where to buy."},{label:"Repeat Purchase",desc:"Re-engagement. Direct comms. Retention."}].map((step, i) => (
            <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, padding: "13px 14px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)", border: "1px solid var(--border2)", borderTop: `2px solid ${i % 2 === 0 ? "var(--gold)" : "#4d9e8e"}`, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: i % 2 === 0 ? "var(--gold)" : "#4d9e8e", marginBottom: 5 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              {i < 4 && <div style={{ fontSize: 16, color: "var(--gold)", opacity: .4, padding: "0 4px", flexShrink: 0 }}>→</div>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", fontStyle: "italic", marginBottom: 14 }}>Every channel feeds data back into this loop — enabling smarter targeting, personalized rewards, and sustainable revenue growth.</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[["1–3%","Current QR Conversion Rate"],["→ 20%+","Target Within 90 Days"],["2,000+","Loyalty Members Year 2"]].map(([v,l]) => (
            <div key={l} style={{ flex: 1, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 9, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--df)", fontSize: 26, fontWeight: 300, color: "var(--gold)" }}>{v}</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".08em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <Divider />

      {/* DIGITAL CHANNELS */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Channel Initiatives — Digital & Direct-to-Consumer" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {DIGITAL_CHANNELS.map(ch => <ChannelCard key={ch.num} item={ch} />)}
        </div>
      </div>
      <Divider />

      {/* BRAND & FIELD */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Channel Initiatives — Social, Events, PR & Field" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {BRAND_FIELD.map(ch => <ChannelCard key={ch.num} item={ch} />)}
        </div>
      </div>
      <Divider />

      {/* IN-STORE */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Channel Initiatives — In-Store, Budtender & Merchandise" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {INSTORE.map(ch => <ChannelCard key={ch.num} item={ch} />)}
          <div style={{ padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid #4d9e8e", borderRadius: 11 }}>
            <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "#4d9e8e", marginBottom: 6 }}>13</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Brand Merchandise Programs</div>
            {[{brand:"HEAD CHANGE",color:"#A31C1C",desc:"Premium, limited-run drops. Apparel, accessories, collector items aligned to the connoisseur identity."},{brand:"SAFE BET",color:"#C97820",desc:"Accessible, functional merch. Everyday wearables and branded utilities with broad market appeal."},{brand:"BUBBLES",color:"#7B68B5",desc:"Creative-forward, expressive items consistent with finalized brand positioning."}].map(m => (
              <div key={m.brand} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: m.color, letterSpacing: ".1em", marginBottom: 3 }}>{m.brand}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.55 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Divider />

      {/* KPIs */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Key Performance Indicators — How We Measure Success" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {KPIS.map(k => (
            <div key={k.area} style={{ padding: "13px 15px", background: "var(--surface)", border: "1px solid var(--border2)", borderLeft: "2px solid #4d9e8e", borderRadius: 9 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>{k.area}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>{k.metric}</div>
              <div style={{ fontFamily: "var(--df)", fontSize: 15, color: "var(--text)" }}>{k.target}</div>
            </div>
          ))}
        </div>
      </div>
      <Divider />


      {/* TEAM */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Team & Infrastructure — A Scalable Marketing Organization" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: "var(--gold)", textTransform: "uppercase", padding: "7px 12px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.18)", borderRadius: 6, marginBottom: 8 }}>Current Team</div>
            {CURRENT_TEAM.map((m, i) => (
              <div key={i} style={{ padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border2)", borderLeft: "2px solid #4d9e8e", borderRadius: 7, marginBottom: 6, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.55 }}>{m}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: "var(--gold)", textTransform: "uppercase", padding: "7px 12px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.18)", borderRadius: 6, marginBottom: 8 }}>Hiring Roadmap</div>
            {HIRING.map((h, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border2)", borderLeft: "2px solid var(--gold)", borderRadius: 7, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{h.role}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Divider />

      {/* BUDGET */}
      <div style={{ marginBottom: 32 }}>
        <Sec label="Budget Philosophy — Investing to Compound" />
        <div style={{ padding: "10px 14px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.2)", borderLeft: "3px solid var(--gold)", borderRadius: 8, marginBottom: 14, fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>Overall Target: 4–5% of Annual Sales Invested into Marketing</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {BUDGET.map(b => (
            <div key={b.cat} style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border2)", borderTop: `2px solid ${b.color}`, borderRadius: 9 }}>
              <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: b.color, lineHeight: 1.1, marginBottom: 4 }}>{b.pct}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{b.cat}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.6 }}>{b.note}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-dim)", fontStyle: "italic" }}>*Target marketing investment of 4–5% of annual sales — consistent with best practices for brand-building stage CPG & cannabis companies.</div>
      </div>
      <Divider />

      {/* CLOSING */}
      <div style={{ marginBottom: 40, padding: "32px 36px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), transparent)" }} />
        <div style={{ fontFamily: "var(--df)", fontSize: 48, fontWeight: 700, color: "var(--text)", letterSpacing: ".04em", marginBottom: 16, lineHeight: .9 }}>CÚRADOR</div>
        <div style={{ width: "60%", height: 1, background: "var(--gold)", opacity: .4, marginBottom: 16 }} />
        <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--gold)", lineHeight: 1.5, marginBottom: 14, maxWidth: 540 }}>Missouri is the proving ground.<br />Everything we build here is built to travel.</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.75, maxWidth: 520 }}>The marketing and creative investment we make today is not a cost — it is the engine that compounds our operational advantage into consumer loyalty, brand equity, and sustainable market share.</div>
        <div style={{ marginTop: 20, fontSize: 9, color: "var(--text-dim)", letterSpacing: ".15em", textTransform: "uppercase" }}>Confidential — Internal Use Only · Marketing & Creative Division · 2026–2027</div>
      </div>

      {/* BOARD DIVIDER */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginBottom: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>Initiative Board</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Active initiatives by marketing channel</div>
      </div>
    </div>
  );
}

function CompanyPanel({ company, brands, activeBrand, onBrandSelect, initiatives, onInitClick, onAddBrandInit }) {
  const brandList = Object.values(brands);
  const [brandsOpen, setBrandsOpen] = useState(true); // brands collapsed under CÚRADOR
  const [openBrand, setOpenBrand] = useState(null);

  const toggleBrand = (e, id) => {
    e.stopPropagation();
    setOpenBrand(prev => prev === id ? null : id);
  };

  return (
    <div className="cp-nav">
      {/* ── CÚRADOR master tab ── */}
      <button
        className={`cp-master-tab ${activeBrand === "curador" ? "on" : ""}`}
        onClick={() => onBrandSelect("curador")}
      >
        <div className="cp-master-tab-logo">C</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cp-master-tab-name">{company.name}</div>
          <div className="cp-master-tab-sub">Marketing Vision</div>
        </div>
        {/* Collapse toggle */}
        <div onClick={e => { e.stopPropagation(); setBrandsOpen(o => !o); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "var(--text-muted)", fontSize: 10, flexShrink: 0, transition: "transform .2s", transform: brandsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          title={brandsOpen ? "Collapse brands" : "Expand brands"}
        >▶</div>
      </button>

      {/* ── Brand tabs — collapsible under CÚRADOR ── */}
      {brandsOpen && (
        <div style={{ paddingLeft: 10 }}>
          {brandList.map(b => {
            const brandInits = b.id === "airo" ? [] : initiatives.filter(i => i.brandId === b.id || i.brandId === null);
            const isOpen = openBrand === b.id;
            const isActive = activeBrand === b.id;
            return (
              <div key={b.id}>
                <div
                  className={`cp-brand-tab ${isActive ? "on" : ""}`}
                  style={{ borderColor: isActive ? b.color + "44" : "transparent", cursor: "pointer" }}
                  onClick={() => onBrandSelect(b.id)}
                >
                  <div className="cp-brand-dot" style={{ background: b.color, boxShadow: isActive ? `0 0 8px ${b.color}66` : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cp-brand-name" style={{ color: isActive ? b.color : "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>{b.name}{b.licensed && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 100, background: "rgba(0,180,216,.1)", color: "#00B4D8", border: "1px solid rgba(0,180,216,.2)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600 }}>Licensed</span>}</div>
                    <div className="cp-brand-tagline">{b.tagline}</div>
                  </div>
                  {b.id !== "airo" && brandInits.length > 0 && (
                    <div style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: b.color + "20", color: b.color, border: `1px solid ${b.color}33`, flexShrink: 0, marginRight: 4 }}>
                      {brandInits.length}
                    </div>
                  )}
                  {b.id !== "airo" && <button style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "var(--text-muted)", fontSize: 10, flexShrink: 0, transition: "transform .18s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    onClick={e => toggleBrand(e, b.id)}
                    title={isOpen ? "Collapse" : "Show initiatives"}
                  >▶</button>}
                </div>

                {isOpen && b.id !== "airo" && (
                  <div className="cp-brand-inits">
                    {brandInits.length === 0 ? (
                      <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "4px 8px", fontStyle: "italic" }}>No initiatives yet</div>
                    ) : (
                      brandInits.map(init => (
                        <div key={init.id} className="cp-init-row" onClick={() => onInitClick(init, b.id)}>
                          <div className="cp-init-dot" style={{ background: b.color }} />
                          <div className="cp-init-title">{init.title}</div>
                      
                    </div>
                  ))
                )}
                <button className="cp-brand-add" onClick={e => { e.stopPropagation(); onAddBrandInit(b.id); }}>
                  <span style={{ fontSize: 12 }}>＋</span> Add Initiative
                </button>
              </div>
            )}
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand }) {
  if (!brand) return null;
  return (
    <div className="bc">
      <div className="bc-hdr">
        <div className="bc-swatch" style={{ background: brand.color, boxShadow: `0 0 12px ${brand.color}44` }} />
        <div>
          <div className="bc-name">{brand.name}</div>
          <div className="bc-tagline" style={{ color: brand.color }}>{brand.tagline}</div>
        </div>
      </div>
      <div className="bc-sec">
        <div className="bc-lbl">Brand Story</div>
        <div className="bc-txt">{brand.story}</div>
      </div>
      <div className="bc-sec">
        <div className="bc-lbl">Mission</div>
        <div className="bc-txt" style={{ fontStyle: "italic" }}>{brand.mission}</div>
      </div>
      <div className="bc-sec">
        <div className="bc-lbl">Core Values</div>
        <div className="bc-pills">
          {brand.values.map(v => <span key={v} className="bc-pill" style={{ color: brand.color, borderColor: brand.color + "33", background: brand.color + "12" }}>{v}</span>)}
        </div>
      </div>
      <div className="bc-sec">
        <div className="bc-lbl">Target Audience</div>
        <div className="bc-txt">{brand.audience}</div>
      </div>
      <div className="bc-sec" style={{ marginBottom: 0 }}>
        <div className="bc-lbl">Brand Guidelines</div>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 9, overflow: "hidden" }}>
          <div className="bc-gr"><div className="bc-gk">Tone</div><div className="bc-gv">{brand.tone}</div></div>
          <div className="bc-gr"><div className="bc-gk">Type</div><div className="bc-gv">{brand.typography}</div></div>
          <div className="bc-gr">
            <div className="bc-gk">Primary</div>
            <div className="bc-color-row">
              <div className="bc-cswatch" style={{ background: brand.color, boxShadow: `0 0 6px ${brand.color}55` }} />
              <span className="bc-gv" style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: 10 }}>{brand.color}</span>
            </div>
          </div>
          <div className="bc-gr" style={{ borderBottom: "none" }}>
            <div className="bc-gk">Secondary</div>
            <div className="bc-color-row">
              <div className="bc-cswatch" style={{ background: brand.secondary, border: "1px solid rgba(255,255,255,.1)" }} />
              <span className="bc-gv" style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: 10 }}>{brand.secondary}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM PANEL
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// ORG CHART — full-width right-side view
// ════════════════════════════════════════════════════════════════════════════
function OrgChartView({ teamMembers, currentUser, orgRoles: initialRoles, onSelect, onRolesChange, canEdit }) {
  const NODE_W = 130, NODE_H = 50, CW = 1000, CH = 700;

  const buildPositions = (rls) => {
    const pos = {};
    const roots = rls.filter(r => !r.parentId);
    const kids = (pid) => rls.filter(r => r.parentId === pid);
    const place = (id, x, y) => {
      pos[id] = { x, y };
      const ch = kids(id);
      if (!ch.length) return NODE_W + 24;
      const tw = ch.length * (NODE_W + 24);
      let cx = x - tw / 2 + (NODE_W + 24) / 2;
      ch.forEach(c => { place(c.id, cx, y + 140); cx += NODE_W + 24; });
    };
    let rx = CW / 2 - roots.length * (NODE_W + 60) / 2;
    roots.forEach(r => { place(r.id, rx, 60); rx += NODE_W + 60; });
    return pos;
  };

  const [roles, setRoles] = useState(initialRoles);
  const ORG_VERSION = "v3"; // bump this to force reset layout
  const DEFAULT_POS = {
    exec:        { x: 180,  y: 30  },
    ceo:         { x: 420,  y: 30  },
    packaging:   { x: 60,   y: 140 },
    creative:    { x: 310,  y: 140 },
    sales:       { x: 540,  y: 140 },
    content:     { x: 30,   y: 260 },
    agencies:    { x: 250,  y: 260 },
    coordinator: { x: 460,  y: 260 },
    puff:        { x: 160,  y: 380 },
    studio:      { x: 320,  y: 380 },
    field:       { x: 480,  y: 380 },
  };
  const [pos, setPos] = useState(() => {
    const saved = window.__savedOrgPos;
    if (saved && saved.__version === ORG_VERSION) return saved;
    return { ...DEFAULT_POS, __version: ORG_VERSION };
  });
  const [conns, setConns] = useState(() => {
    const saved = window.__savedOrgConns;
    if (saved && saved.__version === ORG_VERSION) return saved;
    const m = { __version: ORG_VERSION };
    initialRoles.filter(r => r.parentId).forEach(r => {
      m[r.id] = { from: r.parentId, to: r.id, c1: null, c2: null };
    });
    return m;
  });

  const [dragNode, setDragNode] = useState(null);
  const [dragHandle, setDragHandle] = useState(null); // { connId, which: 'c1'|'c2'|'from'|'to' }
  const [drawConn, setDrawConn] = useState(null); // { fromId, mx, my } while drawing new connection
  const [dropTarget, setDropTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [addingUnder, setAddingUnder] = useState(null);
  const [addVal, setAddVal] = useState('');
  const [editMode, setEditMode] = useState(false);
  const canvasRef = useRef();
  const dragStart = useRef(null);

  const members = (id) => teamMembers.filter(m => m.role === id);

  // Persist pos and conns to SHARED storage so all users see the same chart
  useEffect(() => {
    const toSave = { ...pos, __version: ORG_VERSION };
    window.__savedOrgPos = toSave;
    try { window.storage?.set("ns-orgpos", JSON.stringify(toSave), true); } catch {}
  }, [pos]);
  useEffect(() => {
    const toSave = { ...conns, __version: ORG_VERSION };
    window.__savedOrgConns = toSave;
    try { window.storage?.set("ns-orgconns", JSON.stringify(toSave), true); } catch {}
  }, [conns]);

  const saveRoles = (newRoles) => {
    setRoles(newRoles);
    onRolesChange?.(newRoles);
  };

  const getCanvasXY = (e) => {
    const r = canvasRef.current?.getBoundingClientRect();
    const scroll = canvasRef.current;
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - r.left + scroll.scrollLeft, y: e.clientY - r.top + scroll.scrollTop };
  };

  const nodeAt = (x, y, excludeId) => roles.find(r => {
    if (r.id === excludeId) return false;
    const p = pos[r.id];
    return p && x >= p.x && x <= p.x + NODE_W && y >= p.y && y <= p.y + NODE_H;
  });

  // Default connection points: center of bottom/top
  const connEndpoints = (connId) => {
    const conn = conns[connId];
    if (!conn) return null;
    const fp = pos[conn.from], tp = pos[conn.to];
    if (!fp || !tp) return null;
    const fromPt = { x: fp.x + NODE_W / 2, y: fp.y + NODE_H };
    const toPt = { x: tp.x + NODE_W / 2, y: tp.y };
    const c1 = conn.c1 || { x: fromPt.x, y: fromPt.y + 40 };
    const c2 = conn.c2 || { x: toPt.x, y: toPt.y - 40 };
    return { fromPt, toPt, c1, c2 };
  };

  // Global mouse move
  const onMove = useCallback((e) => {
    const { x, y } = getCanvasXY(e);

    if (dragNode) {
      const dx = e.clientX - dragNode.ox, dy = e.clientY - dragNode.oy;
      setPos(p => ({ ...p, [dragNode.id]: { x: Math.max(0, Math.min(CW - NODE_W, p[dragNode.id].x + dx)), y: Math.max(0, Math.min(CH - NODE_H, p[dragNode.id].y + dy)) } }));
      setDragNode(d => ({ ...d, ox: e.clientX, oy: e.clientY }));
      const hit = nodeAt(x, y, dragNode.id);
      setDropTarget(hit?.id || null);
    }

    if (dragHandle) {
      setConns(prev => {
        const conn = { ...prev[dragHandle.connId] };
        if (dragHandle.which === 'c1') conn.c1 = { x, y };
        else if (dragHandle.which === 'c2') conn.c2 = { x, y };
        else if (dragHandle.which === 'from') conn.fromPtOverride = { x, y };
        else if (dragHandle.which === 'to') conn.toPtOverride = { x, y };
        return { ...prev, [dragHandle.connId]: conn };
      });
    }

    if (drawConn) {
      setDrawConn(d => ({ ...d, mx: x, my: y }));
      const hit = nodeAt(x, y, drawConn.fromId);
      setDropTarget(hit?.id || null);
    }
  }, [dragNode, dragHandle, drawConn, roles, pos]);

  const onUp = useCallback((e) => {
    const { x, y } = getCanvasXY(e);
    const moved = dragStart.current && (Math.abs(e.clientX - dragStart.current.x) > 5 || Math.abs(e.clientY - dragStart.current.y) > 5);

    // Node drop — reparent
    if (dragNode && moved && dropTarget && editMode) {
      const isDesc = (cid, aid) => {
        let cur = roles.find(r => r.id === cid);
        while (cur?.parentId) { if (cur.parentId === aid) return true; cur = roles.find(r => r.id === cur.parentId); }
        return false;
      };
      if (!isDesc(dropTarget, dragNode.id)) {
        saveRoles(roles.map(r => r.id === dragNode.id ? { ...r, parentId: dropTarget } : r));
        setConns(prev => ({ ...prev, [dragNode.id]: { from: dropTarget, to: dragNode.id, c1: null, c2: null } }));
      }
    }

    // Finish drawing new connector
    if (drawConn && dropTarget && dropTarget !== drawConn.fromId) {
      const newId = `conn-${Date.now()}`;
      setConns(prev => ({ ...prev, [newId]: { from: drawConn.fromId, to: dropTarget, c1: null, c2: null } }));
    }

    setDragNode(null);
    setDragHandle(null);
    setDrawConn(null);
    setDropTarget(null);
    dragStart.current = null;
  }, [dragNode, dragHandle, drawConn, dropTarget, roles, editMode]);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [onMove, onUp]);

  const renameRole = (id, title) => { saveRoles(roles.map(r => r.id === id ? { ...r, title } : r)); setEditing(null); };

  const removeRole = (id) => {
    const toRm = new Set([id]);
    let changed = true;
    while (changed) { changed = false; roles.forEach(r => { if (r.parentId && toRm.has(r.parentId) && !toRm.has(r.id)) { toRm.add(r.id); changed = true; } }); }
    saveRoles(roles.filter(r => !toRm.has(r.id)));
    setConns(prev => { const n = { ...prev }; toRm.forEach(id => delete n[id]); return n; });
    setPos(prev => { const n = { ...prev }; toRm.forEach(id => delete n[id]); return n; });
  };

  const removeConn = (id) => setConns(prev => { const n = { ...prev }; delete n[id]; return n; });

  const addRole = (parentId, title) => {
    if (!title.trim()) { setAddingUnder(null); return; }
    const id = `role-${Date.now()}`;
    saveRoles([...roles, { id, title: title.trim(), parentId }]);
    const pp = parentId && pos[parentId];
    setPos(p => ({ ...p, [id]: pp ? { x: pp.x + 160, y: pp.y + 140 } : { x: 400, y: 400 } }));
    if (parentId) setConns(prev => ({ ...prev, [id]: { from: parentId, to: id, c1: null, c2: null } }));
    setAddingUnder(null);
    setAddVal('');
  };

  // Build SVG path for a connector
  const connPath = (connId) => {
    const conn = conns[connId];
    if (!conn) return null;
    const fp = pos[conn.from], tp = pos[conn.to];
    if (!fp || !tp) return null;
    const fromPt = conn.fromPtOverride || { x: fp.x + NODE_W / 2, y: fp.y + NODE_H };
    const toPt   = conn.toPtOverride   || { x: tp.x + NODE_W / 2, y: tp.y };
    const c1 = conn.c1 || { x: fromPt.x, y: fromPt.y + Math.abs(toPt.y - fromPt.y) * 0.4 + 30 };
    const c2 = conn.c2 || { x: toPt.x,   y: toPt.y - Math.abs(toPt.y - fromPt.y) * 0.4 - 30 };
    return { path: `M${fromPt.x},${fromPt.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${toPt.x},${toPt.y}`, fromPt, toPt, c1, c2 };
  };

  const H = ({ x, y, connId, which, color }) => (
    <g>
      <line x1={which === 'c1' ? (conns[connId]?.fromPtOverride?.x || pos[conns[connId]?.from]?.x + NODE_W/2) : (conns[connId]?.toPtOverride?.x || pos[conns[connId]?.to]?.x + NODE_W/2)}
            y1={which === 'c1' ? (conns[connId]?.fromPtOverride?.y || pos[conns[connId]?.from]?.y + NODE_H) : (conns[connId]?.toPtOverride?.y || pos[conns[connId]?.to]?.y)}
            x2={x} y2={y} stroke={color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity=".4" />
      <circle cx={x} cy={y} r="6" fill={color} stroke="var(--surface)" strokeWidth="2"
        style={{ cursor: "crosshair" }}
        onMouseDown={e => { e.stopPropagation(); setDragHandle({ connId, which }); }} />
    </g>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {canEdit && <button onClick={() => { setEditMode(e => !e); setEditing(null); setAddingUnder(null); setDrawConn(null); }}
          style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--bf)", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", background: editMode ? "rgba(77,158,142,.12)" : "var(--surface)", border: `1px solid ${editMode ? "rgba(77,158,142,.35)" : "var(--border)"}`, color: editMode ? "#4d9e8e" : "var(--text-muted)" }}>
          {editMode ? "✓ Done" : "✏ Edit Chart"}
        </button>}
        <button onClick={() => { setPos(buildPositions(roles)); setConns(c => { const n = {}; roles.filter(r => r.parentId).forEach(r => { n[r.id] = { from: r.parentId, to: r.id, c1: null, c2: null }; }); return n; }); }} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--bf)", fontSize: 11, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>⟳ Reset</button>
        {editMode && (
          <>
            {addingUnder === "root" ? (
              <div style={{ display: "flex", gap: 4 }}>
                <input autoFocus value={addVal} onChange={e => setAddVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addRole(null, addVal); if (e.key === "Escape") setAddingUnder(null); }} placeholder="New role…" style={{ padding: "5px 9px", borderRadius: 7, border: "1px solid rgba(77,158,142,.4)", background: "var(--surface2)", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: 140 }} />
                <button onClick={() => addRole(null, addVal)} style={{ padding: "5px 9px", borderRadius: 7, border: "none", background: "#4d9e8e", color: "#fff", fontSize: 11, cursor: "pointer" }}>Add</button>
                <button onClick={() => setAddingUnder(null)} style={{ padding: "5px 9px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <button onClick={() => { setAddingUnder("root"); setAddVal(""); }} style={{ padding: "7px 12px", borderRadius: 8, border: "1px dashed var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "var(--bf)" }}>+ Add role</button>
            )}
          </>
        )}
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>
          {editMode
            ? drawConn
              ? "Click any node to connect · Click + again to cancel"
              : "Drag nodes to move · Click + to draw a connection · Drag ● handles to bend lines · ✕ to remove"
            : "Double-click to rename · Click filled role to view profile"}
        </div>
      </div>

      <div ref={canvasRef} style={{ position: "relative", width: "100%", height: 540, overflow: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
        <div style={{ position: "relative", width: CW, height: CH, userSelect: "none" }}>

          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
            onMouseDown={e => { if (e.target === e.currentTarget) { /* click canvas */ } }}>

            {/* Connectors */}
            {Object.keys(conns).map(cid => {
              const cp = connPath(cid);
              if (!cp) return null;
              const { path, fromPt, toPt, c1, c2 } = cp;
              return (
                <g key={cid}>
                  {/* Wider invisible hit area */}
                  <path d={path} fill="none" stroke="transparent" strokeWidth="10" style={{ cursor: "pointer" }}
                    onClick={() => editMode && removeConn(cid)} />
                  {/* Visible line */}
                  <path d={path} fill="none" stroke="rgba(201,168,76,.35)" strokeWidth="1.5" />
                  {/* Arrow */}
                  <circle cx={toPt.x} cy={toPt.y} r="3" fill="rgba(201,168,76,.6)" />

                  {/* Edit handles */}
                  {editMode && (
                    <>
                      {/* Endpoint handles — diamond shape */}
                      <rect x={fromPt.x - 5} y={fromPt.y - 5} width="10" height="10"
                        fill="#4d9e8e" stroke="var(--surface)" strokeWidth="1.5"
                        transform={`rotate(45,${fromPt.x},${fromPt.y})`}
                        style={{ cursor: "crosshair" }}
                        onMouseDown={e => { e.stopPropagation(); setDragHandle({ connId: cid, which: 'from' }); }} />
                      <rect x={toPt.x - 5} y={toPt.y - 5} width="10" height="10"
                        fill="#8b7fc0" stroke="var(--surface)" strokeWidth="1.5"
                        transform={`rotate(45,${toPt.x},${toPt.y})`}
                        style={{ cursor: "crosshair" }}
                        onMouseDown={e => { e.stopPropagation(); setDragHandle({ connId: cid, which: 'to' }); }} />
                      {/* Control point handles — circles */}
                      <H x={c1.x} y={c1.y} connId={cid} which="c1" color="#c9a84c" />
                      <H x={c2.x} y={c2.y} connId={cid} which="c2" color="#e07b6a" />
                      {/* Remove button */}
                      <g onClick={() => removeConn(cid)} style={{ cursor: "pointer" }}>
                        <circle cx={(fromPt.x + toPt.x) / 2} cy={(fromPt.y + toPt.y) / 2} r="8" fill="rgba(224,123,106,.15)" stroke="rgba(224,123,106,.4)" strokeWidth="1" />
                        <text x={(fromPt.x + toPt.x) / 2} y={(fromPt.y + toPt.y) / 2 + 4} textAnchor="middle" fontSize="10" fill="#e07b6a">✕</text>
                      </g>
                    </>
                  )}
                </g>
              );
            })}

            {/* Live drawing line */}
            {drawConn && pos[drawConn.fromId] && (() => {
              const fp = pos[drawConn.fromId];
              const fx = fp.x + NODE_W / 2, fy = fp.y + NODE_H;
              const mid = (fy + drawConn.my) / 2;
              return <path d={`M${fx},${fy} C${fx},${mid} ${drawConn.mx},${mid} ${drawConn.mx},${drawConn.my}`} fill="none" stroke="#4d9e8e" strokeWidth="2" strokeDasharray="6 3" />;
            })()}

            {/* Drop target highlight */}
            {dropTarget && pos[dropTarget] && (
              <rect x={pos[dropTarget].x - 3} y={pos[dropTarget].y - 3} width={NODE_W + 6} height={NODE_H + 6} rx="12" fill="none" stroke="#4d9e8e" strokeWidth="2" strokeDasharray="5 3" />
            )}
          </svg>

          {/* Nodes */}
          {roles.map(role => {
            const p = pos[role.id] || { x: 100, y: 100 };
            const mems = members(role.id);
            const filled = mems.length > 0;
            const isDragging = dragNode?.id === role.id;
            const borderColor = filled ? "rgba(201,168,76,.45)" : "var(--border)";

            return (
              <div key={role.id} style={{
                position: "absolute", left: p.x, top: p.y, width: NODE_W, height: NODE_H,
                zIndex: isDragging ? 100 : 2,
                transform: isDragging ? "scale(1.05)" : "scale(1)",
                transition: isDragging ? "none" : "transform .12s",
              }}>
                <div style={{
                    width: "100%", height: "100%", borderRadius: 10, padding: "7px 10px",
                    border: `1.5px solid ${borderColor}`,
                    background: filled ? "rgba(255,255,255,.03)" : "var(--surface2)",
                    boxShadow: isDragging ? "0 10px 36px rgba(0,0,0,.45)" : "0 2px 8px rgba(0,0,0,.2)",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    cursor: editMode ? (isDragging ? "grabbing" : "grab") : filled ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  onMouseDown={e => { if (editMode && !drawConn) { e.stopPropagation(); dragStart.current = { x: e.clientX, y: e.clientY }; setDragNode({ id: role.id, ox: e.clientX, oy: e.clientY }); } }}
                  onClick={() => {
                    if (drawConn && drawConn.fromId !== role.id) {
                      // Complete connection
                      const newId = `conn-${Date.now()}`;
                      setConns(prev => ({ ...prev, [newId]: { from: drawConn.fromId, to: role.id, c1: null, c2: null, __version: ORG_VERSION } }));
                      setDrawConn(null);
                      setDropTarget(null);
                    } else if (!editMode && filled) {
                      onSelect(mems[0]);
                    }
                  }}
                  onDoubleClick={() => { setEditing(role.id); setEditVal(role.title); }}
                >
                  {editing === role.id ? (
                    <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                      onBlur={() => renameRole(role.id, editVal || role.title)}
                      onKeyDown={e => { if (e.key === "Enter") renameRole(role.id, editVal || role.title); if (e.key === "Escape") setEditing(null); }}
                      onMouseDown={e => e.stopPropagation()}
                      style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", width: "100%", textAlign: "center" }} />
                  ) : (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, color: filled ? "var(--text)" : "var(--text-muted)", textAlign: "center", lineHeight: 1.3 }}>{role.title}</div>
                    </>
                  )}
                </div>

                {/* Edit mode controls */}
                {editMode && editing !== role.id && (
                  <div style={{ position: "absolute", top: -10, right: -10, display: "flex", gap: 3 }} onMouseDown={e => e.stopPropagation()}>
                    <div title="Draw a connection from this node — click then click another node"
                      style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(77,158,142,.5)", background: drawConn?.fromId === role.id ? "#4d9e8e" : "rgba(77,158,142,.15)", color: "#4d9e8e", fontSize: 13, cursor: "crosshair", display: "grid", placeItems: "center", transition: "background .15s" }}
                      onClick={e => {
                        e.stopPropagation();
                        if (drawConn?.fromId === role.id) {
                          setDrawConn(null); // cancel
                        } else {
                          const p2 = pos[role.id];
                          setDrawConn({ fromId: role.id, mx: p2.x + NODE_W / 2, my: p2.y + NODE_H });
                        }
                      }}>+</div>
                    <div title="Remove role"
                      style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(224,123,106,.5)", background: "rgba(224,123,106,.15)", color: "#e07b6a", fontSize: 10, cursor: "pointer", display: "grid", placeItems: "center" }}
                      onClick={e => { e.stopPropagation(); removeRole(role.id); }}>✕</div>
                  </div>
                )}

                {/* Drawing mode indicator */}
                {editMode && drawConn?.fromId === role.id && (
                  <div style={{ position: "absolute", bottom: -28, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 9, color: "#4d9e8e", background: "rgba(77,158,142,.1)", border: "1px solid rgba(77,158,142,.3)", padding: "2px 7px", borderRadius: 100, pointerEvents: "none" }}>
                    Click a node to connect →
                  </div>
                )}

                {/* Connection port dot — drag to draw */}
                {editMode && !drawConn && (
                  <div title="Drag to draw a new connection"
                    style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: "#4d9e8e", border: "2px solid var(--surface)", cursor: "crosshair", zIndex: 10 }}
                    onMouseDown={e => { e.stopPropagation(); const { x, y } = getCanvasXY(e); setDrawConn({ fromId: role.id, mx: x, my: y }); }}
                  />
                )}

                {/* Add role popover */}
                {addingUnder === role.id && (
                  <div style={{ position: "absolute", top: NODE_H + 10, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px", display: "flex", gap: 5, boxShadow: "0 8px 24px rgba(0,0,0,.4)", whiteSpace: "nowrap" }} onMouseDown={e => e.stopPropagation()}>
                    <input autoFocus value={addVal} onChange={e => setAddVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addRole(role.id, addVal); if (e.key === "Escape") setAddingUnder(null); }}
                      placeholder="Role title…"
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(77,158,142,.4)", background: "var(--surface2)", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: 130 }} />
                    <button onClick={() => addRole(role.id, addVal)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#4d9e8e", color: "#fff", fontSize: 11, cursor: "pointer" }}>Add</button>
                    <button onClick={() => setAddingUnder(null)} style={{ padding: "4px 7px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer" }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MembersGridView({ teamMembers, currentUser, orgRoles, onSelect, onChangeUser }) {
  if (teamMembers.length === 0) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 14, opacity: .25 }}>👥</div>
        <div style={{ fontSize: 15, color: "var(--text-dim)", marginBottom: 8 }}>No team members yet</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Log in with a name and role to appear here and in the org chart</div>
        <button className="btn btn-gold" onClick={onChangeUser}>+ Join the Team</button>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
      {teamMembers.map(m => {
        const roleLabel = orgRoles.find(r => r.id === m.role)?.title || "Team Member";
        const isMe = currentUser?.name?.toLowerCase() === m.name?.toLowerCase();
        const mc = m.color?.bg ? m.color : colorForName(m.name || "User");
        return (
          <div key={m.name} data-tag-type="Team Member" data-tag-label={m.name} data-tag-section="Team" onClick={() => onSelect(m)} style={{
            padding: "18px 18px 16px", borderRadius: 13, cursor: "pointer",
            background: "var(--surface)", transition: "all .15s",
            border: `1px solid ${isMe ? "rgba(201,168,76,.3)" : "var(--border)"}`,
            boxShadow: isMe ? "0 0 0 1px rgba(201,168,76,.1)" : "none",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = isMe ? "rgba(201,168,76,.5)" : "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isMe ? "rgba(201,168,76,.3)" : "var(--border)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isMe ? "0 0 0 1px rgba(201,168,76,.1)" : "none"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: mc.bg, color: mc.text, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{initials(m.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: m.title ? "var(--text-dim)" : "var(--text-muted)", marginTop: 2, fontStyle: m.title ? "normal" : "italic" }}>{m.title || roleLabel}</div>
              </div>
              {isMe && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid rgba(201,168,76,.2)", flexShrink: 0 }}>You</span>}
            </div>
            {m.bio && <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.bio}</div>}
            {(m.skills?.length > 0) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                {m.skills.slice(0, 4).map(s => (
                  <span key={s} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, background: `${mc.bg}18`, border: `1px solid ${mc.bg}30`, color: "var(--text-dim)", fontWeight: 500 }}>{s}</span>
                ))}
                {m.skills.length > 4 && <span style={{ fontSize: 10, color: "var(--text-muted)", alignSelf: "center" }}>+{m.skills.length - 4} more</span>}
              </div>
            )}
            {!m.bio && !m.skills?.length && !m.strengths?.length && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No profile yet{isMe ? " — tap Edit Profile below" : ""}</div>
            )}
            {isMe && (
              <button onClick={e => { e.stopPropagation(); onSelect(m); }}
                style={{ marginTop: 10, width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid rgba(201,168,76,.3)", background: "var(--gold-dim)", color: "var(--gold)", fontSize: 11, fontWeight: 600, fontFamily: "var(--bf)", letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--gold-dim)"; }}
              >✦ Edit Profile</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TeamPanel({ teamMembers, currentUser, orgRoles, onSelect, onChangeUser, fullWidth }) {
  const membersForRole = (roleId) => teamMembers.filter(m => m.role === roleId);

  const OrgNode = ({ roleId, compact }) => {
    const role = orgRoles.find(r => r.id === roleId);
    if (!role) return null;
    const members = membersForRole(roleId);
    const populated = members.length > 0;
    return (
      <div
        className={`org-node ${populated ? "populated" : ""}`}
        onClick={() => populated && onSelect(members[0])}
        title={`${role.title}${members.length ? ` — ${members.map(m => m.name).join(", ")}` : " — vacant"}`}
      >
        <div className="org-box" style={{ fontSize: compact ? "8px" : "9px", padding: compact ? "4px 6px" : "5px 9px" }}>
          {role.title}
        </div>
        {populated && (
          <div className="org-avs">
            {members.slice(0, 3).map(m => (
              <div key={m.name} className="org-av" style={{ background: m.color.bg, color: m.color.text }} title={m.name}>
                {initials(m.name)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Org chart connector helpers
  const Vert = ({ h = 10 }) => <div style={{ width: 1, height: h, background: "var(--border)", margin: "0 auto" }} />;
  const Horiz = ({ pct = "60%" }) => <div style={{ width: pct, height: 1, background: "var(--border)", margin: "0 auto" }} />;

  const OrgChartInner = () => (
    <div className="org-chart">
      <div className="org-level"><OrgNode roleId="ceo" /></div>
      <Vert h={8} /><Horiz pct="58%" />
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><Vert h={6} /><OrgNode roleId="creative" /></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><Vert h={6} /><OrgNode roleId="strategy" /></div>
      </div>
      <Vert h={6} />
      <div style={{ borderBottom: "1px solid var(--border)", width: "80%", margin: "0 auto" }} />
      <div style={{ display: "flex", justifyContent: "space-around", padding: "0 4px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <Vert h={6} />
          <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><OrgNode roleId="content" compact /><Vert h={4} /><OrgNode roleId="email" compact /></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><OrgNode roleId="design" compact /></div>
          </div>
        </div>
        <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <Vert h={6} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
            {["paid","seo","partners","field"].map(id => <OrgNode key={id} roleId={id} compact />)}
          </div>
        </div>
      </div>
    </div>
  );

  if (fullWidth) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
        {/* Org chart */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 20px" }}>
          <div style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16, fontWeight: 500 }}>Org Chart</div>
          <OrgChartInner />
        </div>
        {/* Members */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12, fontWeight: 500 }}>Team Members · {teamMembers.length}</div>
          {teamMembers.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
              <div style={{ fontSize: 28, marginBottom: 10, opacity: .3 }}>👥</div>
              No members yet. Log in to appear here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {teamMembers.map(m => {
                const roleLabel = orgRoles.find(r => r.id === m.role)?.title || "Team Member";
                return (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderRadius: 11, border: "1px solid var(--border2)", cursor: "pointer", background: "var(--surface)", transition: "all .15s" }}
                    onClick={() => onSelect(m)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.background = "var(--surface2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--surface)"; }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: m.color.bg, color: m.color.text, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{initials(m.name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{roleLabel}</div>
                      {m.bio && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.bio}</div>}
                    </div>
                    {currentUser?.name === m.name && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100, background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid rgba(201,168,76,.2)", flexShrink: 0 }}>You</span>}
                  </div>
                );
              })}
            </div>
          )}
          <button className="tp-add-btn" style={{ marginTop: 12, width: "100%" }} onClick={onChangeUser}>
            {currentUser ? "✦ Update Your Profile" : "+ Join the Team"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tp">
      {/* ORG CHART */}
      <div className="tp-org">
        <div className="org-lbl">Org Chart</div>
        <div className="org-chart">
          {/* CEO */}
          <div className="org-level"><OrgNode roleId="ceo" /></div>
          <Vert h={8} />
          <Horiz pct="58%" />
          {/* L1 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 8px", position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Vert h={6} />
              <OrgNode roleId="creative" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Vert h={6} />
              <OrgNode roleId="strategy" />
            </div>
          </div>
          <Vert h={6} />
          {/* L2 — Creative branch */}
          <div style={{ borderBottom: "1px solid var(--border)", width: "80%", margin: "0 auto 0" }} />
          <div style={{ display: "flex", justifyContent: "space-around", padding: "0 4px" }}>
            {/* Creative sub */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flex: 1 }}>
              <Vert h={6} />
              <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><OrgNode roleId="content" compact /><Vert h={4} /><OrgNode roleId="email" compact /></div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><OrgNode roleId="design" compact /></div>
              </div>
            </div>
            {/* Divider */}
            <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />
            {/* Strategy sub */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <Vert h={6} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
                {["paid","seo","partners","field"].map(id => <OrgNode key={id} roleId={id} compact />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MEMBER LIST */}
      <div className="tp-members">
        {teamMembers.length === 0 ? (
          <div className="empty-team">
            <div style={{ fontSize: 24, marginBottom: 8, opacity: .3 }}>👥</div>
            No team members yet.<br />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Log in to appear in the org chart.</span>
          </div>
        ) : (
          <>
            <div className="team-lbl">Team Members · {teamMembers.length}</div>
            {teamMembers.map(m => {
              const roleLabel = orgRoles.find(r => r.id === m.role)?.title || "Team Member";
              return (
                <div key={m.name} className="member-row" onClick={() => onSelect(m)}>
                  <div className="member-av" style={{ background: m.color.bg, color: m.color.text }}>{initials(m.name)}</div>
                  <div className="member-info">
                    <div className="member-name">{m.name}</div>
                    <div className="member-role">{roleLabel}</div>
                  </div>
                  {currentUser?.name === m.name && <div className="me-badge">You</div>}
                </div>
              );
            })}
          </>
        )}
        <button className="tp-add-btn" onClick={onChangeUser}>
          {currentUser ? "✦ Update Your Profile" : "+ Join the Team"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHANNELS PANEL
// ════════════════════════════════════════════════════════════════════════════
function ChannelsPanel({ initiatives, pillars, pillarAccents, onInitClick, hlInitId, fullWidth }) {
  const total = initiatives.length;

  if (fullWidth) {
    const CHANNEL_SECTIONS = [
      {
        label: "Digital & Direct-to-Consumer",
        items: [
          { num: "01", title: "Packaging & QR Journey",     color: "#c9a84c", bullets: ["Redesign all packaging to brand standards", "QR on every product → mobile brand experience", "Product education, loyalty enrollment, review prompts", "Data capture begins at first scan"] },
          { num: "02", title: "In-House Loyalty & Rewards", color: "#4d9e8e", bullets: ["Tiered structure: entry, mid, top tier", "Points via purchase, QR, referrals, events", "Redemption: discounts, merch, early access", "BudDrops: verified limited-allocation drops (Head Change)"] },
          { num: "03", title: "Email & SMS Marketing",      color: "#8b7fc0", bullets: ["Direct-to-consumer: product drops, events, loyalty", "B2B dispensary channel: new arrivals, sell-through tools", "Segmented by brand, tier, purchase behavior", "Positions Cúrador as partner, not just vendor"] },
          { num: "04", title: "SEO & Web Ecosystem",        color: "#5a9ed4", bullets: ["Complete brand websites — mobile-first architecture", "QR → Web → Loyalty: frictionless 3-step conversion", "Local SEO + product/strain content authority", "Retargeting pixels + analytics from Day 1"] },
          { num: "05", title: "Online Menu Advertising",    color: "#a0624a", bullets: ["Paid placements on Weedmaps, Leafly, dispensary menus", "Featured product listings tied to drops & promotions", "Geo-targeted ads reaching active Missouri consumers", "Performance tracked by click-through & attributed sell-through"] },
        ]
      },
      {
        label: "Social, Events, PR & Field",
        items: [
          { num: "06", title: "Social Media Strategy",      color: "#e07b6a", bullets: ["Head Change: Instagram-first, connoisseur culture", "Safe Bet: broad reach, accessible lifestyle tone", "3–4 posts/week per brand; daily story cadence", "Content pillars: Product, Culture, Community, Education"] },
          { num: "07", title: "Reimagined Events",          color: "#c9a84c", bullets: ["Annual calendar set at fiscal year start", "Every event has a defined data capture goal", "Content team at every event: photo, video, social", "Min. 1 major consumer event per quarter per brand"] },
          { num: "08", title: "PR Strategy",                color: "#4d9e8e", bullets: ["MO trade, lifestyle, business & national cannabis press", "Core narratives: manufacturing excellence, expansion", "Product launch PR tied to BudDrops & major SKUs", "Target: 4–5% of annual sales into marketing"] },
          { num: "09", title: "Field Marketing Rework",     color: "#8b7fc0", bullets: ["Every visit has a defined objective & 24-hr report", "Integrated with marketing calendar — not siloed", "Pop-ups tied to data capture goals only", "Target: 20–30% cost reduction vs. prior period"] },
        ]
      },
      {
        label: "In-Store, Budtender & Merchandise",
        items: [
          { num: "10", title: "Tiered In-Store Display",         color: "#5a9ed4", bullets: ["Tier 1: Full branded fixtures, panels, merch placement", "Tier 2: Core kit — shelf talkers, tent cards, signage", "Tier 3: Standard — shelf talkers, product info cards", "Each brand has distinct display visual language"] },
          { num: "11", title: "Budtender Appreciation Program",  color: "#a0624a", bullets: ["BudDrops: exclusive verified limited allocations", "Quarterly education sessions at partner stores", "Recognition & rewards tied to sell-through data", "Budtender CRM: contacts, preferences, event attendance"] },
          { num: "12", title: "In-Store Consumer Education",     color: "#e07b6a", bullets: ["Branded \"How to Hash\" educational booklet at point of sale", "Covers concentrate types, consumption methods, dosing, strain profiles", "Positions Head Change as the authority on craft concentrates in Missouri", "Drives first-time concentrate buyers toward our brands"] },
          { num: "13", title: "Brand Merchandise Programs",      color: "#c9a84c", bullets: ["Head Change: Premium limited-run drops — apparel, accessories, collector items", "Safe Bet: Accessible, functional merch — everyday wearables and branded utilities", "Bubbles: Creative-forward, expressive items consistent with brand positioning"] },
        ]
      },
    ];

    return (
      <div>
        {CHANNEL_SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom: si < CHANNEL_SECTIONS.length - 1 ? 32 : 0 }}>
            <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 14 }}>{section.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {section.items.map(ch => (
                <div key={ch.num} style={{ padding: "16px 18px", background: "var(--surface)", border: `1px solid ${ch.color}22`, borderTop: `2px solid ${ch.color}`, borderRadius: 11 }}>
                  <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: ch.color, lineHeight: 1, marginBottom: 6 }}>{ch.num}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>{ch.title}</div>
                  {ch.bullets.map(b => (
                    <div key={b} style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.55, paddingLeft: 10, position: "relative", marginBottom: 4 }}>
                      <span style={{ position: "absolute", left: 0, color: ch.color, opacity: .6 }}>·</span>{b}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {si < CHANNEL_SECTIONS.length - 1 && <div style={{ height: 1, background: "var(--border)", margin: "28px 0 0" }} />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="ch-hdr">
        <div className="ch-hdr-lbl">All Channels</div>
        <div className="ch-hdr-ct">{total} initiative{total !== 1 ? "s" : ""}</div>
      </div>
      {pillars.map((pillar, pi) => {
        const acc = pillarAccents[pi % pillarAccents.length];
        const items = initiatives.filter(i => i.channel === pillar);
        if (items.length === 0) return (
          <div key={pillar} className="ch-pillar">
            <div className="ch-p-hdr">
              <div className="ch-p-stripe" style={{ background: acc.solid }} />
              <div className="ch-p-name" style={{ color: acc.solid }}>{pillar}</div>
              <div className="ch-p-ct">0</div>
            </div>
          </div>
        );
        return (
          <div key={pillar} className="ch-pillar">
            <div className="ch-p-hdr">
              <div className="ch-p-stripe" style={{ background: acc.solid }} />
              <div className="ch-p-name" style={{ color: acc.solid }}>{pillar}</div>
              <div className="ch-p-ct">{items.length}</div>
            </div>
            {items.map(init => (
              <div key={init.id}
                className={`ch-card ${hlInitId === init.id ? "active" : ""}`}
                style={{ borderLeftColor: hlInitId === init.id ? "var(--gold)" : acc.solid }}
                onClick={() => onInitClick(init)}
              >
                <div className="ch-card-title">{init.title}</div>
                {init.description && <div className="ch-card-desc">{init.description}</div>}
                <div className="ch-card-meta">
                  <span>{init.owner}</span>
                  {init._brief && <span className="ch-card-badge">Brief</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {total === 0 && (
        <div style={{ padding: "32px 14px", textAlign: "center", color: "var(--text-dim)", fontSize: 12, lineHeight: 1.75 }}>
          No initiatives yet.<br />Add one from the board.
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS PANEL
// ════════════════════════════════════════════════════════════════════════════
function CampaignsPanel({ campaigns, onNew, onSelect, onDelete, fullWidth }) {
  const counts = { idea: 0, brief: 0, approved: 0 };
  campaigns.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  if (fullWidth) {
    return (
      <div>
        {/* Status summary */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[["idea","var(--gold)","Idea"],["brief","#8b7fc0","Brief"],["approved","#4d9e8e","Approved"]].map(([s, c, label]) => (
            <div key={s} style={{ flex: 1, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 11, borderTop: `2px solid ${c}` }}>
              <div style={{ fontFamily: "var(--df)", fontSize: 32, fontWeight: 300, color: c, lineHeight: 1 }}>{counts[s]}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        {/* Campaign grid */}
        {campaigns.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: .3 }}>🚀</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 6 }}>No campaigns yet</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Use the AI assistant or click "+ New Brief" to generate campaign briefs</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {campaigns.map(c => {
              const sc = { idea: "#c9a84c", brief: "#8b7fc0", approved: "#4d9e8e" }[c.status] || "var(--text-muted)";
              return (
                <div key={c.id} data-tag-type="Campaign" data-tag-label={c.title} data-tag-section="Campaigns" data-tag-brand={c.brand || ""} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderLeft: `2px solid ${sc}`, borderRadius: 11, padding: "14px 16px", cursor: "pointer", transition: "all .15s" }}
                  onClick={() => onSelect(c)}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border2)"; }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.3, flex: 1 }}>{c.title}</div>
                    <span className={`cmp-status ${c.status}`}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>
                    {c.brief?.objective || c.concept}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.brand || "CÚRADOR"}</span>
                    <span style={{ fontSize: 11, color: sc }}>View brief →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <div className="cmp-hdr">
        <div>
          <div className="cmp-hdr-lbl">Campaigns · {campaigns.length}</div>
          {campaigns.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
              {[["idea","var(--gold)"],["brief","#8b7fc0"],["approved","#4d9e8e"]].map(([s, c]) => counts[s] > 0 && (
                <span key={s} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: c + "18", color: c, border: `1px solid ${c}33`, letterSpacing: ".04em", textTransform: "uppercase" }}>
                  {counts[s]} {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-sm btn-gold" onClick={onNew}>+ New Brief</button>
      </div>
      {campaigns.length === 0 ? (
        <div className="cmp-empty">
          <span className="cmp-empty-icon">🚀</span>
          No campaigns yet.<br />
          <span style={{ fontSize: 11 }}>Generate an AI brief — it becomes an initiative card automatically.</span>
        </div>
      ) : (
        <div className="cmp-list">
          {campaigns.map(c => {
            const statusColors = { idea: "#c9a84c", brief: "#8b7fc0", approved: "#4d9e8e" };
            const sc = statusColors[c.status] || "var(--text-muted)";
            return (
              <div key={c.id} className="cmp-card" data-tag-type="Campaign" data-tag-label={c.title} data-tag-section="Campaigns" data-tag-brand={c.brand || ""} style={{ borderLeftColor: sc }} onClick={() => onSelect(c)}>
                <div className="cmp-card-top">
                  <div className="cmp-card-title">{c.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className={`cmp-status ${c.status}`}>{c.status}</div>
                    {onDelete && (
                      <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${c.title}"?`)) onDelete(c.id); }}
                        style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(224,123,106,.3)", background: "transparent", color: "#e07b6a", cursor: "pointer", lineHeight: 1 }}>✕</button>
                    )}
                  </div>
                </div>
                <div className="cmp-card-desc">{c.brief?.objective || c.concept}</div>
                <div className="cmp-card-foot">
                  <div className="cmp-card-brand">{c.brand || "Curador Brands"}</div>
                  <div className="cmp-card-arr">→</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM MEMBER MODAL
// ════════════════════════════════════════════════════════════════════════════
function TeamMemberModal({ member, currentUser, onClose, onUpdate, onDelete }) {
  const memberColor = member.color?.bg ? member.color : colorForName(member.name || "User");
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(member.name || "");
  const [title, setTitle] = useState(member.title || "");
  const [bio, setBio] = useState(member.bio || "");
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [skillsText, setSkillsText] = useState((member.skills || []).join("\n"));
  const [strengthsText, setStrengthsText] = useState((member.strengths || []).join("\n"));
  const [keyPointsText, setKeyPointsText] = useState((member.keyPoints || []).join("\n"));
  const isMe = currentUser?.name?.toLowerCase() === member.name?.toLowerCase();
  const canEditProfile = true; // everyone can edit any profile
  const [confirmDelete, setConfirmDelete] = useState(false);
  const roleLabel = ORG_ROLES.find(r => r.id === member.role)?.title || member.role || "Team Member";
  const displayTitle = member.title || roleLabel;

  const saveProfile = () => {
    onUpdate(member.name, {
      name: nameVal.trim() || member.name,
      title,
      bio,
      email,
      phone,
      skills: skillsText.split("\n").map(s => s.trim()).filter(Boolean),
      strengths: strengthsText.split("\n").map(s => s.trim()).filter(Boolean),
      keyPoints: keyPointsText.split("\n").map(s => s.trim()).filter(Boolean),
    });
    setEditing(false);
  };

  const hasContent = member.bio || member.title || member.email || member.phone || member.skills?.length || member.strengths?.length || member.keyPoints?.length;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mhdr" style={{ borderTop: `3px solid ${memberColor.bg}`, borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: memberColor.bg, color: memberColor.text, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, flexShrink: 0, boxShadow: `0 0 16px ${memberColor.bg}55` }}>{initials(member.name)}</div>
            <div>
              <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 400, color: "var(--text)" }}>{member.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{displayTitle}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {canEditProfile && !confirmDelete && (
              <button className="edit-toggle" onClick={() => setEditing(e => !e)}>
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            )}
            {!editing && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(224,123,106,.3)", background: "transparent", color: "#e07b6a", fontSize: 11, cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 500 }}>
                Delete
              </button>
            )}
            {confirmDelete && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#e07b6a" }}>Remove {member.name}?</span>
                <button onClick={() => { onDelete(member.name); onClose(); }} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "#e07b6a", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>
                  Confirm
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontFamily: "var(--bf)" }}>
                  Cancel
                </button>
              </div>
            )}
            <button className="mclose" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="mbody">
          {editing ? (
            /* ── EDIT MODE ── */
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="ff" style={{ gridColumn: "1/-1" }}>
                <label className="fl">Name</label>
                <input className="fi" value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="Display name" />
              </div>
              <div className="ff" style={{ gridColumn: "1/-1" }}>
                <label className="fl">Job Title</label>
                <input className="fi" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Creative Director, Brand Strategist…" />
              </div>
              <div className="ff" style={{ gridColumn: "1/-1" }}>
                <label className="fl">Short Bio</label>
                <textarea className="fta" value={bio} onChange={e => setBio(e.target.value)} placeholder="A brief intro — your background, focus, and what you bring to the team…" style={{ minHeight: 80 }} />
              </div>
              <div className="ff">
                <label className="fl">Email</label>
                <input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="ff">
                <label className="fl">Phone</label>
                <input className="fi" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="ff">
                <label className="fl">Skills (one per line)</label>
                <textarea className="fta" value={skillsText} onChange={e => setSkillsText(e.target.value)} placeholder="e.g. Brand Strategy&#10;Social Media&#10;Copywriting&#10;Analytics" style={{ minHeight: 100 }} />
              </div>
              <div className="ff">
                <label className="fl">Strengths (one per line)</label>
                <textarea className="fta" value={strengthsText} onChange={e => setStrengthsText(e.target.value)} placeholder="e.g. Creative direction&#10;Cross-brand consistency&#10;Team leadership" style={{ minHeight: 100 }} />
              </div>
              <div className="ff" style={{ gridColumn: "1/-1" }}>
                <label className="fl">Key Points (one per line)</label>
                <textarea className="fta" value={keyPointsText} onChange={e => setKeyPointsText(e.target.value)} placeholder="e.g. Leads Headchange rebrand&#10;5 years cannabis marketing&#10;Manages 3 dispensary accounts" style={{ minHeight: 80 }} />
              </div>
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <>
              {/* Bio */}
              {member.bio ? (
                <div className="tm-sec">
                  <div className="tm-lbl">About</div>
                  <div className="tm-bio">{member.bio}</div>
                </div>
              ) : isMe ? (
                <div style={{ padding: "10px 0 14px", color: "var(--text-muted)", fontSize: 12 }}>No bio yet — click <strong style={{ color: "var(--gold)" }}>Edit Profile</strong> to add yours.</div>
              ) : null}

              {/* Contact */}
              {(member.email || member.phone) && (
                <div className="tm-sec">
                  <div className="tm-lbl">Contact</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                    {member.email && (
                      <a href={`mailto:${member.email}`} style={{ fontSize: 12, color: "var(--text-dim)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>✉</span> {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} style={{ fontSize: 12, color: "var(--text-dim)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>☎</span> {member.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {(member.skills || []).length > 0 && (
                <div className="tm-sec">
                  <div className="tm-lbl">Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {member.skills.map((s, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 100, background: `${memberColor.bg}22`, border: `1px solid ${memberColor.bg}44`, color: "var(--text-dim)", fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {(member.strengths || []).length > 0 && (
                <div className="tm-sec">
                  <div className="tm-lbl">Strengths</div>
                  {member.strengths.map((s, i) => <div key={i} className="tm-str">{s}</div>)}
                </div>
              )}

              {/* Key Points */}
              {(member.keyPoints || []).length > 0 && (
                <div className="tm-sec">
                  <div className="tm-lbl">Key Points</div>
                  {member.keyPoints.map((k, i) => <div key={i} className="tm-kp">{k}</div>)}
                </div>
              )}

              {!hasContent && !isMe && (
                <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "16px 0", lineHeight: 1.75 }}>
                  This team member hasn't filled out their profile yet.
                </div>
              )}
            </>
          )}
        </div>

        {editing && (
          <div className="mfoot">
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={saveProfile}>Save Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CAMPAIGN MODAL — AI Brief Generator
// ════════════════════════════════════════════════════════════════════════════
function CampaignModal({ currentUser, pillars, onClose, onSave, onSaveAsInit, teamMembers }) {
  const [tab, setTab] = useState("write"); // "write" | "upload"
  const [concept, setConcept] = useState("");
  const [brand, setBrand] = useState("Headchange");
  const [objective, setObjective] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [team, setTeam] = useState([]);
  const [manualName, setManualName] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(null);
  const [err, setErr] = useState("");
  // Upload tab state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileData, setUploadFileData] = useState(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const fileRef = useRef();
  const ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp"];
  // Attached files
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [filesDragging, setFilesDragging] = useState(false);
  const attachRef = useRef();
  const FILE_ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp",".xls",".xlsx",".csv",".ppt",".pptx",".zip"];

  const addTeamMember = (name) => { if (!name.trim() || team.includes(name.trim())) return; setTeam(p => [...p, name.trim()]); };
  const removeTeamMember = (name) => setTeam(p => p.filter(n => n !== name));
  const handleAttachFiles = async (fileList) => {
    for (const file of Array.from(fileList)) {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!FILE_ACCEPTED.some(a => ext === a)) continue;
      const data = await new Promise((res) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      setAttachedFiles(p => [...p, { name: file.name, type: file.type, size: file.size, data }]);
    }
  };

  const readUploadFile = (f) => {
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.some(a => ext === a)) { setErr("Unsupported file. Try PDF, Word, image, or text."); return; }
    setUploadFile(f); setErr(""); setBrief(null);
    const reader = new FileReader();
    reader.onload = e => setUploadFileData(e.target.result);
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    if (!concept.trim()) return;
    setLoading(true); setBrief(null); setErr("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a senior cannabis marketing strategist for Curador Brands (brands: Headchange, Bubbles, Safebet) operating in Missouri. Generate campaign briefs in valid JSON only, no markdown or preamble. Return exactly: {"title":"...","objective":"...","targetAudience":"...","keyMessages":["...","...","..."],"channels":["...","...","..."],"timeline":"...","estimatedBudget":"...","kpis":["...","...","..."],"description":"..."}`,
          messages: [{ role: "user", content: `Campaign concept: ${concept}. Primary brand: ${brand}. Core objective: ${objective || "drive brand awareness and sales"}. Make it specific to Missouri cannabis market.` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setBrief(JSON.parse(clean));
    } catch (e) { setErr("Couldn't generate brief. Check your connection and try again."); }
    setLoading(false);
  };

  const parseBriefFile = async () => {
    if (!uploadFile || !uploadFileData) return;
    setLoading(true); setErr("");
    try {
      const ext = uploadFile.name.split(".").pop().toLowerCase();
      const isImage = ["png","jpg","jpeg","webp"].includes(ext);
      const isText = ["txt","md"].includes(ext);
      const base64 = uploadFileData.split(",")[1];
      const mediaType = uploadFile.type || (ext === "pdf" ? "application/pdf" : isImage ? `image/${ext}` : "text/plain");
      let msgContent;
      if (isText) {
        msgContent = [{ type: "text", text: `Marketing brief document:\n\n${atob(base64)}\n\nExtract the key information.` }];
      } else if (isImage) {
        msgContent = [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "This is a marketing brief. Extract the key information." }];
      } else {
        msgContent = [{ type: "document", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "This is a marketing brief. Extract the key information." }];
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a senior cannabis marketing strategist for Curador Brands operating in Missouri. Extract the brief details and return ONLY valid JSON, no markdown: {"title":"...","objective":"...","targetAudience":"...","keyMessages":["..."],"channels":["..."],"timeline":"...","estimatedBudget":"...","kpis":["..."],"description":"..."}. Use sensible defaults for any missing fields.`,
          messages: [{ role: "user", content: msgContent }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      setBrief(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (e) { setErr("Couldn't parse the brief — try a clearer PDF or a different file."); }
    setLoading(false);
  };

  const saveCampaign = (status = "idea") => {
    const c = { id: `cmp-${Date.now()}`, title: brief?.title || concept || uploadFile?.name || "Untitled", concept, brand, objective, brief, status, createdBy: currentUser?.name || "Team", createdAt: new Date().toISOString(), _briefFile: uploadFile?.name || null, _briefFileData: uploadFileData || null, _briefFileType: uploadFile?.type || null, startDate: startDate || null, endDate: endDate || null, team, _attachedFiles: attachedFiles };
    onSave(c);
  };

  const tabStyle = (t) => ({
    padding: "7px 18px", fontSize: 12, fontWeight: 500, borderRadius: 7, border: "none", cursor: "pointer",
    background: tab === t ? "rgba(201,168,76,.12)" : "transparent",
    color: tab === t ? "var(--gold)" : "var(--text-muted)",
    transition: "all .15s",
  });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal xwide" onClick={e => e.stopPropagation()}>
        <div className="mhdr">
          <div><div className="mtitle">New Campaign Brief</div><div className="msub">Write a concept or upload an existing brief</div></div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          {!brief && (
            <div style={{ display: "flex", gap: 4, marginBottom: 18, padding: "4px", background: "var(--surface2)", borderRadius: 10, width: "fit-content" }}>
              <button style={tabStyle("write")} onClick={() => { setTab("write"); setErr(""); }}>✦ Write Concept</button>
              <button style={tabStyle("upload")} onClick={() => { setTab("upload"); setErr(""); }}>↑ Upload Brief</button>
            </div>
          )}
          {!brief ? (
            tab === "write" ? (
              <>
                <div className="ff"><label className="fl">Campaign Concept *</label><textarea className="fta" style={{ minHeight: 88 }} placeholder="e.g. A terpene education series targeting dispensary budtenders — educational content that positions Headchange as the craft authority..." value={concept} onChange={e => setConcept(e.target.value)} /></div>
                <div className="frow">
                  <div className="ff">
                    <label className="fl">Primary Brand</label>
                    <select className="fsel" value={brand} onChange={e => setBrand(e.target.value)}>
                      {["Headchange", "Bubbles", "Safebet", "All Brands"].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="ff"><label className="fl">Core Objective</label><input className="fi" placeholder="e.g. Increase brand awareness" value={objective} onChange={e => setObjective(e.target.value)} /></div>
                </div>
              </>
            ) : (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                  onDragLeave={() => setUploadDragging(false)}
                  onDrop={e => { e.preventDefault(); setUploadDragging(false); readUploadFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${uploadDragging ? "var(--gold)" : "var(--border2)"}`, borderRadius: 12, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all .15s", background: uploadDragging ? "rgba(201,168,76,.04)" : "var(--surface2)", marginBottom: 12 }}>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" style={{ display: "none" }} onChange={e => readUploadFile(e.target.files[0])} />
                  {uploadFile ? (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{uploadFile.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{(uploadFile.size / 1024).toFixed(0)} KB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 8, opacity: .4 }}>📎</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Drop a brief here or click to browse</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, opacity: .7 }}>PDF · Word · Image · Text</div>
                    </div>
                  )}
                </div>
                <div className="frow">
                  <div className="ff">
                    <label className="fl">Primary Brand</label>
                    <select className="fsel" value={brand} onChange={e => setBrand(e.target.value)}>
                      {["Headchange", "Bubbles", "Safebet", "All Brands"].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )
          ) : (
            <BriefDisplay brief={brief} />
          )}
          {/* Dates, Team, Files — shared across both tabs */}
          {!brief && (
            <>
              <div style={{ borderTop: "1px solid var(--border2)", marginTop: 16, paddingTop: 16 }}>
                <div className="frow">
                  <div className="ff"><label className="fl">Start Date</label><input className="fi" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div className="ff"><label className="fl">End Date</label><input className="fi" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>
                <div className="ff">
                  <label className="fl">Team</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    {team.map(name => (
                      <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", fontSize: 11, color: "var(--gold)" }}>
                        {name}
                        <span onClick={() => removeTeamMember(name)} style={{ cursor: "pointer", opacity: .6, fontSize: 13, lineHeight: 1 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(teamMembers || []).length > 0 && (
                      <select className="fsel" value="" onChange={e => { if (e.target.value) { addTeamMember(e.target.value); e.target.value = ""; } }} style={{ flex: 1 }}>
                        <option value="">Select team member...</option>
                        {(teamMembers || []).filter(m => !team.includes(m.name)).map(m => <option key={m.name} value={m.name}>{m.name}{m.role ? ` — ${m.role}` : ""}</option>)}
                      </select>
                    )}
                    <div style={{ display: "flex", gap: 4, flex: 1 }}>
                      <input className="fi" placeholder="Add name manually" value={manualName} onChange={e => setManualName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { addTeamMember(manualName); setManualName(""); } }}
                        style={{ flex: 1 }} />
                      <button type="button" className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", flexShrink: 0 }}
                        onClick={() => { addTeamMember(manualName); setManualName(""); }}>+</button>
                    </div>
                  </div>
                </div>
                <div className="ff">
                  <label className="fl">Supporting Files</label>
                  <div className={`bu-zone ${filesDragging ? "drag" : ""}`}
                    style={{ minHeight: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px" }}
                    onDragOver={e => { e.preventDefault(); setFilesDragging(true); }}
                    onDragLeave={() => setFilesDragging(false)}
                    onDrop={e => { e.preventDefault(); setFilesDragging(false); handleAttachFiles(e.dataTransfer.files); }}
                    onClick={() => attachRef.current.click()}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Drop files or click to attach</div>
                    <input ref={attachRef} type="file" accept={FILE_ACCEPTED.join(",")} multiple style={{ display: "none" }} onChange={e => handleAttachFiles(e.target.files)} />
                  </div>
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                      {attachedFiles.map((af, i) => (
                        <div key={i} className="bu-file-row">
                          <span style={{ fontSize: 14 }}>{af.type?.startsWith("image/") ? "🖼" : "📄"}</span>
                          <div className="bu-file-name">{af.name}</div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{(af.size / 1024).toFixed(0)} KB</span>
                          <button className="bu-file-rm" onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {loading && <div className="ai-loading"><div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" /><span>{tab === "upload" ? "Reading brief…" : "Generating brief…"}</span></div>}
          {err && <div style={{ padding: "10px 12px", background: "rgba(224,123,106,.08)", border: "1px solid rgba(224,123,106,.2)", borderRadius: 8, fontSize: 12, color: "#e07b6a", marginTop: 8 }}>{err}</div>}
        </div>
        <div className="mfoot">
          {!brief ? (
            tab === "write" ? (
              <><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-gold" disabled={!concept.trim() || loading} onClick={generate}>✦ Generate Brief</button></>
            ) : (
              <><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-gold" disabled={!uploadFile || loading} onClick={parseBriefFile}>✦ Parse Brief</button></>
            )
          ) : (
            <><button className="btn" onClick={() => { setBrief(null); setUploadFile(null); setUploadFileData(null); }}>← Back</button><button className="btn" onClick={() => saveCampaign("brief")}>Save as Brief</button><button className="btn btn-gold" onClick={() => saveCampaign("approved")}>Save & Approve</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignDetailModal({ campaign, pillars, onClose, onSaveAsInit, onNote, onViewConcept, campaignHtml, onHtmlAttach }) {
  const [pillar, setPillar] = useState(pillars[0] || "");
  const [quarter, setQuarter] = useState("Q2 2026");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showFile, setShowFile] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const htmlInputRef = useRef(null);
  const submitNote = () => { if (onNote && noteText.trim()) { onNote({ section:"Campaigns", type:"Campaign", label:campaign.title, id:campaign.id, prefill:noteText.trim() }); setNoteText(""); setNoteOpen(false); } };
  const handleHtmlFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (onHtmlAttach) onHtmlAttach(campaign.id, ev.target.result, file.name); setShowHtml(true); };
    reader.readAsText(file);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal xwide" onClick={e => e.stopPropagation()}>
        <div className="mhdr">
          <div>
            <div className="mtitle">{campaign.title}</div>
            <div className="msub">{campaign.brand} · Created by {campaign.createdBy}</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {onViewConcept && <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={onViewConcept}>🎨 View Concept</button>}
            {campaignHtml && <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={() => setShowHtml(o => !o)}>{showHtml ? "Hide HTML" : "📄 View HTML"}</button>}
            {campaignHtml && <button className="btn btn-sm" onClick={() => { const url = URL.createObjectURL(new Blob([campaignHtml], { type: "text/html" })); window.open(url, "_blank", "noopener,noreferrer"); }}>↗ Full Screen</button>}
            {onHtmlAttach && <button className="btn btn-sm" onClick={() => htmlInputRef.current?.click()}>📎 {campaign._htmlName ? "Replace HTML" : "Attach HTML"}</button>}
            <input ref={htmlInputRef} type="file" accept=".html,text/html" style={{ display:"none" }} onChange={handleHtmlFile} />
            <button className="btn btn-sm" onClick={() => setNoteOpen(o => !o)} style={{ borderColor: noteOpen ? "var(--gold)":"var(--border)", color: noteOpen ? "var(--gold)":"var(--text-muted)" }}>✎ Note</button>
            <button className="mclose" onClick={onClose}>×</button>
          </div>
        </div>
        {noteOpen && (
          <div style={{ padding:"12px 24px", borderBottom:"1px solid var(--border)", background:"rgba(201,168,76,.03)" }}>
            <div style={{ fontSize:10, color:"var(--gold)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6, fontWeight:600 }}>
              Note on: <span style={{ color:"var(--text)" }}>{campaign.title}</span>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) submitNote(); }}
                placeholder="Add your note here… (⌘↵ to post)"
                style={{ flex:1, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 11px", color:"var(--text)", fontFamily:"var(--bf)", fontSize:13, lineHeight:1.6, resize:"none", outline:"none", minHeight:64, transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor="rgba(201,168,76,.35)"}
                onBlur={e => e.target.style.borderColor="var(--border)"} />
              <button onClick={submitNote} disabled={!noteText.trim()} style={{ alignSelf:"flex-end", padding:"6px 14px", borderRadius:7, border:"none", background:"var(--gold)", color:"var(--bg)", fontFamily:"var(--bf)", fontSize:11, fontWeight:600, cursor:"pointer", opacity:noteText.trim()?1:.4 }}>Post →</button>
            </div>
          </div>
        )}
        <div className="mbody">
          {campaign.brief ? (
            <>
              <BriefDisplay brief={campaign.brief} />
              {campaign._briefFile && campaign._briefFileData && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)" }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--text-dim)" }}>{campaign._briefFile}</div>
                  <button className="btn btn-sm" onClick={() => setShowFile(!showFile)}>{showFile ? "Hide File" : "View File"}</button>
                </div>
              )}
              {showFile && campaign._briefFileData && (
                <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", height: 400 }}>
                  {(campaign._briefFileType || "").startsWith("image/") ? (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)" }}>
                      <img src={campaign._briefFileData} alt={campaign._briefFile} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (campaign._briefFileType || "").includes("pdf") ? (
                    <iframe src={campaign._briefFileData} title={campaign._briefFile} style={{ width: "100%", height: "100%", border: "none" }} />
                  ) : (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 13 }}>Preview not available</div>
                      <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { const a = document.createElement("a"); a.href = campaign._briefFileData; a.download = campaign._briefFile; a.click(); }}>↓ Download</button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>
              {campaign.concept && (
                <div className="brief-sec"><div className="brief-lbl">Concept</div><div className="brief-val" style={{ fontSize: 13, lineHeight: 1.75 }}>{campaign.concept}</div></div>
              )}
              {campaign.objective && (
                <div className="brief-sec"><div className="brief-lbl">Objective</div><div className="brief-val">{campaign.objective}</div></div>
              )}
              {campaign._briefFile && (
                <div className="brief-sec">
                  <div className="brief-lbl">Attached File</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)", marginTop: 4 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{campaign._briefFile}</div>
                    {campaign._briefFileData && (
                      <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}
                        onClick={() => setShowFile(!showFile)}>{showFile ? "Hide File" : "View File"}</button>
                    )}
                  </div>
                  {showFile && campaign._briefFileData && (
                    <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", height: 400 }}>
                      {(campaign._briefFileType || "").startsWith("image/") ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)" }}>
                          <img src={campaign._briefFileData} alt={campaign._briefFile} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        </div>
                      ) : (campaign._briefFileType || "").includes("pdf") ? (
                        <iframe src={campaign._briefFileData} title={campaign._briefFile} style={{ width: "100%", height: "100%", border: "none" }} />
                      ) : (
                        <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                          <div style={{ fontSize: 13 }}>Preview not available</div>
                          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => { const a = document.createElement("a"); a.href = campaign._briefFileData; a.download = campaign._briefFile; a.click(); }}>↓ Download</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {campaignHtml && (
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => setShowHtml(o => !o)}
                    style={{ width: "100%", padding: "16px 20px", borderRadius: 10, border: `1px solid ${showHtml ? "rgba(201,168,76,.5)" : "rgba(201,168,76,.25)"}`, background: showHtml ? "rgba(201,168,76,.12)" : "rgba(201,168,76,.06)", color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontSize: 14, fontWeight: 600, letterSpacing: ".04em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,.16)"; e.currentTarget.style.borderColor = "rgba(201,168,76,.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = showHtml ? "rgba(201,168,76,.12)" : "rgba(201,168,76,.06)"; e.currentTarget.style.borderColor = showHtml ? "rgba(201,168,76,.5)" : "rgba(201,168,76,.25)"; }}
                  >
                    <span style={{ fontSize: 18 }}>📄</span>
                    <span>{showHtml ? "Hide HTML Preview" : "View HTML Concept"}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, opacity: .6 }}>{showHtml ? "▲" : "▼"}</span>
                  </button>
                </div>
              )}
              {!campaign.concept && !campaign._briefFile && !campaignHtml && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", padding: "16px 0" }}>No details yet for this campaign.</div>
              )}
            </div>
          )}
          {campaign.brief && campaign.status !== "approved" && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border2)" }}>
              <div className="fl" style={{ marginBottom: 10 }}>Save as Initiative</div>
              <div className="frow">
                <div className="ff">
                  <label className="fl">Pillar</label>
                  <select className="fsel" value={pillar} onChange={e => setPillar(e.target.value)}>{pillars.map(p => <option key={p}>{p}</option>)}</select>
                </div>
                <div className="ff">
                  <label className="fl">Quarter</label>
                  <select className="fsel" value={quarter} onChange={e => setQuarter(e.target.value)}>{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>
                </div>
              </div>
            </div>
          )}
          {showHtml && campaignHtml && (
            <div style={{ marginTop: 16, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", height: 520 }}>
              <iframe srcDoc={campaignHtml} title={campaign._htmlName || campaign.title} sandbox="allow-scripts allow-forms" style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} />
            </div>
          )}
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Close</button>
          {campaign.brief && campaign.status !== "approved" && (
            <button className="btn btn-gold" onClick={() => onSaveAsInit({ id: `init-${Date.now()}`, title: campaign.brief.title, description: campaign.brief.description, owner: campaign.createdBy, pillar, quarter, fileUrl: null, fileName: null, _brief: campaign.brief })}>
              → Save as Initiative
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BriefDisplay({ brief }) {
  return (
    <>
      {brief.objective && <div className="brief-sec"><div className="brief-lbl">Objective</div><div className="brief-val">{brief.objective}</div></div>}
      {brief.targetAudience && <div className="brief-sec"><div className="brief-lbl">Target Audience</div><div className="brief-val">{brief.targetAudience}</div></div>}
      {brief.description && <div className="brief-sec"><div className="brief-lbl">Campaign Overview</div><div className="brief-val">{brief.description}</div></div>}
      {/* Key Points — shown prominently when present */}
      {brief.keyPoints && brief.keyPoints.length > 0 && (
        <div className="brief-sec" style={{ borderColor: "rgba(201,168,76,.2)", background: "rgba(201,168,76,.04)" }}>
          <div className="brief-lbl" style={{ color: "var(--gold)" }}>Key Points</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
            {brief.keyPoints.map((pt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--gold)", flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(brief.keyMessages || []).length > 0 && <div className="brief-sec"><div className="brief-lbl">Key Messages</div><div className="brief-chips">{(brief.keyMessages || []).map((m, i) => <span key={i} className="brief-chip">{m}</span>)}</div></div>}
      {(brief.channels || []).length > 0 && <div className="brief-sec"><div className="brief-lbl">Channels</div><div className="brief-chips">{(brief.channels || []).map((c, i) => <span key={i} className="brief-chip">{c}</span>)}</div></div>}
      {(brief.timeline || brief.estimatedBudget) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {brief.timeline && <div className="brief-sec"><div className="brief-lbl">Timeline</div><div className="brief-val">{brief.timeline}</div></div>}
          {brief.estimatedBudget && <div className="brief-sec"><div className="brief-lbl">Est. Budget</div><div className="brief-val">{brief.estimatedBudget}</div></div>}
        </div>
      )}
      {(brief.kpis || []).length > 0 && <div className="brief-sec"><div className="brief-lbl">KPIs</div><div className="brief-chips">{(brief.kpis || []).map((k, i) => <span key={i} className="brief-chip" style={{ background: "rgba(77,158,142,.08)", color: "#4d9e8e", borderColor: "rgba(77,158,142,.15)" }}>{k}</span>)}</div></div>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WHO ARE YOU MODAL
// ════════════════════════════════════════════════════════════════════════════
function WhoModal({ whoName, setWhoName, whoRole, setWhoRole, onSave, orgRoles, teamMembers }) {
  const [mode, setMode] = useState((teamMembers || []).length > 0 ? "select" : "create"); // "select" | "create"
  const preview = whoName.trim() ? colorForName(whoName.trim()) : null;
  const roles = orgRoles?.length ? orgRoles : ORG_ROLES;
  const existingMembers = teamMembers || [];

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  return (
    <div className="overlay" style={{ overflow: "hidden" }}>
      <div className="modal" style={{ maxWidth: 480, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div className="who-inner" style={{ overflowY: "auto", flex: 1, padding: "24px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            {preview && mode === "create" ? (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: preview.bg, color: preview.text, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, margin: "0 auto 12px" }}>{initials(whoName.trim())}</div>
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 22, margin: "0 auto 12px", opacity: .4 }}>👤</div>
            )}
            <div className="who-title">Who are you?</div>
            <div className="who-sub">Select your profile or create a new one.</div>
          </div>

          {/* Toggle between select existing / create new */}
          {existingMembers.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: 4, background: "var(--surface2)", borderRadius: 10, width: "fit-content" }}>
              <button onClick={() => setMode("select")} style={{ padding: "7px 16px", fontSize: 12, fontWeight: 500, borderRadius: 7, border: "none", cursor: "pointer", background: mode === "select" ? "rgba(201,168,76,.12)" : "transparent", color: mode === "select" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", transition: "all .15s" }}>Select Existing</button>
              <button onClick={() => setMode("create")} style={{ padding: "7px 16px", fontSize: 12, fontWeight: 500, borderRadius: 7, border: "none", cursor: "pointer", background: mode === "create" ? "rgba(201,168,76,.12)" : "transparent", color: mode === "create" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", transition: "all .15s" }}>Create New</button>
            </div>
          )}

          {mode === "select" && existingMembers.length > 0 ? (
            <>
              <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Select your profile</div>
              <div style={{ display: "grid", gap: 6, maxHeight: "50vh", overflowY: "auto", marginBottom: 12 }}>
                {existingMembers.map(m => {
                  const c = m.color?.bg ? m.color : colorForName(m.name);
                  const selected = whoName === m.name;
                  return (
                    <button key={m.name} onClick={() => { setWhoName(m.name); setWhoRole(m.role || "content"); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: `1px solid ${selected ? "var(--gold)" : "var(--border)"}`, background: selected ? "var(--gold-dim)" : "var(--surface2)", cursor: "pointer", textAlign: "left", transition: "all .13s" }}
                      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; }}
                      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "var(--border)"; }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.bg, color: c.text, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials(m.name)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? "var(--gold)" : "var(--text)" }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.title || roles.find(r => r.id === m.role)?.title || "Team Member"}</div>
                      </div>
                      {selected && <span style={{ marginLeft: "auto", fontSize: 14, color: "var(--gold)" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="ff">
                <label className="fl">Your Name</label>
                <input className="fi" placeholder="e.g. Jordan Lee" value={whoName}
                  onChange={e => setWhoName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && whoName.trim()) onSave(whoName.trim(), whoRole); }}
                  autoFocus />
              </div>

              <div className="ff">
                <label className="fl">Your Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 220, overflowY: "auto", padding: "2px 0" }}>
                  {roles.map(r => (
                    <button key={r.id}
                      onClick={() => setWhoRole(r.id)}
                      style={{
                        padding: "9px 12px", borderRadius: 8, border: `1px solid ${whoRole === r.id ? "var(--gold)" : "var(--border)"}`,
                        background: whoRole === r.id ? "var(--gold-dim)" : "var(--surface2)",
                        color: whoRole === r.id ? "var(--gold)" : "var(--text-muted)",
                        fontFamily: "var(--bf)", fontSize: 12, cursor: "pointer", textAlign: "left",
                        fontWeight: whoRole === r.id ? 600 : 400, transition: "all .13s",
                      }}
                      onMouseEnter={e => { if (whoRole !== r.id) e.currentTarget.style.borderColor = "rgba(255,255,255,.15)"; }}
                      onMouseLeave={e => { if (whoRole !== r.id) e.currentTarget.style.borderColor = "var(--border)"; }}
                    >{r.title}</button>
                  ))}
                </div>
              </div>

              {preview && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, marginBottom: 4 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: preview.bg, color: preview.text, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700 }}>{initials(whoName.trim())}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    You'll appear as <strong style={{ color: "var(--text)" }}>{whoName.trim()}</strong> in <strong style={{ color: preview.label.toLowerCase() }}>{preview.label}</strong>
                    {whoRole && <span> · <strong style={{ color: "var(--text)" }}>{roles.find(r => r.id === whoRole)?.title}</strong></span>}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
        {/* Fixed footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", flexShrink: 0, background: "var(--surface)" }}>
          <button className="btn btn-gold" disabled={!whoName.trim()} onClick={() => onSave(whoName.trim(), whoRole)}>
            {mode === "select" ? `Continue as ${whoName || "..."} →` : "Create Profile →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// INITIATIVE → CAMPAIGN MODAL
// ════════════════════════════════════════════════════════════════════════════
const CAMPAIGN_STATUSES = ["idea","brief","in-progress","review","approved","live"];

function getDefaultElements(channel) {
  const ch = (channel || "").toLowerCase();
  const ts = Date.now();
  if (ch.includes("social")) return [
    { label: "Content Creation", startDate: "", endDate: "", cost: "" },
    { label: "Scheduling & Posting", startDate: "", endDate: "", cost: "" },
  ];
  if (ch.includes("email") || ch.includes("sms")) return [
    { label: "Copywriting & Design", startDate: "", endDate: "", cost: "" },
    { label: "List Preparation", startDate: "", endDate: "", cost: "" },
    { label: "Send Date", startDate: "", endDate: "", cost: "" },
  ];
  if (ch.includes("event")) return [
    { label: "Venue & Logistics", startDate: "", endDate: "", cost: "" },
    { label: "Promotion", startDate: "", endDate: "", cost: "" },
    { label: "Day-Of Execution", startDate: "", endDate: "", cost: "" },
  ];
  if (ch.includes("packaging") || ch.includes("merch")) return [
    { label: "Design & Approval", startDate: "", endDate: "", cost: "" },
    { label: "Production Lead Time", startDate: "", endDate: "", cost: "" },
    { label: "Delivery & Launch", startDate: "", endDate: "", cost: "" },
  ];
  if (ch.includes("loyalty") || ch.includes("reward")) return [
    { label: "Program Design", startDate: "", endDate: "", cost: "" },
    { label: "Partner Outreach", startDate: "", endDate: "", cost: "" },
    { label: "Launch & Promotion", startDate: "", endDate: "", cost: "" },
  ];
  if (ch.includes("pr") || ch.includes("field")) return [
    { label: "Outreach & Pitching", startDate: "", endDate: "", cost: "" },
    { label: "Activation", startDate: "", endDate: "", cost: "" },
  ];
  if (ch.includes("budtender") || ch.includes("store") || ch.includes("in-store")) return [
    { label: "Training Materials", startDate: "", endDate: "", cost: "" },
    { label: "Rep Visits / Execution", startDate: "", endDate: "", cost: "" },
    { label: "Follow-Up & Recap", startDate: "", endDate: "", cost: "" },
  ];
  return [
    { label: "Brief & Planning", startDate: "", endDate: "", cost: "" },
    { label: "Production", startDate: "", endDate: "", cost: "" },
    { label: "Launch", startDate: "", endDate: "", cost: "" },
  ];
}

function InitiativeToCampaignModal({ init, brands, onClose, onSave }) {
  const brandList = Object.values(brands || {});
  const initBrand = brandList.find(b => b.id === init.brandId) || brandList[0] || null;

  const [title, setTitle] = useState(init.title || "");
  const [brand, setBrand] = useState(initBrand?.name || "CÚRADOR");
  const [status, setStatus] = useState("brief");
  const [concept, setConcept] = useState(init.description || "");
  const [startDate, setStartDate] = useState(init.startDate || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(init.endDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
  const [cost, setCost] = useState("");
  const [elements, setElements] = useState(() => getDefaultElements(init.channel));

  const updateEl = (i, patch) => setElements(p => p.map((el, idx) => idx === i ? { ...el, ...patch } : el));
  const removeEl = (i) => setElements(p => p.filter((_, idx) => idx !== i));
  const addEl = () => setElements(p => [...p, { label: "Custom Element", startDate, endDate, cost: "" }]);

  const LBL = { fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5, display: "block" };
  const INP = { width: "100%", padding: "8px 11px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", boxSizing: "border-box" };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--gold)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Create Campaign from Initiative</div>
            <div className="mtitle">{init.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{init.channel}</div>
          </div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="mbody" style={{ overflowY: "auto", flex: 1 }}>
          {/* Campaign Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>Campaign Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Campaign name…" autoFocus style={INP} />
          </div>

          {/* Brand + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={LBL}>Brand</label>
              <select value={brand} onChange={e => setBrand(e.target.value)} style={INP}>
                <option value="CÚRADOR">CÚRADOR</option>
                {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={INP}>
                {CAMPAIGN_STATUSES.map(s => <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          {/* Concept / Summary */}
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>Concept / Summary</label>
            <textarea value={concept} onChange={e => setConcept(e.target.value)} rows={3} placeholder="Auto-summarized from initiative — edit as needed…" style={{ ...INP, resize: "vertical", lineHeight: 1.65 }} />
          </div>

          {/* Dates + Budget */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={LBL}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={INP} />
            </div>
            <div>
              <label style={LBL}>Campaign Budget</label>
              <input value={cost} onChange={e => setCost(e.target.value)} placeholder="$0" style={{ ...INP, color: "var(--gold)", fontWeight: 600 }} />
            </div>
          </div>

          {/* Timeline Sub-Elements */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Timeline Components</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Auto-suggested from pillar — edit labels, dates, and budgets. These become sub-elements on the campaign timeline.</div>
              </div>
              <button onClick={addEl} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 6, border: "1px dashed rgba(201,168,76,.3)", background: "transparent", color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>+ Add Element</button>
            </div>

            {elements.map((el, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 90px 28px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input value={el.label} onChange={e => updateEl(i, { label: e.target.value })} placeholder="Element name…"
                  style={{ ...INP, padding: "6px 10px" }} />
                <input type="date" value={el.startDate} onChange={e => updateEl(i, { startDate: e.target.value })}
                  style={{ ...INP, padding: "6px 8px", fontSize: 11 }} />
                <input type="date" value={el.endDate} onChange={e => updateEl(i, { endDate: e.target.value })}
                  style={{ ...INP, padding: "6px 8px", fontSize: 11 }} />
                <input value={el.cost} onChange={e => updateEl(i, { cost: e.target.value })} placeholder="$0"
                  style={{ ...INP, padding: "6px 8px", color: "var(--gold)", fontWeight: 600, fontSize: 11 }} />
                <button onClick={() => removeEl(i)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(224,123,106,.25)", background: "transparent", color: "#e07b6a", cursor: "pointer", fontSize: 13, display: "grid", placeItems: "center" }}>×</button>
              </div>
            ))}
            {elements.length === 0 && (
              <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--text-muted)" }}>No sub-elements yet — click + Add Element to build out the timeline</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), brand, status, concept: concept.trim(), startDate, endDate, cost, elements, createdBy: "Team" })}
            style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: title.trim() ? "linear-gradient(135deg,#c9a84c,#a07030)" : "rgba(255,255,255,.06)", color: title.trim() ? "#07070f" : "var(--text-muted)", fontFamily: "var(--bf)", fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: title.trim() ? "pointer" : "not-allowed" }}>
            🚀 Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MISSOURI CANNABIS COMPLIANCE KNOWLEDGE BASE
// Sourced from: 19 CSR 100-1 Admin Rules, Article XIV Sec 1 & 2 (MO Constitution),
// DCR Adult Use FAQs, DCR General FAQs, Final Rules July 2023, Emergency Rules Jan 2023
// Last compiled: April 2, 2026
// ════════════════════════════════════════════════════════════════════════════
const MO_CANNABIS_COMPLIANCE_KB = `
# Missouri Cannabis Compliance Reference — CÚRADOR Brands
*Source: 19 CSR 100-1, Article XIV MO Constitution Sec 1 & 2, DCR General FAQs, DCR Adult Use FAQs, Final Rules July 2023*

## LEGAL FRAMEWORK
- Adult-use marijuana legal for consumers 21+ as of December 8, 2022 (Amendment 3, Article XIV Section 2)
- Medical marijuana legal under Article XIV Section 1 (effective 2018, amended 2022)
- Regulated by Missouri Dept of Health & Senior Services (DHSS), Division of Cannabis Regulation (DCR)
- DCR Contact: Cannabisinfo@health.mo.gov | 866-219-0165 | cannabis.mo.gov | PO Box 570, Jefferson City, MO 65102
- Call center hours: 9am–4pm CST Mon–Fri (closed last Friday of each month 9–10am for staff meeting)
- 2026 Rule Updates (approved March 2026): ownership review moved pre-issuance; fines up to $100,000; product recall procedures for unregulated THC; microbusiness license transfer pathway

## PROGRAM TIMELINE (Key Dates)
- November 8, 2022: Citizens voted on Amendment 3 ballot measure
- December 8, 2022: Patient/caregiver allotment increased to 6oz/month; adult-use possession legal; license conversion applications accepted
- February 3, 2023: First comprehensive licenses approved; adult-use sales began
- February 6, 2023: Consumer personal cultivation applications accepted
- May 3, 2023: Mandatory patient/caregiver ID scanning at point of sale took effect
- June 1, 2023: Microbusiness license application forms posted
- July 27 – August 10, 2023: First round of microbusiness applications accepted
- October 2, 2023: 48 microbusiness facility licenses issued

## ADVERTISING & MARKETING (Article XIV Sec 2.4(n); Sec 1.3(2)(g))
- Advertising regulations SHALL BE NO MORE STRINGENT than comparable state alcohol advertising rules
- Age-gated accounts required — no public-facing cannabis content accessible to under-21
- No claims of health benefits, therapeutic effects, or medical use in marketing materials
- Geo-targeting required to restrict reach to legal states (adults 21+)
- Influencer partnerships require proper disclosure (#ad, #sponsored per FTC guidelines)
- No depictions of consumption in public or non-licensed spaces
- All posts/ads must include standard legal disclaimer
- Cannot advertise in media primarily directed at persons under 21
- Sponsorship of health or not-for-profit charity/advocacy events is permitted
- Business directory listings and marijuana-related publications are permitted
- Local governments may have additional advertising restrictions — verify by market

## PACKAGING & LABELING (Article XIV Sec 2.4(4)(c)(d)(e); 19 CSR 100-1)
- All packaging must include state-mandated health & safety warnings
- Packaging SHALL NOT be made attractive to children (no cartoon characters, bright colors targeting minors, candy-like designs)
- Child-resistant AND tamper-evident closures required on ALL products
- Packaging must be resealable and child-resistant
- Required label elements:
  • Net weight of product
  • THC content (total THC in mg, cannabidiol/CBD content)
  • THC and cannabinoid amount in milligrams PER SERVING
  • Number of servings per package
  • Batch/lot number
  • Licensed testing lab name
  • Dispensary license number on final retail label
  • Active and inactive ingredients
  • Dosage amounts and instructions for use
  • Quantity limits per sale (possession compliance)
- No unverified, unapproved health or medical claims on packaging
- Marijuana testing facility must certify all products before sale
- Products must not contain contaminants injurious to health (lab tested)
- For edibles: the possession-relevant number is total THC in mg on the label — NOT the package weight or design number

## EVENTS & ACTIVATIONS
- Valid event permit required before any public activation
- Age verification (21+) mandatory at ALL entry points — valid government-issued photo ID
- Acceptable IDs (consumers): MO driver's license, MO ID card, valid/expired undamaged US passport (book or card), US military or military dependent ID, valid non-MO driver's license
- Acceptable IDs (patients/caregivers): Same as above plus government employee ID (city, county, state, or federal); passport must NOT be expired for patients/caregivers
- No cannabis consumption at non-licensed event venues (public consumption prohibited unless local government designates area)
- No free product giveaways or sampling at unlicensed events (no dispensing outside licensed facility)
- Brand ambassador compliance training required prior to event
- All signage must include standard state health warning
- Cannot hold events at schools, school buses, correctional facilities, or places where tobacco is prohibited
- Local governments may allow designated public consumption areas — verify locally
- No events targeting or accessible to persons under 21

## IN-STORE & DISPENSARY COMPLIANCE (19 CSR 100-1.180)
- All display materials must be pre-approved by compliance team
- No promotional pricing that violates state tier regulations
- Budtender talking points must align with approved product claims ONLY — no unverified health/medical claims
- Agents must be trained on differences in strains, effects, and methods of use (19 CSR 100-1.080(1)(H)2)
- Dispensaries must make educational materials available to all customers about potential risks and side effects (19 CSR 100-1.180(2)(H)2) — no requirement to actively educate or notify DCR about customer purchases
- No unverified health, medical, or therapeutic claims in any in-store materials
- Product placement must comply with dispensary partnership agreements
- Photo/video of product in-store requires prior written consent
- Consumer age verification: valid government-issued photo ID showing 21+ required for every sale
- Patient ID card holders must have IDs scanned at point of sale (required since May 3, 2023)
- Must record every sale against patient's 30-day allotment in statewide track-and-trace system
- Caregiver purchasing for patient: must provide patient's ID NUMBER (not physical card) so sale can be logged against patient's allotment
- Non-marijuana products: may be sold, but NOT displayed or sold in the limited access area; must be clearly marked as not DCR-regulated (19 CSR 100-1.180(2)(M))
- Floor plan: No physical separation required between access point and waiting room — only between waiting room and limited access area where marijuana is accessible
- Drive-through sales permitted (including with two-way video screens) if compliant with 19 CSR 100-1.180(2)(A)4; facility must have SOPs for video system failure
- Delivery: permitted if pre-approved by DCR; follows 19 CSR 100-1.180(2)(D) and 100-1.140(3); transportation licensees may also deliver on behalf of dispensary
- Delivery payment: may be collected at time of delivery; if payment not received in advance, max 2 deliveries at same address on same day
- Curbside pickup NOT permitted — only drive-through and delivery if DCR-approved
- Gift cards: permitted as long as purchases are made by qualifying patients, caregivers, or consumers
- Minors: may enter dispensary ONLY if accompanied by a qualifying patient, primary caregiver, or consumer; non-emancipated minor patients must be accompanied by parent/guardian who holds caregiver ID
- Tipping budtenders: not prohibited or endorsed by DCR — facility's discretion

## POSSESSION & PURCHASE LIMITS
- Consumer (21+): Purchase up to 3 oz per transaction; possess up to 3 oz at any time
- Consumer personal cultivator: Any cultivated marijuana above 3 oz possession limit must remain at residence in an enclosed locked facility
- Patient (with ID card): Purchase up to 6 oz per 30-day period (more if physician/NP certifies a compelling reason); possess up to 12 oz (60-day supply)
- Patient with cultivation authorization: May possess up to 18 oz (90-day supply); amount exceeding 60-day supply must stay in enclosed locked facility
- Caregiver: Separate legal limit for each patient (up to 6 patients); all marijuana must be stored separately per patient and labeled with that patient's name
- A patient/consumer may only hold ONE cultivation authorization (not both patient and consumer cultivation)
- Out-of-state patient cards: Licensed dispensaries may accept (19 CSR 100-1.180)
- Edibles: Possession limit based on total THC in mg on label, NOT total package weight

## PATIENT & CAREGIVER ID CARDS
- Patient ID card valid for 3 years if approved on or after December 8, 2022 (previously 1 year)
- Consumer personal cultivation card: valid 12 months, renewable
- No Missouri residency required to apply for a patient ID card (requirement removed Dec 8, 2022)
- New physician/nurse practitioner certification required with every renewal application
- Certification form must be submitted to DCR within 30 days of the medical professional's signature date
- Physical ID cards are NOT mailed — card holders must download and print from the registry portal
- Applications processed within 30 days, in order received
- Certifying professionals: MD, DO, or nurse practitioner licensed and in good standing in Missouri
- Patient/caregiver cultivation application fee reduced to $50 (adjusted with CPI changes)
- Patient cultivation ID requires an approved patient ID first — cannot apply without one
- Prior convictions do NOT disqualify an individual from obtaining a patient ID card; however, a card may be revoked for certain criminal conduct that occurs AFTER the card is issued (see 19 CSR 100-1.040(6)(C))

## TAXATION
- Medical purchases: 4% state tax (Missouri Veterans' Health and Care Fund)
- Adult-use purchases: 6% state tax (Veterans, Health, and Community Reinvestment Fund)
- Local governments may impose additional sales tax up to 3% on adult-use
- All standard state and local sales/use taxes also apply
- Medical tax proceeds: DHSS operations → MO Veterans Commission (Veterans' Health and Care Fund)
- Adult-use tax proceeds: DHSS operations → expungement of marijuana offenses → MO Veterans Commission → MO Public Defender → local governments → grant recipients
- Department of Revenue gets up to 2% of total taxes collected for actual tax collection costs

## PROHIBITED ACTIVITIES (Marketing Relevance)
- No cannabis consumption in public places (unless locally designated)
- No consumption while operating motor vehicles
- No cannabis on grounds of schools, school buses, correctional facilities
- No smoking marijuana where tobacco smoking is prohibited
- No marketing to or targeting persons under 21 in any materials
- Cannot claim cannabis treats/cures specific medical conditions without approval
- Solvent-based/combustible gas extractions only by licensed facility (patients may create home extractions WITHOUT combustible gases — no solvent-based home extraction)
- Cannot promote unlicensed product or activities

## MANUFACTURING COMPLIANCE (Marketing-Relevant Rules)
### Licensing & Operations
- Comprehensive Manufacturing Facility: Licensed by DCR to produce marijuana-infused products (edibles, concentrates, vapes, topicals, etc.)
- Microbusiness Wholesale: May cultivate (up to 250 flowering plants) AND manufacture — sells ONLY to microbusiness dispensary facilities
- Manufacturing facilities cannot sell directly to consumers — all product must flow through licensed dispensary
- Marijuana Testing Facility must be independent — cannot be owned by the same entity as a cultivation, manufacturing, or dispensary facility

### Product Standards (What You Can & Can't Claim in Marketing)
- ALL manufactured products must be certified by a licensed marijuana testing facility before sale or marketing
- No health benefit, therapeutic effect, or medical use claims on any product — not on packaging, not in marketing
- Products must be free from contaminants — lab certification is the only acceptable basis for safety claims
- Active AND inactive ingredients must be disclosed — no hidden additives or undisclosed ingredients
- Cannot imply government approval for medical treatment purposes

### Branding & Packaging for Manufactured Products
- Packaging and branding must NOT appeal to minors: no cartoon characters, candy-like designs, bright colors targeting children
- All manufactured products require: net weight, total THC/CBD in mg, THC per serving in mg, number of servings, batch/lot number, testing lab name, active/inactive ingredients, dosage/instructions, manufacturer/dispensary license number
- Child-resistant AND tamper-evident closures required on ALL manufactured products
- Resealable packaging required

### Batch Tracking & Accountability
- Every manufactured batch must carry a batch/lot number tracked in the statewide seed-to-sale system
- No marijuana may be transferred or sold except through a licensed facility
- Records must be available for DCR inspection at all times
- Co-branding and white-label arrangements: all products must still meet full DCR labeling standards regardless of brand arrangement

### Extractions & Processing
- Solvent-based and combustible-gas extractions are ONLY permitted at licensed manufacturing facilities
- Patients may create home extractions without combustible gases for personal, non-commercial use
- No home solvent-based extraction — licensed facility only

## CONSUMPTION RULES (Article XIV Sec 1 & 2)
### Where Consumption Is Prohibited
- Public places: consumption is prohibited in any public place UNLESS a local government has specifically designated it as a permitted area
- Motor vehicles: no consumption while driving or operating any motor vehicle
- School grounds, school buses, and correctional facilities: strictly prohibited
- Anywhere tobacco smoking is prohibited, marijuana smoking is also prohibited
- Dispensaries: patients and consumers may NOT consume on dispensary premises

### Where Consumption May Be Permitted
- Private residences: consumption is generally permitted
- Locally designated areas: some local governments may create designated public consumption zones — verify with local government before including in any event/activation plan
- Never assume consumption is permitted at an event venue — confirm local law first

### Consumption in Marketing Materials
- No depictions of consumption in public spaces or non-licensed locations in any marketing, social, or advertising content
- No depictions of consumption in a motor vehicle
- Cannot show or imply underage consumption
- Geo-target all content to 21+ audiences in legal states

### Patient Home Extraction (Consumption-Adjacent)
- Qualifying patients ARE allowed to extract at home for personal use
- NO combustible gases, solvents, or dangerous materials allowed in home extraction
- Non-combustible home extraction methods are permitted for personal use only — not for resale

### Personal Cultivation & Possession in Context of Consumption
- Consumer personal cultivators: any marijuana above the 3oz possession limit must remain at their residence in an enclosed, locked facility
- Patients with cultivation authorization: excess above 60-day supply must remain in an enclosed, locked facility
- Individuals on probation/parole: consult attorney or P.O. — cannabis use protections are outside DCR's authority and subject to courts/supervising agencies

## HOME EXTRACTION (Patients Only)
- Qualifying patients ARE allowed to create their own extractions at home
- Restriction: NO combustible gases or other dangerous materials may be used in home extraction
- Non-combustible extraction methods at home are permitted for personal use

## EMPLOYMENT & WORKPLACE
- Employers may prohibit or restrict cannabis use in the workplace
- Employers may discipline employees for working under the influence
- Employers may refuse to hire/discharge employees for cannabis workplace violations
- Article XIV does NOT require employers to accommodate cannabis use
- All dispensary, cultivation, and manufacturing NEW employees must be 21+ (applies to new hires after Feb 3, 2023; current under-21 employees hired before that date may continue)
- Agent ID required for facility employees (fingerprints NOT required for new applicants since Dec 8, 2022)
- Owners with 10%+ financial or voting interest still need fingerprint criminal background check
- Probation/Parole: Cannabis use protections for patients/consumers on supervision are outside DCR's authority — individuals should consult their attorney or P.O.

## LICENSE TYPES & STRUCTURE
- Comprehensive Dispensary Facility: Sells to patients, caregivers, and consumers (21+)
- Comprehensive Cultivation Facility: Grows and supplies marijuana
- Comprehensive Manufacturing Facility: Makes infused products
- Marijuana Testing Facility: Independent testing and certification (cannot be owned by same entity as cultivation/manufacturing/dispensary)
- Marijuana Transportation Licensee: May complete deliveries on behalf of dispensary facilities
- Microbusiness Dispensary: Dispensary designed for individuals who may not otherwise access ownership (e.g., net worth <$250K, veterans with service-connected disability); majority-owned by qualifying individuals per the Constitution; may ONLY sell product produced by microbusiness wholesale facilities
- Microbusiness Wholesale: Cultivates up to 250 flowering plants at a time; may manufacture; sells ONLY to microbusiness dispensary facilities; combines concepts of cultivation + manufacturing
- Licenses valid for 3 years, renewable
- No entity may own more than 10% of total cultivation, dispensary, or manufacturing licenses outstanding
- No entity may own both a microbusiness AND a comprehensive/medical license simultaneously
- No new medical or comprehensive license applications accepted (existing medical licenses can convert to comprehensive)
- Application periods for future licenses publicly announced at least 6 months in advance

## SEED-TO-SALE TRACKING
- Required for ALL marijuana from seed/immature plant through final consumer sale
- Statewide track-and-trace system required
- No marijuana may be sold or transferred except through licensed facility
- Every dispensary sale must be recorded against patient/consumer allotment
- All transactions must be logged; records must be available for inspection

## CBD & UNREGULATED CANNABIS PRODUCTS
- DCR does NOT regulate CBD products produced from industrial hemp — only marijuana from licensed facilities
- Delta-8 THC, Delta-10 THC, THCA, and similar products sold outside licensed dispensaries are NOT regulated by DCR under Article XIV
- Unregulated psychoactive cannabis products have NOT been tested for content or contaminants by a licensed testing facility
- Governor Parson issued Executive Order 24-10 (August 1, 2024) regarding unregulated psychoactive cannabis products — see health.mo.gov/report
- Marketing CÚRADOR products must not be confused with unregulated products; always emphasize licensed, tested, DCR-regulated status

## GUN OWNERSHIP / FIREARMS FOR CARDHOLDERS
- Article XIV does NOT reference or prohibit possession or purchase of firearms
- HOWEVER: Federal law may still prohibit firearm possession or purchase by individuals who use marijuana, regardless of state legalization
- DCR does not regulate firearms and cannot advise on how federal prohibition will be enforced in Missouri
- Cardholders with firearm questions should consult their attorney or appropriate law enforcement agency
- Note: This is a legally sensitive topic — always direct customers to legal counsel, not dispensary staff

## DISQUALIFYING FELONY OFFENSES (Ownership / License Applicants)
- Article XIV prohibits anyone with a disqualifying felony offense from owning 10%+ of a comprehensive, microbusiness, or medical marijuana facility
- A "disqualifying felony offense" = conviction or guilty plea (state or federal) that is/would have been a felony under MO law, regardless of sentence imposed (including SIS/SES)
- Pending charges or arrests WITHOUT a conviction or guilty plea do NOT count as disqualifying
- EXCEPTIONS — a felony is NOT disqualifying if:
  1. The conviction/plea was for a marijuana offense that has been expunged or is currently eligible for expungement under Article XIV Section 2 (MO offenses only — out-of-state marijuana convictions are NOT eligible for this exception)
  2. The conviction/plea was for a NON-VIOLENT crime for which the individual was NOT incarcerated AND the conviction is more than 5 years old
  3. More than 5 years have passed since release from parole/probation AND no subsequent felony conviction or guilty plea since then
- A felony is "violent" if it involves force or threat of force (e.g., 1st-degree burglary, arson, assault, manslaughter, murder, unlawful use of a weapon, robbery)
- "Subsequent felony" means any felony committed AFTER the disqualifying offense — even if before parole/probation was completed
- Incarceration for even a short period disqualifies the non-violent non-incarceration exception; must use Exception 3 instead

## APPEALS
- Any person/entity entitled to appeal under 19 CSR 100-1.020 must file a petition with the Missouri Administrative Hearing Commission (AHC) within 30 days of the date the Department decision is sent
- Filing information: Missouri Administrative Hearing Commission website

## DECRIMINALIZATION & EXPUNGEMENT
- Article XIV includes provisions for persons with certain marijuana-related, non-violent offenses to petition for release from incarceration/parole/probation and have records expunged
- Consult legal counsel to determine eligibility

## 2026 PROPOSED RULE UPDATES (Joint Committee approved March 2026)
- Ownership review now occurs pre-issuance (before licenses granted)
- Framework for publicly traded companies to hold cannabis licenses
- Pathway for microbusiness license transfers to eligible family members
- Product recall procedures for unregulated THC products
- Enforcement authority with fines up to $100,000
- "Majority owned and operated" redefined for microbusiness program
`;

// ════════════════════════════════════════════════════════════════════════════
// COMPLIANCE PANEL
// ════════════════════════════════════════════════════════════════════════════
const DEFAULT_COMPLIANCE_CARDS = [];

const COMPLIANCE_CATEGORIES = ["State License","Federal Regulation","Certificate","SOP / Policy","Insurance","Contract","Lab Result","Other"];

function CompliancePanel({ overview, setOverview, docs, setDocs, links, setLinks, cards, setCards, currentUser }) {
  const [editingOverview, setEditingOverview] = useState(false);
  const [draftOverview, setDraftOverview] = useState(overview);
  const [addingLink, setAddingLink] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkCat, setLinkCat] = useState("Other");
  const [linkNotes, setLinkNotes] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [docDragging, setDocDragging] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardIcon, setNewCardIcon] = useState("📋");
  const [newCardColor, setNewCardColor] = useState("#c9a84c");
  // Card detail panel + AI chat
  const [openCardId, setOpenCardId] = useState(null);
  const [cardChats, setCardChats] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef();
  const fileRef = useRef();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [cardChats, openCardId]);

  const sendComplianceChat = async () => {
    if (!chatInput.trim() || chatLoading || !openCardId) return;
    const openCard = (cards || []).find(c => c.id === openCardId);
    if (!openCard) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    const prevMsgs = cardChats[openCardId] || [];
    const newMsgs = [...prevMsgs, userMsg];
    setCardChats(p => ({ ...p, [openCardId]: [...newMsgs, { role: "assistant", content: "" }] }));
    setChatInput("");
    setChatLoading(true);
    try {
      const resp = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          stream: true,
          system: `You are a Missouri cannabis compliance specialist for CÚRADOR, a cannabis brand operating in Missouri with brands including Headchange, Bubbles, and Safebet. You have deep expertise in Missouri cannabis law sourced directly from 19 CSR 100-1 Administrative Rules, Article XIV Sections 1 & 2 of the Missouri Constitution, DCR FAQs, and the July 2023 Final Rules.

The user is asking about ${openCard.title} compliance specifically. Give authoritative, actionable, and accurate guidance. Cite specific regulations when relevant (e.g., "per 19 CSR 100-1.180" or "per Article XIV Section 2"). Keep answers clear and practical for a marketing team — not a legal team. Flag anything that requires legal counsel.

CURRENT ${openCard.title.toUpperCase()} CHECKLIST ON FILE:
${(openCard.points || []).map((p, i) => `${i + 1}. ${p}`).join("\n")}

---
MISSOURI CANNABIS COMPLIANCE KNOWLEDGE BASE:
${MO_CANNABIS_COMPLIANCE_KB}`,
          messages: newMsgs,
        }),
      });
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.type === "content_block_delta" && json.delta?.text) {
                fullText += json.delta.text;
                setCardChats(p => {
                  const msgs = [...(p[openCardId] || [])];
                  msgs[msgs.length - 1] = { role: "assistant", content: fullText };
                  return { ...p, [openCardId]: msgs };
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setCardChats(p => {
        const msgs = [...(p[openCardId] || [])];
        msgs[msgs.length - 1] = { role: "assistant", content: "Sorry, I couldn't respond right now. Please try again." };
        return { ...p, [openCardId]: msgs };
      });
    }
    setChatLoading(false);
  };

  const updateCard = (id, patch) => setCards(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
  const deleteCard = (id) => { if (confirm("Delete this compliance section?")) setCards(p => p.filter(c => c.id !== id)); };
  const addPoint = (cardId) => setCards(p => p.map(c => c.id === cardId ? { ...c, points: [...c.points, "New requirement"] } : c));
  const updatePoint = (cardId, i, val) => setCards(p => p.map(c => c.id === cardId ? { ...c, points: c.points.map((pt, idx) => idx === i ? val : pt) } : c));
  const removePoint = (cardId, i) => setCards(p => p.map(c => c.id === cardId ? { ...c, points: c.points.filter((_, idx) => idx !== i) } : c));
  const saveNewCard = () => {
    if (!newCardTitle.trim()) return;
    setCards(p => [...p, { id: `cc-${Date.now()}`, title: newCardTitle.trim(), icon: newCardIcon, color: newCardColor, points: ["Add your first requirement here"] }]);
    setNewCardTitle(""); setNewCardIcon("📋"); setNewCardColor("#c9a84c"); setAddingCard(false);
  };

  const saveOverview = () => { setOverview(draftOverview); setEditingOverview(false); };

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const r = new FileReader();
      r.onload = e => {
        setDocs(p => [...p, {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          category: "Other",
          notes: "",
          addedBy: currentUser?.name || "Team",
          addedAt: new Date().toISOString(),
        }]);
      };
      r.readAsDataURL(file);
    });
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith("http") ? linkUrl.trim() : "https://" + linkUrl.trim();
    setLinks(p => [...p, {
      id: `lnk-${Date.now()}`,
      label: linkLabel.trim() || url,
      url,
      category: linkCat,
      notes: linkNotes.trim(),
      addedBy: currentUser?.name || "Team",
      addedAt: new Date().toISOString(),
    }]);
    setLinkLabel(""); setLinkUrl(""); setLinkCat("Other"); setLinkNotes(""); setAddingLink(false);
  };

  const removeDoc = (id) => { if (confirm("Remove this document?")) setDocs(p => p.filter(d => d.id !== id)); };
  const removeLink = (id) => { if (confirm("Remove this link?")) setLinks(p => p.filter(l => l.id !== id)); };
  const updateDocCat = (id, category) => setDocs(p => p.map(d => d.id === id ? { ...d, category } : d));
  const updateLinkCat = (id, category) => setLinks(p => p.map(l => l.id === id ? { ...l, category } : l));

  const allItems = [...docs.map(d => ({ ...d, _type: "doc" })), ...links.map(l => ({ ...l, _type: "link" }))];
  const filtered = filterCat === "All" ? allItems : allItems.filter(i => i.category === filterCat);

  const fmtSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const fmtAgo = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  };

  const CAT_COLORS = {
    "State License": "#4d9e8e", "Federal Regulation": "#5a9ed4", "Certificate": "#8b7fc0",
    "SOP / Policy": "#c9a84c", "Insurance": "#a0624a", "Contract": "#e07b6a",
    "Lab Result": "#4d9e8e", "Other": "#666",
  };

  const INP = { width: "100%", padding: "8px 11px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ padding: "32px 44px", minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 10 }}>Legal & Regulatory</div>
          <div style={{ fontFamily: "var(--df)", fontSize: 38, fontWeight: 300, lineHeight: .95, color: "var(--text)", marginBottom: 10 }}>Compliance</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 520 }}>
            Centralize licenses, certifications, SOPs, and regulatory links. Drop in files or paste URLs to keep everything in one place.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => fileRef.current.click()}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "var(--bf)", fontSize: 12, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.color = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            ↑ Upload Doc
          </button>
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
          <button onClick={() => setAddingLink(true)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(201,168,76,.35)", background: "rgba(201,168,76,.09)", color: "var(--gold)", fontFamily: "var(--bf)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,.09)"}>
            + Add Link
          </button>
        </div>
      </div>

      {/* Overview card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 16 }}>🛡</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Compliance Overview</div>
          </div>
          {!editingOverview
            ? <button onClick={() => { setDraftOverview(overview); setEditingOverview(true); }}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)" }}>✏ Edit</button>
            : <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setEditingOverview(false)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)" }}>Cancel</button>
                <button onClick={saveOverview} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "none", background: "var(--gold)", color: "var(--bg)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>Save</button>
              </div>
          }
        </div>
        <div style={{ padding: "18px 20px" }}>
          {editingOverview ? (
            <textarea value={draftOverview} onChange={e => setDraftOverview(e.target.value)} rows={6} autoFocus
              placeholder="Add a compliance overview — current license status, key requirements, renewal dates, notes for the team…"
              style={{ ...INP, resize: "vertical", lineHeight: 1.75, fontSize: 13 }} />
          ) : (
            overview ? (
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{overview}</div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", cursor: "pointer" }} onClick={() => { setDraftOverview(""); setEditingOverview(true); }}>
                Click Edit to add a compliance overview — license status, renewal dates, key requirements, team notes…
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Compliance Checklists ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: ".02em" }}>Compliance Checklists</div>
          <button onClick={() => setAddingCard(true)}
            style={{ fontSize: 11, padding: "5px 13px", borderRadius: 7, border: "1px dashed rgba(255,255,255,.14)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.color = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            + Add Section
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
          {(cards || []).map(card => {
            const isEditing = editingCardId === card.id;
            return (
              <div key={card.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", borderTop: `3px solid ${card.color}` }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--border2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    {isEditing ? (
                      <input value={card.icon} onChange={e => updateCard(card.id, { icon: e.target.value })}
                        style={{ width: 32, padding: "3px 4px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 16, textAlign: "center", fontFamily: "var(--bf)" }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{card.icon}</span>
                    )}
                    {isEditing ? (
                      <input value={card.title} onChange={e => updateCard(card.id, { title: e.target.value })}
                        style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13, fontWeight: 600, fontFamily: "var(--bf)" }} />
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{card.title}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {isEditing ? (
                      <>
                        <input type="color" value={card.color} onChange={e => updateCard(card.id, { color: e.target.value })}
                          title="Card color" style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", padding: 0 }} />
                        <button onClick={() => setEditingCardId(null)}
                          style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "none", background: card.color, color: "#07070f", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>Done</button>
                        <button onClick={() => deleteCard(card.id)}
                          style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid rgba(224,123,106,.3)", background: "transparent", color: "#e07b6a", cursor: "pointer", fontSize: 11, display: "grid", placeItems: "center" }}>🗑</button>
                      </>
                    ) : (
                      <button onClick={() => setEditingCardId(card.id)}
                        style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)" }}>✏ Edit</button>
                    )}
                  </div>
                </div>

                {/* Points list */}
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {card.points.map((pt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: card.color, flexShrink: 0, marginTop: 6 }} />
                      {isEditing ? (
                        <>
                          <input value={pt} onChange={e => updatePoint(card.id, i, e.target.value)}
                            style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }} />
                          <button onClick={() => removePoint(card.id, i)}
                            style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid rgba(224,123,106,.25)", background: "transparent", color: "rgba(224,123,106,.5)", cursor: "pointer", fontSize: 10, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>×</button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{pt}</span>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button onClick={() => addPoint(card.id)}
                      style={{ marginTop: 4, padding: "5px 0", borderRadius: 6, border: "1px dashed rgba(255,255,255,.1)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)", fontSize: 11, width: "100%", transition: "all .13s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = card.color + "55"; e.currentTarget.style.color = card.color; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                      + Add Point
                    </button>
                  )}
                </div>
                {/* Card footer — open detail panel */}
                {!isEditing && (
                  <div onClick={() => { setOpenCardId(card.id); setChatInput(""); }}
                    style={{ padding: "10px 16px", borderTop: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background .13s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: ".03em" }}>View Details</span>
                    <span style={{ fontSize: 10, color: card.color, background: card.color + "1a", padding: "3px 9px", borderRadius: 20, fontWeight: 700, letterSpacing: ".04em" }}>🤖 Ask AI</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new card modal */}
        {addingCard && (
          <div className="overlay" onClick={() => setAddingCard(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="mhdr">
                <div><div className="mtitle">New Compliance Section</div><div className="msub">Add a custom checklist category</div></div>
                <button className="mclose" onClick={() => setAddingCard(false)}>×</button>
              </div>
              <div className="mbody" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Icon</label>
                    <input value={newCardIcon} onChange={e => setNewCardIcon(e.target.value)} maxLength={2} placeholder="📋"
                      style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 22, textAlign: "center", fontFamily: "var(--bf)", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Section Title *</label>
                    <input value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} placeholder="e.g. Lab Testing" autoFocus
                      style={{ width: "100%", padding: "8px 11px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", boxSizing: "border-box" }}
                      onKeyDown={e => e.key === "Enter" && saveNewCard()} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Accent Color</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {["#c9a84c","#8b7fc0","#4d9e8e","#5a9ed4","#e07b6a","#a0624a","#4d9e8e"].map(c => (
                      <button key={c} onClick={() => setNewCardColor(c)}
                        style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: newCardColor === c ? `2px solid #fff` : "2px solid transparent", cursor: "pointer" }} />
                    ))}
                    <input type="color" value={newCardColor} onChange={e => setNewCardColor(e.target.value)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", padding: 0, background: "transparent" }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn" onClick={() => setAddingCard(false)}>Cancel</button>
                <button disabled={!newCardTitle.trim()} onClick={saveNewCard}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: newCardTitle.trim() ? newCardColor : "rgba(255,255,255,.06)", color: newCardTitle.trim() ? "#07070f" : "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: newCardTitle.trim() ? "pointer" : "not-allowed", fontFamily: "var(--bf)" }}>
                  Create Section
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Compliance Card Detail Panel ── */}
      {openCardId && (() => {
        const card = (cards || []).find(c => c.id === openCardId);
        if (!card) return null;
        const msgs = cardChats[openCardId] || [];
        const isEditingDetail = editingCardId === card.id;
        return (
          <div className="overlay" onClick={() => setOpenCardId(null)} style={{ zIndex: 1100 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(900px, 95vw)", background: "var(--bg)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", zIndex: 1101, animation: "slideInRight .22s ease" }}>

              {/* Header */}
              <div style={{ borderTop: `4px solid ${card.color}`, padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "var(--surface)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{card.icon}</div>
                  <div>
                    <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)", lineHeight: 1.1 }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, letterSpacing: ".06em", textTransform: "uppercase" }}>Compliance Checklist · AI Assistant</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {!isEditingDetail
                    ? <button onClick={() => setEditingCardId(card.id)}
                        style={{ fontSize: 11, padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)" }}>✏ Edit</button>
                    : <button onClick={() => setEditingCardId(null)}
                        style={{ fontSize: 11, padding: "5px 12px", borderRadius: 7, border: "none", background: card.color, color: "#07070f", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 700 }}>Done</button>
                  }
                  <button onClick={() => setOpenCardId(null)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, display: "grid", placeItems: "center" }}>×</button>
                </div>
              </div>

              {/* Body — split: left checklist, right AI chat */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>

                {/* LEFT — Checklist */}
                <div style={{ overflowY: "auto", padding: "22px 24px", borderRight: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: card.color, fontWeight: 600, marginBottom: 14 }}>Compliance Requirements</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {card.points.map((pt, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: card.color + "22", border: `1px solid ${card.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: card.color, marginTop: 1 }}>{i + 1}</div>
                        {isEditingDetail ? (
                          <div style={{ flex: 1, display: "flex", gap: 6 }}>
                            <input value={pt} onChange={e => updatePoint(card.id, i, e.target.value)}
                              style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)" }} />
                            <button onClick={() => removePoint(card.id, i)}
                              style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid rgba(224,123,106,.25)", background: "transparent", color: "rgba(224,123,106,.6)", cursor: "pointer", fontSize: 12, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 3 }}>×</button>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, paddingTop: 2 }}>{pt}</div>
                        )}
                      </div>
                    ))}
                    {isEditingDetail && (
                      <button onClick={() => addPoint(card.id)}
                        style={{ marginTop: 6, padding: "8px 0", borderRadius: 7, border: `1px dashed ${card.color}44`, background: "transparent", color: card.color, cursor: "pointer", fontFamily: "var(--bf)", fontSize: 12, fontWeight: 600 }}>
                        + Add Requirement
                      </button>
                    )}
                  </div>

                  {/* Color picker in edit mode */}
                  {isEditingDetail && (
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border2)" }}>
                      <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Accent Color</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {["#c9a84c","#8b7fc0","#4d9e8e","#5a9ed4","#e07b6a","#a0624a"].map(c => (
                          <button key={c} onClick={() => updateCard(card.id, { color: c })}
                            style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: card.color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
                        ))}
                        <input type="color" value={card.color} onChange={e => updateCard(card.id, { color: e.target.value })}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", padding: 0, background: "transparent" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT — AI Chat */}
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--surface)" }}>
                  {/* Chat header */}
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: card.color + "22", border: `1px solid ${card.color}44`, display: "grid", placeItems: "center", fontSize: 14 }}>🤖</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>AI Compliance Assistant</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Ask anything about {card.title} compliance</div>
                    </div>
                    {msgs.length > 0 && (
                      <button onClick={() => setCardChats(p => ({ ...p, [openCardId]: [] }))}
                        style={{ marginLeft: "auto", fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)" }}>Clear</button>
                    )}
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {msgs.length === 0 && (
                      <div style={{ textAlign: "center", paddingTop: 32 }}>
                        <div style={{ fontSize: 32, marginBottom: 10, opacity: .35 }}>🤖</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Ask me anything about {card.title} compliance</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
                          {(card.title === "Packaging" ? [
                              "What must appear on every product label?",
                              "What packaging is banned for being attractive to minors?",
                              "Which regulation covers labeling requirements?",
                            ] : card.title === "Events" ? [
                              "Can we give free samples at an event?",
                              "What ID verification is required at activations?",
                              "Can we host an event at a non-licensed venue?",
                            ] : card.title === "In-Store" ? [
                              "What health claims are allowed at point of sale?",
                              "What ID must budtenders check before every sale?",
                              "What are the rules around in-store display materials?",
                            ] : card.title === "Social Media" ? [
                              "How does Missouri regulate cannabis advertising?",
                              "What disclosures do influencer posts need?",
                              "What claims are prohibited on social media?",
                            ] : [
                              `What are the key ${card.title.toLowerCase()} requirements?`,
                              "What are common violations to avoid?",
                              "What does Missouri law say about this?",
                            ]
                          ).map(q => (
                            <button key={q} onClick={() => { setChatInput(q); }}
                              style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, border: `1px solid ${card.color}44`, background: card.color + "0d", color: card.color, cursor: "pointer", fontFamily: "var(--bf)", transition: "all .13s" }}
                              onMouseEnter={e => e.currentTarget.style.background = card.color + "22"}
                              onMouseLeave={e => e.currentTarget.style.background = card.color + "0d"}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {msgs.map((msg, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "88%", padding: "10px 13px", borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                          background: msg.role === "user" ? card.color : "var(--surface2)",
                          color: msg.role === "user" ? "#07070f" : "var(--text)",
                          fontSize: 13, lineHeight: 1.65,
                          border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                          whiteSpace: "pre-wrap",
                        }}>
                          {msg.content || (msg.role === "assistant" && chatLoading && i === msgs.length - 1 ? (
                            <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: card.color, animation: "pulse 1s infinite" }} />
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: card.color, animation: "pulse 1s .2s infinite" }} />
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: card.color, animation: "pulse 1s .4s infinite" }} />
                            </span>
                          ) : "")}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border2)", display: "flex", gap: 8, flexShrink: 0, background: "var(--bg)" }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendComplianceChat()}
                      placeholder={`Ask about ${card.title} compliance…`}
                      style={{ flex: 1, padding: "9px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", outline: "none" }}
                    />
                    <button onClick={sendComplianceChat} disabled={!chatInput.trim() || chatLoading}
                      style={{ width: 40, height: 40, borderRadius: 9, border: "none", background: chatInput.trim() && !chatLoading ? card.color : "rgba(255,255,255,.06)", color: chatInput.trim() && !chatLoading ? "#07070f" : "var(--text-muted)", cursor: chatInput.trim() && !chatLoading ? "pointer" : "not-allowed", fontSize: 16, display: "grid", placeItems: "center", flexShrink: 0, transition: "all .15s" }}>
                      ↑
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDocDragging(true); }}
        onDragLeave={() => setDocDragging(false)}
        onDrop={e => { e.preventDefault(); setDocDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current.click()}
        style={{ border: `2px dashed ${docDragging ? "var(--gold)" : "rgba(255,255,255,.08)"}`, borderRadius: 12, padding: "24px 20px", textAlign: "center", cursor: "pointer", transition: "all .2s", marginBottom: 24, background: docDragging ? "rgba(201,168,76,.04)" : "transparent" }}>
        <div style={{ fontSize: 22, marginBottom: 6, opacity: docDragging ? 1 : .4 }}>📁</div>
        <div style={{ fontSize: 13, color: docDragging ? "var(--gold)" : "var(--text-muted)" }}>Drop files here or click to upload</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, opacity: .7 }}>PDF, DOCX, PNG, JPG — any file type</div>
      </div>

      {/* Filter bar */}
      {(docs.length > 0 || links.length > 0) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {["All", ...COMPLIANCE_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              style={{ fontSize: 11, padding: "4px 11px", borderRadius: 100, border: `1px solid ${filterCat === cat ? (CAT_COLORS[cat] || "var(--gold)") : "var(--border)"}`, background: filterCat === cat ? (CAT_COLORS[cat] || "var(--gold)") + "20" : "transparent", color: filterCat === cat ? (CAT_COLORS[cat] || "var(--gold)") : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)", transition: "all .13s" }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      {filtered.length === 0 && (docs.length > 0 || links.length > 0) && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>No items in this category</div>
      )}
      {filtered.length === 0 && docs.length === 0 && links.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 14, opacity: .2 }}>🛡</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 6 }}>No compliance documents yet</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Upload files or add links to get started</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {filtered.map(item => {
          const catColor = CAT_COLORS[item.category] || "#666";
          const isDoc = item._type === "doc";
          const ext = isDoc ? (item.name || "").split(".").pop().toUpperCase() : null;
          return (
            <div key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", borderTop: `2px solid ${catColor}`, transition: "box-shadow .15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.3)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ padding: "14px 16px" }}>
                {/* Category badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <select value={item.category} onChange={e => isDoc ? updateDocCat(item.id, e.target.value) : updateLinkCat(item.id, e.target.value)}
                    style={{ fontSize: 9, padding: "2px 6px", borderRadius: 100, border: `1px solid ${catColor}44`, background: catColor + "18", color: catColor, fontFamily: "var(--bf)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", outline: "none" }}>
                    {COMPLIANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{fmtAgo(item.addedAt)}</div>
                </div>

                {/* Icon + Name */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  {isDoc ? (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: catColor + "22", border: `1px solid ${catColor}33`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 7, fontWeight: 700, color: catColor, letterSpacing: ".05em" }}>{ext}</div>
                    </div>
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: catColor + "22", border: `1px solid ${catColor}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>🔗</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isDoc ? item.name : item.label}</div>
                    {isDoc && item.size && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{fmtSize(item.size)} · Added by {item.addedBy}</div>}
                    {!isDoc && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</div>}
                    {item.notes && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.5 }}>{item.notes}</div>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--border2)", paddingTop: 10 }}>
                  <button onClick={() => {
                    if (isDoc) {
                      window.open(item.data, "_blank", "noopener,noreferrer");
                    } else { window.open(item.url, "_blank", "noopener,noreferrer"); }
                  }} style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--bf)", fontSize: 11, cursor: "pointer", transition: "all .13s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = catColor + "55"; e.currentTarget.style.color = catColor; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                    {isDoc ? "Open ↗" : "Visit ↗"}
                  </button>
                  {isDoc && (
                    <button onClick={() => { const a = document.createElement("a"); a.href = item.data; a.download = item.name; a.click(); }}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--bf)", fontSize: 11, cursor: "pointer", transition: "all .13s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.color = "var(--gold)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                      ↓ Download
                    </button>
                  )}
                  <button onClick={() => isDoc ? removeDoc(item.id) : removeLink(item.id)}
                    style={{ width: 32, padding: "6px 0", borderRadius: 7, border: "1px solid rgba(224,123,106,.25)", background: "transparent", color: "rgba(224,123,106,.5)", fontFamily: "var(--bf)", fontSize: 12, cursor: "pointer", transition: "all .13s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(224,123,106,.6)"; e.currentTarget.style.color = "#e07b6a"; e.currentTarget.style.background = "rgba(224,123,106,.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(224,123,106,.25)"; e.currentTarget.style.color = "rgba(224,123,106,.5)"; e.currentTarget.style.background = "transparent"; }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Link Modal */}
      {addingLink && (
        <div className="overlay" onClick={() => setAddingLink(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="mhdr">
              <div><div className="mtitle">Add Compliance Link</div><div className="msub">Paste a URL to a regulation, portal, or resource</div></div>
              <button className="mclose" onClick={() => setAddingLink(false)}>×</button>
            </div>
            <div className="mbody" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>URL *</label>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" autoFocus style={INP} onKeyDown={e => e.key === "Enter" && addLink()} />
              </div>
              <div>
                <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Label</label>
                <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="e.g. MO State License Portal" style={INP} />
              </div>
              <div>
                <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Category</label>
                <select value={linkCat} onChange={e => setLinkCat(e.target.value)} style={INP}>
                  {COMPLIANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Notes</label>
                <textarea value={linkNotes} onChange={e => setLinkNotes(e.target.value)} placeholder="Optional notes…" rows={2} style={{ ...INP, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" onClick={() => setAddingLink(false)}>Cancel</button>
              <button disabled={!linkUrl.trim()} onClick={addLink}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: linkUrl.trim() ? "var(--gold)" : "rgba(255,255,255,.06)", color: linkUrl.trim() ? "var(--bg)" : "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: linkUrl.trim() ? "pointer" : "not-allowed", fontFamily: "var(--bf)" }}>
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// DETAIL MODAL
// ════════════════════════════════════════════════════════════════════════════
function DetailModal({ init, getAccent, onClose, onFileClick, onCreateCampaign, onViewConcept, conceptHtml }) {
  const acc = getAccent(init.channel);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()}>
        <div className="mhdr" style={{ borderTop: `2px solid ${acc.solid}`, borderRadius: "16px 16px 0 0" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 6 }}>{init.channel}</div>
            <div className="mtitle">{init.title}</div>
          </div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.85, marginBottom: 18 }}>{init.description}</p>
          {init._brief && (
            <div style={{ marginBottom: 18 }}>
              <div className="fl" style={{ marginBottom: 10 }}>Campaign Brief</div>
              <BriefDisplay brief={init._brief} />
            </div>
          )}
          <div className="dgrid">
            <div><div className="dfield-lbl">Owner</div><div className="dfield-val">{init.owner}</div></div>
            
            {init.startDate && <div><div className="dfield-lbl">Start Date</div><div className="dfield-val">{fmtDate(init.startDate)}</div></div>}
            {(init.endDate || init.revolving) && (
              <div>
                <div className="dfield-lbl">End Date</div>
                <div className="dfield-val" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {init.revolving ? <span className="card-revolving">↻ Revolving / Ongoing</span> : fmtDate(init.endDate)}
                </div>
              </div>
            )}
            {init.startDate && init.endDate && !init.revolving && (() => {
              const pct = dateProgress(init.startDate, init.endDate);
              const acc2 = getAccent(init.channel);
              return (
                <div style={{ gridColumn: "1/-1" }}>
                  <div className="dfield-lbl" style={{ marginBottom: 6 }}>Progress</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 5, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: acc2.solid, borderRadius: 3, transition: "width .4s" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 32 }}>{pct}%</span>
                  </div>
                </div>
              );
            })()}
            <div style={{ gridColumn: "1/-1" }}>
              <div className="dfield-lbl">Pillar</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: acc.grad, flexShrink: 0 }} />
                <div className="dfield-val">{init.channel}</div>
              </div>
            </div>
          </div>
          {init.fileUrl && (
            <div className="fpbar">
              <span>📎</span>
              <span className="fpname">{init.fileName || "Attached file"}</span>
              <button className="fpact" onClick={() => { window.open(init.fileUrl, "_blank", "noopener,noreferrer"); }}>Open ↗</button>
              <button className="fpact" onClick={() => { onClose(); onFileClick(init.id); }}>Swap</button>
            </div>
          )}
        </div>
        <div className="mfoot">
          {(conceptHtml || init.htmlConceptName) && onViewConcept && (
            <button className="btn" style={{ borderColor: "rgba(123,104,181,.4)", color: "#8b7fc0", fontWeight: 600 }} onClick={() => onViewConcept(init.id)}>🎨 View Concept</button>
          )}
          {!init.fileUrl && <button className="btn" onClick={() => { onClose(); onFileClick(init.id); }}>+ Attach File</button>}
          {onCreateCampaign && (
            <button className="btn" style={{ borderColor: "rgba(201,168,76,.35)", color: "var(--gold)", fontWeight: 600 }} onClick={() => onCreateCampaign(init)}>🚀 → Campaign</button>
          )}
          <button className="btn btn-gold" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD MODAL
// ════════════════════════════════════════════════════════════════════════════
function FileUploadModal({ initiative, onClose, onSave }) {
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [prevName, setPrevName] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const fileRef = useRef();
  const handleFile = (file) => { const r = new FileReader(); r.onload = e => { setPrevUrl(e.target.result); setPrevName(file.name); }; r.readAsDataURL(file); };
  const onDrop = useCallback(e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, []);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mhdr"><div><div className="mtitle">Attach File</div><div className="msub">{initiative?.title}</div></div><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          {initiative?.fileUrl && !prevName && <div className="fpbar"><span>📎</span><span className="fpname">Current: {initiative.fileName || "File"}</span></div>}
          {prevName ? (
            <div className="fpbar"><span>📄</span><span className="fpname">{prevName}</span><button className="fpact" onClick={() => { setPrevName(null); setPrevUrl(null); }}>Remove</button></div>
          ) : (
            <div className={`dzone ${dragging ? "drag" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileRef.current.click()}>
              <div className="dicon">📁</div><div className="dtxt">Drop file or click to browse</div><div className="dsub">HTML, PDF, DOCX — any file</div>
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            </div>
          )}
          <div className="divdr">or paste a link</div>
          <input className="url-in" placeholder="Google Docs, Notion, Figma, or any URL" value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={!prevUrl && !url.trim()} onClick={() => { if (prevUrl) onSave(prevUrl, prevName); else if (url.trim()) onSave(url.trim(), url.trim()); }}>{initiative?.fileUrl ? "Swap File" : "Attach File"}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADD INITIATIVE — with integrated brief upload that auto-fills the form
// ════════════════════════════════════════════════════════════════════════════
function AddInitiativeModal({ pillars, brands, preselectedBrand, existing, onClose, onSave, teamMembers }) {
  const brandList = brands ? Object.values(brands) : [];
  const isEditing = !!existing;

  const [f, setF] = useState(() => ({
    title: existing?.title || "",
    description: existing?.description || "",
    owner: existing?.owner || "",
    team: existing?.team || [],
    channel: existing?.channel || CHANNELS[0],
    brandId: existing?.brandId || preselectedBrand || null,
    startDate: existing?.startDate || "",
    endDate: existing?.endDate || "",
    revolving: existing?.revolving || false,
  }));
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const selectedBrand = f.brandId ? brandList.find(b => b.id === f.brandId) : null;
  const accentColor = selectedBrand?.color || "var(--gold)";
  const [manualName, setManualName] = useState("");

  // Right panel mode: "brief" | "concept" | "files"
  const [rightMode, setRightMode] = useState("brief");

  // Brief state
  const [briefFile, setBriefFile] = useState(null);
  const [briefParsed, setBriefParsed] = useState(null);
  const [briefProcessing, setBriefProcessing] = useState(false);
  const [briefError, setBriefError] = useState(null);
  const [briefDragging, setBriefDragging] = useState(false);
  const briefRef = useRef();
  const ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp"];

  // Attached files (general supporting files)
  const [attachedFiles, setAttachedFiles] = useState(existing?._attachedFiles || []);
  const [filesDragging, setFilesDragging] = useState(false);
  const filesRef = useRef();
  const FILE_ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp",".xls",".xlsx",".csv",".ppt",".pptx",".zip"];

  // Concept HTML state — preserve existing when editing
  const [conceptHtml, setConceptHtml] = useState(existing?.htmlConcept || null);
  const [conceptName, setConceptName] = useState(existing?.htmlConceptName || null);
  const [conceptDragging, setConceptDragging] = useState(false);
  const conceptRef = useRef();

  const addTeamMember = (name) => {
    if (!name.trim() || f.team.includes(name.trim())) return;
    s("team", [...f.team, name.trim()]);
  };
  const removeTeamMember = (name) => s("team", f.team.filter(n => n !== name));

  const handleAttachFiles = async (fileList) => {
    const files = Array.from(fileList);
    for (const file of files) {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!FILE_ACCEPTED.some(a => ext === a)) continue;
      const data = await new Promise((res) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      setAttachedFiles(p => [...p, { name: file.name, type: file.type, size: file.size, data }]);
    }
  };

  const handleBriefFile = (file) => {
    if (!file) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.some(a => ext === a)) { setBriefError("Unsupported type. Try PDF, Word, image, or text."); return; }
    setBriefFile(file); setBriefError(null); setBriefParsed(null);
  };

  const handleConceptFile = (file) => {
    if (!file?.name.endsWith(".html")) return;
    const r = new FileReader();
    r.onload = e => { setConceptHtml(e.target.result); setConceptName(file.name); };
    r.readAsText(file);
  };

  const parseBrief = async () => {
    if (!briefFile) return;
    setBriefProcessing(true); setBriefError(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = e => res(e.target.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(briefFile);
      });
      const ext = briefFile.name.split(".").pop().toLowerCase();
      const isImage = ["png","jpg","jpeg","webp"].includes(ext);
      const isText = ["txt","md"].includes(ext);
      const mediaType = briefFile.type || (ext === "pdf" ? "application/pdf" : isImage ? `image/${ext}` : "text/plain");
      let msgContent;
      if (isText) msgContent = [{ type: "text", text: `Brief document:\n\n${atob(base64)}\n\nExtract key info.` }];
      else if (isImage) msgContent = [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "This is a brief document image. Extract key info." }];
      else msgContent = [{ type: "document", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "This is a marketing brief. Extract key info." }];
      const brandContext = selectedBrand ? `for the brand "${selectedBrand.name}"` : "for CÚRADOR (all brands)";
      const resp = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: `You are a marketing strategist for CÚRADOR, a Missouri cannabis company. The user is uploading a brief ${brandContext}. Extract fields and respond ONLY with valid JSON, no markdown:
{"title":"short initiative title (max 8 words)","description":"2-3 sentence summary","owner":"owner or team (default: Brand Team)","channel":"one of: ${CHANNELS.join(", ")}","objective":"one sentence primary objective","keyMessages":["msg1","msg2"],"keyPoints":["Actionable point — max 12 words","Actionable point","Actionable point","Actionable point","Actionable point"]}`,
          messages: [{ role: "user", content: msgContent }],
        }),
      });
      const data = await resp.json();
      const raw = data.content?.find(c => c.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setBriefParsed(parsed);
      if (parsed.title) s("title", parsed.title);
      if (parsed.description) s("description", parsed.description);
      if (parsed.owner) s("owner", parsed.owner);
      if (parsed.channel && CHANNELS.includes(parsed.channel)) s("channel", parsed.channel);
    } catch { setBriefError("Couldn't parse — check the file and try again."); }
    setBriefProcessing(false);
  };

  const handleSave = () => {
    const data = {
      ...f,
      id: isEditing ? existing.id : `init-${Date.now()}`,
      fileUrl: existing?.fileUrl || null,
      fileName: briefFile?.name || existing?.fileName || null,
      _brief: briefParsed ? { objective: briefParsed.objective, keyMessages: briefParsed.keyMessages || [], keyPoints: briefParsed.keyPoints || [] } : (existing?._brief || null),
      _briefSource: briefFile?.name || existing?._briefSource || null,
      htmlConcept: conceptHtml || null,
      htmlConceptName: conceptName || existing?.htmlConceptName || null,
      _conceptUrl: existing?._conceptUrl || null,
      _attachedFiles: attachedFiles,
    };
    onSave(data);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 860 }}>
        <div className="mhdr" style={{ borderTop: `2px solid ${accentColor}`, borderRadius: "16px 16px 0 0" }}>
          <div className="mtitle">{isEditing ? "Edit Initiative" : "New Initiative"}</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>

          {/* LEFT — form */}
          <div style={{ padding: "18px 20px", overflowY: "auto", borderRight: "1px solid var(--border2)", maxHeight: "72vh" }}>
            {/* Brand selector */}
            <div className="ff">
              <label className="fl">Brand</label>
              <div className="brand-sel-row">
                <button className={`brand-sel-chip ${f.brandId === null ? "on" : ""}`}
                  style={{ borderColor: f.brandId === null ? "var(--gold)" : "var(--border)", background: f.brandId === null ? "var(--gold-dim)" : "transparent", color: f.brandId === null ? "var(--gold)" : "var(--text-muted)" }}
                  onClick={() => s("brandId", null)}>
                  <div className="brand-sel-pip" style={{ background: "var(--gold)" }} /> CÚRADOR
                </button>
                {brandList.map(b => (
                  <button key={b.id} className={`brand-sel-chip ${f.brandId === b.id ? "on" : ""}`}
                    style={{ borderColor: f.brandId === b.id ? b.color + "88" : "var(--border)", background: f.brandId === b.id ? b.color + "14" : "transparent", color: f.brandId === b.id ? b.color : "var(--text-muted)" }}
                    onClick={() => s("brandId", b.id)}>
                    <div className="brand-sel-pip" style={{ background: b.color }} />{b.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="ff"><label className="fl">Title *</label><input className="fi" placeholder="e.g. How to Hash Guide" value={f.title} onChange={e => s("title", e.target.value)} /></div>
            <div className="ff"><label className="fl">Description</label><textarea className="fta" placeholder="What does this initiative accomplish?" value={f.description} onChange={e => s("description", e.target.value)} /></div>
            <div className="ff"><label className="fl">Owner</label><input className="fi" placeholder="Lead person or team" value={f.owner} onChange={e => s("owner", e.target.value)} /></div>
            <div className="ff">
              <label className="fl">Team</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {f.team.map(name => (
                  <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", fontSize: 11, color: "var(--gold)" }}>
                    {name}
                    <span onClick={() => removeTeamMember(name)} style={{ cursor: "pointer", opacity: .6, fontSize: 13, lineHeight: 1 }}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(teamMembers || []).length > 0 && (
                  <select className="fsel" value="" onChange={e => { if (e.target.value) { addTeamMember(e.target.value); e.target.value = ""; } }} style={{ flex: 1 }}>
                    <option value="">Select team member...</option>
                    {(teamMembers || []).filter(m => !f.team.includes(m.name)).map(m => <option key={m.name} value={m.name}>{m.name}{m.role ? ` — ${m.role}` : ""}</option>)}
                  </select>
                )}
                <div style={{ display: "flex", gap: 4, flex: 1 }}>
                  <input className="fi" placeholder="Add name manually" value={manualName} onChange={e => setManualName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { addTeamMember(manualName); setManualName(""); } }}
                    style={{ flex: 1 }} />
                  <button type="button" className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", flexShrink: 0 }}
                    onClick={() => { addTeamMember(manualName); setManualName(""); }}>+</button>
                </div>
              </div>
            </div>
            <div className="ff"><label className="fl">Channel</label>
              <select className="fsel" value={f.channel} onChange={e => s("channel", e.target.value)}>
                {CHANNELS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="frow">
              <div className="ff"><label className="fl">Start Date</label><input className="fi" type="date" value={f.startDate} onChange={e => s("startDate", e.target.value)} /></div>
              <div className="ff"><label className="fl">End Date</label><input className="fi" type="date" value={f.endDate} disabled={f.revolving} style={{ opacity: f.revolving ? 0.4 : 1 }} onChange={e => s("endDate", e.target.value)} /></div>
            </div>
            <div className="ff">
              <div className={`rev-toggle ${f.revolving ? "on" : ""}`} onClick={() => s("revolving", !f.revolving)}>
                <div className="rev-knob"><div className="rev-pip" /></div>
                <span className="rev-icon">↻</span>
                <div className="rev-info">
                  <div className="rev-lbl">Revolving / Ongoing</div>
                  <div className="rev-sub">{f.revolving ? "No end date — evergreen or recurring" : "Toggle on if this runs continuously"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — brief or concept */}
          <div style={{ display: "flex", flexDirection: "column", maxHeight: "72vh" }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
              {[["brief","📎 Brief"],["files","📁 Files"],["concept","🎨 HTML"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setRightMode(mode)} style={{
                  flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontFamily: "var(--bf)", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", transition: "all .15s",
                  background: rightMode === mode ? "var(--surface2)" : "transparent",
                  color: rightMode === mode ? accentColor : "var(--text-muted)",
                  borderBottom: rightMode === mode ? `2px solid ${accentColor}` : "2px solid transparent",
                }}>{label}{mode === "files" && attachedFiles.length > 0 ? ` (${attachedFiles.length})` : ""}</button>
              ))}
            </div>

            <div style={{ flex: 1, padding: "16px 18px", overflowY: "auto" }}>
              {rightMode === "brief" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Drop a PDF, Word doc, or image — AI reads it and fills the form automatically.</div>
                  {!briefFile ? (
                    <div className={`bu-zone ${briefDragging ? "drag" : ""}`}
                      style={{ minHeight: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      onDragOver={e => { e.preventDefault(); setBriefDragging(true); }}
                      onDragLeave={() => setBriefDragging(false)}
                      onDrop={e => { e.preventDefault(); setBriefDragging(false); handleBriefFile(e.dataTransfer.files[0]); }}
                      onClick={() => briefRef.current.click()}>
                      <span className="bu-icon">📎</span>
                      <div className="bu-title">Drop brief here</div>
                      <div className="bu-sub">PDF · Word · Image · Text</div>
                      <input ref={briefRef} type="file" accept={ACCEPTED.join(",")} style={{ display: "none" }} onChange={e => handleBriefFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="bu-file-row">
                        <span style={{ fontSize: 16 }}>📎</span>
                        <div className="bu-file-name">{briefFile.name}</div>
                        <button className="bu-file-rm" onClick={() => { setBriefFile(null); setBriefParsed(null); setBriefError(null); }}>✕</button>
                      </div>
                      {briefProcessing && (
                        <div className="bu-processing">
                          <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
                          <div className="bu-proc-txt">Reading brief…</div>
                        </div>
                      )}
                      {briefParsed && !briefProcessing && (
                        <div style={{ padding: "10px 12px", background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.18)", borderRadius: 9 }}>
                          <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 6 }}>✦ Form filled from brief</div>
                          {briefParsed.objective && <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 8 }}>{briefParsed.objective}</div>}
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {(briefParsed.keyPoints || []).map((pt, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: "var(--text-dim)" }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "var(--gold)", flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {briefError && <div style={{ fontSize: 11, color: "#e07b6a", padding: "8px 10px", background: "rgba(224,123,106,.08)", borderRadius: 7 }}>{briefError}</div>}
                      {!briefParsed && !briefProcessing && (
                        <button className="btn btn-gold" style={{ width: "100%" }} onClick={parseBrief}>✦ Parse with AI</button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {rightMode === "files" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Attach supporting files — decks, images, spreadsheets, docs.</div>
                  <div className={`bu-zone ${filesDragging ? "drag" : ""}`}
                    style={{ minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                    onDragOver={e => { e.preventDefault(); setFilesDragging(true); }}
                    onDragLeave={() => setFilesDragging(false)}
                    onDrop={e => { e.preventDefault(); setFilesDragging(false); handleAttachFiles(e.dataTransfer.files); }}
                    onClick={() => filesRef.current.click()}>
                    <span className="bu-icon">📁</span>
                    <div className="bu-title">Drop files here</div>
                    <div className="bu-sub">PDF · Word · Image · Excel · PowerPoint · CSV</div>
                    <input ref={filesRef} type="file" accept={FILE_ACCEPTED.join(",")} multiple style={{ display: "none" }} onChange={e => handleAttachFiles(e.target.files)} />
                  </div>
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {attachedFiles.map((af, i) => (
                        <div key={i} className="bu-file-row">
                          <span style={{ fontSize: 14 }}>{af.type?.startsWith("image/") ? "🖼" : "📄"}</span>
                          <div className="bu-file-name">{af.name}</div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{(af.size / 1024).toFixed(0)} KB</span>
                          <button className="bu-file-rm" onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {rightMode === "concept" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Drop an HTML file — presentations, mockups, interactive prototypes. It will preview on the initiative card and open full screen.</div>
                  {!conceptHtml ? (
                    <div className={`bu-zone ${conceptDragging ? "drag" : ""}`}
                      style={{ minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      onDragOver={e => { e.preventDefault(); setConceptDragging(true); }}
                      onDragLeave={() => setConceptDragging(false)}
                      onDrop={e => { e.preventDefault(); setConceptDragging(false); handleConceptFile(e.dataTransfer.files[0]); }}
                      onClick={() => conceptRef.current.click()}>
                      <span className="bu-icon">🎨</span>
                      <div className="bu-title">Drop HTML concept</div>
                      <div className="bu-sub">Any .html file · Renders live in the card</div>
                      <input ref={conceptRef} type="file" accept=".html" style={{ display: "none" }} onChange={e => handleConceptFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="bu-file-row">
                        <span style={{ fontSize: 16 }}>🎨</span>
                        <div className="bu-file-name">{conceptName}</div>
                        <button className="bu-file-rm" onClick={() => { setConceptHtml(null); setConceptName(null); }}>✕</button>
                      </div>
                      {/* Mini preview */}
                      <div style={{ height: 180, borderRadius: 9, overflow: "hidden", position: "relative", background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <iframe srcDoc={conceptHtml} style={{ width: "200%", height: "200%", border: "none", transform: "scale(0.5)", transformOrigin: "0 0", pointerEvents: "none" }} sandbox="allow-scripts" title="preview" />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(7,7,15,.8) 100%)" }} />
                        <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "var(--text-dim)" }}>Live preview · {conceptName}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={!f.title.trim()} onClick={handleSave}>
            {isEditing ? "Save Changes" : `Add Initiative${briefFile ? " + Brief" : ""}${conceptHtml ? " + Concept" : ""}${attachedFiles.length > 0 ? ` + ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EDIT STRATEGY
// ════════════════════════════════════════════════════════════════════════════
function EditStrategyModal({ strategy, onClose, onSave }) {
  const [f, setF] = useState({ ...strategy, pillarsText: strategy.pillars.join("\n") });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mhdr"><div className="mtitle">Edit Strategy</div><button className="mclose" onClick={onClose}>×</button></div>
        <div className="mbody">
          <div className="ff"><label className="fl">Brand Name</label><input className="fi" value={f.brand} onChange={e => s("brand", e.target.value)} /></div>
          <div className="ff"><label className="fl">Tagline</label><input className="fi" value={f.tagline} onChange={e => s("tagline", e.target.value)} /></div>
          <div className="ff"><label className="fl">Vision Statement</label><textarea className="fta" style={{ minHeight: 90 }} value={f.vision} onChange={e => s("vision", e.target.value)} /></div>
          <div className="ff"><label className="fl">Strategic Pillars (one per line)</label><textarea className="fta" value={f.pillarsText} onChange={e => s("pillarsText", e.target.value)} /></div>
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={() => onSave({ ...f, pillars: f.pillarsText.split("\n").map(p => p.trim()).filter(Boolean) })}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BRIEF QUICK UPLOAD — header button with brand picker dropdown
// ════════════════════════════════════════════════════════════════════════════
function BriefQuickUpload({ brands, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn" onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        📎 Upload Brief
        <span style={{ fontSize: 9, opacity: .6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 8px 6px", fontWeight: 500 }}>Select brand</div>
          {Object.values(brands).map(b => (
            <button key={b.id} onClick={() => { onSelect(b.id); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--bf)", transition: "background .12s", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = b.color + "14"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{b.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BRIEF UPLOAD MODAL
// ════════════════════════════════════════════════════════════════════════════
function BriefUploadModal({ brandId, brand, pillars, onClose, onSave }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null); // base64
  const [processing, setProcessing] = useState(false);
  const [parsed, setParsed] = useState(null);   // AI-extracted fields
  const [error, setError] = useState(null);
  const fileRef = useRef();

  // Accept PDF, Word docs, images, text
  const ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp"];

  const readFile = (f) => {
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.some(a => ext === a)) { setError("Unsupported file type. Try PDF, Word, image, or text."); return; }
    setFile(f);
    setError(null);
    setParsed(null);
    const reader = new FileReader();
    reader.onload = e => setFileData(e.target.result); // data URL reader.readAsDataURL(f);
  };

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    readFile(e.dataTransfer.files[0]);
  }, []);

  const parseBrief = async () => {
    if (!file || !fileData) return;
    setProcessing(true); setError(null);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      const isImage = ["png","jpg","jpeg","webp"].includes(ext);
      const isPdf = ext === "pdf";
      const isText = ["txt","md"].includes(ext);
      const base64 = fileData.split(",")[1];
      const mediaType = file.type || (isPdf ? "application/pdf" : isImage ? `image/${ext}` : "text/plain");

      let msgContent;
      if (isText) {
        // Decode text and send as text
        const text = atob(base64);
        msgContent = [{ type: "text", text: `Here is a marketing brief document:\n\n${text}\n\nPlease extract the key information.` }];
      } else if (isImage) {
        msgContent = [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "This is a marketing brief document image. Please extract the key information." }
        ];
      } else {
        // PDF or Word — send as document
        msgContent = [
          { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "This is a marketing brief. Please extract the key information." }
        ];
      }

      const systemPrompt = `You are a marketing strategist for CÚRADOR, a Missouri cannabis company. The user is uploading a brief document for the brand "${brand?.name || "Unknown"}".
Extract the following fields from the document and respond ONLY with a valid JSON object, no markdown, no backticks, no commentary:
{
  "title": "short initiative title (max 8 words)",
  "description": "2-3 sentence summary of the initiative objective",
  "owner": "who owns this initiative (person or team, if mentioned, otherwise 'Brand Team')",
  "channel": "one of: ${pillars.join(", ")} — pick the best fit",
  "quarter": "one of: Q1 2026, Q2 2026, Q3 2026, Q4 2026 — pick the most relevant",
  "keyMessages": ["key message 1", "key message 2"],
  "channels": ["channel 1", "channel 2"],
  "objective": "single sentence primary objective",
  "notes": "any other important context from the brief (max 2 sentences)"
}
If a field is not present, use a sensible default. Always return valid JSON only.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: msgContent }],
        }),
      });

      const data = await resp.json();
      const raw = data.content?.find(c => c.type === "text")?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const extracted = JSON.parse(clean);
      setParsed(extracted);
    } catch (e) {
      setError("Couldn't parse the brief — try a clearer PDF or paste the text manually.");
    }
    setProcessing(false);
  };

  const createCard = () => {
    if (!parsed) return;
    const init = {
      id: `init-${Date.now()}`,
      title: parsed.title || file.name.replace(/\.[^.]+$/, ""),
      description: parsed.description || "",
      owner: parsed.owner || "Brand Team",
      pillar: pillars.includes(parsed.pillar) ? parsed.pillar : pillars[0],
      quarter: parsed.quarter || "Q2 2026",
      brandId: brandId,
      fileUrl: null, fileName: file.name,
      _brief: { objective: parsed.objective, keyMessages: parsed.keyMessages || [], channels: parsed.channels || [] },
      _briefSource: file.name,
      _briefNotes: parsed.notes || "",
    };
    onSave(init);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()}>
        <div className="mhdr" style={{ borderTop: `2px solid ${brand?.color || "var(--gold)"}`, borderRadius: "16px 16px 0 0" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}>
              {brand?.name || "Brand"} · Upload Brief
            </div>
            <div className="mtitle">Create Initiative from Brief</div>
          </div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>

        <div className="mbody">
          {!file ? (
            /* Drop zone */
            <div
              className={`bu-zone ${dragging ? "drag" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current.click()}
            >
              <span className="bu-icon">📎</span>
              <div className="bu-title">Drop your brief here</div>
              <div className="bu-sub">PDF, Word doc, image, or text file — AI will extract the key info and build the card</div>
              <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} style={{ display: "none" }} onChange={e => readFile(e.target.files[0])} />
            </div>
          ) : (
            <div>
              {/* File attached row */}
              <div className="bu-file-row">
                <span style={{ fontSize: 16 }}>📎</span>
                <div className="bu-file-name">{file.name}</div>
                <button className="bu-file-rm" onClick={() => { setFile(null); setFileData(null); setParsed(null); setError(null); }}>✕</button>
              </div>

              {/* Processing indicator */}
              {processing && (
                <div className="bu-processing">
                  <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
                  <div className="bu-proc-txt">Reading brief and extracting initiative details…</div>
                </div>
              )}

              {/* Parsed preview */}
              {parsed && !processing && (
                <div className="bu-preview">
                  <div style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: brand?.color || "var(--gold)", marginBottom: 8, fontWeight: 600 }}>Extracted from Brief</div>
                  <div className="bu-prev-title">{parsed.title}</div>
                  <div className="bu-prev-body">{parsed.description}</div>
                  {parsed.objective && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>Objective: {parsed.objective}</div>}
                  <div className="bu-prev-chips">
                    {(parsed.keyMessages || []).map(m => <span key={m} className="bu-prev-chip">{m}</span>)}
                    {(parsed.channels || []).map(c => <span key={c} className="bu-prev-chip" style={{ background: "rgba(77,158,142,.1)", color: "#4d9e8e", borderColor: "rgba(77,158,142,.2)" }}>{c}</span>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                    {[["Pillar", parsed.pillar], ["Quarter", parsed.quarter], ["Owner", parsed.owner]].map(([l, v]) => (
                      <div key={l} style={{ padding: "8px 10px", background: "var(--surface)", borderRadius: 7, border: "1px solid var(--border2)" }}>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 12, color: "var(--text)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {parsed.notes && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, padding: "8px 10px", background: "var(--surface)", borderRadius: 7, borderLeft: `2px solid ${brand?.color || "var(--gold)"}` }}>{parsed.notes}</div>}
                </div>
              )}

              {error && <div style={{ fontSize: 12, color: "#e07b6a", padding: "10px 12px", background: "rgba(224,123,106,.08)", borderRadius: 8, border: "1px solid rgba(224,123,106,.2)", marginBottom: 12 }}>{error}</div>}

              {/* Parse button if not yet processed */}
              {!parsed && !processing && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Ready to parse — click below to let AI extract the initiative details from your brief.</div>
              )}
            </div>
          )}
        </div>

        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          {file && !parsed && !processing && (
            <button className="btn btn-gold" onClick={parseBrief}>✦ Parse Brief with AI</button>
          )}
          {parsed && !processing && (
            <button className="btn btn-gold" onClick={createCard}>Create Initiative Card →</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GANTT VIEWER
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// CONCEPTS PANEL — upload & host HTML files
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// CONCEPT VIEWER MODAL — full-screen HTML concept viewer for initiatives
// ════════════════════════════════════════════════════════════════════════════
function ConceptViewerModal({ init, onClose, onUpload, onNote }) {
  const color = getChannelColor(init.channel);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const submitNote = () => { if (onNote && noteText.trim()) { onNote({ section:"Concepts", type:"Concept", label:init.title, id:init.id, prefill:noteText.trim() }); setNoteText(""); setNoteOpen(false); } };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: "#07070f" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "rgba(7,7,15,.95)", backdropFilter: "blur(16px)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{init.title}</div>
            <div style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: ".09em" }}>
              {(init.channel || "").split(" · ")[1] || init.channel}
              {init.htmlConceptName && <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>· {init.htmlConceptName}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" onClick={() => { const blob = new Blob([init.htmlConcept], { type: "text/html" }); window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer"); }}>Open Full Screen ↗</button>
          <button className="btn btn-sm" onClick={onUpload}>↺ Replace</button>
          <button className="btn btn-sm" onClick={() => setNoteOpen(o => !o)} style={{ borderColor: noteOpen ? "var(--gold)":"rgba(255,255,255,.1)", color: noteOpen ? "var(--gold)":"var(--text-muted)" }}>✎ Note</button>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>×</button>
        </div>
      </div>
      {noteOpen && (
        <div style={{ padding:"12px 24px", borderBottom:"1px solid rgba(255,255,255,.07)", background:"rgba(7,7,15,.97)", flexShrink:0 }}>
          <div style={{ fontSize:10, color:"var(--gold)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6, fontWeight:600 }}>
            Note on concept: <span style={{ color:"#fff" }}>{init.title}</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) submitNote(); }}
              placeholder="Add your note… (⌘↵ to post)"
              style={{ flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, padding:"8px 11px", color:"#fff", fontFamily:"var(--bf)", fontSize:13, lineHeight:1.6, resize:"none", outline:"none", minHeight:64, transition:"border-color .15s" }}
              onFocus={e => e.target.style.borderColor="rgba(201,168,76,.5)"}
              onBlur={e => e.target.style.borderColor="rgba(255,255,255,.1)"} />
            <button onClick={submitNote} disabled={!noteText.trim()} style={{ alignSelf:"flex-end", padding:"6px 14px", borderRadius:7, border:"none", background:"var(--gold)", color:"#07070f", fontFamily:"var(--bf)", fontSize:11, fontWeight:600, cursor:"pointer", opacity:noteText.trim()?1:.4 }}>Post →</button>
          </div>
        </div>
      )}
      <iframe srcDoc={init.htmlConcept} title={init.title} sandbox="allow-scripts allow-forms allow-downloads" style={{ flex: 1, border: "none", width: "100%", background: "#fff" }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CONCEPT HTML UPLOAD MODAL — attach HTML to an existing initiative
// ════════════════════════════════════════════════════════════════════════════
function ConceptHtmlUploadModal({ initName, onClose, onSave }) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();
  const handleFile = (file) => {
    if (!file?.name.endsWith(".html")) return;
    const r = new FileReader();
    r.onload = e => onSave(e.target.result, file.name);
    r.readAsText(file);
  };
  const onDrop = useCallback(e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }, []);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="mhdr">
          <div className="mtitle">Attach Concept</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody">
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.7 }}>
            Attach an HTML concept file to <strong style={{ color: "var(--text)" }}>{initName}</strong>.
          </div>
          <div className={`bu-zone ${dragging ? "drag" : ""}`}
            style={{ minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}>
            <span style={{ fontSize: 32, marginBottom: 12, opacity: .5 }}>🎨</span>
            <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 6 }}>Drop your HTML concept here</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Any .html file · Renders live</div>
            <input ref={fileRef} type="file" accept=".html" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={() => fileRef.current.click()}>Browse Files</button>
        </div>
      </div>
    </div>
  );
}

function AddConceptModal({ brands, onClose, onSave, teamMembers }) {
  const brandList = brands ? Object.values(brands) : [];
  const [f, setF] = useState({ title: "", description: "", brandId: null, channel: CHANNELS[0], startDate: "", endDate: "", team: [] });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const selectedBrand = f.brandId ? brandList.find(b => b.id === f.brandId) : null;
  const accentColor = selectedBrand?.color || "var(--gold)";
  const [rightMode, setRightMode] = useState("brief");
  const [manualName, setManualName] = useState("");

  // Brief
  const [briefFile, setBriefFile] = useState(null);
  const [briefParsed, setBriefParsed] = useState(null);
  const [briefProcessing, setBriefProcessing] = useState(false);
  const [briefError, setBriefError] = useState(null);
  const [briefDragging, setBriefDragging] = useState(false);
  const briefRef = useRef();
  const ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp"];

  // Attached files
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [filesDragging, setFilesDragging] = useState(false);
  const filesRef = useRef();
  const FILE_ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp",".xls",".xlsx",".csv",".ppt",".pptx",".zip"];

  // HTML concept
  const [conceptHtml, setConceptHtml] = useState(null);
  const [conceptName, setConceptName] = useState(null);
  const [conceptDragging, setConceptDragging] = useState(false);
  const conceptRef = useRef();

  const addTeamMember = (name) => { if (!name.trim() || f.team.includes(name.trim())) return; s("team", [...f.team, name.trim()]); };
  const removeTeamMember = (name) => s("team", f.team.filter(n => n !== name));
  const handleAttachFiles = async (fileList) => {
    for (const file of Array.from(fileList)) {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!FILE_ACCEPTED.some(a => ext === a)) continue;
      const data = await new Promise((res) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      setAttachedFiles(p => [...p, { name: file.name, type: file.type, size: file.size, data }]);
    }
  };

  const handleBriefFile = (file) => {
    if (!file) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.some(a => ext === a)) { setBriefError("Unsupported type."); return; }
    setBriefFile(file); setBriefError(null); setBriefParsed(null);
  };

  const handleConceptFile = (file) => {
    if (!file?.name.endsWith(".html")) return;
    const r = new FileReader();
    r.onload = e => { setConceptHtml(e.target.result); setConceptName(file.name.replace(/\.html$/i,"")); if (!f.title) s("title", file.name.replace(/\.html$/i,"")); };
    r.readAsText(file);
  };

  const parseBrief = async () => {
    if (!briefFile) return;
    setBriefProcessing(true); setBriefError(null);
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(briefFile); });
      const ext = briefFile.name.split(".").pop().toLowerCase();
      const isImage = ["png","jpg","jpeg","webp"].includes(ext);
      const isText = ["txt","md"].includes(ext);
      const mediaType = briefFile.type || (ext === "pdf" ? "application/pdf" : isImage ? `image/${ext}` : "text/plain");
      let msgContent;
      if (isText) msgContent = [{ type: "text", text: `Brief:

${atob(base64)}` }];
      else if (isImage) msgContent = [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Extract key info from this brief." }];
      else msgContent = [{ type: "document", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Extract key info from this brief." }];
      const resp = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are a marketing strategist for CÚRADOR. Extract fields from this brief and respond ONLY with valid JSON:
{"title":"short concept title (max 8 words)","description":"2-3 sentence summary","keyPoints":["Point 1","Point 2","Point 3","Point 4"]}`,
          messages: [{ role: "user", content: msgContent }],
        }),
      });
      const data = await resp.json();
      const raw = data.content?.find(x => x.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setBriefParsed(parsed);
      if (parsed.title) s("title", parsed.title);
      if (parsed.description) s("description", parsed.description);
    } catch { setBriefError("Couldn't parse — try again."); }
    setBriefProcessing(false);
  };

  const handleSave = async () => {
    if (!f.title.trim() && !conceptName) return;
    // Read brief file data if available
    let fileData = null;
    let fileType = null;
    if (briefFile) {
      fileType = briefFile.type || null;
      try {
        fileData = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(briefFile); });
      } catch {}
    }
    onSave({
      id: `concept-${Date.now()}`,
      name: f.title.trim() || conceptName || "Untitled",
      description: f.description,
      brandId: f.brandId,
      channel: f.channel,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      team: f.team,
      html: conceptHtml || null,
      brief: briefParsed ? { title: briefParsed.title || f.title, description: briefParsed.description || f.description, keyPoints: briefParsed.keyPoints || [] } : null,
      briefFile: briefFile?.name || null,
      briefFileData: fileData,
      briefFileType: fileType,
      _attachedFiles: attachedFiles,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 860 }}>
        <div className="mhdr" style={{ borderTop: `2px solid ${accentColor}`, borderRadius: "16px 16px 0 0" }}>
          <div className="mtitle">New Concept</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {/* LEFT — form */}
          <div style={{ padding: "18px 20px", overflowY: "auto", borderRight: "1px solid var(--border2)", maxHeight: "68vh" }}>
            <div className="ff">
              <label className="fl">Brand</label>
              <div className="brand-sel-row">
                <button className={`brand-sel-chip ${f.brandId === null ? "on" : ""}`}
                  style={{ borderColor: f.brandId === null ? "var(--gold)" : "var(--border)", background: f.brandId === null ? "var(--gold-dim)" : "transparent", color: f.brandId === null ? "var(--gold)" : "var(--text-muted)" }}
                  onClick={() => s("brandId", null)}>
                  <div className="brand-sel-pip" style={{ background: "var(--gold)" }} /> CÚRADOR
                </button>
                {brandList.map(b => (
                  <button key={b.id} className={`brand-sel-chip ${f.brandId === b.id ? "on" : ""}`}
                    style={{ borderColor: f.brandId === b.id ? b.color+"88":"var(--border)", background: f.brandId === b.id ? b.color+"14":"transparent", color: f.brandId === b.id ? b.color:"var(--text-muted)" }}
                    onClick={() => s("brandId", b.id)}>
                    <div className="brand-sel-pip" style={{ background: b.color }} />{b.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="ff"><label className="fl">Title *</label><input className="fi" placeholder="e.g. Summer Campaign Concept" value={f.title} onChange={e => s("title", e.target.value)} /></div>
            <div className="ff"><label className="fl">Description</label><textarea className="fta" placeholder="What is this concept?" value={f.description} onChange={e => s("description", e.target.value)} /></div>
            <div className="ff"><label className="fl">Channel</label>
              <select className="fsel" value={f.channel} onChange={e => s("channel", e.target.value)}>
                {CHANNELS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="frow">
              <div className="ff"><label className="fl">Start Date</label><input className="fi" type="date" value={f.startDate} onChange={e => s("startDate", e.target.value)} /></div>
              <div className="ff"><label className="fl">End Date</label><input className="fi" type="date" value={f.endDate} onChange={e => s("endDate", e.target.value)} /></div>
            </div>
            <div className="ff">
              <label className="fl">Team</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {f.team.map(name => (
                  <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", fontSize: 11, color: "var(--gold)" }}>
                    {name}
                    <span onClick={() => removeTeamMember(name)} style={{ cursor: "pointer", opacity: .6, fontSize: 13, lineHeight: 1 }}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(teamMembers || []).length > 0 && (
                  <select className="fsel" value="" onChange={e => { if (e.target.value) { addTeamMember(e.target.value); e.target.value = ""; } }} style={{ flex: 1 }}>
                    <option value="">Select team member...</option>
                    {(teamMembers || []).filter(m => !f.team.includes(m.name)).map(m => <option key={m.name} value={m.name}>{m.name}{m.role ? ` — ${m.role}` : ""}</option>)}
                  </select>
                )}
                <div style={{ display: "flex", gap: 4, flex: 1 }}>
                  <input className="fi" placeholder="Add name manually" value={manualName} onChange={e => setManualName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { addTeamMember(manualName); setManualName(""); } }}
                    style={{ flex: 1 }} />
                  <button type="button" className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", flexShrink: 0 }}
                    onClick={() => { addTeamMember(manualName); setManualName(""); }}>+</button>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT — tabs */}
          <div style={{ display: "flex", flexDirection: "column", maxHeight: "68vh" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
              {[["brief","📎 Brief"],["files","📁 Files"],["concept","🎨 HTML"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setRightMode(mode)} style={{
                  flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontFamily: "var(--bf)", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
                  background: rightMode === mode ? "var(--surface2)" : "transparent",
                  color: rightMode === mode ? accentColor : "var(--text-muted)",
                  borderBottom: rightMode === mode ? `2px solid ${accentColor}` : "2px solid transparent",
                }}>{label}</button>
              ))}
            </div>
            <div style={{ flex: 1, padding: "16px 18px", overflowY: "auto" }}>
              {rightMode === "brief" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Drop a brief — AI reads it and fills the form.</div>
                  {!briefFile ? (
                    <div className={`bu-zone ${briefDragging ? "drag" : ""}`} style={{ minHeight: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      onDragOver={e => { e.preventDefault(); setBriefDragging(true); }} onDragLeave={() => setBriefDragging(false)}
                      onDrop={e => { e.preventDefault(); setBriefDragging(false); handleBriefFile(e.dataTransfer.files[0]); }}
                      onClick={() => briefRef.current.click()}>
                      <span className="bu-icon">📎</span>
                      <div className="bu-title">Drop brief here</div>
                      <div className="bu-sub">PDF · Word · Image · Text</div>
                      <input ref={briefRef} type="file" accept={ACCEPTED.join(",")} style={{ display: "none" }} onChange={e => handleBriefFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="bu-file-row">
                        <span>📎</span><div className="bu-file-name">{briefFile.name}</div>
                        <button className="bu-file-rm" onClick={() => { setBriefFile(null); setBriefParsed(null); }}>✕</button>
                      </div>
                      {briefProcessing && <div className="bu-processing"><div className="ai-dot"/><div className="ai-dot"/><div className="ai-dot"/><div className="bu-proc-txt">Reading brief…</div></div>}
                      {briefParsed && !briefProcessing && (
                        <div style={{ padding:"10px 12px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.18)", borderRadius:9 }}>
                          <div style={{ fontSize:9, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gold)", fontWeight:600, marginBottom:6 }}>✦ Form filled from brief</div>
                          {(briefParsed.keyPoints||[]).map((pt,i) => (
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:11, color:"var(--text-dim)", marginBottom:4 }}>
                              <div style={{ width:16, height:16, borderRadius:"50%", background:"rgba(201,168,76,.15)", border:"1px solid rgba(201,168,76,.25)", display:"grid", placeItems:"center", fontSize:8, fontWeight:700, color:"var(--gold)", flexShrink:0 }}>{i+1}</div>
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {briefError && <div style={{ fontSize:11, color:"#e07b6a", padding:"8px 10px", background:"rgba(224,123,106,.08)", borderRadius:7 }}>{briefError}</div>}
                      {!briefParsed && !briefProcessing && <button className="btn btn-gold" style={{ width:"100%" }} onClick={parseBrief}>✦ Parse with AI</button>}
                    </div>
                  )}
                </div>
              )}
              {rightMode === "files" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Attach supporting files — decks, images, spreadsheets, docs.</div>
                  <div className={`bu-zone ${filesDragging ? "drag" : ""}`}
                    style={{ minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                    onDragOver={e => { e.preventDefault(); setFilesDragging(true); }}
                    onDragLeave={() => setFilesDragging(false)}
                    onDrop={e => { e.preventDefault(); setFilesDragging(false); handleAttachFiles(e.dataTransfer.files); }}
                    onClick={() => filesRef.current.click()}>
                    <span className="bu-icon">📁</span>
                    <div className="bu-title">Drop files here</div>
                    <div className="bu-sub">PDF · Word · Image · Excel · PowerPoint · CSV</div>
                    <input ref={filesRef} type="file" accept={FILE_ACCEPTED.join(",")} multiple style={{ display: "none" }} onChange={e => handleAttachFiles(e.target.files)} />
                  </div>
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {attachedFiles.map((af, i) => (
                        <div key={i} className="bu-file-row">
                          <span style={{ fontSize: 14 }}>{af.type?.startsWith("image/") ? "🖼" : "📄"}</span>
                          <div className="bu-file-name">{af.name}</div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{(af.size / 1024).toFixed(0)} KB</span>
                          <button className="bu-file-rm" onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {rightMode === "concept" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Drop an HTML file — it renders live in the Concepts panel.</div>
                  {!conceptHtml ? (
                    <div className={`bu-zone ${conceptDragging ? "drag" : ""}`} style={{ minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      onDragOver={e => { e.preventDefault(); setConceptDragging(true); }} onDragLeave={() => setConceptDragging(false)}
                      onDrop={e => { e.preventDefault(); setConceptDragging(false); handleConceptFile(e.dataTransfer.files[0]); }}
                      onClick={() => conceptRef.current.click()}>
                      <span className="bu-icon">🎨</span>
                      <div className="bu-title">Drop HTML concept</div>
                      <div className="bu-sub">Any .html file · Renders live</div>
                      <input ref={conceptRef} type="file" accept=".html" style={{ display: "none" }} onChange={e => handleConceptFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="bu-file-row">
                        <span>🎨</span><div className="bu-file-name">{conceptName}</div>
                        <button className="bu-file-rm" onClick={() => { setConceptHtml(null); setConceptName(null); }}>✕</button>
                      </div>
                      <div style={{ height: 180, borderRadius: 9, overflow: "hidden", position: "relative", background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <iframe srcDoc={conceptHtml} style={{ width:"200%", height:"200%", border:"none", transform:"scale(0.5)", transformOrigin:"0 0", pointerEvents:"none" }} sandbox="allow-scripts" title="preview" />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 60%,rgba(7,7,15,.8) 100%)" }} />
                        <div style={{ position:"absolute", bottom:8, left:10, fontSize:10, color:"var(--text-dim)" }}>Live preview · {conceptName}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={!f.title.trim() && !conceptName} onClick={handleSave}>
            Add Concept{briefFile ? " + Brief" : ""}{conceptHtml ? " + HTML" : ""}{attachedFiles.length > 0 ? ` + ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditConceptModal({ concept, brands, onClose, onSave, teamMembers }) {
  const brandList = brands ? Object.values(brands) : [];
  const [f, setF] = useState({
    name: concept.name || "",
    description: concept.description || concept.brief?.description || "",
    brandId: concept.brandId || null,
    channel: concept.channel || CHANNELS[0],
    startDate: concept.startDate || "",
    endDate: concept.endDate || "",
    team: concept.team || [],
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const selectedBrand = f.brandId ? brandList.find(b => b.id === f.brandId) : null;
  const accentColor = selectedBrand?.color || "var(--gold)";
  const [manualName, setManualName] = useState("");

  const addTeamMember = (name) => { if (!name.trim() || f.team.includes(name.trim())) return; s("team", [...f.team, name.trim()]); };
  const removeTeamMember = (name) => s("team", f.team.filter(n => n !== name));

  const handleSave = () => {
    if (!f.name.trim()) return;
    onSave({
      name: f.name.trim(),
      description: f.description,
      brandId: f.brandId,
      channel: f.channel,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      team: f.team,
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="mhdr" style={{ borderTop: `2px solid ${accentColor}`, borderRadius: "16px 16px 0 0" }}>
          <div className="mtitle">Edit Concept</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
          <div className="ff">
            <label className="fl">Brand</label>
            <div className="brand-sel-row">
              <button className={`brand-sel-chip ${f.brandId === null ? "on" : ""}`}
                style={{ borderColor: f.brandId === null ? "var(--gold)" : "var(--border)", background: f.brandId === null ? "var(--gold-dim)" : "transparent", color: f.brandId === null ? "var(--gold)" : "var(--text-muted)" }}
                onClick={() => s("brandId", null)}>
                <div className="brand-sel-pip" style={{ background: "var(--gold)" }} /> CURADOR
              </button>
              {brandList.map(b => (
                <button key={b.id} className={`brand-sel-chip ${f.brandId === b.id ? "on" : ""}`}
                  style={{ borderColor: f.brandId === b.id ? b.color+"88":"var(--border)", background: f.brandId === b.id ? b.color+"14":"transparent", color: f.brandId === b.id ? b.color:"var(--text-muted)" }}
                  onClick={() => s("brandId", b.id)}>
                  <div className="brand-sel-pip" style={{ background: b.color }} />{b.name}
                </button>
              ))}
            </div>
          </div>
          <div className="ff"><label className="fl">Title *</label><input className="fi" value={f.name} onChange={e => s("name", e.target.value)} /></div>
          <div className="ff"><label className="fl">Description</label><textarea className="fta" rows={4} placeholder="Add details about this concept..." value={f.description} onChange={e => s("description", e.target.value)} /></div>
          <div className="ff"><label className="fl">Channel</label>
            <select className="fsel" value={f.channel} onChange={e => s("channel", e.target.value)}>
              {CHANNELS.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="frow">
            <div className="ff"><label className="fl">Start Date</label><input className="fi" type="date" value={f.startDate} onChange={e => s("startDate", e.target.value)} /></div>
            <div className="ff"><label className="fl">End Date</label><input className="fi" type="date" value={f.endDate} onChange={e => s("endDate", e.target.value)} /></div>
          </div>
          <div className="ff">
            <label className="fl">Team</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {f.team.map(name => (
                <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 100, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", fontSize: 11, color: "var(--gold)" }}>
                  {name}
                  <span onClick={() => removeTeamMember(name)} style={{ cursor: "pointer", opacity: .6, fontSize: 13, lineHeight: 1 }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(teamMembers || []).length > 0 && (
                <select className="fsel" value="" onChange={e => { if (e.target.value) { addTeamMember(e.target.value); e.target.value = ""; } }} style={{ flex: 1 }}>
                  <option value="">Select team member...</option>
                  {(teamMembers || []).filter(m => !f.team.includes(m.name)).map(m => <option key={m.name} value={m.name}>{m.name}{m.role ? ` — ${m.role}` : ""}</option>)}
                </select>
              )}
              <div style={{ display: "flex", gap: 4, flex: 1 }}>
                <input className="fi" placeholder="Add name manually" value={manualName} onChange={e => setManualName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { addTeamMember(manualName); setManualName(""); } }}
                  style={{ flex: 1 }} />
                <button type="button" className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", flexShrink: 0 }}
                  onClick={() => { addTeamMember(manualName); setManualName(""); }}>+</button>
              </div>
            </div>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={!f.name.trim()} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function ConceptsPanel({ concepts, activeConceptId, setActiveConceptId, onAdd, onRemove, onRename, onUpdateConcept, brands, teamMembers, canEdit, onPushToCampaign, onPushToInitiative, onNote }) {
  const [dragging, setDragging] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // concept object to edit
  const [showPushMenu, setShowPushMenu] = useState(false);
  const [pushChannel, setPushChannel] = useState(CHANNELS[0]);
  const [fileViewer, setFileViewer] = useState(null); // { data, name, type, conceptName }
  const [viewerNote, setViewerNote] = useState("");
  const [loadedHtml, setLoadedHtml] = useState({}); // { [id]: html } — loaded on demand

  // Load HTML from storage when concept is selected
  useEffect(() => {
    if (!activeConceptId) return;
    const concept = concepts.find(c => c.id === activeConceptId);
    if (!concept) return;
    // Already loaded inline (new upload not yet saved)
    if (concept.html && !loadedHtml[activeConceptId]) {
      setLoadedHtml(p => ({ ...p, [activeConceptId]: concept.html }));
      return;
    }
    if (loadedHtml[activeConceptId]) return;
    // Load from storage
    window.storage.get(`ns-ch-${activeConceptId}`, true)
      .then(r => { if (r?.value) setLoadedHtml(p => ({ ...p, [activeConceptId]: r.value })); })
      .catch(() => {});
  }, [activeConceptId, concepts]);

  const handleAdd = async (concept) => {
    const { html, ...meta } = concept;
    // Store HTML separately in shared storage (keeps metadata array small)
    if (html) {
      await window.storage.set(`ns-ch-${concept.id}`, html, true).catch(() => {});
      setLoadedHtml(p => ({ ...p, [concept.id]: html }));
    }
    onAdd(meta);
    setActiveConceptId(concept.id);
    setShowAddModal(false);
  };

  const handleRemove = async (id) => {
    await window.storage.delete(`ns-ch-${id}`, true).catch(() => {});
    setLoadedHtml(p => { const n = { ...p }; delete n[id]; return n; });
    onRemove(id);
  };

  const activeConcept = concepts.find(c => c.id === activeConceptId);
  const activeHtml = activeConceptId ? loadedHtml[activeConceptId] : null;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {showAddModal && <AddConceptModal brands={brands} teamMembers={teamMembers} onClose={() => setShowAddModal(false)} onSave={handleAdd} />}
      {showEditModal && <EditConceptModal concept={showEditModal} brands={brands} teamMembers={teamMembers} onClose={() => setShowEditModal(null)} onSave={(updates) => {
        if (onUpdateConcept) onUpdateConcept(showEditModal.id, updates);
        setShowEditModal(null);
      }} />}

      {/* LEFT — list */}
      <div style={{ width: 230, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
        <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid var(--border2)" }}>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>Creative Studio</div>
          <div style={{ fontFamily: "var(--df)", fontSize: 20, fontWeight: 300, color: "var(--text)", lineHeight: 1.1, marginBottom: 6 }}>Concepts</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 10 }}>Store briefs, HTML prototypes, and creative decks. Push to an initiative or campaign when ready.</div>
          <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center", fontSize: 11 }} onClick={() => setShowAddModal(true)}>
            + New Concept
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
          {concepts.length === 0 ? (
            <div style={{ padding: "20px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: 11, lineHeight: 1.7, fontStyle: "italic" }}>
              No concepts yet.<br />Click + New Concept to add one.
            </div>
          ) : concepts.map(c => {
            const brand = c.brandId ? Object.values(brands || {}).find(b => b.id === c.brandId) : null;
            return (
              <div key={c.id} onClick={() => setActiveConceptId(c.id)} style={{
                padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 3,
                background: activeConceptId === c.id ? "var(--gold-dim)" : "transparent",
                border: `1px solid ${activeConceptId === c.id ? "rgba(201,168,76,.3)" : "transparent"}`,
                transition: "all .13s",
              }}
                onMouseEnter={e => { if (activeConceptId !== c.id) e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
                onMouseLeave={e => { if (activeConceptId !== c.id) e.currentTarget.style.background = "transparent"; }}
              >
                {renaming === c.id ? (
                  <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                    onBlur={() => { if (onRename) onRename(c.id, renameVal || c.name); setRenaming(null); }}
                    onKeyDown={e => { if (e.key === "Enter") { if (onRename) onRename(c.id, renameVal || c.name); setRenaming(null); } if (e.key === "Escape") setRenaming(null); }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--gold)", borderRadius: 4, padding: "2px 6px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {brand && <div style={{ width: 7, height: 7, borderRadius: "50%", background: brand.color, flexShrink: 0 }} />}
                      <span style={{ fontSize: 12, color: activeConceptId === c.id ? "var(--gold)" : "var(--text)", fontWeight: activeConceptId === c.id ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      {c.channel && <div style={{ fontSize: 9, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{(c.channel||"").split(" · ")[1] || c.channel}</div>}
                      {c.status === "campaign" && <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 100, background: "rgba(201,168,76,.12)", color: "var(--gold)", fontWeight: 600, letterSpacing: ".04em", whiteSpace: "nowrap" }}>→ Campaign</span>}
                      {c.status === "initiative" && <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 100, background: "rgba(77,158,142,.12)", color: "#4d9e8e", fontWeight: 600, letterSpacing: ".04em", whiteSpace: "nowrap" }}>→ Initiative</span>}
                    </div>
                  </div>
                )}
                {activeConceptId === c.id && renaming !== c.id && (
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <button onClick={e => { e.stopPropagation(); setShowEditModal(c); }}
                      style={{ flex: 1, fontSize: 9, padding: "3px 0", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 4, color: "var(--gold)", cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>Edit</button>
                    {onRename && <button onClick={e => { e.stopPropagation(); setRenaming(c.id); setRenameVal(c.name); }}
                      style={{ flex: 1, fontSize: 9, padding: "3px 0", background: "rgba(255,255,255,.05)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-muted)", cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>Rename</button>}
                    {onRemove && <button onClick={e => { e.stopPropagation(); handleRemove(c.id); }}
                      style={{ flex: 1, fontSize: 9, padding: "3px 0", background: "rgba(224,123,106,.08)", border: "1px solid rgba(224,123,106,.2)", borderRadius: 4, color: "#e07b6a", cursor: "pointer", letterSpacing: ".06em", textTransform: "uppercase" }}>Delete</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT — viewer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeConcept && activeHtml ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13 }}>🎨</span>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{activeConcept.name}</div>
                {activeConcept.channel && <div style={{ fontSize: 10, color: "var(--gold)", padding: "1px 8px", border: "1px solid rgba(201,168,76,.25)", borderRadius: 100 }}>{(activeConcept.channel||"").split(" · ")[1]||activeConcept.channel}</div>}
                <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "1px 8px", border: "1px solid var(--border2)", borderRadius: 100 }}>
                  {new Date(activeConcept.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}
                </div>
              </div>
              <div style={{ display: "flex", gap: 7, alignItems: "center", position: "relative" }}>
                {activeConcept.status !== "campaign" && activeConcept.status !== "initiative" && onPushToCampaign && (
                  <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}
                    onClick={() => { onPushToCampaign(activeConcept); }}>→ Campaign</button>
                )}
                {activeConcept.status !== "initiative" && onPushToInitiative && (
                  <button className="btn btn-sm" style={{ borderColor: "rgba(77,158,142,.3)", color: "#4d9e8e" }}
                    onClick={() => setShowPushMenu(o => !o)}>→ Initiative</button>
                )}
                {showPushMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", boxShadow: "0 12px 40px rgba(0,0,0,.4)", zIndex: 20, width: 260 }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Push to Initiative</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 10 }}>Select a marketing channel:</div>
                    <select value={pushChannel} onChange={e => setPushChannel(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", marginBottom: 10, outline: "none" }}>
                      {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
                      <button className="btn btn-sm" onClick={() => setShowPushMenu(false)}>Cancel</button>
                      <button className="btn btn-sm" style={{ borderColor: "rgba(77,158,142,.4)", color: "#4d9e8e", fontWeight: 600 }}
                        onClick={() => { onPushToInitiative(activeConcept, pushChannel, activeHtml); setShowPushMenu(false); }}>Confirm →</button>
                    </div>
                  </div>
                )}
                <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.2)", color: "var(--gold)" }} onClick={() => setShowEditModal(activeConcept)}>Edit</button>
                <button className="btn btn-sm" onClick={() => { const blob = new Blob([activeHtml],{type:"text/html"}); window.open(URL.createObjectURL(blob),"_blank","noopener,noreferrer"); }}>Open ↗</button>
                <button className="btn btn-sm" onClick={() => { const blob = new Blob([activeHtml],{type:"text/html"}); const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=activeConcept.name+".html"; a.click(); }}>↓ Download</button>
              </div>
            </div>
            {activeConcept.brief?.keyPoints?.length > 0 && (
              <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border2)", background: "rgba(201,168,76,.03)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                {activeConcept.brief.keyPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "var(--text-dim)" }}>
                    <div style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.2)", display: "grid", placeItems: "center", fontSize: 7, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>{i+1}</div>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}
            <iframe key={activeConcept.id} srcDoc={activeHtml} title={activeConcept.name} sandbox="allow-scripts allow-forms allow-downloads" style={{ flex: 1, border: "none", width: "100%", background: "#fff" }} />
          </>
        ) : activeConcept && !activeHtml ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13 }}>🎨</span>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{activeConcept.name}</div>
                {activeConcept.channel && <div style={{ fontSize: 10, color: "var(--gold)", padding: "1px 8px", border: "1px solid rgba(201,168,76,.25)", borderRadius: 100 }}>{(activeConcept.channel||"").split(" · ")[1]||activeConcept.channel}</div>}
              </div>
              <div style={{ display: "flex", gap: 7, alignItems: "center", position: "relative" }}>
                {activeConcept.status !== "campaign" && activeConcept.status !== "initiative" && onPushToCampaign && (
                  <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}
                    onClick={() => { onPushToCampaign(activeConcept); }}>→ Campaign</button>
                )}
                {activeConcept.status !== "initiative" && onPushToInitiative && (
                  <button className="btn btn-sm" style={{ borderColor: "rgba(77,158,142,.3)", color: "#4d9e8e" }}
                    onClick={() => setShowPushMenu(o => !o)}>→ Initiative</button>
                )}
                <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.2)", color: "var(--gold)" }} onClick={() => setShowEditModal(activeConcept)}>Edit</button>
                {showPushMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", boxShadow: "0 12px 40px rgba(0,0,0,.4)", zIndex: 20, width: 260 }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Push to Initiative</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 10 }}>Select a marketing channel:</div>
                    <select value={pushChannel} onChange={e => setPushChannel(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", marginBottom: 10, outline: "none" }}>
                      {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
                      <button className="btn btn-sm" onClick={() => setShowPushMenu(false)}>Cancel</button>
                      <button className="btn btn-sm" style={{ borderColor: "rgba(77,158,142,.4)", color: "#4d9e8e", fontWeight: 600 }}
                        onClick={() => { onPushToInitiative(activeConcept, pushChannel, null); setShowPushMenu(false); }}>Confirm →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
              <div style={{ maxWidth: 640 }}>
                {/* Title */}
                <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)", marginBottom: 6, lineHeight: 1.2 }}>{activeConcept.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
                  {activeConcept.brandId && (() => { const br = Object.values(brands || {}).find(b => b.id === activeConcept.brandId); return br ? <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 100, background: br.color+"18", color: br.color, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>{br.name}</span> : null; })()}
                  {activeConcept.channel && <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 100, background: "rgba(201,168,76,.08)", color: "var(--gold)", border: "1px solid rgba(201,168,76,.2)" }}>{(activeConcept.channel||"").split(" · ")[1]||activeConcept.channel}</span>}
                  {activeConcept.status && activeConcept.status !== "draft" && (
                    <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 100, background: activeConcept.status === "campaign" ? "rgba(201,168,76,.12)" : "rgba(77,158,142,.12)", color: activeConcept.status === "campaign" ? "var(--gold)" : "#4d9e8e", fontWeight: 600 }}>
                      → {activeConcept.status === "campaign" ? "Campaign" : "Initiative"}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(activeConcept.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
                </div>

                {/* Description / Overview */}
                {(activeConcept.description || activeConcept.brief?.description) && (
                  <div style={{ marginBottom: 24, padding: "18px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 8 }}>Overview</div>
                    <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.8 }}>{activeConcept.brief?.description || activeConcept.description}</div>
                  </div>
                )}

                {/* Key Points */}
                {activeConcept.brief?.keyPoints?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 12 }}>Key Points</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {activeConcept.brief.keyPoints.map((pt, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>{i+1}</div>
                          <span style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65, paddingTop: 2 }}>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Brief File */}
                {activeConcept.briefFile && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Attached Brief</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                      <span style={{ fontSize: 22 }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{activeConcept.briefFile}</div>
                      </div>
                      {activeConcept.briefFileData && (
                        <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}
                          onClick={() => setFileViewer({ data: activeConcept.briefFileData, name: activeConcept.briefFile, type: activeConcept.briefFileType, conceptName: activeConcept.name })}>View</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Channel detail */}
                {activeConcept.channel && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Marketing Channel</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{activeConcept.channel}</div>
                  </div>
                )}

                {/* Empty state */}
                {!activeConcept.description && !activeConcept.brief?.description && !activeConcept.brief?.keyPoints?.length && !activeConcept.briefFile && (
                  <div style={{ padding: "32px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 28, opacity: .2, marginBottom: 10 }}>🎨</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No brief or details attached yet.</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, opacity: .7 }}>Add a description, upload a brief, or attach an HTML concept.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); }}
          >
            <div style={{ textAlign: "center", padding: "60px 40px", borderRadius: 20, border: `2px dashed ${dragging ? "var(--gold)" : "var(--border)"}`, background: dragging ? "rgba(201,168,76,.04)" : "transparent", transition: "all .2s", maxWidth: 480 }}>
              <div style={{ fontSize: 40, marginBottom: 18, opacity: .5 }}>🎨</div>
              <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)", marginBottom: 10 }}>
                {concepts.length > 0 ? "Select a concept" : "No concepts yet"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.75, marginBottom: 24 }}>
                Add concepts with briefs, HTML prototypes, or both. Stored and shared with the whole team.
              </div>
              <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>+ New Concept</button>
            </div>
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {fileViewer && (
        <div className="overlay" onClick={() => setFileViewer(null)} style={{ zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "90vw", maxWidth: 1100, height: "85vh", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.6)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{fileViewer.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fileViewer.conceptName}</div>
                </div>
              </div>
              <button onClick={() => setFileViewer(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>×</button>
            </div>
            {/* Body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* File preview */}
              <div style={{ flex: 1, overflow: "hidden", background: "#fff" }}>
                {(fileViewer.type || "").startsWith("image/") ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", overflow: "auto" }}>
                    <img src={fileViewer.data} alt={fileViewer.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                ) : (fileViewer.type || "").includes("pdf") ? (
                  <iframe src={fileViewer.data} title={fileViewer.name} style={{ width: "100%", height: "100%", border: "none" }} />
                ) : (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>📄</div>
                    <div style={{ fontSize: 13 }}>Preview not available for this file type</div>
                    <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => { const a = document.createElement("a"); a.href = fileViewer.data; a.download = fileViewer.name; a.click(); }}>↓ Download</button>
                  </div>
                )}
              </div>
              {/* Notes sidebar */}
              <div style={{ width: 280, flexShrink: 0, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border2)" }}>
                  <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>Notes</div>
                </div>
                <div style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.65 }}>Add a note about this brief — it will appear in the main notes panel.</div>
                </div>
                <div style={{ padding: "12px", borderTop: "1px solid var(--border2)" }}>
                  <textarea value={viewerNote} onChange={e => setViewerNote(e.target.value)}
                    placeholder="Add your note… (⌘↵ to post)"
                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && viewerNote.trim() && onNote) { onNote(viewerNote, fileViewer.conceptName); setViewerNote(""); } }}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontFamily: "var(--bf)", fontSize: 12, lineHeight: 1.6, resize: "none", outline: "none", minHeight: 64, boxSizing: "border-box", transition: "border-color .15s" }}
                    onFocus={e => e.target.style.borderColor = "rgba(201,168,76,.35)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  <button disabled={!viewerNote.trim()} onClick={() => { if (onNote && viewerNote.trim()) { onNote(viewerNote, fileViewer.conceptName); setViewerNote(""); } }}
                    style={{ marginTop: 6, width: "100%", padding: "7px", borderRadius: 7, border: "none", background: viewerNote.trim() ? "var(--gold)" : "rgba(255,255,255,.06)", color: viewerNote.trim() ? "var(--bg)" : "var(--text-muted)", fontFamily: "var(--bf)", fontSize: 11, fontWeight: 600, cursor: viewerNote.trim() ? "pointer" : "not-allowed", transition: "all .15s" }}>Post Note →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CAMPAIGN TIMELINE PANEL ─── */
function CampaignTimelinePanel({ campaignTimeline, setCampaignTimeline, campaigns, brands }) {
  const dragRef = useRef(null);
  const [collapsed, setCollapsed] = useState({});
  const toggleCollapse = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  // Build 12-month rolling window starting from current month
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(windowStart.getFullYear(), windowStart.getMonth() + m, 1);
    months.push(d);
  }
  const rangeStart = months[0].getTime();
  const rangeEnd = new Date(months[11].getFullYear(), months[11].getMonth() + 1, 0, 23, 59, 59).getTime();
  const rangeDur = rangeEnd - rangeStart || 1;

  const dateToPercent = (dateStr) => {
    if (!dateStr) return 0;
    const t = new Date(dateStr + "T12:00:00").getTime();
    return Math.max(0, Math.min(100, ((t - rangeStart) / rangeDur) * 100));
  };

  const percentToDate = (pct) => {
    const t = rangeStart + (pct / 100) * rangeDur;
    return new Date(t).toISOString().slice(0, 10);
  };

  const fmtCost = (v) => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0;
    if (n === 0) return "$0";
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const updateEntry = (id, patch) => setCampaignTimeline(p => p.map(e => e.id === id ? { ...e, ...patch } : e));
  const updateElement = (entryId, elId, patch) => setCampaignTimeline(p => p.map(e => e.id !== entryId ? e : { ...e, elements: e.elements.map(el => el.id === elId ? { ...el, ...patch } : el) }));
  const deleteElement = (entryId, elId) => setCampaignTimeline(p => p.map(e => e.id !== entryId ? e : { ...e, elements: e.elements.filter(el => el.id !== elId) }));
  const addElement = (entryId) => {
    setCampaignTimeline(p => p.map(e => {
      if (e.id !== entryId) return e;
      return { ...e, elements: [...e.elements, { id: `el-${Date.now()}`, label: "New Element", startDate: e.startDate, endDate: e.endDate, cost: 0 }] };
    }));
  };

  const startDrag = (e, entryId, elId, handle) => {
    e.preventDefault();
    const track = e.currentTarget.closest(".ctl-bar-track");
    if (!track) return;
    const rect = track.getBoundingClientRect();
    dragRef.current = { entryId, elId, handle, rect };

    const onMove = (mv) => {
      if (!dragRef.current) return;
      const { entryId: eid, elId: kid, handle: h, rect: r } = dragRef.current;
      const rawPct = ((mv.clientX - r.left) / r.width) * 100;
      const pct = Math.max(0, Math.min(100, rawPct));
      const newDate = percentToDate(pct);
      if (kid) {
        setCampaignTimeline(p => p.map(en => {
          if (en.id !== eid) return en;
          return { ...en, elements: en.elements.map(el => {
            if (el.id !== kid) return el;
            if (h === "start") {
              const endPct = dateToPercent(el.endDate);
              if (pct >= endPct) return el;
              return { ...el, startDate: newDate };
            } else {
              const startPct = dateToPercent(el.startDate);
              if (pct <= startPct) return el;
              return { ...el, endDate: newDate };
            }
          })};
        }));
      } else {
        setCampaignTimeline(p => p.map(en => {
          if (en.id !== eid) return en;
          if (h === "start") {
            const endPct = dateToPercent(en.endDate);
            if (pct >= endPct) return en;
            return { ...en, startDate: newDate };
          } else {
            const startPct = dateToPercent(en.startDate);
            if (pct <= startPct) return en;
            return { ...en, endDate: newDate };
          }
        }));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const renderBar = (color, startDate, endDate, entryId, elId = null) => {
    const leftPct = dateToPercent(startDate);
    const rightPct = dateToPercent(endDate);
    const widthPct = Math.max(0.5, rightPct - leftPct);
    const barColor = elId ? color + "bb" : color;
    return (
      <div className="ctl-bar" style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: barColor }}>
        {/* Left handle */}
        <div className="ctl-handle ctl-handle-l" onMouseDown={e => startDrag(e, entryId, elId, "start")} style={{ background: "rgba(0,0,0,.25)" }}>
          <div className="ctl-handle-pip" />
        </div>
        {/* Right handle */}
        <div className="ctl-handle ctl-handle-r" onMouseDown={e => startDrag(e, entryId, elId, "end")} style={{ background: "rgba(0,0,0,.25)" }}>
          <div className="ctl-handle-pip" />
        </div>
      </div>
    );
  };

  const totalCost = (entry) => {
    const base = parseFloat(String(entry.cost).replace(/[^0-9.]/g, "")) || 0;
    const elTotal = (entry.elements || []).reduce((s, el) => s + (parseFloat(String(el.cost).replace(/[^0-9.]/g, "")) || 0), 0);
    return base + elTotal;
  };

  if (campaignTimeline.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: 14 }}>
        <div style={{ fontSize: 28, marginBottom: 12, opacity: .3 }}>📅</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 6 }}>No timeline entries yet</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Timeline entries are created automatically when you add a campaign</div>
      </div>
    );
  }

  return (
    <div className="ctl-wrap" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {/* Header row with month labels */}
      <div className="ctl-grid-hdr">
        <div className="ctl-label-col">Campaign</div>
        <div className="ctl-cost-col">Budget</div>
        <div className="ctl-bar-area">
          {months.map((m, i) => (
            <div key={i} className="ctl-month-cell">
              {m.toLocaleString("en", { month: "short" })} <span style={{ opacity: .5 }}>{String(m.getFullYear()).slice(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign rows */}
      {campaignTimeline.map(entry => {
        const brand = Object.values(brands).find(b => b.name === entry.brand);
        const color = entry.color || brand?.color || "#c9a84c";
        const tc = totalCost(entry);
        return (
          <div key={entry.id}>
            {/* Campaign row */}
            <div className="ctl-row" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="ctl-row-label">
                {/* Collapse toggle */}
                <button
                  onClick={() => toggleCollapse(entry.id)}
                  title={collapsed[entry.id] ? "Expand sub-elements" : "Collapse sub-elements"}
                  style={{ width: 18, height: 18, borderRadius: 4, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color + "66"; e.currentTarget.style.color = color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <span style={{ display: "inline-block", transition: "transform .18s", transform: collapsed[entry.id] ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
                </button>
                <div className="ctl-brand-dot" style={{ background: color }} />
                <span className="ctl-row-name" title={entry.title}>{entry.title}</span>
                {collapsed[entry.id] && (entry.elements || []).length > 0 && (
                  <span style={{ fontSize: 9, color: "var(--text-muted)", background: "rgba(255,255,255,.06)", borderRadius: 100, padding: "1px 6px", flexShrink: 0 }}>{entry.elements.length}</span>
                )}
                <button className="ctl-add-el-btn" title="Add sub-element" onClick={() => { addElement(entry.id); setCollapsed(p => ({ ...p, [entry.id]: false })); }}>+</button>
              </div>
              <div className="ctl-row-cost">
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>
                  {tc > 0 ? fmtCost(tc) : ""}
                </div>
                <input
                  className="ctl-cost-input"
                  value={entry.cost || ""}
                  onChange={e => updateEntry(entry.id, { cost: e.target.value })}
                  placeholder="$0"
                  title="Campaign base cost"
                />
              </div>
              <div className="ctl-bar-track">
                <div className="ctl-month-grid">
                  {months.map((_, i) => <div key={i} className="ctl-month-stripe" />)}
                </div>
                {entry.startDate && entry.endDate && renderBar(color, entry.startDate, entry.endDate, entry.id)}
                {entry.startDate && entry.endDate && (
                  <div style={{ position: "absolute", bottom: 2, left: `${dateToPercent(entry.startDate)}%`, fontSize: 9, color: "var(--text-muted)", pointerEvents: "none", whiteSpace: "nowrap", paddingLeft: 4 }}>
                    {fmtDate(entry.startDate)} – {fmtDate(entry.endDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Element rows */}
            {!collapsed[entry.id] && (entry.elements || []).map(el => (
              <div key={el.id} className="ctl-row el-row" style={{ borderLeft: `3px solid ${color}55` }}>
                <div className="ctl-row-label">
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, opacity: .5, flexShrink: 0, marginLeft: 2 }} />
                  <input
                    className="ctl-el-label-input"
                    value={el.label}
                    onChange={e => updateElement(entry.id, el.id, { label: e.target.value })}
                    title="Element label"
                  />
                  <button className="ctl-del-btn" title="Remove" onClick={() => deleteElement(entry.id, el.id)}>×</button>
                </div>
                <div className="ctl-row-cost">
                  <input
                    className="ctl-cost-input"
                    style={{ fontSize: 11 }}
                    value={el.cost || ""}
                    onChange={e => updateElement(entry.id, el.id, { cost: e.target.value })}
                    placeholder="$0"
                  />
                </div>
                <div className="ctl-bar-track">
                  <div className="ctl-month-grid">
                    {months.map((_, i) => <div key={i} className="ctl-month-stripe" />)}
                  </div>
                  {el.startDate && el.endDate && renderBar(color, el.startDate, el.endDate, entry.id, el.id)}
                  {el.startDate && el.endDate && (
                    <div style={{ position: "absolute", bottom: 1, left: `${dateToPercent(el.startDate)}%`, fontSize: 8, color: "var(--text-muted)", pointerEvents: "none", whiteSpace: "nowrap", paddingLeft: 4 }}>
                      {fmtDate(el.startDate)} – {fmtDate(el.endDate)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ─── TIMELINE PANEL ─── */
const TIMELINE_CATEGORIES = ["Campaign", "Initiative", "Event", "Launch", "Milestone", "Deliverable", "Other"];
const TIMELINE_STATUSES = ["planned", "in-progress", "completed", "on-hold", "cancelled"];
const TIMELINE_STATUS_COLORS = { "planned": "#8b7fc0", "in-progress": "#c9a84c", "completed": "#4d9e8e", "on-hold": "#e07b6a", "cancelled": "#666" };

function TimelinePanel({ items, setItems, canEdit, ganttHtml, onUpdateGantt, currentUser, initiatives, campaigns }) {
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [filter, setFilter] = useState("all");

  // Sort items by start date
  const sorted = [...items].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
  const filtered = filter === "all" ? sorted : sorted.filter(i => i.status === filter);

  // Months for the visual bar
  const now = new Date();
  const months = [];
  for (let m = -1; m < 8; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    months.push({ label: d.toLocaleString("en", { month: "short" }), year: d.getFullYear(), date: d });
  }
  const rangeStart = months[0].date.getTime();
  const rangeEnd = new Date(months[months.length - 1].date.getFullYear(), months[months.length - 1].date.getMonth() + 1, 0).getTime();
  const rangeDur = rangeEnd - rangeStart || 1;

  const getBarStyle = (item) => {
    const s = new Date(item.startDate || now).getTime();
    const e = new Date(item.endDate || item.startDate || now).getTime();
    const left = Math.max(0, Math.min(100, ((s - rangeStart) / rangeDur) * 100));
    const right = Math.max(0, Math.min(100, ((e - rangeStart) / rangeDur) * 100));
    const width = Math.max(1, right - left);
    return { left: `${left}%`, width: `${width}%` };
  };

  const addItem = (item) => { setItems(p => [...p, { ...item, id: `tl-${Date.now()}`, createdBy: currentUser?.name || "Team", createdAt: new Date().toISOString() }]); setShowAdd(false); };
  const updateItem = (id, updates) => { setItems(p => p.map(i => i.id === id ? { ...i, ...updates } : i)); };
  const deleteItem = (id) => { setItems(p => p.filter(i => i.id !== id)); if (selected === id) setSelected(null); };

  const selectedItem = items.find(i => i.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Project Timeline</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "2px 8px", border: "1px solid var(--border2)", borderRadius: 100 }}>{items.length} items</div>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {/* Status filter */}
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)" }}>
            <option value="all">All Statuses</option>
            {TIMELINE_STATUSES.map(s => <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          {ganttHtml && <button className="btn btn-sm" onClick={() => setShowGantt(o => !o)}>{showGantt ? "← Items" : "📊 Gantt View"}</button>}
          {canEdit && <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", fontWeight: 600 }} onClick={() => setShowAdd(true)}>+ Add Item</button>}
        </div>
      </div>

      {showGantt ? (
        <GanttViewer ganttHtml={ganttHtml} onUpdate={onUpdateGantt} canEdit={canEdit} />
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* LEFT — Timeline list + visual */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Month headers */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "rgba(255,255,255,.02)" }}>
              <div style={{ width: 280, flexShrink: 0, padding: "8px 16px", fontSize: 10, color: "var(--text-muted)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, borderRight: "1px solid var(--border)" }}>Item</div>
              <div style={{ flex: 1, display: "flex", position: "relative" }}>
                {months.map((m, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 0", fontSize: 10, color: m.date.getMonth() === now.getMonth() && m.year === now.getFullYear() ? "var(--gold)" : "var(--text-muted)", fontWeight: m.date.getMonth() === now.getMonth() ? 700 : 400, letterSpacing: ".06em", borderRight: i < months.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                    {m.label} {m.year !== now.getFullYear() ? `'${String(m.year).slice(2)}` : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 36, opacity: .2, marginBottom: 10 }}>📅</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No timeline items yet</div>
                  {canEdit && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Click + Add Item to get started</div>}
                </div>
              )}
              {filtered.map(item => {
                const barStyle = getBarStyle(item);
                const statusColor = TIMELINE_STATUS_COLORS[item.status] || "#888";
                const isSelected = selected === item.id;
                return (
                  <div key={item.id} onClick={() => setSelected(item.id)}
                    style={{ display: "flex", borderBottom: "1px solid var(--border2)", cursor: "pointer", background: isSelected ? "rgba(201,168,76,.04)" : "transparent", transition: "background .1s" }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    {/* Item info */}
                    <div style={{ width: 280, flexShrink: 0, padding: "10px 16px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{item.category} · {item.owner || "Unassigned"}</div>
                      </div>
                    </div>
                    {/* Gantt bar */}
                    <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", padding: "6px 0" }}>
                      {/* Grid lines */}
                      {months.map((_, i) => <div key={i} style={{ position: "absolute", left: `${(i / months.length) * 100}%`, top: 0, bottom: 0, borderLeft: "1px solid rgba(255,255,255,.03)" }} />)}
                      {/* Today marker */}
                      <div style={{ position: "absolute", left: `${((now.getTime() - rangeStart) / rangeDur) * 100}%`, top: 0, bottom: 0, borderLeft: "1px dashed rgba(201,168,76,.3)", zIndex: 1 }} />
                      {/* Bar */}
                      <div style={{ position: "absolute", ...barStyle, height: 20, borderRadius: 4, background: `linear-gradient(90deg, ${statusColor}44, ${statusColor}88)`, border: `1px solid ${statusColor}66`, top: "50%", transform: "translateY(-50%)", minWidth: 6 }}>
                        <div style={{ fontSize: 9, color: "#fff", padding: "2px 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "16px" }}>{item.title}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Detail panel */}
          {selectedItem && (
            <div style={{ width: 380, flexShrink: 0, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)", overflowY: "auto" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{selectedItem.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{selectedItem.category} · Added by {selectedItem.createdBy}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}>×</button>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Status */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Status</div>
                  {canEdit ? (
                    <select value={selectedItem.status} onChange={e => updateItem(selectedItem.id, { status: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: TIMELINE_STATUS_COLORS[selectedItem.status], fontSize: 12, fontFamily: "var(--bf)", fontWeight: 600 }}>
                      {TIMELINE_STATUSES.map(s => <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: TIMELINE_STATUS_COLORS[selectedItem.status], fontWeight: 600 }}>{selectedItem.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                  )}
                </div>
                {/* Dates */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Start Date</div>
                    {canEdit ? <input type="date" value={selectedItem.startDate || ""} onChange={e => updateItem(selectedItem.id, { startDate: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }} />
                      : <span style={{ fontSize: 12, color: "var(--text)" }}>{selectedItem.startDate || "—"}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>End Date</div>
                    {canEdit ? <input type="date" value={selectedItem.endDate || ""} onChange={e => updateItem(selectedItem.id, { endDate: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }} />
                      : <span style={{ fontSize: 12, color: "var(--text)" }}>{selectedItem.endDate || "—"}</span>}
                  </div>
                </div>
                {/* Owner */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Owner</div>
                  {canEdit ? <input value={selectedItem.owner || ""} onChange={e => updateItem(selectedItem.id, { owner: e.target.value })} placeholder="Assign owner…"
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }} />
                    : <span style={{ fontSize: 12, color: "var(--text)" }}>{selectedItem.owner || "Unassigned"}</span>}
                </div>
                {/* Estimated Cost */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Estimated Cost</div>
                  {canEdit ? <input value={selectedItem.cost || ""} onChange={e => updateItem(selectedItem.id, { cost: e.target.value })} placeholder="$0.00"
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--gold)", fontSize: 13, fontFamily: "var(--bf)", fontWeight: 600 }} />
                    : <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>{selectedItem.cost || "—"}</span>}
                </div>
                {/* Description */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Description</div>
                  {canEdit ? <textarea value={selectedItem.description || ""} onChange={e => updateItem(selectedItem.id, { description: e.target.value })} placeholder="Add details…" rows={3}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", lineHeight: 1.65, resize: "vertical", boxSizing: "border-box" }} />
                    : <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.65 }}>{selectedItem.description || "No description"}</div>}
                </div>
                {/* Key Points */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Key Points</div>
                  {(selectedItem.keyPoints || []).map((pt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>{i + 1}</div>
                      {canEdit ? (
                        <div style={{ display: "flex", flex: 1, gap: 4 }}>
                          <input value={pt} onChange={e => { const kp = [...(selectedItem.keyPoints || [])]; kp[i] = e.target.value; updateItem(selectedItem.id, { keyPoints: kp }); }}
                            style={{ flex: 1, padding: "5px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }} />
                          <button onClick={() => { const kp = (selectedItem.keyPoints || []).filter((_, j) => j !== i); updateItem(selectedItem.id, { keyPoints: kp }); }}
                            style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid rgba(224,123,106,.3)", background: "transparent", color: "#e07b6a", cursor: "pointer", fontSize: 11, display: "grid", placeItems: "center" }}>×</button>
                        </div>
                      ) : <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{pt}</span>}
                    </div>
                  ))}
                  {canEdit && <button onClick={() => updateItem(selectedItem.id, { keyPoints: [...(selectedItem.keyPoints || []), ""] })}
                    style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, border: "1px dashed rgba(255,255,255,.12)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)", width: "100%", marginTop: 4 }}>+ Add Key Point</button>}
                </div>
                {/* Link to initiative/campaign */}
                {selectedItem.linkedInitiative && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Linked To</div>
                    <div style={{ fontSize: 12, color: "var(--gold)", padding: "6px 10px", background: "rgba(201,168,76,.06)", borderRadius: 7, border: "1px solid rgba(201,168,76,.15)" }}>{selectedItem.linkedInitiative}</div>
                  </div>
                )}
                {/* Delete */}
                {canEdit && (
                  <button onClick={() => { if (confirm(`Delete "${selectedItem.title}"?`)) deleteItem(selectedItem.id); }}
                    style={{ marginTop: 8, width: "100%", padding: "8px", borderRadius: 7, border: "1px solid rgba(224,123,106,.3)", background: "rgba(224,123,106,.06)", color: "#e07b6a", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--bf)", letterSpacing: ".04em" }}>Delete Item</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAdd && <TimelineAddModal onClose={() => setShowAdd(false)} onAdd={addItem} initiatives={initiatives} campaigns={campaigns} />}
    </div>
  );
}

function TimelineAddModal({ onClose, onAdd, initiatives, campaigns }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Campaign");
  const [status, setStatus] = useState("planned");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [owner, setOwner] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [linkedInitiative, setLinkedInitiative] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), category, status, startDate, endDate, owner: owner.trim(), cost: cost.trim(), description: description.trim(), linkedInitiative: linkedInitiative || null, keyPoints: [] });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="mhdr">
          <div>
            <div className="mtitle">Add Timeline Item</div>
            <div className="msub">This will be saved permanently to the project timeline</div>
          </div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody" style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 24px" }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Packaging Redesign Launch" autoFocus
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
          </div>
          {/* Category + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }}>
                {TIMELINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }}>
                {TIMELINE_STATUSES.map(s => <option key={s} value={s}>{s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
            </div>
          </div>
          {/* Owner + Cost */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Owner</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Who's responsible?"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Estimated Cost</label>
              <input value={cost} onChange={e => setCost(e.target.value)} placeholder="$0.00"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--gold)", fontSize: 13, fontFamily: "var(--bf)", fontWeight: 600, boxSizing: "border-box" }} />
            </div>
          </div>
          {/* Link to existing */}
          <div>
            <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Link to Initiative / Campaign</label>
            <select value={linkedInitiative} onChange={e => setLinkedInitiative(e.target.value)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)" }}>
              <option value="">None</option>
              <optgroup label="Initiatives">
                {(initiatives || []).map(i => <option key={i.id} value={i.title}>{i.title}</option>)}
              </optgroup>
              <optgroup label="Campaigns">
                {(campaigns || []).map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
              </optgroup>
            </select>
          </div>
          {/* Description */}
          <div>
            <label style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 5 }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details, deliverables, notes…" rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", lineHeight: 1.65, resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button disabled={!title.trim()} onClick={submit}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: title.trim() ? "var(--gold)" : "rgba(255,255,255,.06)", color: title.trim() ? "var(--bg)" : "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: title.trim() ? "pointer" : "not-allowed", fontFamily: "var(--bf)", letterSpacing: ".04em" }}>Add to Timeline</button>
        </div>
      </div>
    </div>
  );
}

function GanttViewer({ ganttHtml, onUpdate, canEdit, timelineItems, setTimelineItems, currentUser, initiatives, campaigns, canAddContent }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ganttHtml || "");
  const [saved, setSaved] = useState(false);
  const [panel, setPanel] = useState(null); // "items" or null
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const fileRef = useRef();
  const textareaRef = useRef();
  const canModify = canEdit || canAddContent;

  useEffect(() => {
    if (ganttHtml) { setDraft(ganttHtml); return; }
    fetch(DEFAULT_GANTT_URL).then(r=>r.text()).then(html=>{setDraft(html);onUpdate(html);}).catch(()=>{});
  }, [ganttHtml]);

  const handleFile = (file) => {
    if (!file?.name.endsWith(".html")) return;
    const r = new FileReader();
    r.onload = e => { setDraft(e.target.result); onUpdate(e.target.result); };
    r.readAsText(file);
  };

  const pushUpdate = () => { onUpdate(draft); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const exitEditor = () => setEditing(false);

  const addItem = (item) => { setTimelineItems(p => [...p, { ...item, id: `tl-${Date.now()}`, createdBy: currentUser?.name || "Team", createdAt: new Date().toISOString() }]); setShowAdd(false); };
  const updateItem = (id, updates) => setTimelineItems(p => p.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteItem = (id) => { setTimelineItems(p => p.filter(i => i.id !== id)); if (selected === id) setSelected(null); };
  const selectedItem = (timelineItems || []).find(i => i.id === selected);

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e07b6a", boxShadow: "0 0 6px #e07b6a" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Timeline Editor</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "2px 8px", border: "1px solid var(--border2)", borderRadius: 100 }}>Live preview updates as you type</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={exitEditor}>← Back</button>
            <button onClick={pushUpdate} style={{ padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer", background: saved ? "#4d9e8e" : "#c9a84c", color: "#07070f", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", transition: "background .3s", fontFamily: "var(--bf)" }}>
              {saved ? "✓ Saved" : "Push Update"}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "#0a0a14" }}>
            <div style={{ padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>HTML Source</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>· {draft.length.toLocaleString()} chars</div>
              <button className="btn btn-sm" style={{ marginLeft: "auto", fontSize: 9 }} onClick={() => fileRef.current.click()}>↺ Replace</button>
              <input ref={fileRef} type="file" accept=".html" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false}
              style={{ flex: 1, padding: "14px 16px", background: "transparent", border: "none", outline: "none", color: "#a8c4e0", fontFamily: "'DM Mono','Fira Code','Courier New',monospace", fontSize: 12, lineHeight: 1.65, resize: "none", overflowY: "auto", tabSize: 2 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
            <div style={{ padding: "7px 14px", borderBottom: "1px solid rgba(0,0,0,.08)", background: "#f5f5f5", flexShrink: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "#666", fontWeight: 500 }}>Live Preview</div>
            </div>
            <iframe key={draft.length} srcDoc={draft} title="Gantt Live Preview" sandbox="allow-scripts allow-forms" style={{ flex: 1, border: "none", width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  // View mode — Gantt iframe + items panel
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)" }}>
      {/* Top bar */}
      <div className="gv-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div className="gv-title">
          Curador Brands — Project Timeline
          <span>Interactive Gantt · Drag bars to reschedule</span>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className={`btn btn-sm${panel === "items" ? " active" : ""}`} onClick={() => setPanel(p => p === "items" ? null : "items")}
            style={panel === "items" ? { borderColor: "rgba(201,168,76,.4)", color: "var(--gold)" } : {}}>
            📋 Items {(timelineItems||[]).length > 0 && <span style={{ marginLeft: 4, fontSize: 9, padding: "1px 5px", borderRadius: 100, background: "rgba(201,168,76,.15)", color: "var(--gold)" }}>{(timelineItems||[]).length}</span>}
          </button>
          <button className="btn btn-sm" onClick={() => {
            const html = ganttHtml || draft;
            if (!html) return;
            const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
            window.open(url, "_blank", "width=1400,height=800,noopener,noreferrer");
          }}>↗ Expand</button>
          {canEdit && <button className="btn btn-sm" onClick={() => setEditing(true)} style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}>✏ Edit HTML</button>}
          {canEdit && <button className="btn btn-sm" onClick={() => fileRef.current.click()}>↺ Replace</button>}
          {canEdit && <button className="btn btn-sm" onClick={() => { onUpdate(null); }}>↩ Reset</button>}
          <input ref={fileRef} type="file" accept=".html" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {/* Content: iframe + optional items panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Gantt iframe */}
        <iframe className="gv-frame" srcDoc={ganttHtml} title="Timeline" sandbox="allow-scripts allow-downloads allow-forms"
          style={{ flex: 1, border: "none", borderTop: 0 }} />

        {/* Items panel */}
        {panel === "items" && (
          <div style={{ width: selected ? 680 : 340, flexShrink: 0, borderLeft: "1px solid var(--border)", display: "flex", overflow: "hidden", transition: "width .2s", background: "var(--bg)" }}>
            {/* Items list */}
            <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: selected ? "1px solid var(--border)" : "none" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Timeline Items</div>
                {canModify && <button onClick={() => setShowAdd(true)}
                  style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(201,168,76,.3)", background: "rgba(201,168,76,.06)", color: "var(--gold)", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>+ Add</button>}
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {(timelineItems||[]).length === 0 && (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, opacity: .2, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No items yet</div>
                    {canModify && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Add items with costs, dates, and details</div>}
                  </div>
                )}
                {[...(timelineItems||[])].sort((a,b) => new Date(a.startDate||0) - new Date(b.startDate||0)).map(item => {
                  const sc = TIMELINE_STATUS_COLORS[item.status] || "#888";
                  return (
                    <div key={item.id} onClick={() => setSelected(item.id)}
                      style={{ padding: "10px 16px", borderBottom: "1px solid var(--border2)", cursor: "pointer", background: selected === item.id ? "rgba(201,168,76,.06)" : "transparent", transition: "background .1s" }}
                      onMouseEnter={e => { if (selected !== item.id) e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                      onMouseLeave={e => { if (selected !== item.id) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: sc, fontWeight: 600 }}>{(item.status||"planned").replace("-"," ")}</span>
                            {item.cost && <span style={{ fontSize: 10, color: "var(--gold)" }}>{item.cost}</span>}
                            {item.startDate && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(item.startDate).toLocaleDateString("en",{month:"short",day:"numeric"})}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {selectedItem && (
              <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto", background: "var(--surface)" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{selectedItem.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{selectedItem.category} · {selectedItem.createdBy}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, display: "grid", placeItems: "center" }}>×</button>
                </div>
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Status */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Status</div>
                    {canModify ? <select value={selectedItem.status} onChange={e => updateItem(selectedItem.id, { status: e.target.value })}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: TIMELINE_STATUS_COLORS[selectedItem.status], fontSize: 12, fontFamily: "var(--bf)", fontWeight: 600 }}>
                      {TIMELINE_STATUSES.map(s => <option key={s} value={s}>{s.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select> : <span style={{ fontSize: 12, color: TIMELINE_STATUS_COLORS[selectedItem.status], fontWeight: 600 }}>{(selectedItem.status||"").replace("-"," ")}</span>}
                  </div>
                  {/* Dates */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Start</div>
                      {canModify ? <input type="date" value={selectedItem.startDate||""} onChange={e => updateItem(selectedItem.id, { startDate: e.target.value })}
                        style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "var(--text)" }}>{selectedItem.startDate || "—"}</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>End</div>
                      {canModify ? <input type="date" value={selectedItem.endDate||""} onChange={e => updateItem(selectedItem.id, { endDate: e.target.value })}
                        style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "var(--text)" }}>{selectedItem.endDate || "—"}</span>}
                    </div>
                  </div>
                  {/* Owner */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Owner</div>
                    {canModify ? <input value={selectedItem.owner||""} onChange={e => updateItem(selectedItem.id, { owner: e.target.value })} placeholder="Assign…"
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
                      : <span style={{ fontSize: 12, color: "var(--text)" }}>{selectedItem.owner || "Unassigned"}</span>}
                  </div>
                  {/* Cost */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Estimated Cost</div>
                    {canModify ? <input value={selectedItem.cost||""} onChange={e => updateItem(selectedItem.id, { cost: e.target.value })} placeholder="$0.00"
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--gold)", fontSize: 13, fontFamily: "var(--bf)", fontWeight: 600, boxSizing: "border-box" }} />
                      : <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>{selectedItem.cost || "—"}</span>}
                  </div>
                  {/* Description */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Description</div>
                    {canModify ? <textarea value={selectedItem.description||""} onChange={e => updateItem(selectedItem.id, { description: e.target.value })} placeholder="Details…" rows={3}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box" }} />
                      : <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{selectedItem.description || "—"}</div>}
                  </div>
                  {/* Key Points */}
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Key Points</div>
                    {(selectedItem.keyPoints||[]).map((pt, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>{i+1}</div>
                        {canModify ? (
                          <div style={{ display: "flex", flex: 1, gap: 4 }}>
                            <input value={pt} onChange={e => { const kp = [...(selectedItem.keyPoints||[])]; kp[i] = e.target.value; updateItem(selectedItem.id, { keyPoints: kp }); }}
                              style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", boxSizing: "border-box" }} />
                            <button onClick={() => { const kp = (selectedItem.keyPoints||[]).filter((_,j)=>j!==i); updateItem(selectedItem.id, { keyPoints: kp }); }}
                              style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid rgba(224,123,106,.3)", background: "transparent", color: "#e07b6a", cursor: "pointer", fontSize: 10, display: "grid", placeItems: "center" }}>×</button>
                          </div>
                        ) : <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{pt}</span>}
                      </div>
                    ))}
                    {canModify && <button onClick={() => updateItem(selectedItem.id, { keyPoints: [...(selectedItem.keyPoints||[]), ""] })}
                      style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px dashed rgba(255,255,255,.12)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--bf)", width: "100%", marginTop: 3 }}>+ Key Point</button>}
                  </div>
                  {/* Linked */}
                  {selectedItem.linkedInitiative && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 5 }}>Linked To</div>
                      <div style={{ fontSize: 12, color: "var(--gold)", padding: "5px 10px", background: "rgba(201,168,76,.06)", borderRadius: 7, border: "1px solid rgba(201,168,76,.15)" }}>{selectedItem.linkedInitiative}</div>
                    </div>
                  )}
                  {canModify && (
                    <button onClick={() => { if (confirm(`Delete "${selectedItem.title}"?`)) deleteItem(selectedItem.id); }}
                      style={{ marginTop: 6, width: "100%", padding: "7px", borderRadius: 7, border: "1px solid rgba(224,123,106,.3)", background: "rgba(224,123,106,.06)", color: "#e07b6a", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--bf)" }}>Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && <TimelineAddModal onClose={() => setShowAdd(false)} onAdd={addItem} initiatives={initiatives} campaigns={campaigns} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DESIGN PORTAL
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// SHARED COMMENT MODAL
// ════════════════════════════════════════════════════════════════════════════
function CommentModal({ title, comments, currentUser, onAdd, onEdit, onDelete, onClose }) {
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const endRef = useRef();
  const send = () => { if (!text.trim()) return; onAdd(text.trim(), replyTo); setText(""); setReplyTo(null); setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50); };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
          <div className="mtitle" style={{ fontSize: 15 }}>Comments — {title}</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", maxHeight: "50vh", display: "flex", flexDirection: "column", gap: 10 }}>
          {(!comments || comments.length === 0) && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>No comments yet. Start the conversation.</div>}
          {(comments || []).map(c => {
            const isReply = c.replyTo;
            const parent = isReply ? (comments || []).find(p => p.id === c.replyTo) : null;
            const isMe = c.author === currentUser?.name;
            return (
              <div key={c.id} style={{ marginLeft: isReply ? 20 : 0, padding: "10px 14px", background: isMe ? "rgba(184,150,58,.06)" : "var(--surface2)", border: `1px solid ${isMe ? "rgba(184,150,58,.15)" : "var(--border2)"}`, borderRadius: 10 }}>
                {isReply && parent && <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontStyle: "italic" }}>Replying to {parent.author}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(c.ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                </div>
                {editId === c.id ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onEdit(c.id, editText); setEditId(null); } if (e.key === "Escape") setEditId(null); }}
                      style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
                    <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => { onEdit(c.id, editText); setEditId(null); }}>Save</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{c.text}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      <button onClick={() => setReplyTo(c.id)} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Reply</button>
                      {isMe && <button onClick={() => { setEditId(c.id); setEditText(c.text); }} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Edit</button>}
                      {isMe && <button onClick={() => onDelete(c.id)} style={{ fontSize: 10, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Delete</button>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          {replyTo && (
            <div style={{ fontSize: 10, color: "var(--gold)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              Replying to {(comments || []).find(c => c.id === replyTo)?.author || "comment"}
              <button onClick={() => setReplyTo(null)} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Type a comment..."
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", outline: "none" }} />
            <button className="btn btn-gold" onClick={send} disabled={!text.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: renders a comment bubble that opens CommentModal
function CommentBubble({ item, title, currentUser, onUpdateComments }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const comments = item.comments || [];
  const send = () => { if (!text.trim()) return; onUpdateComments([...comments, { id: `cmt-${Date.now()}`, author: currentUser?.name || "Team", text: text.trim(), ts: new Date().toISOString() }]); setText(""); };
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", width: "100%", height: "100%" }} onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
        <span style={{ fontSize: 16, color: comments.length > 0 ? "var(--gold)" : "#555" }}>💬</span>
        {comments.length > 0 && <span style={{ position: "absolute", top: -2, right: -2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700, lineHeight: "14px" }}>{comments.length}</span>}
      </div>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: -20, top: "100%", width: 300, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 30, marginTop: 4 }}>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)", letterSpacing: ".08em", textTransform: "uppercase" }}>{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
            <button onClick={() => setOpen(false)} style={{ fontSize: 14, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto", padding: "6px 12px" }}>
            {comments.length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>No comments yet.</div>}
            {comments.map(c => (
              <div key={c.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border2)" }}>
                {editId === c.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onUpdateComments(comments.map(cm => cm.id === c.id ? { ...cm, text: editText } : cm)); setEditId(null); } if (e.key === "Escape") setEditId(null); }}
                      style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 6px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                    <button onClick={() => { onUpdateComments(comments.map(cm => cm.id === c.id ? { ...cm, text: editText } : cm)); setEditId(null); }} style={{ fontSize: 9, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--bf)" }}>Save</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span>
                      <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                    {c.author === currentUser?.name && (
                      <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                        <button onClick={() => { setEditId(c.id); setEditText(c.text); }} style={{ fontSize: 9, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Edit</button>
                        <button onClick={() => onUpdateComments(comments.filter(cm => cm.id !== c.id))} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border2)", display: "flex", gap: 6 }}>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Comment..."
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
            <button onClick={send} disabled={!text.trim()} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, border: "none", background: text.trim() ? "var(--gold)" : "var(--surface2)", color: text.trim() ? "#fff" : "var(--text-muted)", cursor: text.trim() ? "pointer" : "default", fontFamily: "var(--bf)", fontWeight: 600 }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

const DESIGN_STATUSES = ["Not Started", "In Progress", "In Review", "Completed", "On Hold"];
const DESIGN_SECTIONS = ["Active & Upcoming Launches", "New Ideas — Strain Drops", "Field Kit Design Needs", "Social Content", "Packaging", "Events", "Other"];

const DEFAULT_DESIGN_REQUESTS = [
  // ── Active & Upcoming Launches ──
  { id:"drd-1", section:"Active & Upcoming Launches", brand:"Bubbles", project:"Two New Flavor Launches (New SKUs)", owner:"Munchi", designType:"Video", channel:"Instagram", creative:"Tom", dueDate:"", liveDate:"2026-04-27", status:"In Progress", priority:"High", notes:"Tom sent over a video to review 4/21", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-2", section:"Active & Upcoming Launches", brand:"Bubbles", project:"Two New Flavor Launches (New SKUs)", owner:"Munchi", designType:"Table Cards", channel:"Field Team", creative:"Allison Gellner", dueDate:"", liveDate:"", status:"In Progress", priority:"High", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-3", section:"Active & Upcoming Launches", brand:"Headchange", project:"Rosin All In One", owner:"Sanson", designType:"Other", channel:"", creative:"", dueDate:"", liveDate:"2026-04-27", status:"Not Started", priority:"High", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-4", section:"Active & Upcoming Launches", brand:"Headchange", project:"Packaging (Boxes)", owner:"Sanson", designType:"Packaging", channel:"Packaging", creative:"Allison Gellner", dueDate:"", liveDate:"", status:"In Progress", priority:"Low", notes:"Bryan sent through compliance", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-5", section:"Active & Upcoming Launches", brand:"Headchange", project:"BatCountry Collab (Cartridge)", owner:"Munchi", designType:"Packaging", channel:"Packaging", creative:"Kelly", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-6", section:"Active & Upcoming Launches", brand:"Headchange", project:"BatCountry Collab (Video)", owner:"Munchi", designType:"Video", channel:"Video", creative:"Tom", dueDate:"", liveDate:"", status:"In Progress", priority:"High", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-7", section:"Active & Upcoming Launches", brand:"Headchange", project:"BatCountry Collab (Photography/Artwork)", owner:"Munchi", designType:"Photography", channel:"Instagram", creative:"Tom / Kelly", dueDate:"", liveDate:"", status:"In Progress", priority:"High", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-8", section:"Active & Upcoming Launches", brand:"Headchange", project:"Sesh - EDM Dab Circus Theme Robust & Sesh Menu", owner:"Luke", designType:"Print", channel:"Print", creative:"Kelly", dueDate:"2026-04-29", liveDate:"2026-05-11", status:"Not Started", priority:"Medium", notes:"Menu (2-sided)", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-9", section:"Active & Upcoming Launches", brand:"Headchange", project:"Sesh - EDM Dab Circus Theme Event Bright Artwork", owner:"Luke", designType:"Social Graphics", channel:"Digital", creative:"Kelly", dueDate:"2026-04-29", liveDate:"2026-05-11", status:"Not Started", priority:"Medium", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  // ── New Ideas — Strain Drops ──
  { id:"drd-10", section:"New Ideas — Strain Drops", brand:"Headchange", project:"New Strains dropping w/o 5/4", owner:"Cindy", designType:"Photography", channel:"Instagram", creative:"TBD", dueDate:"2026-04-27", liveDate:"2026-05-03", status:"Not Started", priority:"Medium", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-11", section:"New Ideas — Strain Drops", brand:"Headchange", project:"New Strains dropping w/o 5/11", owner:"Cindy", designType:"Photography", channel:"Instagram", creative:"TBD", dueDate:"2026-05-04", liveDate:"2026-05-10", status:"Not Started", priority:"Medium", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-12", section:"New Ideas — Strain Drops", brand:"Headchange", project:"New Strains dropping w/o 5/18", owner:"Cindy", designType:"Photography", channel:"Instagram", creative:"TBD", dueDate:"2026-05-11", liveDate:"2026-05-17", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-13", section:"New Ideas — Strain Drops", brand:"Headchange", project:"New Strains dropping w/o 5/25", owner:"Cindy", designType:"Photography", channel:"Instagram", creative:"TBD", dueDate:"2026-05-18", liveDate:"2026-05-24", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-14", section:"New Ideas — Strain Drops", brand:"Headchange", project:"Melt Shot / Glass Feature / Comments", owner:"Sanson", designType:"Video", channel:"Video", creative:"Tom", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-15", section:"New Ideas — Strain Drops", brand:"Headchange", project:"Melt Shot / Glass Feature / Comments (Art)", owner:"Sanson", designType:"Video", channel:"Instagram", creative:"Tom / Kelly", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"Video w/ Art", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  // ── Field Kit Design Needs ──
  { id:"drd-20", section:"Field Kit Design Needs", brand:"All Brands", project:"Popup Banners", owner:"TBD", designType:"Print", channel:"Field / Activation", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"SafeBet & Bubbles confirmed. Headchange needed.", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-21", section:"Field Kit Design Needs", brand:"All Brands", project:"Table Tents", owner:"TBD", designType:"Print", channel:"Field / Activation", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"For dispensary counters & pop-up tables", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-22", section:"Field Kit Design Needs", brand:"All Brands", project:"Printed Product Cards (SKU-Specific)", owner:"TBD", designType:"Print", channel:"Field / Activation", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"One per SKU per brand", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-23", section:"Field Kit Design Needs", brand:"All Brands", project:"Monthly Retailer Promo Flyers", owner:"TBD", designType:"Print", channel:"Field / Buyers", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"Include case pricing for buyers", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-24", section:"Field Kit Design Needs", brand:"All Brands", project:"General Signage (Posters / Shelf Talkers)", owner:"TBD", designType:"Print", channel:"Retail", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"Window clings, exit signage if applicable", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-25", section:"Field Kit Design Needs", brand:"All Brands", project:"Branded Table Skirts", owner:"TBD", designType:"Print", channel:"Field / Activation", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"Activation-specific", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-26", section:"Field Kit Design Needs", brand:"Headchange", project:"Retail Branded Display — REDESIGN", owner:"TBD", designType:"Other", channel:"Retail", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"High", notes:"Called out as out of date. Priority redesign needed.", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-27", section:"Field Kit Design Needs", brand:"SafeBet", project:"Retail Branded Display", owner:"TBD", designType:"Other", channel:"Retail", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-28", section:"Field Kit Design Needs", brand:"Bubbles", project:"Retail Branded Display", owner:"TBD", designType:"Other", channel:"Retail", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-29", section:"Field Kit Design Needs", brand:"All Brands", project:"Budtender Education One-Pagers", owner:"TBD", designType:"Print", channel:"Field / Education", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"Scientific 'Why' + product specs", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-30", section:"Field Kit Design Needs", brand:"All Brands", project:"Sell Sheets", owner:"TBD", designType:"Print", channel:"Sales", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Medium", notes:"PDF and physical print versions", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-31", section:"Field Kit Design Needs", brand:"All Brands", project:"Brand Guidelines Doc", owner:"TBD", designType:"Other", channel:"Internal / Field", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"High", notes:"Voice, usage, color/font standards", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-32", section:"Field Kit Design Needs", brand:"All Brands", project:"Full Logo Suite", owner:"TBD", designType:"Other", channel:"Internal / Field", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"High", notes:"Full color, B&W, horizontal, stacked", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-33", section:"Field Kit Design Needs", brand:"All Brands", project:"High-Res Product Photography", owner:"TBD", designType:"Photography", channel:"All Channels", creative:"Tom", dueDate:"", liveDate:"", status:"In Progress", priority:"Low", notes:"Studio & lifestyle. Macro shots needed too.", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-34", section:"Field Kit Design Needs", brand:"All Brands", project:"Stickers (Core + SKU-specific)", owner:"TBD", designType:"Print", channel:"Field / Swag", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-35", section:"Field Kit Design Needs", brand:"All Brands", project:"Branded Pins", owner:"TBD", designType:"Other", channel:"Field / Swag", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-36", section:"Field Kit Design Needs", brand:"All Brands", project:"T-Shirts", owner:"TBD", designType:"Other", channel:"Field / Swag", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
  { id:"drd-37", section:"Field Kit Design Needs", brand:"All Brands", project:"Lucid Loyalty QR Code Display", owner:"TBD", designType:"Print", channel:"Retail", creative:"TBD", dueDate:"", liveDate:"", status:"Not Started", priority:"Low", notes:"", createdAt:"2026-04-15T00:00:00Z", createdBy:"Team" },
];
const DESIGN_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const DESIGN_TYPES = ["Video", "Photography", "Print", "Packaging", "Social Graphics", "Email", "Web", "Signage", "Table Cards", "Other"];
const PRIORITY_COLORS = { Low: "#4d9e8e", Medium: "#c9a84c", High: "#e07b6a", Urgent: "#d94848" };
const STATUS_COLORS = { "Not Started": "var(--text-muted)", "In Progress": "#c9a84c", "In Review": "#7b93db", "Completed": "#4d9e8e", "On Hold": "#e07b6a" };

function DesignPortal({ requests, setRequests, brands, teamMembers, currentUser, view, setView, showModal, setShowModal, selectedReq, setSelectedReq }) {
  const brandList = brands ? Object.values(brands) : [];
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [collapsedSections, setCollapsedSections] = useState({});

  const addRequest = (req) => {
    setRequests(p => [{ ...req, id: `dr-${Date.now()}`, createdAt: new Date().toISOString(), createdBy: currentUser?.name || "Team", status: "Not Started" }, ...p]);
    setShowModal(false);
    setView("queue");
  };

  const updateRequest = (id, updates) => setRequests(p => p.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteRequest = (id) => { setRequests(p => p.filter(r => r.id !== id)); if (selectedReq?.id === id) setSelectedReq(null); };
  const toggleSection = (s) => setCollapsedSections(p => ({ ...p, [s]: !p[s] }));

  const filtered = requests.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    if (filterBrand !== "all" && r.brand !== filterBrand) return false;
    return true;
  });

  const groups = {};
  filtered.forEach(r => { const section = r.section || "General"; if (!groups[section]) groups[section] = []; groups[section].push(r); });

  // Zoom
  const [zoom, setZoom] = useState(80);
  // Column widths (resizable)
  const defaultCols = [52, 100, 200, 120, 36, 120, 120, 120, 90, 90, 90, 115, 85, 180];
  const [colWidths, setColWidths] = useState(defaultCols);
  const dragRef = useRef(null);

  const startResize = (colIdx, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[colIdx];
    const onMove = (ev) => {
      const diff = ev.clientX - startX;
      setColWidths(p => { const n = [...p]; n[colIdx] = Math.max(30, startW + diff); return n; });
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const GRID = colWidths.map(w => `${w}px`).join(" ");
  // Shared inline cell styles
  const cellBase = { padding: "6px 8px", fontSize: 12, overflow: "hidden", display: "flex", alignItems: "center", borderRight: "1px solid var(--border2)" };
  const selStyle = { background: "transparent", border: "none", color: "inherit", fontSize: 12, fontFamily: "var(--bf)", cursor: "pointer", outline: "none", width: "100%", padding: 0 };
  const inpStyle = { background: "transparent", border: "none", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {showModal && <DesignRequestModal brands={brands} teamMembers={teamMembers} onClose={() => setShowModal(false)} onSave={addRequest} />}
      {selectedReq && <DesignDetailModal request={selectedReq} brands={brands} teamMembers={teamMembers} currentUser={currentUser} onClose={() => setSelectedReq(null)} onUpdate={(updates) => { updateRequest(selectedReq.id, updates); setSelectedReq({ ...selectedReq, ...updates }); }} onDelete={() => { deleteRequest(selectedReq.id); setSelectedReq(null); }} />}

      {/* Header — sticky */}
      <div style={{ padding: "12px 24px", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)", lineHeight: 1.2 }}>Design Queue</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select className="fsel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto", minWidth: 120, fontSize: 11 }}>
              <option value="all">All Statuses</option>
              {DESIGN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="fsel" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: "auto", minWidth: 110, fontSize: 11 }}>
              <option value="all">All Priorities</option>
              {DESIGN_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="fsel" value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={{ width: "auto", minWidth: 110, fontSize: 11 }}>
              <option value="all">All Brands</option>
              {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 4px", borderLeft: "1px solid var(--border2)", marginLeft: 4 }}>
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}>−</button>
              <span style={{ fontSize: 10, color: "var(--text-muted)", minWidth: 32, textAlign: "center" }}>{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}>+</button>
              {zoom !== 100 && <button onClick={() => setZoom(100)} style={{ fontSize: 9, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontFamily: "var(--bf)" }}>Reset</button>}
            </div>
            <button className="btn btn-gold" onClick={() => setShowModal(true)}>+ Submit Request</button>
          </div>
        </div>
      </div>

      {/* Spreadsheet table */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px 24px" }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ fontSize: 48, opacity: .3, marginBottom: 16 }}>🖌</div>
            <div style={{ fontFamily: "var(--df)", fontSize: 24, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>No design requests yet</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Submit a request to get started.</div>
            <button className="btn btn-gold" onClick={() => setShowModal(true)}>+ Submit Request</button>
          </div>
        ) : (
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: `${10000 / zoom}%`, minWidth: "fit-content" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "visible" }}>
            {/* Column headers with resize handles */}
            <div style={{ display: "grid", gridTemplateColumns: GRID, background: "var(--surface3)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
              {["", "Brand", "Project", "Owner", "💬", "What Needed", "Channel", "Creative", "Due", "Live", "Created", "Status", "Priority", "Notes"].map((h, i) => (
                <div key={i} style={{ padding: "8px 8px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)", whiteSpace: "nowrap", position: "relative", userSelect: "none" }}>
                  {h}
                  {i < 13 && <div onMouseDown={e => startResize(i, e)} style={{ position: "absolute", right: -2, top: 0, bottom: 0, width: 5, cursor: "col-resize", zIndex: 3 }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,.4)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"} />}
                </div>
              ))}
            </div>

            {Object.entries(groups).map(([section, items]) => (
              <div key={section}>
                {/* Section row */}
                <div onClick={() => toggleSection(section)} style={{ padding: "8px 12px", background: "rgba(201,168,76,.04)", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <span style={{ fontSize: 10, transition: "transform .15s", display: "inline-block", transform: collapsedSections[section] ? "rotate(0deg)" : "rotate(90deg)" }}>▶</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{section}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>— {items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Data rows — inline editable */}
                {!collapsedSections[section] && items.map(r => {
                  const brandObj = brandList.find(b => b.name === r.brand);
                  const ownerObj = (teamMembers || []).find(m => m.name === r.owner);
                  const u = (field, val) => updateRequest(r.id, { [field]: val });
                  return (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: GRID, borderBottom: "1px solid var(--border2)", fontSize: 12, minHeight: 36 }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Expand button */}
                      <div style={{ ...cellBase, justifyContent: "center", cursor: "pointer", gap: 3 }} onClick={() => setSelectedReq(r)} title="Expand request"
                        onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".04em" }}>Expand</span>
                      </div>
                      {/* Brand */}
                      <div style={{ ...cellBase }}>
                        <select value={r.brand || ""} onChange={e => u("brand", e.target.value)} style={{ ...selStyle, color: brandObj?.color || "var(--gold)", fontWeight: 600, fontSize: 11 }}>
                          {brandList.map(b => <option key={b.id} value={b.name} style={{ color: b.color }}>{b.name}</option>)}
                          <option value="All Brands">All Brands</option>
                        </select>
                      </div>
                      {/* Project */}
                      <div style={{ ...cellBase }}>
                        <input value={r.project || ""} onChange={e => u("project", e.target.value)} style={{ ...inpStyle, fontWeight: 500 }} />
                      </div>
                      {/* Owner — plain text, comma-separate for multiple */}
                      <div style={{ ...cellBase }}>
                        <input value={r.owner || ""} onChange={e => u("owner", e.target.value)} style={{ ...inpStyle, color: "#e8a87c" }} placeholder="Add names..." title="Comma-separate multiple names" />
                      </div>
                      {/* Comments — next to owner */}
                      <div style={{ ...cellBase, justifyContent: "center", cursor: "pointer", position: "relative" }}
                        onClick={e => { e.stopPropagation(); setSelectedReq(selectedReq?.id === r.id ? null : { ...r, _openComments: true }); }}
                        title="Comments">
                        <span style={{ fontSize: 16, color: (r.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                        {r.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 4, fontSize: 8, background: "var(--gold)", color: "#07070f", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{r.comments.length}</span>}
                      </div>
                      {/* What is Needed */}
                      <div style={{ ...cellBase }}>
                        <select value={r.designType || ""} onChange={e => u("designType", e.target.value)} style={{ ...selStyle, color: "var(--text-dim)" }}>
                          {DESIGN_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      {/* Channel */}
                      <div style={{ ...cellBase }}>
                        <input value={r.channel || ""} onChange={e => u("channel", e.target.value)} style={{ ...inpStyle, color: "var(--text-muted)" }} placeholder="—" />
                      </div>
                      {/* Creative — plain text */}
                      <div style={{ ...cellBase }}>
                        <input value={r.creative || ""} onChange={e => u("creative", e.target.value)} style={{ ...inpStyle, color: "var(--text-dim)" }} placeholder="Add names..." />
                      </div>
                      {/* Due Date */}
                      <div style={{ ...cellBase }}>
                        <input type="date" value={r.dueDate || ""} onChange={e => u("dueDate", e.target.value)} style={{ ...inpStyle, fontSize: 11, color: "var(--text-muted)" }} />
                      </div>
                      {/* Live Date */}
                      <div style={{ ...cellBase }}>
                        <input type="date" value={r.liveDate || ""} onChange={e => u("liveDate", e.target.value)} style={{ ...inpStyle, fontSize: 11, color: "var(--text-muted)" }} />
                      </div>
                      {/* Created + Urgency */}
                      <div style={{ ...cellBase, gap: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) : "—"}</span>
                        {(() => {
                          if (!r.dueDate || !r.createdAt || r.status === "Completed") return null;
                          const now = Date.now();
                          const due = new Date(r.dueDate + "T00:00").getTime();
                          const daysLeft = Math.ceil((due - now) / 86400000);
                          if (daysLeft < 0) return <span title="Overdue" style={{ fontSize: 14, color: "#d94848", flexShrink: 0 }}>!!</span>;
                          if (daysLeft <= 3) return <span title={`${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`} style={{ fontSize: 14, color: "#e07b6a", flexShrink: 0 }}>!</span>;
                          if (daysLeft <= 7) return <span title={`${daysLeft} days left`} style={{ fontSize: 12, color: "#c9a84c", flexShrink: 0 }}>!</span>;
                          return null;
                        })()}
                      </div>
                      {/* Status */}
                      <div style={{ ...cellBase }}>
                        <select value={r.status || "Not Started"} onChange={e => u("status", e.target.value)}
                          style={{ ...selStyle, color: STATUS_COLORS[r.status] || "var(--text-muted)", fontWeight: 600, fontSize: 11 }}>
                          {DESIGN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {/* Priority */}
                      <div style={{ ...cellBase }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[r.priority] || "#888", flexShrink: 0, marginRight: 6 }} />
                        <select value={r.priority || "Medium"} onChange={e => u("priority", e.target.value)}
                          style={{ ...selStyle, color: PRIORITY_COLORS[r.priority] || "var(--text-muted)", fontWeight: 600, fontSize: 11 }}>
                          {DESIGN_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      {/* Notes */}
                      <div style={{ ...cellBase, borderRight: "none" }}>
                        <input value={r.notes || ""} onChange={e => u("notes", e.target.value)} style={{ ...inpStyle, color: "var(--text-muted)", fontSize: 11 }} placeholder="Add notes..." />
                      </div>
                    </div>
                  );
                })}

                {/* Add row button within section */}
                {!collapsedSections[section] && (
                  <div onClick={() => { setShowModal(true); }} style={{ padding: "6px 12px", borderBottom: "1px solid var(--border2)", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>
                    + Add row
                  </div>
                )}
              </div>
            ))}

            {/* Global add row if no sections */}
            {Object.keys(groups).length === 0 && filtered.length === 0 && requests.length > 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No requests match filters.</div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DESIGN REQUEST MODAL ──────────────────────────────────────────────────
function DesignRequestModal({ brands, teamMembers, onClose, onSave }) {
  const brandList = brands ? Object.values(brands) : [];
  const [f, setF] = useState({
    project: "", brand: brandList[0]?.name || "Headchange", owner: "", designType: DESIGN_TYPES[0],
    channel: CHANNELS[0], designer: "", creative: "", dueDate: "", liveDate: "", priority: "Medium",
    section: DESIGN_SECTIONS[0], notes: "",
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const selectedBrand = brandList.find(b => b.name === f.brand);
  const accentColor = selectedBrand?.color || "var(--gold)";

  // Right panel
  const [rightMode, setRightMode] = useState("brief");
  const [briefFile, setBriefFile] = useState(null);
  const [briefFileData, setBriefFileData] = useState(null);
  const [briefDragging, setBriefDragging] = useState(false);
  const briefRef = useRef();
  const [conceptHtml, setConceptHtml] = useState(null);
  const [conceptName, setConceptName] = useState(null);
  const [conceptDragging, setConceptDragging] = useState(false);
  const conceptRef = useRef();
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [filesDragging, setFilesDragging] = useState(false);
  const filesRef = useRef();
  const FILE_ACCEPTED = [".pdf",".doc",".docx",".txt",".md",".png",".jpg",".jpeg",".webp",".xls",".xlsx",".csv",".ppt",".pptx",".zip",".ai",".psd",".eps",".svg"];

  const readBrief = (file) => { if (!file) return; setBriefFile(file); const r = new FileReader(); r.onload = e => setBriefFileData(e.target.result); r.readAsDataURL(file); };
  const readHtml = (file) => { if (!file?.name.endsWith(".html")) return; const r = new FileReader(); r.onload = e => { setConceptHtml(e.target.result); setConceptName(file.name.replace(/\.html$/i, "")); }; r.readAsText(file); };
  const handleAttachFiles = async (fileList) => {
    for (const file of Array.from(fileList)) {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!FILE_ACCEPTED.some(a => ext === a)) continue;
      const data = await new Promise((res) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      setAttachedFiles(p => [...p, { name: file.name, type: file.type, size: file.size, data }]);
    }
  };

  const handleSave = () => {
    if (!f.project.trim()) return;
    onSave({ ...f, _briefFile: briefFile?.name || null, _briefFileData: briefFileData || null, _briefFileType: briefFile?.type || null, _html: conceptHtml || null, _htmlName: conceptName || null, _attachedFiles: attachedFiles });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 920 }}>
        <div className="mhdr" style={{ borderTop: `2px solid ${accentColor}`, borderRadius: "16px 16px 0 0" }}>
          <div className="mtitle">Submit Design Request</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {/* LEFT — form */}
          <div style={{ padding: "18px 20px", overflowY: "auto", borderRight: "1px solid var(--border2)", maxHeight: "72vh" }}>
            <div className="ff"><label className="fl">Project Name *</label><input className="fi" placeholder="e.g. Two New Flavor Launches" value={f.project} onChange={e => s("project", e.target.value)} /></div>
            <div className="frow">
              <div className="ff"><label className="fl">Brand</label>
                <select className="fsel" value={f.brand} onChange={e => s("brand", e.target.value)}>
                  {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  <option value="All Brands">All Brands</option>
                </select>
              </div>
              <div className="ff"><label className="fl">What is Needed</label>
                <select className="fsel" value={f.designType} onChange={e => s("designType", e.target.value)}>
                  {DESIGN_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="ff"><label className="fl">Channel</label>
              <select className="fsel" value={f.channel} onChange={e => s("channel", e.target.value)}>
                {CHANNELS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="frow">
              <div className="ff"><label className="fl">Project Owner</label>
                <input className="fi" placeholder="e.g. Munchi, Sanson" value={f.owner} onChange={e => s("owner", e.target.value)} />
              </div>
              <div className="ff"><label className="fl">Creative (who executes)</label>
                <input className="fi" placeholder="e.g. Tom, Allison Gellner" value={f.creative} onChange={e => s("creative", e.target.value)} />
              </div>
            </div>
            <div className="frow">
              <div className="ff"><label className="fl">Due Date</label><input className="fi" type="date" value={f.dueDate} onChange={e => s("dueDate", e.target.value)} /></div>
              <div className="ff"><label className="fl">Live Date</label><input className="fi" type="date" value={f.liveDate} onChange={e => s("liveDate", e.target.value)} /></div>
            </div>
            <div className="frow">
              <div className="ff"><label className="fl">Priority</label>
                <select className="fsel" value={f.priority} onChange={e => s("priority", e.target.value)}>
                  {DESIGN_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="ff"><label className="fl">Section</label>
                <select className="fsel" value={f.section} onChange={e => s("section", e.target.value)}>
                  {DESIGN_SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
            </div>
            <div className="ff"><label className="fl">Description / Notes</label><textarea className="fta" rows={3} placeholder="What specifically needs to be designed? Any references, sizes, or specs..." value={f.notes} onChange={e => s("notes", e.target.value)} /></div>
          </div>
          {/* RIGHT — attachments */}
          <div style={{ display: "flex", flexDirection: "column", maxHeight: "72vh" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
              {[["brief", "📎 Brief"], ["files", "📁 Files"], ["html", "🎨 HTML"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setRightMode(mode)} style={{
                  flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontFamily: "var(--bf)", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
                  background: rightMode === mode ? "var(--surface2)" : "transparent",
                  color: rightMode === mode ? accentColor : "var(--text-muted)",
                  borderBottom: rightMode === mode ? `2px solid ${accentColor}` : "2px solid transparent",
                }}>{label}{mode === "files" && attachedFiles.length > 0 ? ` (${attachedFiles.length})` : ""}</button>
              ))}
            </div>
            <div style={{ flex: 1, padding: "16px 18px", overflowY: "auto" }}>
              {rightMode === "brief" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Attach a design brief — PDF, Word, image, or text file.</div>
                  {!briefFile ? (
                    <div className={`bu-zone ${briefDragging ? "drag" : ""}`} style={{ minHeight: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      onDragOver={e => { e.preventDefault(); setBriefDragging(true); }} onDragLeave={() => setBriefDragging(false)}
                      onDrop={e => { e.preventDefault(); setBriefDragging(false); readBrief(e.dataTransfer.files[0]); }}
                      onClick={() => briefRef.current.click()}>
                      <span className="bu-icon">📎</span><div className="bu-title">Drop brief here</div><div className="bu-sub">PDF · Word · Image · Text</div>
                      <input ref={briefRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" style={{ display: "none" }} onChange={e => readBrief(e.target.files[0])} />
                    </div>
                  ) : (
                    <div className="bu-file-row"><span>📎</span><div className="bu-file-name">{briefFile.name}</div><button className="bu-file-rm" onClick={() => { setBriefFile(null); setBriefFileData(null); }}>✕</button></div>
                  )}
                </div>
              )}
              {rightMode === "files" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Attach reference files, assets, mockups, source files.</div>
                  <div className={`bu-zone ${filesDragging ? "drag" : ""}`} style={{ minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                    onDragOver={e => { e.preventDefault(); setFilesDragging(true); }} onDragLeave={() => setFilesDragging(false)}
                    onDrop={e => { e.preventDefault(); setFilesDragging(false); handleAttachFiles(e.dataTransfer.files); }}
                    onClick={() => filesRef.current.click()}>
                    <span className="bu-icon">📁</span><div className="bu-title">Drop files here</div><div className="bu-sub">PDF · Image · AI · PSD · SVG · Excel</div>
                    <input ref={filesRef} type="file" accept={FILE_ACCEPTED.join(",")} multiple style={{ display: "none" }} onChange={e => handleAttachFiles(e.target.files)} />
                  </div>
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {attachedFiles.map((af, i) => (
                        <div key={i} className="bu-file-row">
                          <span style={{ fontSize: 14 }}>{af.type?.startsWith("image/") ? "🖼" : "📄"}</span>
                          <div className="bu-file-name">{af.name}</div>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{(af.size / 1024).toFixed(0)} KB</span>
                          <button className="bu-file-rm" onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {rightMode === "html" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>Attach an HTML mockup or prototype.</div>
                  {!conceptHtml ? (
                    <div className={`bu-zone ${conceptDragging ? "drag" : ""}`} style={{ minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                      onDragOver={e => { e.preventDefault(); setConceptDragging(true); }} onDragLeave={() => setConceptDragging(false)}
                      onDrop={e => { e.preventDefault(); setConceptDragging(false); readHtml(e.dataTransfer.files[0]); }}
                      onClick={() => conceptRef.current.click()}>
                      <span className="bu-icon">🎨</span><div className="bu-title">Drop HTML file</div><div className="bu-sub">.html files only</div>
                      <input ref={conceptRef} type="file" accept=".html" style={{ display: "none" }} onChange={e => readHtml(e.target.files[0])} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="bu-file-row"><span>🎨</span><div className="bu-file-name">{conceptName}</div><button className="bu-file-rm" onClick={() => { setConceptHtml(null); setConceptName(null); }}>✕</button></div>
                      <div style={{ height: 180, borderRadius: 9, overflow: "hidden", position: "relative", background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <iframe srcDoc={conceptHtml} style={{ width: "200%", height: "200%", border: "none", transform: "scale(0.5)", transformOrigin: "0 0", pointerEvents: "none" }} sandbox="allow-scripts" title="preview" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={!f.project.trim()} onClick={handleSave}>Submit Request{briefFile ? " + Brief" : ""}{attachedFiles.length > 0 ? ` + ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""}` : ""}</button>
        </div>
      </div>
    </div>
  );
}

// ── DESIGN DETAIL MODAL ───────────────────────────────────────────────────
function DesignDetailModal({ request, brands, teamMembers, onClose, onUpdate, onDelete, currentUser }) {
  const brandList = brands ? Object.values(brands) : [];
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ ...request });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const brandObj = brandList.find(b => b.name === request.brand);
  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const comments = request.comments || [];
  const commentsRef = useRef();

  const addComment = () => {
    if (!commentText.trim()) return;
    const c = { id: `dc-${Date.now()}`, author: currentUser?.name || "Team", text: commentText.trim(), ts: new Date().toISOString(), replyTo: replyTo || null };
    onUpdate({ comments: [...comments, c] });
    setCommentText("");
    setReplyTo(null);
    setTimeout(() => { if (commentsRef.current) commentsRef.current.scrollTop = commentsRef.current.scrollHeight; }, 50);
  };
  const deleteComment = (id) => onUpdate({ comments: comments.filter(c => c.id !== id) });
  const saveEditComment = (id) => { onUpdate({ comments: comments.map(c => c.id === id ? { ...c, text: editCommentText } : c) }); setEditingComment(null); };

  const handleSave = () => { onUpdate(f); setEditing(false); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="mhdr" style={{ borderTop: `2px solid ${brandObj?.color || "var(--gold)"}`, borderRadius: "16px 16px 0 0" }}>
          <div className="mtitle">{request.project}</div>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", maxHeight: "65vh" }}>
          {!editing ? (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: brandObj ? brandObj.color + "18" : "rgba(201,168,76,.1)", color: brandObj?.color || "var(--gold)" }}>{request.brand}</span>
                <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${STATUS_COLORS[request.status]}30`, color: STATUS_COLORS[request.status] }}>{request.status}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[request.priority] }} />
                  <span style={{ color: PRIORITY_COLORS[request.priority] }}>{request.priority}</span>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", marginBottom: 20 }}>
                {[
                  ["Type", request.designType], ["Channel", (request.channel || "").split(" · ")[1] || request.channel],
                  ["Owner", request.owner || "—"], ["Creative", request.creative || "TBD"],
                  ["Due Date", request.dueDate ? new Date(request.dueDate + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
                  ["Live Date", request.liveDate ? new Date(request.liveDate + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
                  ["Section", request.section || "General"], ["Submitted By", request.createdBy || "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{val}</div>
                  </div>
                ))}
              </div>
              {request.notes && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, whiteSpace: "pre-wrap" }}>{request.notes}</div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Update Status</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DESIGN_STATUSES.map(st => (
                    <button key={st} onClick={() => onUpdate({ status: st })}
                      style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${STATUS_COLORS[st]}${request.status === st ? "" : "40"}`,
                        background: request.status === st ? STATUS_COLORS[st] + "20" : "transparent",
                        color: STATUS_COLORS[st], fontFamily: "var(--bf)",
                      }}>{st}</button>
                  ))}
                </div>
              </div>
              {/* Brief — always show with upload + download */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Brief</div>
                {request._briefFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ fontSize: 18 }}>📎</span>
                    <div style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{request._briefFile}</div>
                    {request._briefFileData && (
                      <>
                        <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", fontSize: 10 }} onClick={() => { window.open(request._briefFileData, "_blank", "noopener,noreferrer"); }}>View</button>
                        <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { const a = document.createElement("a"); a.href = request._briefFileData; a.download = request._briefFile; a.click(); }}>Download</button>
                      </>
                    )}
                    <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(224,123,106,.3)", color: "#e07b6a" }} onClick={() => onUpdate({ _briefFile: null, _briefFileData: null, _briefFileType: null })}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 8, cursor: "pointer" }}
                    onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.html"; inp.onchange = (e) => { const file = e.target.files[0]; if (!file) return; const r2 = new FileReader(); r2.onload = ev => { onUpdate({ _briefFile: file.name, _briefFileData: ev.target.result, _briefFileType: file.type }); }; r2.readAsDataURL(file); }; inp.click(); }}>
                    <span style={{ fontSize: 18, opacity: .4 }}>📎</span>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Click to attach a brief (PDF, Word, image, HTML)</div>
                  </div>
                )}
              </div>
              {/* Attached Files — always show with upload */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Attached Files {request._attachedFiles?.length > 0 && `(${request._attachedFiles.length})`}</div>
                  <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }}
                    onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.ai,.psd,.svg,.html"; inp.onchange = async (e) => { const files = Array.from(e.target.files); const newFiles = []; for (const file of files) { const data = await new Promise(res => { const r2 = new FileReader(); r2.onload = ev => res(ev.target.result); r2.readAsDataURL(file); }); newFiles.push({ name: file.name, type: file.type, size: file.size, data }); } onUpdate({ _attachedFiles: [...(request._attachedFiles || []), ...newFiles] }); }; inp.click(); }}>+ Add Files</button>
                </div>
                {(request._attachedFiles || []).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {request._attachedFiles.map((af, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <span style={{ fontSize: 16 }}>{af.type?.startsWith("image/") ? "🖼" : "📄"}</span>
                        <div style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{af.name}</div>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{(af.size / 1024).toFixed(0)} KB</span>
                        {af.data && <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { const a = document.createElement("a"); a.href = af.data; a.download = af.name; a.click(); }}>Download</button>}
                        <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(224,123,106,.2)", color: "#e07b6a" }} onClick={() => onUpdate({ _attachedFiles: request._attachedFiles.filter((_, j) => j !== i) })}>×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>No files attached.</div>
                )}
              </div>
              {/* HTML Concept — with download */}
              {request._html && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>HTML Concept — {request._htmlName || "Attached"}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { const blob = new Blob([request._html], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (request._htmlName || "concept") + ".html"; a.click(); }}>Download</button>
                      <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { const blob = new Blob([request._html], { type: "text/html" }); window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer"); }}>Open</button>
                    </div>
                  </div>
                  <div style={{ height: 200, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "#fff" }}>
                    <iframe srcDoc={request._html} style={{ width: "100%", height: "100%", border: "none" }} sandbox="allow-scripts" title="concept" />
                  </div>
                </div>
              )}
              {/* Comments */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 8 }}>Comments {comments.length > 0 && `(${comments.length})`}</div>
                <div ref={commentsRef} style={{ maxHeight: 260, overflowY: "auto", marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {comments.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", padding: "8px 0" }}>No comments yet.</div>}
                  {comments.map(c => {
                    const isReply = c.replyTo;
                    const parentComment = isReply ? comments.find(p => p.id === c.replyTo) : null;
                    return (
                      <div key={c.id} style={{ padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, marginLeft: isReply ? 24 : 0 }}>
                        {isReply && parentComment && <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontStyle: "italic" }}>Replying to {parentComment.author}</div>}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>{c.author}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(c.ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                        </div>
                        {editingComment === c.id ? (
                          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                            <input value={editCommentText} onChange={e => setEditCommentText(e.target.value)} style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }}
                              onKeyDown={e => { if (e.key === "Enter") saveEditComment(c.id); if (e.key === "Escape") setEditingComment(null); }} autoFocus />
                            <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={() => saveEditComment(c.id)}>Save</button>
                            <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => setEditingComment(null)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>{c.text}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                              <button onClick={() => { setReplyTo(c.id); }} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Reply</button>
                              {(c.author === currentUser?.name) && (
                                <>
                                  <button onClick={() => { setEditingComment(c.id); setEditCommentText(c.text); }} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Edit</button>
                                  <button onClick={() => deleteComment(c.id)} style={{ fontSize: 10, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>Delete</button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Add comment */}
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    {replyTo && (
                      <div style={{ fontSize: 10, color: "var(--gold)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        Replying to {comments.find(c => c.id === replyTo)?.author || "comment"}
                        <button onClick={() => setReplyTo(null)} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
                      </div>
                    )}
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                      placeholder="Add a comment..." style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
                  </div>
                  <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)", marginTop: replyTo ? 18 : 0 }} onClick={addComment} disabled={!commentText.trim()}>Send</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="ff"><label className="fl">Project</label><input className="fi" value={f.project} onChange={e => s("project", e.target.value)} /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Brand</label>
                  <select className="fsel" value={f.brand} onChange={e => s("brand", e.target.value)}>
                    {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    <option value="All Brands">All Brands</option>
                  </select>
                </div>
                <div className="ff"><label className="fl">Type</label>
                  <select className="fsel" value={f.designType} onChange={e => s("designType", e.target.value)}>
                    {DESIGN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="ff"><label className="fl">Channel</label>
                <select className="fsel" value={f.channel} onChange={e => s("channel", e.target.value)}>
                  {CHANNELS.map(x => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Owner</label>
                  <input className="fi" value={f.owner || ""} onChange={e => s("owner", e.target.value)} placeholder="e.g. Munchi, Sanson" />
                </div>
                <div className="ff"><label className="fl">Creative (who executes)</label>
                  <input className="fi" value={f.creative || ""} onChange={e => s("creative", e.target.value)} placeholder="e.g. Tom, Allison" />
                </div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Due Date</label><input className="fi" type="date" value={f.dueDate || ""} onChange={e => s("dueDate", e.target.value)} /></div>
                <div className="ff"><label className="fl">Live Date</label><input className="fi" type="date" value={f.liveDate || ""} onChange={e => s("liveDate", e.target.value)} /></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Priority</label>
                  <select className="fsel" value={f.priority} onChange={e => s("priority", e.target.value)}>
                    {DESIGN_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="ff"><label className="fl">Section</label>
                  <select className="fsel" value={f.section || DESIGN_SECTIONS[0]} onChange={e => s("section", e.target.value)}>
                    {DESIGN_SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>
              </div>
              <div className="ff"><label className="fl">Notes</label><textarea className="fta" rows={3} value={f.notes || ""} onChange={e => s("notes", e.target.value)} /></div>
            </>
          )}
        </div>
        <div className="mfoot">
          {!editing ? (
            <>
              <button className="btn" style={{ borderColor: "rgba(224,123,106,.3)", color: "#e07b6a" }} onClick={() => { if (confirm(`Delete "${request.project}"?`)) { onDelete(); onClose(); } }}>Delete</button>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn" onClick={onClose}>Close</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSave}>Save Changes</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FIELD TEAM PORTAL
// ════════════════════════════════════════════════════════════════════════════
function FieldTeamPortal({ tree, setTree, contacts, setContacts, tierList, setTierList, drops, setDrops, creditMemos, setCreditMemos, salesContacts, setSalesContacts, promoCalendar, setPromoCalendar, popupsData, setPopupsData, eventsData, setEventsData, csBoardData, setCsBoardData, fieldAgenda, setFieldAgenda, currentUser }) {
  const [expanded, setExpanded] = useState(() => new Set(tree.filter(n => n.type === "folder").map(n => n.id)));
  const [selectedId, setSelectedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [menuId, setMenuId] = useState(null);
  const attachRef = useRef();

  const getChildren = (parentId) => tree.filter(n => n.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = tree.find(n => n.id === selectedId);
  const isContactsView = selected?.name === "Centralized Contacts";
  const isTierListView = selected?.name === "Tier List Tracker";
  const isDropsView = selected?.name === "2026 Weekly Drops Menu";
  const isCreditMemosView = selected?.name === "Credit Memo Requests";
  const isSalesContactsView = selected?.name === "Sales Contact List";
  const isPromoCalendarView = selected?.name === "Promo Calendar- Work In Progress";
  const isPopupsView = selected?.name === "Popups and Blitz Calendar";
  const isEventsView = selected?.name === "Events & Event Support";
  const isAgendaView = selected?.name === "Field Marketing Weekly";
  const isCsBoardView = selected?.name === "Customer Service Board";

  const addNode = (parentId, type) => {
    const siblings = getChildren(parentId);
    const node = { id: `ft-${Date.now()}`, parentId, type, name: type === "folder" ? "New Folder" : "New Document", sortOrder: siblings.length, notes: "", link: "", attachments: [] };
    setTree(p => [...p, node]);
    if (parentId) setExpanded(p => new Set([...p, parentId]));
    setRenamingId(node.id);
    setRenameVal(node.name);
    if (type === "doc") setSelectedId(node.id);
  };

  const updateNode = (id, patch) => setTree(p => p.map(n => n.id === id ? { ...n, ...patch } : n));

  const deleteNode = (id) => {
    const descendants = new Set();
    const collect = (pid) => { tree.filter(n => n.parentId === pid).forEach(n => { descendants.add(n.id); collect(n.id); }); };
    descendants.add(id);
    collect(id);
    setTree(p => p.filter(n => !descendants.has(n.id)));
    if (selectedId && descendants.has(selectedId)) setSelectedId(null);
  };

  const handleAttach = async (files) => {
    if (!selected) return;
    const newFiles = [];
    for (const file of Array.from(files)) {
      if (file.size > 2 * 1024 * 1024) continue;
      const data = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      newFiles.push({ id: `fa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: file.name, dataUrl: data });
    }
    updateNode(selected.id, { attachments: [...(selected.attachments || []), ...newFiles] });
  };

  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === "folder";
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;
    const children = isFolder ? getChildren(node.id) : [];
    return (
      <div key={node.id}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", paddingLeft: 10 + depth * 18, cursor: "pointer", borderRadius: 6, fontSize: 12, position: "relative", background: isSelected ? "var(--gold-dim)" : "transparent", color: isSelected ? "var(--gold)" : "var(--text-dim)", border: `1px solid ${isSelected ? "rgba(201,168,76,.25)" : "transparent"}` }}
          onClick={() => { if (isFolder) { setExpanded(p => { const n = new Set(p); if (n.has(node.id)) n.delete(node.id); else n.add(node.id); return n; }); } setSelectedId(node.id); }}
          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
          {isFolder && <span style={{ fontSize: 9, transition: "transform .15s", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", opacity: .5 }}>▶</span>}
          <span style={{ fontSize: 13 }}>{isFolder ? "📁" : "📄"}</span>
          {renamingId === node.id ? (
            <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onBlur={() => { if (renameVal.trim()) updateNode(node.id, { name: renameVal.trim() }); setRenamingId(null); }}
              onKeyDown={e => { if (e.key === "Enter") { if (renameVal.trim()) updateNode(node.id, { name: renameVal.trim() }); setRenamingId(null); } if (e.key === "Escape") setRenamingId(null); }}
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--gold)", borderRadius: 4, padding: "2px 6px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
          ) : (
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isSelected ? 600 : 400 }}>{node.name}</span>
          )}
          <span onClick={e => { e.stopPropagation(); setMenuId(menuId === node.id ? null : node.id); }} style={{ fontSize: 14, opacity: .3, padding: "0 2px", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".3"}>⋯</span>
          {menuId === node.id && (
            <div style={{ position: "absolute", right: 4, top: "100%", zIndex: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 0", boxShadow: "0 8px 24px rgba(0,0,0,.4)", minWidth: 140 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { setRenamingId(node.id); setRenameVal(node.name); setMenuId(null); }} style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "none", color: "var(--text-dim)", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "var(--bf)" }}>Rename</button>
              {isFolder && <button onClick={() => { addNode(node.id, "doc"); setMenuId(null); }} style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "none", color: "var(--text-dim)", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "var(--bf)" }}>+ Add Document</button>}
              {isFolder && <button onClick={() => { addNode(node.id, "folder"); setMenuId(null); }} style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "none", color: "var(--text-dim)", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "var(--bf)" }}>+ Add Folder</button>}
              <div style={{ height: 1, background: "var(--border2)", margin: "4px 0" }} />
              <button onClick={() => { if (confirm(`Delete "${node.name}"?`)) deleteNode(node.id); setMenuId(null); }} style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "none", color: "#e07b6a", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "var(--bf)" }}>Delete</button>
            </div>
          )}
        </div>
        {isFolder && isExpanded && children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", overflow: "hidden" }} onClick={() => setMenuId(null)}>
      {/* Left — Tree */}
      <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border2)" }}>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>Sales & Field Operations</div>
          <div style={{ fontFamily: "var(--df)", fontSize: 20, fontWeight: 300, color: "var(--text)", lineHeight: 1.1, marginBottom: 8 }}>Field Team</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" style={{ flex: 1, fontSize: 10, borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={() => addNode(null, "folder")}>+ Folder</button>
            <button className="btn btn-sm" style={{ flex: 1, fontSize: 10, borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={() => addNode(null, "doc")}>+ Document</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
          {getChildren(null).map(node => renderNode(node))}
        </div>
      </div>
      {/* Right — Detail */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selected && isContactsView ? (
          <ContactsTable contacts={contacts} setContacts={setContacts} currentUser={currentUser} />
        ) : selected && isTierListView ? (
          <TierListTable data={tierList} setData={setTierList} currentUser={currentUser} />
        ) : selected && isDropsView ? (
          <WeeklyDropsTable drops={drops} setDrops={setDrops} />
        ) : selected && isCreditMemosView ? (
          <CreditMemoTable data={creditMemos} setData={setCreditMemos} currentUser={currentUser} />
        ) : selected && isSalesContactsView ? (
          <SalesContactTable data={salesContacts} setData={setSalesContacts} currentUser={currentUser} />
        ) : selected && isPromoCalendarView ? (
          <PromoCalendarTable data={promoCalendar} setData={setPromoCalendar} currentUser={currentUser} />
        ) : selected && isPopupsView ? (
          <PopupsBlitzTable data={popupsData} setData={setPopupsData} currentUser={currentUser} />
        ) : selected && isEventsView ? (
          <EventsTable data={eventsData} setData={setEventsData} currentUser={currentUser} />
        ) : selected && isCsBoardView ? (
          <CSBoardTable data={csBoardData} setData={setCsBoardData} currentUser={currentUser} />
        ) : selected && isAgendaView ? (
          <FieldAgendaTable data={fieldAgenda} setData={setFieldAgenda} currentUser={currentUser} />
        ) : selected ? (
          <>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{selected.type === "folder" ? "📁" : "📄"}</span>
                <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>{selected.name}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm" onClick={() => { setRenamingId(selected.id); setRenameVal(selected.name); }}>Rename</button>
                {selected.type === "folder" && <button className="btn btn-sm" style={{ borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={() => addNode(selected.id, "doc")}>+ Document</button>}
                <button className="btn btn-sm" style={{ borderColor: "rgba(224,123,106,.3)", color: "#e07b6a" }} onClick={() => { if (confirm(`Delete "${selected.name}"?`)) deleteNode(selected.id); }}>Delete</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>External Link</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={selected.link || ""} onChange={e => updateNode(selected.id, { link: e.target.value })} placeholder="Paste a Google Sheets, Docs, or any URL..."
                    style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
                  {selected.link && <button className="btn btn-sm" onClick={() => window.open(selected.link, "_blank", "noopener,noreferrer")}>Open ↗</button>}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Notes</div>
                <textarea value={selected.notes || ""} onChange={e => updateNode(selected.id, { notes: e.target.value })} placeholder="Add notes, instructions, or content..."
                  style={{ width: "100%", minHeight: 200, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", outline: "none", resize: "vertical", lineHeight: 1.7 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Attachments {(selected.attachments?.length > 0) && `(${selected.attachments.length})`}</div>
                  <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(201,168,76,.3)", color: "var(--gold)" }} onClick={() => attachRef.current?.click()}>+ Add Files</button>
                  <input ref={attachRef} type="file" multiple style={{ display: "none" }} onChange={e => handleAttach(e.target.files)} />
                </div>
                {(selected.attachments || []).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selected.attachments.map(af => (
                      <div key={af.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <span style={{ fontSize: 16 }}>📄</span>
                        <div style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{af.name}</div>
                        <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { const a = document.createElement("a"); a.href = af.dataUrl; a.download = af.name; a.click(); }}>Download</button>
                        <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(224,123,106,.2)", color: "#e07b6a" }} onClick={() => updateNode(selected.id, { attachments: selected.attachments.filter(a => a.id !== af.id) })}>×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }} onClick={() => attachRef.current?.click()}>
                    Click to attach files (max 2MB per file)
                  </div>
                )}
              </div>
              {selected.type === "folder" && getChildren(selected.id).length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Contents</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {getChildren(selected.id).map(child => (
                      <div key={child.id} onClick={() => setSelectedId(child.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,.3)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                        <span style={{ fontSize: 14 }}>{child.type === "folder" ? "📁" : "📄"}</span>
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{child.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: 48, opacity: .3, marginBottom: 16 }}>📁</div>
              <div style={{ fontFamily: "var(--df)", fontSize: 24, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>Field Team Portal</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>Select a folder or document from the tree to view details, add notes, attach files, or link to external spreadsheets.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CONTACTS TABLE (Centralized Contacts) ─────────────────────────────────
function ContactsTable({ contacts, setContacts, currentUser }) {
  const [collapsed, setCollapsed] = useState({});
  const [didInitCollapse, setDidInitCollapse] = useState(false);
  useEffect(() => {
    if (!didInitCollapse && contacts.length > 0) {
      const all = {};
      [...new Set(contacts.map(c => c.section))].forEach(s => { all[s] = true; });
      setCollapsed(all);
      setDidInitCollapse(true);
    }
  }, [contacts, didInitCollapse]);
  const [filterTier, setFilterTier] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [groupBy, setGroupBy] = useState("section"); // "section" | "tier" | "account" | "role"
  const [showGroupBy, setShowGroupBy] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [commentOpen, setCommentOpen] = useState(null);
  const [commentText, setCommentText] = useState("");

  const sections = [...new Set(contacts.map(c => c.section))];

  const addComment = (contactId) => {
    if (!commentText.trim()) return;
    const c = { id: `ccm-${Date.now()}`, author: currentUser?.name || "Team", text: commentText.trim(), ts: new Date().toISOString() };
    setContacts(p => p.map(ct => ct.id === contactId ? { ...ct, comments: [...(ct.comments || []), c] } : ct));
    setCommentText("");
  };
  const deleteComment = (contactId, cId) => setContacts(p => p.map(ct => ct.id === contactId ? { ...ct, comments: (ct.comments || []).filter(c => c.id !== cId) } : ct));
  const tiers = [...new Set(contacts.map(c => c.tier).filter(Boolean))].sort();

  const updateContact = (id, field, val) => setContacts(p => p.map(c => c.id === id ? { ...c, [field]: val } : c));
  const deleteContact = (id) => setContacts(p => p.filter(c => c.id !== id));
  const addContact = (section) => {
    setContacts(p => [...p, { id: `cc-${Date.now()}`, section, name: "", role: "", email: "", tier: "", tierTracker: "", location: "", account: "", phone: "", lastContacted: "", storeOwner: "", notes: "" }]);
  };
  const addGroup = () => {
    if (!newGroupName.trim()) return;
    addContact(newGroupName.trim());
    setNewGroupName("");
    setShowNewGroup(false);
  };

  let filtered = contacts.filter(c => {
    if (filterTier !== "all" && c.tier !== filterTier) return false;
    if (filterSection !== "all" && c.section !== filterSection) return false;
    if (search) {
      const s = search.toLowerCase();
      return (c.name||"").toLowerCase().includes(s) || (c.email||"").toLowerCase().includes(s) || (c.account||"").toLowerCase().includes(s) || (c.role||"").toLowerCase().includes(s);
    }
    return true;
  });

  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      const av = (a[sortField] || "").toLowerCase();
      const bv = (b[sortField] || "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const groups = {};
  const groupKey = groupBy === "tier" ? "tier" : groupBy === "account" ? "account" : groupBy === "role" ? "role" : "section";
  filtered.forEach(c => { const g = c[groupKey] || "Other"; if (!groups[g]) groups[g] = []; groups[g].push(c); });

  const TIER_COLORS = { "Tier 1": "#4d9e8e", "Tier 2": "#c9a84c", "Tier 3": "#e07b6a" };
  const SECTION_COLORS = { "Global Contacts": "#6366f1", "SWMO": "#4d9e8e", "KC": "#3b82f6", "SEMO": "#22c55e", "STL": "#c9a84c", "MidMO": "#a855f7", "COMO": "#f59e0b" };
  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const CG = "1fr 130px 1fr 80px 140px 100px 110px 110px 100px 90px 1fr 40px 30px";
  const tbtn = { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "none", background: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 12, fontFamily: "var(--bf)", fontWeight: 500, borderRadius: 6, transition: "all .15s", whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6 }} onClick={() => addContact(sections[0] || "Global Contacts")}>+ New Contact</button>
        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
        <button onClick={() => setSearchOpen(o => !o)} style={{ ...tbtn, color: searchOpen ? "var(--gold)" : "var(--text-dim)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          🔍 Search
        </button>
        <button style={tbtn} onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} style={{ background: "none", border: "none", color: "inherit", fontSize: 12, fontFamily: "var(--bf)", cursor: "pointer", outline: "none" }}>
            <option value="all">All Regions</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </button>
        <button style={tbtn} onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ background: "none", border: "none", color: "inherit", fontSize: 12, fontFamily: "var(--bf)", cursor: "pointer", outline: "none" }}>
            <option value="all">Filter Tier</option>
            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </button>
        <button style={tbtn} onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <select value={sortField ? `${sortField}-${sortDir}` : ""} onChange={e => { const v = e.target.value; if (!v) { setSortField(""); return; } const [f, d] = v.split("-"); setSortField(f); setSortDir(d); }}
            style={{ background: "none", border: "none", color: "inherit", fontSize: 12, fontFamily: "var(--bf)", cursor: "pointer", outline: "none" }}>
            <option value="">Sort</option>
            <option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option>
            <option value="tier-asc">Tier 1-3</option><option value="tier-desc">Tier 3-1</option>
            <option value="account-asc">Account A-Z</option><option value="role-asc">Role A-Z</option>
          </select>
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowGroupBy(o => !o)} style={{ ...tbtn, color: groupBy !== "section" ? "var(--gold)" : "var(--text-dim)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
            Group by
          </button>
          {showGroupBy && (
            <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 0", boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 20, minWidth: 180 }}>
              {[["section", "Region"], ["tier", "Tier"], ["account", "Account/Store"], ["role", "Role"]].map(([val, label]) => (
                <button key={val} onClick={() => { setGroupBy(val); setShowGroupBy(false); }} style={{ display: "block", width: "100%", padding: "8px 16px", border: "none", background: groupBy === val ? "var(--gold-dim)" : "none", color: groupBy === val ? "var(--gold)" : "var(--text-dim)", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "var(--bf)" }}>{label}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} contact{filtered.length !== 1 ? "s" : ""}</div>
      </div>
      {/* Search bar */}
      {searchOpen && (
        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border2)", background: "var(--surface2)" }}>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, account, role..." style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 1200 }}>
          <div style={{ display: "grid", gridTemplateColumns: CG, background: "var(--surface3)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
            {["Contact","Role","Email","Tier","Tier Tracker","Location","Account","Phone","Last Contact","Owner","Notes","💬",""].map(h => (
              <div key={h} style={{ padding: "8px 8px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
            ))}
          </div>
          {Object.entries(groups).map(([section, items]) => (
            <div key={section}>
              <div onClick={() => setCollapsed(p => ({ ...p, [section]: !p[section] }))} style={{ padding: "10px 12px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", borderLeft: `3px solid ${SECTION_COLORS[section] || "var(--gold)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[section] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s" }}>▶</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: SECTION_COLORS[section] || "var(--gold)" }}>{section}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{items.length} Contact{items.length !== 1 ? "s" : ""}</span>
              </div>
              {!collapsed[section] && items.map(c => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: CG, borderBottom: "1px solid var(--border2)", minHeight: 34 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={cs}><input value={c.name||""} onChange={e => updateContact(c.id,"name",e.target.value)} style={{ ...is, fontWeight: 500, color: "var(--text)" }} placeholder="Name" /></div>
                  <div style={cs}><input value={c.role||""} onChange={e => updateContact(c.id,"role",e.target.value)} style={is} /></div>
                  <div style={cs}><input value={c.email||""} onChange={e => updateContact(c.id,"email",e.target.value)} style={{ ...is, color: "#89a8e0" }} /></div>
                  <div style={cs}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: TIER_COLORS[c.tier]||"#555", flexShrink: 0, marginRight: 4 }} />
                    <select value={c.tier||""} onChange={e => updateContact(c.id,"tier",e.target.value)} style={{ ...is, color: TIER_COLORS[c.tier]||"var(--text-muted)", fontWeight: 600, fontSize: 10 }}>
                      <option value="">—</option><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option>
                    </select>
                  </div>
                  <div style={cs}><input value={c.tierTracker||""} onChange={e => updateContact(c.id,"tierTracker",e.target.value)} style={is} /></div>
                  <div style={cs}><input value={c.location||""} onChange={e => updateContact(c.id,"location",e.target.value)} style={is} /></div>
                  <div style={cs}><input value={c.account||""} onChange={e => updateContact(c.id,"account",e.target.value)} style={is} /></div>
                  <div style={cs}><input value={c.phone||""} onChange={e => updateContact(c.id,"phone",e.target.value)} style={is} /></div>
                  <div style={cs}><input type="date" value={c.lastContacted||""} onChange={e => updateContact(c.id,"lastContacted",e.target.value)} style={{ ...is, fontSize: 10, color: "var(--text-muted)" }} /></div>
                  <div style={cs}><input value={c.storeOwner||""} onChange={e => updateContact(c.id,"storeOwner",e.target.value)} style={is} /></div>
                  <div style={cs}><input value={c.notes||""} onChange={e => updateContact(c.id,"notes",e.target.value)} style={is} placeholder="Notes..." /></div>
                  {/* Comment */}
                  <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }}
                    onClick={e => { e.stopPropagation(); setCommentOpen(commentOpen === c.id ? null : c.id); }}>
                    <span style={{ fontSize: 16, color: (c.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                    {c.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{c.comments.length}</span>}
                    {commentOpen === c.id && (
                      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "100%", width: 300, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{c.name || "Contact"}</div>
                        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                          {(c.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments yet.</div>}
                          {(c.comments || []).map(cm => (
                            <div key={cm.id} style={{ padding: "8px 10px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)" }}>{cm.author}</span>
                                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{new Date(cm.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>{cm.text}</div>
                              {cm.author === currentUser?.name && <button onClick={() => deleteComment(c.id, cm.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)", marginTop: 2 }}>Delete</button>}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(c.id); }} placeholder="Add comment..."
                            style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                          <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(c.id)}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteContact(c.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
                </div>
              ))}
              {!collapsed[section] && (
                <div onClick={() => addContact(section)} style={{ padding: "6px 12px", borderBottom: "1px solid var(--border2)", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity="1"} onMouseLeave={e => e.currentTarget.style.opacity=".5"}>+ Add contact</div>
              )}
            </div>
          ))}
          {/* Add new group */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            {showNewGroup ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addGroup(); if (e.key === "Escape") setShowNewGroup(false); }}
                  placeholder="Group name (e.g. NEMO, Columbia)" style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
                <button className="btn btn-sm" style={{ borderColor: "rgba(184,150,58,.3)", color: "var(--gold)", fontSize: 10 }} onClick={addGroup}>Add</button>
                <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => setShowNewGroup(false)}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowNewGroup(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 8, background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "var(--bf)", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                + Add new group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TIER LIST TABLE ───────────────────────────────────────────────────────
function TierListTable({ data, setData, currentUser }) {
  const [collapsed, setCollapsed] = useState({ "Tier 1": true, "Tier 2": true, "Tier 3": true });
  const [expandedAcct, setExpandedAcct] = useState({});
  const [filterTier, setFilterTier] = useState("all");
  const [search, setSearch] = useState("");
  const [commentOpen, setCommentOpen] = useState(null); // account id
  const [commentText, setCommentText] = useState("");
  const commentRef = useRef();

  const TIER_COLORS = { "Tier 1": "#4d9e8e", "Tier 2": "#c9a84c", "Tier 3": "#e07b6a" };
  const tiers = [...new Set(data.map(a => a.tier))];

  const updateAccount = (id, field, val) => setData(p => p.map(a => a.id === id ? { ...a, [field]: val } : a));
  const updateStore = (acctId, storeId, field, val) => setData(p => p.map(a => a.id === acctId ? { ...a, stores: a.stores.map(s => s.id === storeId ? { ...s, [field]: val } : s) } : a));
  const addComment = (acctId) => {
    if (!commentText.trim()) return;
    const c = { id: `tc-${Date.now()}`, author: currentUser?.name || "Team", text: commentText.trim(), ts: new Date().toISOString() };
    setData(p => p.map(a => a.id === acctId ? { ...a, comments: [...(a.comments || []), c] } : a));
    setCommentText("");
  };
  const deleteComment = (acctId, cId) => setData(p => p.map(a => a.id === acctId ? { ...a, comments: (a.comments || []).filter(c => c.id !== cId) } : a));

  const filtered = data.filter(a => {
    if (filterTier !== "all" && a.tier !== filterTier) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.name.toLowerCase().includes(s) || a.brandsCarried?.toLowerCase().includes(s) || a.stores.some(st => st.name.toLowerCase().includes(s));
    }
    return true;
  });

  const groups = {};
  filtered.forEach(a => { if (!groups[a.tier]) groups[a.tier] = []; groups[a.tier].push(a); });

  const cs = { padding: "5px 6px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const AG = "1fr 36px 140px 130px 80px 80px 80px 80px 80px 80px 80px 80px 80px";
  const SG = "30px 1fr 120px 70px 100px 80px 80px 90px 80px 80px 80px 80px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Tier List Tracker</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} account{filtered.length !== 1 ? "s" : ""} / {filtered.reduce((s, a) => s + a.stores.length, 0)} stores</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts or stores..." style={{ flex: 1, minWidth: 180, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }}>
            <option value="all">All Tiers</option>
            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 1100 }}>
          {/* Account header */}
          <div style={{ display: "grid", gridTemplateColumns: AG, background: "var(--surface3)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
            {["Account", "💬", "Brands Carried", "POC Access", "Discount", "Inventory", "Assets", "In-Store", "Digital", "Promos", "Orders", "Scorecard", "Proj Q2"].map(h => (
              <div key={h} style={{ padding: "8px 6px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
            ))}
          </div>
          {Object.entries(groups).map(([tier, accounts]) => (
            <div key={tier}>
              <div onClick={() => setCollapsed(p => ({ ...p, [tier]: !p[tier] }))} style={{ padding: "8px 12px", background: "rgba(201,168,76,.04)", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[tier] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s" }}>▶</span>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: TIER_COLORS[tier] || "#888" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: TIER_COLORS[tier] || "var(--text)" }}>{tier}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{accounts.length} accounts</span>
              </div>
              {!collapsed[tier] && accounts.map(a => (
                <div key={a.id}>
                  {/* Account row */}
                  <div style={{ display: "grid", gridTemplateColumns: AG, borderBottom: "1px solid var(--border2)", minHeight: 34, background: "rgba(255,255,255,.01)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.01)"}>
                    <div style={{ ...cs, gap: 6 }}>
                      <span onClick={() => setExpandedAcct(p => ({ ...p, [a.id]: !p[a.id] }))} style={{ cursor: "pointer", fontSize: 9, opacity: .5, display: "inline-block", transform: expandedAcct[a.id] ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s" }}>▶</span>
                      <input value={a.name} onChange={e => updateAccount(a.id, "name", e.target.value)} style={{ ...is, fontWeight: 600, color: "var(--text)" }} />
                      <span style={{ fontSize: 9, color: "var(--text-muted)", flexShrink: 0 }}>{a.stores.length}</span>
                    </div>
                    {/* Comment — next to account */}
                    <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }}
                      onClick={e => { e.stopPropagation(); setCommentOpen(commentOpen === a.id ? null : a.id); }}>
                      <span style={{ fontSize: 16, color: (a.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                      {a.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{a.comments.length}</span>}
                      {commentOpen === a.id && (
                        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{a.name}</div>
                          <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                            {(a.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}
                            {(a.comments || []).map(c => (
                              <div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span><span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                                <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                                {c.author === currentUser?.name && <button onClick={() => deleteComment(a.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(a.id); }} placeholder="Comment..."
                              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                            <button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(a.id)}>Send</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={cs}><input value={a.brandsCarried||""} onChange={e => updateAccount(a.id, "brandsCarried", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.pocAccess||""} onChange={e => updateAccount(a.id, "pocAccess", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.discount||""} onChange={e => updateAccount(a.id, "discount", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.inventoryReports||""} onChange={e => updateAccount(a.id, "inventoryReports", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.assetUsage||""} onChange={e => updateAccount(a.id, "assetUsage", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.inStoreVM||""} onChange={e => updateAccount(a.id, "inStoreVM", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.digitalAssets||""} onChange={e => updateAccount(a.id, "digitalAssets", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.promoParticipation||""} onChange={e => updateAccount(a.id, "promoParticipation", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.orderCadence||""} onChange={e => updateAccount(a.id, "orderCadence", e.target.value)} style={is} /></div>
                    <div style={cs}><input value={a.scorecard||""} onChange={e => updateAccount(a.id, "scorecard", e.target.value)} style={is} /></div>
                    <div style={{ ...cs, borderRight: "none" }}><input value={a.projQ2||""} onChange={e => updateAccount(a.id, "projQ2", e.target.value)} style={is} /></div>
                  </div>
                  {/* Store sub-rows */}
                  {expandedAcct[a.id] && a.stores.map(st => (
                    <div key={st.id} style={{ display: "grid", gridTemplateColumns: SG, borderBottom: "1px solid var(--border2)", minHeight: 30, background: "rgba(201,168,76,.02)" }}>
                      <div style={{ ...cs, justifyContent: "center" }}><span style={{ fontSize: 8, color: "var(--text-muted)" }}>└</span></div>
                      <div style={cs}><input value={st.name||""} onChange={e => updateStore(a.id, st.id, "name", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.storeRep||""} onChange={e => updateStore(a.id, st.id, "storeRep", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.region||""} onChange={e => updateStore(a.id, st.id, "region", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.msrpDetails||""} onChange={e => updateStore(a.id, st.id, "msrpDetails", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.msrpChanges||""} onChange={e => updateStore(a.id, st.id, "msrpChanges", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.carriedAllBrands||""} onChange={e => updateStore(a.id, st.id, "carriedAllBrands", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.whatsMissing||""} onChange={e => updateStore(a.id, st.id, "whatsMissing", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.assetUsage||""} onChange={e => updateStore(a.id, st.id, "assetUsage", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.inStoreVM||""} onChange={e => updateStore(a.id, st.id, "inStoreVM", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={cs}><input value={st.digitalAsset||""} onChange={e => updateStore(a.id, st.id, "digitalAsset", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                      <div style={{ ...cs, borderRight: "none" }}><input value={st.promoParticipation||""} onChange={e => updateStore(a.id, st.id, "promoParticipation", e.target.value)} style={{ ...is, fontSize: 10 }} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── WEEKLY DROPS TABLE ────────────────────────────────────────────────────
const DROP_BRANDS = ["Headchange", "Safe Bet", "Bubbles", "Airo"];
const DROP_FORMATS = ["Rosin (1g)", "Rosin (2g)", "Rosin (1g + 2g)", "Badder (1g)", "Badder (2g)", "Badder (1g + 2g)", "Sugar", "Sauce Cart", "Rosin Cart", "Rosin AIO", "Resin AIO", "AIO Rosin", "AIO Resin", "Disti Cart", "Mini Hash Hole", "Hash Hole", "Preroll (single)", "Preroll (5pk)", "Preroll (14pk)", "Blunt (1g)", "Diamond Infused Rolls (7pk)", "Diamond Infused Rolls (15pk)", "FECO", "FECO + CBN", "Other"];
const BRAND_COLORS_MAP = { "Headchange": "#c9a84c", "Safe Bet": "#e07b6a", "Bubbles": "#6366f1", "Airo": "#4d9e8e" };

function WeeklyDropsTable({ drops, setDrops }) {
  const [collapsed, setCollapsed] = useState({});
  const [filterBrand, setFilterBrand] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newDrop, setNewDrop] = useState({ weekOf: "", brand: "Headchange", format: DROP_FORMATS[0], sku: "" });

  const updateDrop = (id, field, val) => setDrops(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteDrop = (id) => setDrops(p => p.filter(d => d.id !== id));
  const addDrop = () => {
    if (!newDrop.sku.trim() || !newDrop.weekOf) return;
    setDrops(p => [{ ...newDrop, id: `wd-${Date.now()}`, sku: newDrop.sku.trim(), socialHighlight: false }, ...p]);
    setNewDrop({ weekOf: newDrop.weekOf, brand: newDrop.brand, format: newDrop.format, sku: "" });
  };

  const filtered = drops.filter(d => {
    if (filterBrand !== "all" && d.brand !== filterBrand) return false;
    if (search && !(d.sku||"").toLowerCase().includes(search.toLowerCase()) && !(d.format||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by week
  const weeks = {};
  filtered.forEach(d => { const w = d.weekOf || "No Date"; if (!weeks[w]) weeks[w] = []; weeks[w].push(d); });
  const sortedWeeks = Object.keys(weeks).sort((a, b) => {
    const pa = a.split("/").map(Number), pb = b.split("/").map(Number);
    return (pb[0] * 100 + pb[1]) - (pa[0] * 100 + pa[1]);
  });

  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const [cmtOpen, setCmtOpen] = useState(null);
  const [cmtText, setCmtText] = useState("");
  const addDropComment = (dropId) => {
    if (!cmtText.trim()) return;
    setDrops(p => p.map(d => d.id === dropId ? { ...d, comments: [...(d.comments || []), { id: `wdc-${Date.now()}`, author: "Team", text: cmtText.trim(), ts: new Date().toISOString() }] } : d));
    setCmtText("");
  };
  const deleteDropComment = (dropId, cId) => setDrops(p => p.map(d => d.id === dropId ? { ...d, comments: (d.comments || []).filter(c => c.id !== cId) } : d));
  const DG = "100px 160px 160px 32px 24px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>2026 Weekly Drops Menu</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} drop{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAdd(o => !o)}>+ New Drop</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search strain or format..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }}>
            <option value="all">All Brands</option>
            {DROP_BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        {/* Quick add form */}
        {showAdd && (
          <div style={{ marginTop: 10, padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Week Of</label>
              <input type="date" value={newDrop.weekOf} onChange={e => setNewDrop(p => ({ ...p, weekOf: e.target.value ? new Date(e.target.value + "T00:00").toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) : "" }))}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Brand</label>
              <select value={newDrop.brand} onChange={e => setNewDrop(p => ({ ...p, brand: e.target.value }))} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: BRAND_COLORS_MAP[newDrop.brand] || "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", fontWeight: 600 }}>
                {DROP_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Format / SKU</label>
              <select value={newDrop.format} onChange={e => setNewDrop(p => ({ ...p, format: e.target.value }))} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }}>
                {DROP_FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              <label style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Strain Name</label>
              <input value={newDrop.sku} onChange={e => setNewDrop(p => ({ ...p, sku: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") addDrop(); }} placeholder="e.g. Modified Grapes"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
            </div>
            <button className="btn btn-gold" style={{ fontSize: 10, padding: "6px 14px" }} onClick={addDrop} disabled={!newDrop.sku.trim() || !newDrop.weekOf}>Add Drop</button>
            <button className="btn" style={{ fontSize: 10, padding: "6px 14px" }} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 500 }}>
          <div style={{ display: "grid", gridTemplateColumns: DG, background: "var(--surface3)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
            {["Brand", "Format / SKU", "Strain", "💬", ""].map(h => (
              <div key={h} style={{ padding: "8px 8px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
            ))}
          </div>
          {sortedWeeks.map(week => {
            const items = weeks[week];
            return (
              <div key={week}>
                <div onClick={() => setCollapsed(p => ({ ...p, [week]: !p[week] }))} style={{ padding: "10px 12px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", borderLeft: "3px solid var(--gold)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[week] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s" }}>▶</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--df)" }}>Week of {week}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{items.length} drop{items.length !== 1 ? "s" : ""}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    {[...new Set(items.map(i => i.brand))].map(b => (
                      <span key={b} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: (BRAND_COLORS_MAP[b] || "#888") + "18", color: BRAND_COLORS_MAP[b] || "#888", fontWeight: 600 }}>{b}</span>
                    ))}
                  </div>
                </div>
                {!collapsed[week] && items.map(d => (
                  <div key={d.id} style={{ display: "grid", gridTemplateColumns: DG, borderBottom: "1px solid var(--border2)", minHeight: 32 }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={cs}>
                      <select value={d.brand} onChange={e => updateDrop(d.id, "brand", e.target.value)} style={{ ...is, color: BRAND_COLORS_MAP[d.brand] || "var(--text)", fontWeight: 600, fontSize: 10 }}>
                        {DROP_BRANDS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div style={cs}><input value={d.format || ""} onChange={e => updateDrop(d.id, "format", e.target.value)} style={is} placeholder="Format" /></div>
                    <div style={cs}>
                      <input value={d.sku || ""} onChange={e => updateDrop(d.id, "sku", e.target.value)} style={{ ...is, fontWeight: 500, color: "var(--text)" }} />
                      {d.socialHighlight && <span title="Social Highlight" style={{ fontSize: 10, marginLeft: 4, flexShrink: 0 }}>⭐</span>}
                    </div>
                    {/* Comment */}
                    <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }}
                      onClick={e => { e.stopPropagation(); setCmtOpen(cmtOpen === d.id ? null : d.id); }}>
                      <span style={{ fontSize: 16, color: (d.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                      {d.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{d.comments.length}</span>}
                      {cmtOpen === d.id && (
                        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{d.sku || "Drop"}</div>
                          <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                            {(d.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}
                            {(d.comments || []).map(c => (
                              <div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span>
                                  <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                                <button onClick={() => deleteDropComment(d.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addDropComment(d.id); }} placeholder="Comment..."
                              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                            <button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addDropComment(d.id)}>Send</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteDrop(d.id); }}>
                      <span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── CREDIT MEMO TABLE ─────────────────────────────────────────────────────
const CM_STATUSES = ["Submitted", "Approved", "In Progress", "Completed", "Denied"];
const CM_PRIORITIES = ["", "Low", "Medium", "High", "Urgent"];
const CM_SECTION_COLORS = { "Awaiting Sales Approval": "#c9a84c", "Awaiting Finance Approval": "#6366f1", "Awaiting Creation": "#e07b6a", "Completed Requests": "#4d9e8e" };

function CreditMemoTable({ data, setData, currentUser }) {
  const [collapsed, setCollapsed] = useState({});
  const [didInit, setDidInit] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [cmtOpen, setCmtOpen] = useState(null);
  const [cmtText, setCmtText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", date: new Date().toISOString().slice(0, 10), customer: "", total: "", priority: "", section: "Awaiting Sales Approval", notes: "" });

  useEffect(() => { if (!didInit && data.length > 0) { const all = {}; [...new Set(data.map(d => d.section))].forEach(s => { all[s] = true; }); setCollapsed(all); setDidInit(true); } }, [data, didInit]);

  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addItem = () => {
    if (!newItem.name.trim() && !newItem.customer.trim()) return;
    setData(p => [...p, { ...newItem, id: `cm-${Date.now()}`, total: parseFloat(newItem.total) || 0, status: "Submitted" }]);
    setCollapsed(p => ({ ...p, [newItem.section]: false }));
    setShowAddModal(false);
    setNewItem({ name: "", date: new Date().toISOString().slice(0, 10), customer: "", total: "", priority: "", section: "Awaiting Sales Approval", notes: "" });
  };
  const addComment = (itemId) => { if (!cmtText.trim()) return; setData(p => p.map(d => d.id === itemId ? { ...d, comments: [...(d.comments || []), { id: `cmc-${Date.now()}`, author: currentUser?.name || "Team", text: cmtText.trim(), ts: new Date().toISOString() }] } : d)); setCmtText(""); };
  const deleteComment = (itemId, cId) => setData(p => p.map(d => d.id === itemId ? { ...d, comments: (d.comments || []).filter(c => c.id !== cId) } : d));

  const filtered = data.filter(d => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (search) { const s = search.toLowerCase(); return (d.name||"").toLowerCase().includes(s) || (d.customer||"").toLowerCase().includes(s); }
    return true;
  });
  const groups = {}; filtered.forEach(d => { const s = d.section || "General"; if (!groups[s]) groups[s] = []; groups[s].push(d); });
  const sections = [...new Set(data.map(d => d.section))];

  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const MG = "1fr 100px 1fr 90px 80px 100px 1fr 36px 28px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Credit Memo Requests</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} items / ${filtered.reduce((s, d) => s + (d.total || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ New Request</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or customer..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }}>
            <option value="all">All Statuses</option>
            {CM_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {/* Add Modal */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">New Credit Memo Request</div>
              <button className="mclose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="ff"><label className="fl">Name / Description</label><input className="fi" placeholder="e.g. Q1 Promos" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Date</label><input className="fi" type="date" value={newItem.date} onChange={e => setNewItem(p => ({ ...p, date: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Total ($)</label><input className="fi" type="number" step="0.01" placeholder="0.00" value={newItem.total} onChange={e => setNewItem(p => ({ ...p, total: e.target.value }))} /></div>
              </div>
              <div className="ff"><label className="fl">Customer</label><input className="fi" placeholder="e.g. Blue Sage Belton" value={newItem.customer} onChange={e => setNewItem(p => ({ ...p, customer: e.target.value }))} /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Section</label>
                  <select className="fsel" value={newItem.section} onChange={e => setNewItem(p => ({ ...p, section: e.target.value }))}>
                    {Object.keys(CM_SECTION_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="ff"><label className="fl">Priority</label>
                  <select className="fsel" value={newItem.priority} onChange={e => setNewItem(p => ({ ...p, priority: e.target.value }))}>
                    {CM_PRIORITIES.map(p => <option key={p} value={p}>{p || "None"}</option>)}
                  </select>
                </div>
              </div>
              <div className="ff"><label className="fl">Notes</label><textarea className="fta" rows={2} placeholder="Additional details..." value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div className="mfoot">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={addItem}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 800 }}>
          <div style={{ display: "grid", gridTemplateColumns: MG, background: "var(--surface3)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
            {["Name", "Date", "Customer", "Total ($)", "Priority", "Status", "Notes", "💬", ""].map(h => (
              <div key={h} style={{ padding: "8px 8px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
            ))}
          </div>
          {Object.entries(groups).map(([section, items]) => (
            <div key={section}>
              <div onClick={() => setCollapsed(p => ({ ...p, [section]: !p[section] }))} style={{ padding: "10px 12px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", borderLeft: `3px solid ${CM_SECTION_COLORS[section] || "var(--gold)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[section] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s" }}>▶</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: CM_SECTION_COLORS[section] || "var(--gold)" }}>{section}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{items.length} items / ${items.reduce((s, d) => s + (d.total || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              {!collapsed[section] && items.map(d => (
                <div key={d.id} style={{ display: "grid", gridTemplateColumns: MG, borderBottom: "1px solid var(--border2)", minHeight: 34 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={cs}><input value={d.name||""} onChange={e => updateItem(d.id, "name", e.target.value)} style={{ ...is, fontWeight: 500, color: "var(--text)" }} placeholder="Name" /></div>
                  <div style={cs}><input type="date" value={d.date||""} onChange={e => updateItem(d.id, "date", e.target.value)} style={{ ...is, fontSize: 10, color: "var(--text-muted)" }} /></div>
                  <div style={cs}><input value={d.customer||""} onChange={e => updateItem(d.id, "customer", e.target.value)} style={is} placeholder="Customer" /></div>
                  <div style={cs}><input type="number" step="0.01" value={d.total||""} onChange={e => updateItem(d.id, "total", parseFloat(e.target.value) || 0)} style={{ ...is, textAlign: "right" }} /></div>
                  <div style={cs}><select value={d.priority||""} onChange={e => updateItem(d.id, "priority", e.target.value)} style={{ ...is, fontSize: 10 }}>{CM_PRIORITIES.map(p => <option key={p} value={p}>{p || "—"}</option>)}</select></div>
                  <div style={cs}><select value={d.status||""} onChange={e => updateItem(d.id, "status", e.target.value)} style={{ ...is, fontSize: 10, fontWeight: 600, color: d.status === "Completed" ? "#4d9e8e" : d.status === "Denied" ? "#e07b6a" : "var(--text-dim)" }}>{CM_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div style={cs}><input value={d.notes||""} onChange={e => updateItem(d.id, "notes", e.target.value)} style={is} placeholder="Notes..." /></div>
                  <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }} onClick={e => { e.stopPropagation(); setCmtOpen(cmtOpen === d.id ? null : d.id); }}>
                    <span style={{ fontSize: 16, color: (d.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                    {d.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{d.comments.length}</span>}
                    {cmtOpen === d.id && (
                      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{d.name} — {d.customer}</div>
                        <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                          {(d.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}
                          {(d.comments || []).map(c => (
                            <div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span><span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                              <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                              {c.author === currentUser?.name && <button onClick={() => deleteComment(d.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(d.id); }} placeholder="Comment..." style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                          <button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(d.id)}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
                </div>
              ))}
              {!collapsed[section] && (
                <div onClick={() => addItem(section)} style={{ padding: "6px 12px", borderBottom: "1px solid var(--border2)", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add request</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SALES CONTACT TABLE ───────────────────────────────────────────────────
const ORDER_STYLES = ["Menu", "LeafLink", "Email", "Phone", "Text", "Unknown or Inactive"];

function SalesContactTable({ data, setData, currentUser }) {
  const [search, setSearch] = useState("");
  const [cmtOpen, setCmtOpen] = useState(null);
  const [cmtText, setCmtText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ account: "", contact: "", email: "", phone: "", orderingStyle: "Menu", notes: "" });

  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addItem = () => {
    if (!newItem.account.trim()) return;
    setData(p => [...p, { ...newItem, id: `scl-${Date.now()}` }]);
    setShowAddModal(false);
    setNewItem({ account: "", contact: "", email: "", phone: "", orderingStyle: "Menu", notes: "" });
  };
  const addComment = (itemId) => { if (!cmtText.trim()) return; setData(p => p.map(d => d.id === itemId ? { ...d, comments: [...(d.comments || []), { id: `scc-${Date.now()}`, author: currentUser?.name || "Team", text: cmtText.trim(), ts: new Date().toISOString() }] } : d)); setCmtText(""); };
  const deleteComment = (itemId, cId) => setData(p => p.map(d => d.id === itemId ? { ...d, comments: (d.comments || []).filter(c => c.id !== cId) } : d));

  const filtered = search ? data.filter(d => { const s = search.toLowerCase(); return (d.account||"").toLowerCase().includes(s) || (d.contact||"").toLowerCase().includes(s) || (d.email||"").toLowerCase().includes(s); }) : data;

  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is2 = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const SLG = "1fr 1fr 1fr 120px 110px 1fr 36px 28px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Sales Contact List</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} account{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ New Account</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search account, contact, email..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
        </div>
      </div>
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">New Sales Account</div>
              <button className="mclose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="ff"><label className="fl">Account Name *</label><input className="fi" placeholder="e.g. Blue Sage" value={newItem.account} onChange={e => setNewItem(p => ({ ...p, account: e.target.value }))} autoFocus /></div>
              <div className="ff"><label className="fl">Contact Name</label><input className="fi" placeholder="e.g. Katie Fagan" value={newItem.contact} onChange={e => setNewItem(p => ({ ...p, contact: e.target.value }))} /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Email</label><input className="fi" type="email" placeholder="email@example.com" value={newItem.email} onChange={e => setNewItem(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Phone</label><input className="fi" placeholder="123-456-7890" value={newItem.phone} onChange={e => setNewItem(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="ff"><label className="fl">Ordering Style</label>
                <select className="fsel" value={newItem.orderingStyle} onChange={e => setNewItem(p => ({ ...p, orderingStyle: e.target.value }))}>
                  {ORDER_STYLES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="ff"><label className="fl">Notes</label><textarea className="fta" rows={2} placeholder="Additional details..." value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div className="mfoot">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={!newItem.account.trim()} onClick={addItem}>Add Account</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 700 }}>
          <div style={{ display: "grid", gridTemplateColumns: SLG, background: "var(--surface3)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}>
            {["Account", "Contact", "Email", "Phone", "Ordering", "Notes", "💬", ""].map(h => (
              <div key={h} style={{ padding: "8px 8px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
            ))}
          </div>
          {filtered.map(d => (
            <div key={d.id} style={{ display: "grid", gridTemplateColumns: SLG, borderBottom: "1px solid var(--border2)", minHeight: 34 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={cs}><input value={d.account||""} onChange={e => updateItem(d.id, "account", e.target.value)} style={{ ...is2, fontWeight: 500, color: "var(--text)" }} placeholder="Account" /></div>
              <div style={cs}><input value={d.contact||""} onChange={e => updateItem(d.id, "contact", e.target.value)} style={is2} placeholder="Contact" /></div>
              <div style={cs}><input value={d.email||""} onChange={e => updateItem(d.id, "email", e.target.value)} style={{ ...is2, color: "#3b82f6" }} /></div>
              <div style={cs}><input value={d.phone||""} onChange={e => updateItem(d.id, "phone", e.target.value)} style={is2} /></div>
              <div style={cs}><select value={d.orderingStyle||""} onChange={e => updateItem(d.id, "orderingStyle", e.target.value)} style={{ ...is2, fontSize: 10 }}>{ORDER_STYLES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div style={cs}><input value={d.notes||""} onChange={e => updateItem(d.id, "notes", e.target.value)} style={is2} placeholder="Notes..." /></div>
              <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }} onClick={e => { e.stopPropagation(); setCmtOpen(cmtOpen === d.id ? null : d.id); }}>
                <span style={{ fontSize: 16, color: (d.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                {d.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{d.comments.length}</span>}
                {cmtOpen === d.id && (
                  <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{d.account}</div>
                    <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {(d.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}
                      {(d.comments || []).map(c => (
                        <div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span><span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                          <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                          {c.author === currentUser?.name && <button onClick={() => deleteComment(d.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(d.id); }} placeholder="Comment..." style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                      <button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(d.id)}>Send</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
            </div>
          ))}
          <div onClick={addItem} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add account</div>
        </div>
      </div>
    </div>
  );
}

// ── PROMO CALENDAR TABLE ──────────────────────────────────────────────────
const PROMO_STATUSES = ["Planning", "Active", "Ended", "Cancelled"];
const PROMO_BRANDS = ["ALL", "Headchange", "Safe Bet", "Bubbles", "Airo"];

function PromoCalendarTable({ data, setData, currentUser }) {
  const [collapsed, setCollapsed] = useState({});
  const [didInit, setDidInit] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [cmtOpen, setCmtOpen] = useState(null);
  const [cmtText, setCmtText] = useState("");
  const [newItem, setNewItem] = useState({ name: "", section: "", status: "Planning", discountType: "", startDate: "", endDate: "", brand: "ALL", participants: "", promoDetails: "" });

  useEffect(() => { if (!didInit && data.length > 0) { const all = {}; [...new Set(data.map(d => d.section))].forEach(s => { all[s] = true; }); setCollapsed(all); setDidInit(true); } }, [data, didInit]);

  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addItem = () => {
    if (!newItem.name.trim()) return;
    const section = newItem.section.trim() || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    setData(p => [...p, { ...newItem, id: `pc-${Date.now()}`, section }]);
    setCollapsed(p => ({ ...p, [section]: false }));
    setShowAddModal(false);
    setNewItem({ name: "", section: "", status: "Planning", discountType: "", startDate: "", endDate: "", brand: "ALL", participants: "", promoDetails: "" });
  };
  const addComment = (itemId) => { if (!cmtText.trim()) return; setData(p => p.map(d => d.id === itemId ? { ...d, comments: [...(d.comments || []), { id: `pcc-${Date.now()}`, author: currentUser?.name || "Team", text: cmtText.trim(), ts: new Date().toISOString() }] } : d)); setCmtText(""); };
  const deleteComment = (itemId, cId) => setData(p => p.map(d => d.id === itemId ? { ...d, comments: (d.comments || []).filter(c => c.id !== cId) } : d));

  const filtered = search ? data.filter(d => { const s = search.toLowerCase(); return (d.name||"").toLowerCase().includes(s) || (d.promoDetails||"").toLowerCase().includes(s) || (d.brand||"").toLowerCase().includes(s); }) : data;
  const groups = {}; filtered.forEach(d => { const s = d.section || "General"; if (!groups[s]) groups[s] = []; groups[s].push(d); });
  // Sort months most recent first
  const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthVal = (s) => { const m = MONTH_ORDER.findIndex(mo => s.toLowerCase().includes(mo.toLowerCase())); const y = parseInt((s.match(/\d{4}/) || ["2026"])[0]); return y * 12 + (m >= 0 ? m : 0); };
  const sortedSections = Object.keys(groups).sort((a, b) => monthVal(b) - monthVal(a));
  const MONTH_COLORS = ["#e07b6a","#6366f1","#4d9e8e","#c9a84c","#a855f7","#3b82f6","#22c55e","#f59e0b","#ec4899","#14b8a6","#8b5cf6","#ef4444"];
  const getMonthColor = (s) => { const m = MONTH_ORDER.findIndex(mo => s.toLowerCase().includes(mo.toLowerCase())); return m >= 0 ? MONTH_COLORS[m % MONTH_COLORS.length] : "var(--gold)"; };

  const STATUS_CLR = { "Planning": "#6366f1", "Active": "#4d9e8e", "Ended": "#8a8a96", "Cancelled": "#e07b6a" };
  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is3 = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const PG = "1fr 40px 100px 110px 120px 100px 100px 1fr 1fr 28px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Promo Calendar</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} promo{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ New Promo</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search promo, brand, details..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
        </div>
      </div>
      {/* Add Modal */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">New Promo</div>
              <button className="mclose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="ff"><label className="fl">Promo Name *</label><input className="fi" placeholder="e.g. Week 2, Q1 Promo..." value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Month / Period</label><input className="fi" placeholder="e.g. April 2026" value={newItem.section} onChange={e => setNewItem(p => ({ ...p, section: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Brand</label>
                  <select className="fsel" value={newItem.brand} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}>{PROMO_BRANDS.map(b => <option key={b}>{b}</option>)}</select>
                </div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Start Date</label><input className="fi" type="date" value={newItem.startDate} onChange={e => setNewItem(p => ({ ...p, startDate: e.target.value }))} /></div>
                <div className="ff"><label className="fl">End Date</label><input className="fi" type="date" value={newItem.endDate} onChange={e => setNewItem(p => ({ ...p, endDate: e.target.value }))} /></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Status</label>
                  <select className="fsel" value={newItem.status} onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))}>{PROMO_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
                <div className="ff"><label className="fl">Discount Type</label><input className="fi" placeholder="e.g. 20% off" value={newItem.discountType} onChange={e => setNewItem(p => ({ ...p, discountType: e.target.value }))} /></div>
              </div>
              <div className="ff"><label className="fl">Participants</label><input className="fi" placeholder="Participating accounts..." value={newItem.participants} onChange={e => setNewItem(p => ({ ...p, participants: e.target.value }))} /></div>
              <div className="ff"><label className="fl">Promo Details</label><textarea className="fta" rows={3} placeholder="Products included, terms, etc." value={newItem.promoDetails} onChange={e => setNewItem(p => ({ ...p, promoDetails: e.target.value }))} /></div>
            </div>
            <div className="mfoot">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={!newItem.name.trim()} onClick={addItem}>Add Promo</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 900 }}>
          {sortedSections.map(section => {
            const items = groups[section];
            const mColor = getMonthColor(section);
            return (
            <div key={section}>
              <div onClick={() => setCollapsed(p => ({ ...p, [section]: !p[section] }))} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none", marginTop: 16 }}>
                <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[section] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", color: mColor }}>▶</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: mColor }}>{section}</span>
              </div>
              {collapsed[section] && (
                <div style={{ padding: "6px 16px 12px", fontSize: 11, color: "var(--text-muted)", borderLeft: `3px solid ${mColor}`, marginLeft: 16 }}>{items.length} promo{items.length !== 1 ? "s" : ""}</div>
              )}
              {!collapsed[section] && (
                <div style={{ borderLeft: `3px solid ${mColor}`, marginLeft: 16 }}>
                {/* Column headers per section */}
                <div style={{ display: "grid", gridTemplateColumns: PG, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                  {["Name of the promo", "", "Status", "Discount Type", "Timeline", "Digital Assets", "Brand", "Participants", "Promo Details", ""].map((h, hi) => (
                    <div key={hi} style={{ padding: "6px 8px", fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
                  ))}
                </div>
                {items.map(d => (
                <div key={d.id} style={{ display: "grid", gridTemplateColumns: PG, borderBottom: "1px solid var(--border2)", minHeight: 38 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={cs}><input value={d.name||""} onChange={e => updateItem(d.id, "name", e.target.value)} style={{ ...is3, fontWeight: 500, color: "var(--text)" }} /></div>
                  {/* Comment bubble next to name */}
                  <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }} onClick={e => { e.stopPropagation(); setCmtOpen(cmtOpen === d.id ? null : d.id); }}>
                    <span style={{ fontSize: 16, color: (d.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                    {d.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{d.comments.length}</span>}
                    {cmtOpen === d.id && (
                      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{d.name}</div>
                        <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                          {(d.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}
                          {(d.comments || []).map(c => (
                            <div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span><span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                              <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                              {c.author === currentUser?.name && <button onClick={() => deleteComment(d.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(d.id); }} placeholder="Comment..." style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                          <button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(d.id)}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Status — colored badge */}
                  <div style={cs}>
                    <div style={{ width: "100%", padding: "4px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#fff", background: STATUS_CLR[d.status] || "#888", cursor: "pointer" }} onClick={() => { const next = PROMO_STATUSES[(PROMO_STATUSES.indexOf(d.status) + 1) % PROMO_STATUSES.length]; updateItem(d.id, "status", next); }}>{d.status || "—"}</div>
                  </div>
                  {/* Discount Type — colored badge */}
                  <div style={cs}>
                    <div style={{ width: "100%", padding: "4px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: d.discountType ? "#9333ea" : "rgba(0,0,0,.1)", cursor: "text" }}>
                      <input value={d.discountType||""} onChange={e => updateItem(d.id, "discountType", e.target.value)} style={{ background: "transparent", border: "none", color: d.discountType ? "#fff" : "var(--text-muted)", fontSize: 10, fontWeight: 600, textAlign: "center", outline: "none", width: "100%", padding: 0, fontFamily: "var(--bf)" }} placeholder="—" />
                    </div>
                  </div>
                  {/* Timeline — date range pill */}
                  <div style={cs}>
                    {d.startDate || d.endDate ? (
                      <div style={{ padding: "4px 8px", borderRadius: 100, background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap", width: "100%" }}>
                        {d.startDate ? new Date(d.startDate+"T00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "?"} - {d.endDate ? new Date(d.endDate+"T00:00").toLocaleDateString("en-US",{day:"numeric"}) : "?"}
                      </div>
                    ) : <span style={{ fontSize: 10, color: "var(--text-muted)", width: "100%", textAlign: "center" }}>—</span>}
                  </div>
                  <div style={cs}><input value={d.digitalAssets||""} onChange={e => updateItem(d.id, "digitalAssets", e.target.value)} style={is3} /></div>
                  {/* Brand — colored badge */}
                  <div style={cs}>
                    <select value={d.brand||""} onChange={e => updateItem(d.id, "brand", e.target.value)} style={{ ...is3, fontSize: 10, fontWeight: 600, color: "#fff", background: d.brand === "ALL" ? "#22c55e" : BRAND_COLORS_MAP[d.brand] || "#888", borderRadius: 4, padding: "4px 4px", textAlign: "center", cursor: "pointer" }}>{PROMO_BRANDS.map(b => <option key={b}>{b}</option>)}</select>
                  </div>
                  <div style={cs}><input value={d.participants||""} onChange={e => updateItem(d.id, "participants", e.target.value)} style={is3} /></div>
                  <div style={cs}><input value={d.promoDetails||""} onChange={e => updateItem(d.id, "promoDetails", e.target.value)} style={is3} placeholder="Details..." /></div>
                  <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
                </div>
              ))}
                <div onClick={() => setShowAddModal(true)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add name of the promo</div>
                </div>
              )}
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

// ── POPUPS & BLITZ TABLE ──────────────────────────────────────────────────
const VISIT_TYPES = ["Popup", "Blitz", "Event", "Other"];
const POPUP_STATUSES = ["Scheduled", "Done", "Cancelled", "In Progress"];
const FEEDBACK_OPTS = ["Not Started", "In Progress", "Complete", "Report Waived"];
const MERCH_OPTS = ["Not Needed", "Ordered", "Delivered", "Pending"];
const REGION_COLORS2 = { "SWMO": "#3b82f6", "KC": "#6366f1", "SEMO": "#22c55e", "STL": "#c9a84c", "MidMO": "#e07b6a" };

function PopupsBlitzTable({ data, setData, currentUser }) {
  const [collapsed, setCollapsed] = useState({});
  const [didInit, setDidInit] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [cmtOpen, setCmtOpen] = useState(null);
  const [cmtText, setCmtText] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" | "calendar"
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [newItem, setNewItem] = useState({ name: "", section: "SWMO", brand: "", date: "", visitType: "Popup", status: "Scheduled", feedbackForm: "Not Started", person: "", merchOrdered: "Not Needed" });

  useEffect(() => { if (!didInit && data.length > 0) { const all = {}; [...new Set(data.map(d => d.section))].forEach(s => { all[s] = true; }); setCollapsed(all); setDidInit(true); } }, [data, didInit]);

  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addItem = () => { if (!newItem.name.trim()) return; setData(p => [...p, { ...newItem, id: `pb-${Date.now()}` }]); setCollapsed(p => ({ ...p, [newItem.section]: false })); setShowAddModal(false); setNewItem({ name: "", section: "SWMO", brand: "", date: "", visitType: "Popup", status: "Scheduled", feedbackForm: "Not Started", person: "", merchOrdered: "Not Needed" }); };
  const addComment = (itemId) => { if (!cmtText.trim()) return; setData(p => p.map(d => d.id === itemId ? { ...d, comments: [...(d.comments || []), { id: `pbc-${Date.now()}`, author: currentUser?.name || "Team", text: cmtText.trim(), ts: new Date().toISOString() }] } : d)); setCmtText(""); };
  const deleteComment = (itemId, cId) => setData(p => p.map(d => d.id === itemId ? { ...d, comments: (d.comments || []).filter(c => c.id !== cId) } : d));

  const filtered = search ? data.filter(d => { const s = search.toLowerCase(); return (d.name||"").toLowerCase().includes(s) || (d.person||"").toLowerCase().includes(s) || (d.brand||"").toLowerCase().includes(s); }) : data;
  const groups = {}; filtered.forEach(d => { const s = d.section || "Other"; if (!groups[s]) groups[s] = []; groups[s].push(d); });
  const regions = ["SWMO", "KC", "SEMO", "STL", "MidMO"];

  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is4 = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const BG = "1fr 36px 90px 100px 90px 90px 100px 120px 90px 28px";
  const VT_CLR = { "Popup": "#22c55e", "Blitz": "#3b82f6", "Event": "#a855f7", "Other": "#8a8a96" };
  const ST_CLR = { "Scheduled": "#3b82f6", "Done": "#22c55e", "Cancelled": "#e07b6a", "In Progress": "#c9a84c" };
  const FB_CLR = { "Not Started": "#8a8a96", "In Progress": "#c9a84c", "Complete": "#22c55e", "Report Waived": "#a855f7" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Popups and Blitz Calendar</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} dizpo{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ New Dizpo</button>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <button onClick={() => setViewMode("table")} style={{ padding: "4px 10px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: viewMode === "table" ? "var(--gold-dim)" : "transparent", color: viewMode === "table" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Table</button>
            <button onClick={() => setViewMode("calendar")} style={{ padding: "4px 10px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: viewMode === "calendar" ? "var(--gold-dim)" : "transparent", color: viewMode === "calendar" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Calendar</button>
          </div>
          {viewMode === "table" && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, person, brand..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />}
          {viewMode === "calendar" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, display: "grid", placeItems: "center" }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", minWidth: 120, textAlign: "center" }}>{new Date(calMonth.year, calMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              <button onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, display: "grid", placeItems: "center" }}>›</button>
              <button onClick={() => { const d = new Date(); setCalMonth({ year: d.getFullYear(), month: d.getMonth() }); }} className="btn btn-sm" style={{ fontSize: 10 }}>Today</button>
            </div>
          )}
        </div>
      </div>
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">New Dizpo</div>
              <button className="mclose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="ff"><label className="fl">Name *</label><input className="fi" placeholder="e.g. Ireland - Springfield - Flora Farms" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Region</label><select className="fsel" value={newItem.section} onChange={e => setNewItem(p => ({ ...p, section: e.target.value }))}>{regions.map(r => <option key={r}>{r}</option>)}</select></div>
                <div className="ff"><label className="fl">Visit Type</label><select className="fsel" value={newItem.visitType} onChange={e => setNewItem(p => ({ ...p, visitType: e.target.value }))}>{VISIT_TYPES.map(v => <option key={v}>{v}</option>)}</select></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Date</label><input className="fi" type="date" value={newItem.date} onChange={e => setNewItem(p => ({ ...p, date: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Brand</label><input className="fi" placeholder="e.g. Headchange" value={newItem.brand} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))} /></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Person</label><input className="fi" placeholder="Assigned rep" value={newItem.person} onChange={e => setNewItem(p => ({ ...p, person: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Status</label><select className="fsel" value={newItem.status} onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))}>{POPUP_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
            </div>
            <div className="mfoot">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={!newItem.name.trim()} onClick={addItem}>Add Dizpo</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        {viewMode === "calendar" ? (
          /* ── CALENDAR VIEW ── */
          (() => {
            const year = calMonth.year, month = calMonth.month;
            const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon start
            const weeks = [];
            let day = 1 - startOffset;
            while (day <= daysInMonth) { const week = []; for (let i = 0; i < 7; i++) { week.push(day); day++; } weeks.push(week); }
            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
            const VT_CLR2 = { "Popup": "#22c55e", "Blitz": "#3b82f6", "Event": "#a855f7", "Other": "#c9a84c" };
            return (
              <div style={{ padding: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
                  {dayNames.map(d => <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{d}</div>)}
                  {weeks.map((week, wi) => week.map((d, di) => {
                    const isThisMonth = d >= 1 && d <= daysInMonth;
                    const dateStr = isThisMonth ? `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` : "";
                    const isToday = dateStr === todayStr;
                    const dayEvents = isThisMonth ? data.filter(ev => ev.date === dateStr) : [];
                    return (
                      <div key={`${wi}-${di}`} style={{ minHeight: 90, padding: "4px 6px", background: isThisMonth ? "var(--surface)" : "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 4, opacity: isThisMonth ? 1 : .4, position: "relative" }}>
                        <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--gold)" : "var(--text-dim)", marginBottom: 4 }}>
                          {isToday && <span style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", background: "var(--gold)", color: "#fff", textAlign: "center", lineHeight: "20px", fontSize: 11 }}>{d}</span>}
                          {!isToday && isThisMonth && d}
                        </div>
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} title={ev.name} style={{ padding: "2px 5px", marginBottom: 2, borderRadius: 3, fontSize: 9, fontWeight: 500, color: "#fff", background: VT_CLR2[ev.visitType] || "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "default" }}>{ev.name}</div>
                        ))}
                        {dayEvents.length > 3 && <div style={{ fontSize: 9, color: "var(--text-muted)", paddingLeft: 5 }}>+{dayEvents.length - 3} more</div>}
                      </div>
                    );
                  }))}
                </div>
              </div>
            );
          })()
        ) : (
        <div style={{ minWidth: 900 }}>
          {regions.map(region => {
            const items = groups[region] || [];
            const rColor = REGION_COLORS2[region] || "var(--gold)";
            return (
              <div key={region} style={{ marginBottom: 16 }}>
                <div onClick={() => setCollapsed(p => ({ ...p, [region]: !p[region] }))} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[region] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", color: rColor }}>▶</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: rColor }}>{region}</span>
                </div>
                {collapsed[region] && <div style={{ padding: "4px 16px 12px", fontSize: 11, color: "var(--text-muted)", borderLeft: `3px solid ${rColor}`, marginLeft: 16 }}>{items.length} Dizpo{items.length !== 1 ? "s" : ""}</div>}
                {!collapsed[region] && (
                  <div style={{ borderLeft: `3px solid ${rColor}`, marginLeft: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: BG, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                      {["Name", "💬", "Brand", "Date", "Visit Type", "Status", "Feedback", "Person", "Merch", ""].map((h, hi) => (
                        <div key={hi} style={{ padding: "6px 8px", fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
                      ))}
                    </div>
                    {items.map(d => (
                      <div key={d.id} style={{ display: "grid", gridTemplateColumns: BG, borderBottom: "1px solid var(--border2)", minHeight: 36 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={cs}><input value={d.name||""} onChange={e => updateItem(d.id, "name", e.target.value)} style={{ ...is4, fontWeight: 500, color: "var(--text)" }} /></div>
                        <div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }} onClick={e => { e.stopPropagation(); setCmtOpen(cmtOpen === d.id ? null : d.id); }}>
                          <span style={{ fontSize: 16, color: (d.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>
                          {d.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{d.comments.length}</span>}
                          {cmtOpen === d.id && (
                            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{d.name}</div>
                              <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                                {(d.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}
                                {(d.comments || []).map(c => (
                                  <div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span><span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                                    <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>
                                    {c.author === currentUser?.name && <button onClick={() => deleteComment(d.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>}
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(d.id); }} placeholder="Comment..." style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
                                <button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(d.id)}>Send</button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={cs}><input value={d.brand||""} onChange={e => updateItem(d.id, "brand", e.target.value)} style={is4} /></div>
                        <div style={cs}><input type="date" value={d.date||""} onChange={e => updateItem(d.id, "date", e.target.value)} style={{ ...is4, fontSize: 10, color: "var(--text-muted)" }} /></div>
                        <div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: VT_CLR[d.visitType] || "#888", cursor: "pointer" }} onClick={() => { const next = VISIT_TYPES[(VISIT_TYPES.indexOf(d.visitType) + 1) % VISIT_TYPES.length]; updateItem(d.id, "visitType", next); }}>{d.visitType || "—"}</div></div>
                        <div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: ST_CLR[d.status] || "#888", cursor: "pointer" }} onClick={() => { const next = POPUP_STATUSES[(POPUP_STATUSES.indexOf(d.status) + 1) % POPUP_STATUSES.length]; updateItem(d.id, "status", next); }}>{d.status || "—"}</div></div>
                        <div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: FB_CLR[d.feedbackForm] || "#888", cursor: "pointer" }} onClick={() => { const next = FEEDBACK_OPTS[(FEEDBACK_OPTS.indexOf(d.feedbackForm) + 1) % FEEDBACK_OPTS.length]; updateItem(d.id, "feedbackForm", next); }}>{d.feedbackForm || "—"}</div></div>
                        <div style={cs}><input value={d.person||""} onChange={e => updateItem(d.id, "person", e.target.value)} style={{ ...is4, fontSize: 10 }} /></div>
                        <div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: d.merchOrdered === "Ordered" ? "#c9a84c" : d.merchOrdered === "Delivered" ? "#22c55e" : "#8a8a96", cursor: "pointer" }} onClick={() => { const next = MERCH_OPTS[(MERCH_OPTS.indexOf(d.merchOrdered) + 1) % MERCH_OPTS.length]; updateItem(d.id, "merchOrdered", next); }}>{d.merchOrdered || "—"}</div></div>
                        <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
                      </div>
                    ))}
                    <div onClick={() => setShowAddModal(true)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add dizpo</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

// ── EVENTS TABLE ──────────────────────────────────────────────────────────
const EVENT_STATUSES = ["Waiting for Confirmation", "Confirmed", "Completed", "Cancelled"];
const ACTIVATION_TYPES = ["Sesh", "Event", "Popup", "Blitz", "Other"];
const EVENT_REGIONS = ["STL", "KC", "SWMO", "SEMO", "MidMO", "COMO"];
const SECTION_ORDER = ["Sesh Ideas", "Future Events", "Next 30 Days", "Completed", "Unavailable Events", "Archived 2025"];
const ES_CLR = { "Waiting for Confirmation": "#c9a84c", "Confirmed": "#22c55e", "Completed": "#3b82f6", "Cancelled": "#e07b6a" };
const AT_CLR = { "Sesh": "#a855f7", "Event": "#22c55e", "Popup": "#3b82f6", "Blitz": "#c9a84c", "Other": "#8a8a96" };

function EventsTable({ data, setData, currentUser }) {
  const [collapsed, setCollapsed] = useState({});
  const [didInit, setDidInit] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [showAddModal, setShowAddModal] = useState(false);
  const [cmtOpen, setCmtOpen] = useState(null);
  const [cmtText, setCmtText] = useState("");
  const [newItem, setNewItem] = useState({ name: "", section: "Future Events", activationType: "Sesh", region: "STL", date: "", eventStatus: "Waiting for Confirmation", staffAttending: "", location: "", estAttendance: "", contactEmail: "", contactPhone: "", startTime: "", endTime: "", collaborators: "" });
  useEffect(() => { if (!didInit && data.length > 0) { setDidInit(true); } }, [data, didInit]);
  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addItem = () => { if (!newItem.name.trim()) return; setData(p => [...p, { ...newItem, id: `ev-${Date.now()}` }]); setCollapsed(p => ({ ...p, [newItem.section]: false })); setShowAddModal(false); setNewItem({ name: "", section: "Future Events", activationType: "Sesh", region: "STL", date: "", eventStatus: "Waiting for Confirmation", staffAttending: "", location: "", estAttendance: "", contactEmail: "", contactPhone: "", startTime: "", endTime: "", collaborators: "" }); };
  const addComment = (itemId) => { if (!cmtText.trim()) return; setData(p => p.map(d => d.id === itemId ? { ...d, comments: [...(d.comments || []), { id: `evc-${Date.now()}`, author: currentUser?.name || "Team", text: cmtText.trim(), ts: new Date().toISOString() }] } : d)); setCmtText(""); };
  const deleteComment = (itemId, cId) => setData(p => p.map(d => d.id === itemId ? { ...d, comments: (d.comments || []).filter(c => c.id !== cId) } : d));
  const filtered = search ? data.filter(d => { const s = search.toLowerCase(); return (d.name||"").toLowerCase().includes(s) || (d.location||"").toLowerCase().includes(s) || (d.region||"").toLowerCase().includes(s); }) : data;
  const groups = {}; filtered.forEach(d => { const s = d.section || "Other"; if (!groups[s]) groups[s] = []; groups[s].push(d); });
  const sortedSections = SECTION_ORDER.filter(s => groups[s]);
  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is5 = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const EG = "1fr 36px 90px 70px 90px 100px 120px 1fr 28px";
  const SEC_CLR = { "Sesh Ideas": "#a855f7", "Future Events": "#22c55e", "Next 30 Days": "#3b82f6", "Completed": "#8a8a96", "Unavailable Events": "#e07b6a", "Archived 2025": "#c9a84c" };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Events & Event Support</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} event{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ New Sesh</button>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <button onClick={() => setViewMode("table")} style={{ padding: "4px 10px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: viewMode === "table" ? "var(--gold-dim)" : "transparent", color: viewMode === "table" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Table</button>
            <button onClick={() => setViewMode("calendar")} style={{ padding: "4px 10px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: viewMode === "calendar" ? "var(--gold-dim)" : "transparent", color: viewMode === "calendar" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Calendar</button>
          </div>
          {viewMode === "table" && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search event, location, region..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />}
          {viewMode === "calendar" && (<div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}><button onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, display: "grid", placeItems: "center" }}>‹</button><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", minWidth: 120, textAlign: "center" }}>{new Date(calMonth.year, calMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span><button onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, display: "grid", placeItems: "center" }}>›</button><button onClick={() => { const d = new Date(); setCalMonth({ year: d.getFullYear(), month: d.getMonth() }); }} className="btn btn-sm" style={{ fontSize: 10 }}>Today</button></div>)}
        </div>
      </div>
      {showAddModal && (<div className="overlay" onClick={() => setShowAddModal(false)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}><div className="mhdr" style={{ borderTop: "2px solid #a855f7", borderRadius: "16px 16px 0 0" }}><div className="mtitle">New Sesh / Event</div><button className="mclose" onClick={() => setShowAddModal(false)}>×</button></div><div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}><div className="ff"><label className="fl">Event Name *</label><input className="fi" placeholder="e.g. The Sesh - Comedy Edition" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus /></div><div className="frow"><div className="ff"><label className="fl">Type</label><select className="fsel" value={newItem.activationType} onChange={e => setNewItem(p => ({ ...p, activationType: e.target.value }))}>{ACTIVATION_TYPES.map(t => <option key={t}>{t}</option>)}</select></div><div className="ff"><label className="fl">Region</label><select className="fsel" value={newItem.region} onChange={e => setNewItem(p => ({ ...p, region: e.target.value }))}>{EVENT_REGIONS.map(r => <option key={r}>{r}</option>)}</select></div></div><div className="frow"><div className="ff"><label className="fl">Date</label><input className="fi" type="date" value={newItem.date} onChange={e => setNewItem(p => ({ ...p, date: e.target.value }))} /></div><div className="ff"><label className="fl">Status</label><select className="fsel" value={newItem.eventStatus} onChange={e => setNewItem(p => ({ ...p, eventStatus: e.target.value }))}>{EVENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div></div><div className="frow"><div className="ff"><label className="fl">Section</label><select className="fsel" value={newItem.section} onChange={e => setNewItem(p => ({ ...p, section: e.target.value }))}>{SECTION_ORDER.map(s => <option key={s}>{s}</option>)}</select></div><div className="ff"><label className="fl">Est. Attendance</label><input className="fi" placeholder="200" value={newItem.estAttendance} onChange={e => setNewItem(p => ({ ...p, estAttendance: e.target.value }))} /></div></div><div className="ff"><label className="fl">Location</label><input className="fi" placeholder="Venue and address" value={newItem.location} onChange={e => setNewItem(p => ({ ...p, location: e.target.value }))} /></div><div className="frow"><div className="ff"><label className="fl">Start Time</label><input className="fi" placeholder="07:00 PM" value={newItem.startTime} onChange={e => setNewItem(p => ({ ...p, startTime: e.target.value }))} /></div><div className="ff"><label className="fl">End Time</label><input className="fi" placeholder="11:00 PM" value={newItem.endTime} onChange={e => setNewItem(p => ({ ...p, endTime: e.target.value }))} /></div></div><div className="ff"><label className="fl">Staff Attending</label><input className="fi" placeholder="Names..." value={newItem.staffAttending} onChange={e => setNewItem(p => ({ ...p, staffAttending: e.target.value }))} /></div><div className="ff"><label className="fl">Collaborators</label><input className="fi" placeholder="Partners..." value={newItem.collaborators} onChange={e => setNewItem(p => ({ ...p, collaborators: e.target.value }))} /></div></div><div className="mfoot"><button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn btn-gold" disabled={!newItem.name.trim()} onClick={addItem}>Add Event</button></div></div></div>)}
      <div style={{ flex: 1, overflow: "auto" }}>
        {viewMode === "calendar" ? (() => { const year = calMonth.year, month = calMonth.month; const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const startOffset = firstDay === 0 ? 6 : firstDay - 1; const weeks = []; let day = 1 - startOffset; while (day <= daysInMonth) { const week = []; for (let i = 0; i < 7; i++) { week.push(day); day++; } weeks.push(week); } const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`; return (<div style={{ padding: "8px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{d}</div>)}{weeks.map((week, wi) => week.map((d, di) => { const isThisMonth = d >= 1 && d <= daysInMonth; const dateStr = isThisMonth ? `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` : ""; const isToday = dateStr === todayStr; const dayEvents = isThisMonth ? data.filter(ev => ev.date === dateStr) : []; return (<div key={`${wi}-${di}`} style={{ minHeight: 90, padding: "4px 6px", background: isThisMonth ? "var(--surface)" : "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 4, opacity: isThisMonth ? 1 : .4 }}><div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--gold)" : "var(--text-dim)", marginBottom: 4 }}>{isToday ? <span style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", background: "var(--gold)", color: "#fff", textAlign: "center", lineHeight: "20px", fontSize: 11 }}>{d}</span> : isThisMonth && d}</div>{dayEvents.slice(0, 3).map(ev => (<div key={ev.id} title={ev.name} style={{ padding: "2px 5px", marginBottom: 2, borderRadius: 3, fontSize: 9, fontWeight: 500, color: "#fff", background: AT_CLR[ev.activationType] || "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>))}{dayEvents.length > 3 && <div style={{ fontSize: 9, color: "var(--text-muted)", paddingLeft: 5 }}>+{dayEvents.length - 3} more</div>}</div>); }))}</div></div>); })() : (
        <div style={{ minWidth: 800 }}>
          {sortedSections.map(section => { const items = groups[section]; const sColor = SEC_CLR[section] || "var(--gold)"; return (<div key={section} style={{ marginBottom: 16 }}><div onClick={() => setCollapsed(p => ({ ...p, [section]: !p[section] }))} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}><span style={{ fontSize: 10, display: "inline-block", transform: collapsed[section] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", color: sColor }}>▶</span><span style={{ fontSize: 16, fontWeight: 700, color: sColor }}>{section}</span></div>{collapsed[section] && <div style={{ padding: "4px 16px 12px", fontSize: 11, color: "var(--text-muted)", borderLeft: `3px solid ${sColor}`, marginLeft: 16 }}>{items.length} event{items.length !== 1 ? "s" : ""}</div>}{!collapsed[section] && (<div style={{ borderLeft: `3px solid ${sColor}`, marginLeft: 16 }}><div style={{ display: "grid", gridTemplateColumns: EG, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>{["Event", "💬", "Type", "Region", "Date", "Status", "Staff", "Location", ""].map((h, hi) => (<div key={hi} style={{ padding: "6px 8px", fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>))}</div>{items.map(d => (<div key={d.id} style={{ display: "grid", gridTemplateColumns: EG, borderBottom: "1px solid var(--border2)", minHeight: 36 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><div style={cs}><input value={d.name||""} onChange={e => updateItem(d.id, "name", e.target.value)} style={{ ...is5, fontWeight: 500, color: "var(--text)" }} /></div><div style={{ ...cs, justifyContent: "center", cursor: "pointer", position: "relative", overflow: "visible" }} onClick={e => { e.stopPropagation(); setCmtOpen(cmtOpen === d.id ? null : d.id); }}><span style={{ fontSize: 16, color: (d.comments?.length > 0) ? "var(--gold)" : "#555" }}>💬</span>{d.comments?.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, fontSize: 8, background: "var(--gold)", color: "#fff", borderRadius: 100, padding: "0 4px", fontWeight: 700 }}>{d.comments.length}</span>}{cmtOpen === d.id && (<div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: 0, top: "100%", width: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 30, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}><div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>{d.name}</div><div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>{(d.comments || []).length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No comments.</div>}{(d.comments || []).map(c => (<div key={c.id} style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: "var(--gold)" }}>{c.author}</span><span style={{ fontSize: 8, color: "var(--text-muted)" }}>{new Date(c.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div><div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{c.text}</div>{c.author === currentUser?.name && <button onClick={() => deleteComment(d.id, c.id)} style={{ fontSize: 9, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontFamily: "var(--bf)" }}>Delete</button>}</div>))}</div><div style={{ display: "flex", gap: 6 }}><input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addComment(d.id); }} placeholder="Comment..." style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} /><button className="btn btn-sm" style={{ fontSize: 9, borderColor: "rgba(184,150,58,.3)", color: "var(--gold)" }} onClick={() => addComment(d.id)}>Send</button></div></div>)}</div><div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: AT_CLR[d.activationType] || "#888", cursor: "pointer" }} onClick={() => { const next = ACTIVATION_TYPES[(ACTIVATION_TYPES.indexOf(d.activationType) + 1) % ACTIVATION_TYPES.length]; updateItem(d.id, "activationType", next); }}>{d.activationType || "—"}</div></div><div style={cs}><input value={d.region||""} onChange={e => updateItem(d.id, "region", e.target.value)} style={{ ...is5, fontSize: 10 }} /></div><div style={cs}><input type="date" value={d.date||""} onChange={e => updateItem(d.id, "date", e.target.value)} style={{ ...is5, fontSize: 10, color: "var(--text-muted)" }} /></div><div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 9, fontWeight: 600, color: "#fff", background: ES_CLR[d.eventStatus] || "#888", cursor: "pointer" }} onClick={() => { const next = EVENT_STATUSES[(EVENT_STATUSES.indexOf(d.eventStatus) + 1) % EVENT_STATUSES.length]; updateItem(d.id, "eventStatus", next); }}>{d.eventStatus || "—"}</div></div><div style={cs}><input value={d.staffAttending||""} onChange={e => updateItem(d.id, "staffAttending", e.target.value)} style={{ ...is5, fontSize: 10 }} /></div><div style={cs}><input value={d.location||""} onChange={e => updateItem(d.id, "location", e.target.value)} style={{ ...is5, fontSize: 10 }} /></div><div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div></div>))}<div onClick={() => setShowAddModal(true)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add event</div></div>)}</div>); })}
        </div>
        )}
      </div>
    </div>
  );
}

// ── FIELD MARKETING WEEKLY AGENDA V3 ──────────────────────────────────────
const AGENDA_STATUSES = ["Not Started", "In Progress", "Completed"];
const AGENDA_ST_CLR = { "Not Started": "#8a8a96", "In Progress": "#c9a84c", "Completed": "#22c55e" };
const TODO_URGENCY = ["Low", "Medium", "High", "Urgent"];
const TODO_URG_CLR = { "Low": "#4d9e8e", "Medium": "#c9a84c", "High": "#e07b6a", "Urgent": "#d94848" };

function FieldAgendaTable({ data, setData, currentUser }) {
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [newMeetingDate, setNewMeetingDate] = useState(new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }));
  const [agendaTitle, setAgendaTitle] = useState("");
  const [agendaSubItems, setAgendaSubItems] = useState([""]);
  const [todoPopup, setTodoPopup] = useState(null); // { text, fromDate }
  const [todoOwner, setTodoOwner] = useState("");
  const [todoUrgency, setTodoUrgency] = useState("Medium");
  const [todosOpen, setTodosOpen] = useState(true);
  const [todos, setTodos] = useState(() => { try { const v = localStorage.getItem("ns_agenda-todos"); return v ? JSON.parse(v) : []; } catch { return []; } });

  useEffect(() => { try { localStorage.setItem("ns_agenda-todos", JSON.stringify(todos)); } catch {} }, [todos]);

  if (!data?.meetings) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  const meetings = data.meetings || [];
  const active = selectedMeeting !== null ? meetings[selectedMeeting] : null;

  const addMeeting = () => { if (!newMeetingDate) return; setData(p => ({ ...p, meetings: [{ date: newMeetingDate, sections: [] }, ...p.meetings] })); setShowAddMeeting(false); setSelectedMeeting(0); };
  const publishAgenda = () => {
    if (!agendaTitle.trim()) return;
    const section = { title: agendaTitle.trim(), items: agendaSubItems.filter(s => s.trim()).map(s => s.trim()) };
    setData(p => { const ms = [...p.meetings]; ms[selectedMeeting] = { ...ms[selectedMeeting], sections: [...ms[selectedMeeting].sections, section] }; return { ...p, meetings: ms }; });
    setAgendaTitle(""); setAgendaSubItems([""]); setShowAddAgenda(false);
  };
  const deleteSection = (mIdx, sIdx) => {
    setData(p => { const ms = [...p.meetings]; ms[mIdx] = { ...ms[mIdx], sections: ms[mIdx].sections.filter((_, i) => i !== sIdx) }; return { ...p, meetings: ms }; });
  };
  const renameSection = (mIdx, sIdx, title) => {
    setData(p => { const ms = [...p.meetings]; ms[mIdx] = { ...ms[mIdx], sections: ms[mIdx].sections.map((s, i) => i === sIdx ? { ...s, title } : s) }; return { ...p, meetings: ms }; });
  };
  const deleteSubItem = (mIdx, sIdx, iIdx) => {
    setData(p => { const ms = [...p.meetings]; ms[mIdx] = { ...ms[mIdx], sections: ms[mIdx].sections.map((s, i) => i === sIdx ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s) }; return { ...p, meetings: ms }; });
  };
  const editSubItem = (mIdx, sIdx, iIdx, text) => {
    setData(p => { const ms = [...p.meetings]; ms[mIdx] = { ...ms[mIdx], sections: ms[mIdx].sections.map((s, i) => i === sIdx ? { ...s, items: s.items.map((it, j) => j === iIdx ? text : it) } : s) }; return { ...p, meetings: ms }; });
  };
  const deleteMeeting = (mIdx) => {
    setData(p => ({ ...p, meetings: p.meetings.filter((_, i) => i !== mIdx) }));
    setSelectedMeeting(null);
  };
  const addTodo = () => {
    if (!todoPopup) return;
    setTodos(p => [...p, { id: `todo-${Date.now()}`, text: todoPopup.text, owner: todoOwner || "", urgency: todoUrgency, status: "Not Started", fromDate: todoPopup.fromDate, createdAt: new Date().toISOString() }]);
    setTodoPopup(null); setTodoOwner(""); setTodoUrgency("Medium");
  };
  const updateTodo = (id, field, val) => setTodos(p => p.map(t => t.id === id ? { ...t, [field]: val } : t));
  const deleteTodo = (id) => setTodos(p => p.filter(t => t.id !== id));
  const activeTodos = todos.filter(t => t.status !== "Completed");
  const completedTodos = todos.filter(t => t.status === "Completed");

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Todo Popup */}
      {todoPopup && (
        <div className="overlay" onClick={() => setTodoPopup(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mhdr" style={{ borderTop: "2px solid #22c55e", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle" style={{ fontSize: 14 }}>Add to Todos</div>
              <button className="mclose" onClick={() => setTodoPopup(null)}>×</button>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--text)", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 14, lineHeight: 1.6 }}>{todoPopup.text}</div>
              <div className="frow">
                <div className="ff"><label className="fl">Owner</label><input className="fi" placeholder="Who owns this?" value={todoOwner} onChange={e => setTodoOwner(e.target.value)} autoFocus /></div>
                <div className="ff"><label className="fl">Urgency</label>
                  <select className="fsel" value={todoUrgency} onChange={e => setTodoUrgency(e.target.value)}>{TODO_URGENCY.map(u => <option key={u}>{u}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="mfoot"><button className="btn" onClick={() => setTodoPopup(null)}>Cancel</button><button className="btn btn-gold" onClick={addTodo}>Add Todo</button></div>
          </div>
        </div>
      )}
      {/* Add Agenda Modal */}
      {showAddAgenda && (
        <div className="overlay" onClick={() => setShowAddAgenda(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">New Agenda Item</div>
              <button className="mclose" onClick={() => setShowAddAgenda(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="ff"><label className="fl">Agenda Topic *</label><input className="fi" placeholder="e.g. Leadership Updates, Luke's Notes..." value={agendaTitle} onChange={e => setAgendaTitle(e.target.value)} autoFocus /></div>
              <div style={{ marginTop: 12 }}>
                <label className="fl">Sub-Items</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {agendaSubItems.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", width: 16, textAlign: "center" }}>{i + 1}.</span>
                      <input value={item} onChange={e => { const n = [...agendaSubItems]; n[i] = e.target.value; setAgendaSubItems(n); }}
                        onKeyDown={e => { if (e.key === "Enter") { setAgendaSubItems(p => [...p, ""]); setTimeout(() => e.target.parentElement.nextSibling?.querySelector("input")?.focus(), 50); } }}
                        placeholder="Sub-item note..." style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none" }} />
                      {agendaSubItems.length > 1 && <button onClick={() => setAgendaSubItems(p => p.filter((_, j) => j !== i))} style={{ fontSize: 14, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", opacity: .4 }}>×</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setAgendaSubItems(p => [...p, ""])} style={{ marginTop: 8, fontSize: 11, color: "var(--gold)", background: "none", border: "1px solid rgba(184,150,58,.2)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "var(--bf)" }}>+ Add Sub-Item</button>
              </div>
            </div>
            <div className="mfoot">
              <button className="btn" onClick={() => setShowAddAgenda(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={!agendaTitle.trim()} onClick={publishAgenda}>Publish Agenda Item</button>
            </div>
          </div>
        </div>
      )}
      {/* Add Meeting Modal */}
      {showAddMeeting && (
        <div className="overlay" onClick={() => setShowAddMeeting(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}><div className="mtitle">New Meeting</div><button className="mclose" onClick={() => setShowAddMeeting(false)}>×</button></div>
            <div style={{ padding: "18px 20px" }}><div className="ff"><label className="fl">Date</label><input className="fi" placeholder="4/28/2026" value={newMeetingDate} onChange={e => setNewMeetingDate(e.target.value)} autoFocus /></div></div>
            <div className="mfoot"><button className="btn" onClick={() => setShowAddMeeting(false)}>Cancel</button><button className="btn btn-gold" onClick={addMeeting}>Create</button></div>
          </div>
        </div>
      )}

      {/* Left — Meetings + Todos */}
      <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border2)" }}>
          <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 6 }}>Weekly Meetings</div>
          <button className="btn btn-gold" style={{ width: "100%", fontSize: 10, justifyContent: "center" }} onClick={() => setShowAddMeeting(true)}>+ New Meeting</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
          {meetings.map((m, i) => (
            <button key={i} onClick={() => setSelectedMeeting(i)} style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${selectedMeeting === i ? "rgba(184,150,58,.3)" : "transparent"}`, background: selectedMeeting === i ? "var(--gold-dim)" : "transparent", cursor: "pointer", textAlign: "left", marginBottom: 2, fontFamily: "var(--bf)", transition: "all .13s" }}
              onMouseEnter={e => { if (selectedMeeting !== i) e.currentTarget.style.background = "rgba(0,0,0,.03)"; }} onMouseLeave={e => { if (selectedMeeting !== i) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ fontSize: 13, fontWeight: selectedMeeting === i ? 600 : 400, color: selectedMeeting === i ? "var(--gold)" : "var(--text)" }}>{m.date}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{m.sections.length} topics · {m.sections.reduce((s, sec) => s + sec.items.length, 0)} items</div>
            </button>
          ))}
        </div>
        {/* Todos */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <div onClick={() => setTodosOpen(o => !o)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#22c55e", fontWeight: 600 }}>Todos ({activeTodos.length})</div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", transform: todosOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s", display: "inline-block" }}>▶</span>
          </div>
          {todosOpen && (
            <div style={{ padding: "0 12px 10px", maxHeight: 250, overflowY: "auto" }}>
              {activeTodos.length === 0 && completedTodos.length === 0 && <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>Click "+ Todo" on any item to track it here</div>}
              {activeTodos.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "5px 0", borderBottom: "1px solid var(--border2)" }}>
                  <div onClick={() => updateTodo(t.id, "status", AGENDA_STATUSES[(AGENDA_STATUSES.indexOf(t.status) + 1) % AGENDA_STATUSES.length])}
                    style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${AGENDA_ST_CLR[t.status]}`, background: "transparent", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text)", lineHeight: 1.4 }}>{t.text}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 9, color: "#e8a87c" }}>{t.owner}</span>
                      <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: TODO_URG_CLR[t.urgency] + "20", color: TODO_URG_CLR[t.urgency], fontWeight: 600 }}>{t.urgency}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteTodo(t.id)} style={{ fontSize: 10, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", opacity: .3, padding: 0 }}>×</button>
                </div>
              ))}
              {completedTodos.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>Completed</div>
                  {completedTodos.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: "#22c55e", display: "grid", placeItems: "center", flexShrink: 0 }}><span style={{ fontSize: 9, color: "#fff" }}>✓</span></div>
                      <span style={{ flex: 1, fontSize: 10, color: "var(--text-muted)", textDecoration: "line-through" }}>{t.text}</span>
                      <button onClick={() => deleteTodo(t.id)} style={{ fontSize: 9, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>clear</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right — Meeting detail */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {active ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)" }}>{active.date}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Field Marketing Weekly Check-in</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-gold" style={{ fontSize: 11 }} onClick={() => { setAgendaTitle(""); setAgendaSubItems([""]); setShowAddAgenda(true); }}>+ Add Agenda Item</button>
                <button className="btn btn-sm" style={{ fontSize: 10, borderColor: "rgba(224,123,106,.3)", color: "#e07b6a" }} onClick={() => { if (confirm(`Delete meeting ${active.date}?`)) deleteMeeting(selectedMeeting); }}>Delete Meeting</button>
              </div>
            </div>
            {active.sections.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 12 }}>No agenda items yet. Click "+ Add Agenda Item" to start.</div>}
            {active.sections.map((sec, si) => (
              <div key={si} style={{ marginBottom: 24, padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, borderLeft: "3px solid var(--gold)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <input value={sec.title} onChange={e => renameSection(selectedMeeting, si, e.target.value)} style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", background: "transparent", border: "none", outline: "none", fontFamily: "var(--bf)", flex: 1, padding: 0 }} />
                  <button onClick={() => { if (confirm(`Delete "${sec.title}"?`)) deleteSection(selectedMeeting, si); }} style={{ fontSize: 10, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", opacity: .4, padding: "0 4px" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".4"}>Delete</button>
                </div>
                {sec.items.length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No sub-items</div>}
                {sec.items.map((item, ii) => (
                  <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: ii < sec.items.length - 1 ? "1px solid var(--border2)" : "none" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", flexShrink: 0, marginTop: 7, opacity: .5 }} />
                    <input value={item} onChange={e => editSubItem(selectedMeeting, si, ii, e.target.value)} style={{ flex: 1, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65, background: "transparent", border: "none", outline: "none", fontFamily: "var(--bf)", padding: 0 }} />
                    <button onClick={() => setTodoPopup({ text: item, fromDate: active.date })} title="Add to todos"
                      style={{ flexShrink: 0, fontSize: 9, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#22c55e"; e.currentTarget.style.color = "#22c55e"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>+ Todo</button>
                    <button onClick={() => deleteSubItem(selectedMeeting, si, ii)} style={{ flexShrink: 0, fontSize: 12, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", opacity: .3, padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".3"}>×</button>
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 40px" }}>
            <div style={{ fontSize: 40, opacity: .3, marginBottom: 16 }}>📋</div>
            <div style={{ fontFamily: "var(--df)", fontSize: 24, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>Field Marketing Weekly</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>Select a meeting or create a new one to view the agenda.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CUSTOMER SERVICE BOARD ────────────────────────────────────────────────
const CS_STATUSES = ["New", "Initial Contact Made", "Reviewing", "Approved", "Shipped", "Closed"];
const CS_SOURCES = ["Website", "Email", "Phone", "Social Media", "In-Store", "Other"];
const CS_BRANDS = ["Curador", "Headchange", "Safe Bet", "Bubbles", "Airo"];
const CS_ST_CLR = { "New": "#3b82f6", "Initial Contact Made": "#c9a84c", "Reviewing": "#a855f7", "Approved": "#22c55e", "Shipped": "#14b8a6", "Closed": "#8a8a96" };
const CS_SEC_CLR = { "New Tickets": "#3b82f6", "Under Review": "#a855f7", "Hashtonaut Approved": "#22c55e", "Shipped & Tracking": "#14b8a6", "Closed Tickets": "#8a8a96" };
const CS_SECTIONS = ["New Tickets", "Under Review", "Hashtonaut Approved", "Shipped & Tracking", "Closed Tickets"];

function CSBoardTable({ data, setData, currentUser }) {
  const [collapsed, setCollapsed] = useState({});
  const [didInit, setDidInit] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", section: "New Tickets", brand: "Curador", date: new Date().toISOString().slice(0, 10), ticketSource: "Website", csStatus: "New", email: "", phone: "", reason: "", shippingAddress: "", productIssue: "", carePackageType: "", shirtSize: "" });

  useEffect(() => { if (!didInit && data.length > 0) { setCollapsed({ "Closed Tickets": true }); setDidInit(true); } }, [data, didInit]);

  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addItem = () => {
    if (!newItem.name.trim()) return;
    setData(p => [...p, { ...newItem, id: `cs-${Date.now()}` }]);
    setCollapsed(p => ({ ...p, [newItem.section]: false }));
    setShowAddModal(false);
    setNewItem({ name: "", section: "New Tickets", brand: "Curador", date: new Date().toISOString().slice(0, 10), ticketSource: "Website", csStatus: "New", email: "", phone: "", reason: "", shippingAddress: "", productIssue: "", carePackageType: "", shirtSize: "" });
  };

  const filtered = search ? data.filter(d => { const s = search.toLowerCase(); return (d.name || "").toLowerCase().includes(s) || (d.email || "").toLowerCase().includes(s) || (d.reason || "").toLowerCase().includes(s); }) : data;
  const groups = {};
  filtered.forEach(d => { const s = d.section || "New Tickets"; if (!groups[s]) groups[s] = []; groups[s].push(d); });

  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is7 = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const CSG = "1fr 36px 80px 90px 90px 100px 1fr 110px 1fr 28px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)" }}>Customer Service Board</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ New Ticket</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, reason..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
        </div>
      </div>
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="mhdr" style={{ borderTop: "2px solid #3b82f6", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">New Ticket</div>
              <button className="mclose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="ff"><label className="fl">Customer Name *</label><input className="fi" placeholder="Full name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Brand</label><select className="fsel" value={newItem.brand} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}>{CS_BRANDS.map(b => <option key={b}>{b}</option>)}</select></div>
                <div className="ff"><label className="fl">Source</label><select className="fsel" value={newItem.ticketSource} onChange={e => setNewItem(p => ({ ...p, ticketSource: e.target.value }))}>{CS_SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Email</label><input className="fi" type="email" placeholder="customer@email.com" value={newItem.email} onChange={e => setNewItem(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Phone</label><input className="fi" placeholder="555-123-4567" value={newItem.phone} onChange={e => setNewItem(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Section</label><select className="fsel" value={newItem.section} onChange={e => setNewItem(p => ({ ...p, section: e.target.value }))}>{CS_SECTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="ff"><label className="fl">Date</label><input className="fi" type="date" value={newItem.date} onChange={e => setNewItem(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div className="ff"><label className="fl">Reason for Contact</label><textarea className="fta" rows={3} placeholder="Describe the issue or request..." value={newItem.reason} onChange={e => setNewItem(p => ({ ...p, reason: e.target.value }))} /></div>
              <div className="frow">
                <div className="ff"><label className="fl">Care Package Type</label><input className="fi" placeholder="e.g. Merch, Product Replace" value={newItem.carePackageType} onChange={e => setNewItem(p => ({ ...p, carePackageType: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Shirt Size</label><input className="fi" placeholder="S/M/L/XL/XXL" value={newItem.shirtSize} onChange={e => setNewItem(p => ({ ...p, shirtSize: e.target.value }))} /></div>
              </div>
            </div>
            <div className="mfoot"><button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn btn-gold" disabled={!newItem.name.trim()} onClick={addItem}>Create Ticket</button></div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ minWidth: 900 }}>
          {CS_SECTIONS.map(section => {
            const items = groups[section] || [];
            const sColor = CS_SEC_CLR[section] || "var(--gold)";
            if (items.length === 0 && collapsed[section]) return null;
            return (
              <div key={section} style={{ marginBottom: 16 }}>
                <div onClick={() => setCollapsed(p => ({ ...p, [section]: !p[section] }))} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <span style={{ fontSize: 10, display: "inline-block", transform: collapsed[section] ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", color: sColor }}>▶</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: sColor }}>{section}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{items.length} ticket{items.length !== 1 ? "s" : ""}</span>
                </div>
                {collapsed[section] && items.length > 0 && <div style={{ padding: "4px 16px 12px", fontSize: 11, color: "var(--text-muted)", borderLeft: `3px solid ${sColor}`, marginLeft: 16 }}>{items.length} ticket{items.length !== 1 ? "s" : ""}</div>}
                {!collapsed[section] && (
                  <div style={{ borderLeft: `3px solid ${sColor}`, marginLeft: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: CSG, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                      {["Ticket", "💬", "Brand", "Date", "Source", "Status", "Email", "Phone", "Reason", ""].map((h, hi) => (
                        <div key={hi} style={{ padding: "6px 8px", fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
                      ))}
                    </div>
                    {items.map(d => (
                      <div key={d.id} style={{ display: "grid", gridTemplateColumns: CSG, borderBottom: "1px solid var(--border2)", minHeight: 36 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={cs}><input value={d.name||""} onChange={e => updateItem(d.id, "name", e.target.value)} style={{ ...is7, fontWeight: 500, color: "var(--text)" }} /></div>
                        <div style={{ ...cs, overflow: "visible" }}><CommentBubble item={d} title={d.name||""} currentUser={currentUser} onUpdateComments={c => updateItem(d.id, "comments", c)} /></div>
                        <div style={cs}><select value={d.brand||""} onChange={e => updateItem(d.id, "brand", e.target.value)} style={{ ...is7, fontSize: 10 }}>{CS_BRANDS.map(b => <option key={b}>{b}</option>)}</select></div>
                        <div style={cs}><input type="date" value={d.date||""} onChange={e => updateItem(d.id, "date", e.target.value)} style={{ ...is7, fontSize: 10, color: "var(--text-muted)" }} /></div>
                        <div style={cs}><select value={d.ticketSource||""} onChange={e => updateItem(d.id, "ticketSource", e.target.value)} style={{ ...is7, fontSize: 10 }}>{CS_SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 9, fontWeight: 600, color: "#fff", background: CS_ST_CLR[d.csStatus] || "#888", cursor: "pointer" }} onClick={() => { const next = CS_STATUSES[(CS_STATUSES.indexOf(d.csStatus) + 1) % CS_STATUSES.length]; updateItem(d.id, "csStatus", next); }}>{d.csStatus || "New"}</div></div>
                        <div style={cs}><input value={d.email||""} onChange={e => updateItem(d.id, "email", e.target.value)} style={{ ...is7, color: "#3b82f6" }} /></div>
                        <div style={cs}><input value={d.phone||""} onChange={e => updateItem(d.id, "phone", e.target.value)} style={is7} /></div>
                        <div style={cs}><input value={d.reason||""} onChange={e => updateItem(d.id, "reason", e.target.value)} style={is7} placeholder="Reason..." /></div>
                        <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
                      </div>
                    ))}
                    <div onClick={() => setShowAddModal(true)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add ticket</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── PACKAGING PORTAL ──────────────────────────────────────────────────────
const BRAND_PKG_SKUS = {
  "Headchange": ["Concentrate Box","Concentrate Case","Box Sticker","Jar Wrap","Jar Lid","Jar QR","510 Cart Package","510 Cart Case","All-in-One Cart Package","All-in-One Cart Case","Live Rosin Cart","Live Resin AIO","Live Rosin AIO","Mini Hash Holes"],
  "SafeBet": ["Pre-Roll Package","510 Cart Package","510 Cart Case","All-in-One Cart Package","All-in-One Cart Case","FECO Package","FECO Case","QR Sticker","Infused Pre Rolls","Bubble Hash Infused","Live Resin Infused","Diamond Infused","1g All in One","FECO Plus CBN","1g Blunt","1g Bubble Hash Infused Blunt"],
  "Bubbles": ["Cart SKU 1 Package","Cart SKU 1 Case","Cart SKU 2 Package","Cart SKU 2 Case","Cart SKU 3 Package","Cart SKU 3 Case","Cart SKU 4 Package","Cart SKU 4 Case"],
  "Airo": ["Airo Pod Package","Airo Pod Case","Airo AIO Package"],
};
const PKG_STATUSES = ["Idea", "Sampled", "Approved", "Denied"];
const PKG_ST_CLR = { "Idea": "#3b82f6", "Sampled": "#c9a84c", "Approved": "#22c55e", "Denied": "#e07b6a" };
const PKG_TYPES = ["Box", "Jar", "Tube", "Mylar", "Pouch", "Bag", "Cart Box", "Display", "Label", "Wrap", "Other"];

function PackagingPortal({ tracker, setTracker, confirmed, setConfirmed, evolutionTracker, setEvolutionTracker, evolutionConfirmed, setEvolutionConfirmed, brands, currentUser }) {
  const brandList = brands ? Object.values(brands) : [];
  const [section, setSection] = useState("current"); // "current" | "evolution"
  const [activeTab, setActiveTab] = useState("tracker");
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
  const [filterBrand, setFilterBrand] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [cardDetailId, setCardDetailId] = useState(null);
  const [moodModalId, setMoodModalId] = useState(null);
  const [moodDragOver, setMoodDragOver] = useState(false);
  const [newItem, setNewItem] = useState({ brand: brandList[0]?.name || "Headchange", sku: "", packageType: PKG_TYPES[0], supplier: "", cost: "", contact: "", status: "Idea", notes: "" });

  const isEvolution = section === "evolution";
  const data = isEvolution
    ? (activeTab === "tracker" ? (evolutionTracker || []) : (evolutionConfirmed || []))
    : (activeTab === "tracker" ? tracker : confirmed);
  const setData = isEvolution
    ? (activeTab === "tracker" ? setEvolutionTracker : setEvolutionConfirmed)
    : (activeTab === "tracker" ? setTracker : setConfirmed);

  const updateItem = (id, field, val) => setData(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteItem = (id) => setData(p => p.filter(d => d.id !== id));
  const addElement = (id) => setData(p => p.map(d => d.id === id ? { ...d, elements: [...(d.elements || []), { id: `el-${Date.now()}`, name: "", type: "", supplier: "", cost: "", notes: "" }] } : d));
  const updateElement = (itemId, elId, field, val) => setData(p => p.map(d => d.id === itemId ? { ...d, elements: (d.elements || []).map(e => e.id === elId ? { ...e, [field]: val } : e) } : d));
  const deleteElement = (itemId, elId) => setData(p => p.map(d => d.id === itemId ? { ...d, elements: (d.elements || []).filter(e => e.id !== elId) } : d));
  const addItem = () => {
    if (!newItem.sku.trim()) return;
    const defaultElements = [
      { id: `el-${Date.now()}-1`, name: "", type: "", supplier: "", cost: "", notes: "" },
      { id: `el-${Date.now()}-2`, name: "", type: "", supplier: "", cost: "", notes: "" },
      { id: `el-${Date.now()}-3`, name: "", type: "", supplier: "", cost: "", notes: "" },
    ];
    setData(p => [...p, { ...newItem, id: `pkg-${Date.now()}`, comments: [], elements: defaultElements, attachment: null, attachmentName: "", createdAt: new Date().toISOString(), createdBy: currentUser?.name || "Team" }]);
    setCollapsed(p => ({ ...p, [newItem.brand]: false }));
    setShowAddModal(false);
    setNewItem({ brand: brandList[0]?.name || "Headchange", sku: "", packageType: PKG_TYPES[0], supplier: "", cost: "", contact: "", status: "Idea", notes: "" });
  };
  const handleAttach = (id, file) => {
    if (!file || file.size > 2 * 1024 * 1024) return;
    const r = new FileReader();
    r.onload = e => updateItem(id, "attachment", e.target.result);
    r.readAsDataURL(file);
    updateItem(id, "attachmentName", file.name);
  };
  const addMoodImage = (id, file) => {
    if (!file || !file.type?.startsWith("image/") || file.size > 3 * 1024 * 1024) return;
    const r = new FileReader();
    r.onload = e => setData(p => p.map(d => d.id === id ? { ...d, moodboard: [...(d.moodboard || []), { id: `mb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, url: e.target.result, name: file.name, createdAt: new Date().toISOString() }] } : d));
    r.readAsDataURL(file);
  };
  const removeMoodImage = (itemId, imgId) => setData(p => p.map(d => d.id === itemId ? { ...d, moodboard: (d.moodboard || []).filter(m => m.id !== imgId) } : d));

  const filtered = data.filter(d => {
    if (filterBrand !== "all" && d.brand !== filterBrand) return false;
    if (search) { const s = search.toLowerCase(); return (d.sku || "").toLowerCase().includes(s) || (d.supplier || "").toLowerCase().includes(s) || (d.packageType || "").toLowerCase().includes(s); }
    return true;
  });
  const groups = {};
  filtered.forEach(d => { const b = d.brand || "Other"; if (!groups[b]) groups[b] = []; groups[b].push(d); });

  const cs = { padding: "5px 8px", fontSize: 11, borderRight: "1px solid var(--border2)", display: "flex", alignItems: "center", overflow: "hidden" };
  const is8 = { background: "transparent", border: "none", color: "var(--text-dim)", fontSize: 11, fontFamily: "var(--bf)", outline: "none", width: "100%", padding: 0 };
  const PGR = "30px 1fr 36px 44px 100px 80px 80px 80px 100px 80px 28px";

  const brandColor = (name) => brandList.find(b => b.name === name)?.color || "var(--gold)";
  const isImageAttachment = (d) => d.attachment && /^data:image\//.test(d.attachment);
  const moodCount = (d) => (d.moodboard || []).length;
  const detailItem = cardDetailId ? data.find(d => d.id === cardDetailId) : null;
  const moodItem = moodModalId ? data.find(d => d.id === moodModalId) : null;
  const handleMoodDrop = (e, id) => {
    e.preventDefault();
    setMoodDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith("image/"));
    files.forEach(f => addMoodImage(id, f));
  };

  const renderDetailBody = (d) => (
    <>
      {/* Notes */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Notes</div>
        <textarea value={d.notes||""} onChange={e => updateItem(d.id, "notes", e.target.value)} placeholder="Add packaging notes, specs, dimensions..."
          style={{ width: "100%", minHeight: 60, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", color: "var(--text)", fontSize: 12, fontFamily: "var(--bf)", outline: "none", resize: "vertical", lineHeight: 1.6 }} />
      </div>
      {/* Elements sub-table */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>Package Elements ({(d.elements || []).length})</div>
          <button onClick={() => addElement(d.id)} style={{ fontSize: 9, color: "var(--gold)", background: "none", border: "1px solid rgba(184,150,58,.2)", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>+ Add Element</button>
        </div>
        {(d.elements || []).length > 0 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 80px 80px 60px 80px 70px 60px 60px 60px 70px 65px 65px 65px 1fr 24px", background: "var(--surface3)", borderBottom: "1px solid var(--border)", minWidth: 1100 }}>
              {["Element", "Type", "Sample", "Hardware", "Specs", "CAD", "Sample Status", "Supplier", "Cost", "Current Cost", "Lead Time", "MOQ", "Touch Points", "Casability", "Sizing", "Notes", ""].map(h => (
                <div key={h} style={{ padding: "4px 8px", fontSize: 8, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
              ))}
            </div>
            {(d.elements || []).map(el => (
              <div key={el.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 80px 80px 60px 80px 70px 60px 60px 60px 70px 65px 65px 65px 1fr 24px", borderBottom: "1px solid var(--border2)", minWidth: 1100 }}>
                <div style={{ padding: "4px 8px" }}><input value={el.name||""} onChange={e => updateElement(d.id, el.id, "name", e.target.value)} placeholder="e.g. Lid, Label, Insert" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.type||""} onChange={e => updateElement(d.id, el.id, "type", e.target.value)} style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><select value={el.sampleType||""} onChange={e => updateElement(d.id, el.id, "sampleType", e.target.value)} style={{ ...is8, fontSize: 10, color: el.sampleType === "Custom" ? "#a855f7" : el.sampleType === "Stock" ? "#22c55e" : "var(--text-muted)" }}><option value="">—</option><option value="Stock">Stock</option><option value="Custom">Custom</option></select></div>
                <div style={{ padding: "4px 8px" }}><input value={el.hardware||""} onChange={e => updateElement(d.id, el.id, "hardware", e.target.value)} placeholder="Device/supplier" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.specs||""} onChange={e => updateElement(d.id, el.id, "specs", e.target.value)} placeholder="Specs" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}>{el.cadFile ? (<div style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={{ fontSize: 8, color: "var(--text-dim)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.cadFileName||"CAD"}</span><button onClick={() => { const a = document.createElement("a"); a.href = el.cadFile; a.download = el.cadFileName||"cad"; a.click(); }} style={{ fontSize: 7, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>DL</button><button onClick={() => { updateElement(d.id, el.id, "cadFile", null); updateElement(d.id, el.id, "cadFileName", ""); }} style={{ fontSize: 8, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button></div>) : (<button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.onchange = ev => { const f = ev.target.files[0]; if (!f || f.size > 5*1024*1024) return; const r2 = new FileReader(); r2.onload = e2 => { updateElement(d.id, el.id, "cadFile", e2.target.result); updateElement(d.id, el.id, "cadFileName", f.name); }; r2.readAsDataURL(f); }; inp.click(); }} style={{ fontSize: 8, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 4px", cursor: "pointer", fontFamily: "var(--bf)" }}>+CAD</button>)}</div>
                <div style={{ padding: "4px 8px" }}><select value={el.sampleStatus||""} onChange={e => updateElement(d.id, el.id, "sampleStatus", e.target.value)} style={{ ...is8, fontSize: 9, fontWeight: 600, color: el.sampleStatus === "Approved" ? "#22c55e" : el.sampleStatus === "Denied" ? "#e07b6a" : "var(--text-muted)" }}><option value="">—</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Denied">Denied</option></select></div>
                <div style={{ padding: "4px 8px" }}><input value={el.supplier||""} onChange={e => updateElement(d.id, el.id, "supplier", e.target.value)} style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.cost||""} onChange={e => updateElement(d.id, el.id, "cost", e.target.value)} style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.currentCost||""} onChange={e => updateElement(d.id, el.id, "currentCost", e.target.value)} placeholder="Current $" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.leadTime||""} onChange={e => updateElement(d.id, el.id, "leadTime", e.target.value)} placeholder="e.g. 4wk" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.moq||""} onChange={e => updateElement(d.id, el.id, "moq", e.target.value)} placeholder="MOQ" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.touchPoints||""} onChange={e => updateElement(d.id, el.id, "touchPoints", e.target.value)} placeholder="Touch pts" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.casability||""} onChange={e => updateElement(d.id, el.id, "casability", e.target.value)} placeholder="Casability" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.sizing||""} onChange={e => updateElement(d.id, el.id, "sizing", e.target.value)} placeholder="Sizing" style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px" }}><input value={el.notes||""} onChange={e => updateElement(d.id, el.id, "notes", e.target.value)} style={{ ...is8, fontSize: 10 }} /></div>
                <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}><button onClick={() => deleteElement(d.id, el.id)} style={{ fontSize: 10, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", opacity: .4 }}>×</button></div>
              </div>
            ))}
          </div>
        )}
        {(d.elements || []).length === 0 && <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>No elements yet — add lid, label, insert, etc.</div>}
      </div>
      {/* Mood Board entry point — modal handles the grid */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Mood Board</div>
        <button onClick={() => setMoodModalId(d.id)} style={{ fontSize: 11, color: "#a855f7", background: "rgba(168,85,247,.08)", border: "1px solid rgba(168,85,247,.3)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--bf)", fontWeight: 600 }}>🎨 Open Mood Board ({(d.moodboard || []).length})</button>
      </div>
      {/* File attachment in detail */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Attachments</div>
        <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.onchange = e => handleAttach(d.id, e.target.files[0]); inp.click(); }}
          style={{ fontSize: 10, color: "var(--gold)", background: "none", border: "1px solid rgba(184,150,58,.2)", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontFamily: "var(--bf)" }}>+ Attach File</button>
        {d.attachmentName && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text-dim)" }}>{d.attachmentName}</span>}
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {/* Sticky toolbar */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div style={{ fontFamily: "var(--df)", fontSize: 28, fontWeight: 300, color: "var(--text)" }}>Packaging</div>
            <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: isEvolution ? "#a855f7" : "var(--gold)", fontWeight: 600 }}>{isEvolution ? "Evolution" : "Current"}</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        {/* Section tabs — Current vs Evolution */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10, borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => { setSection("current"); setExpandedRow(null); setCardDetailId(null); setMoodModalId(null); }} style={{ padding: "8px 18px", fontSize: 12, border: "none", cursor: "pointer", background: "transparent", color: section === "current" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600, borderBottom: section === "current" ? "2px solid var(--gold)" : "2px solid transparent", marginBottom: -1 }}>Current Packaging</button>
          <button onClick={() => { setSection("evolution"); setExpandedRow(null); setCardDetailId(null); setMoodModalId(null); }} style={{ padding: "8px 18px", fontSize: 12, border: "none", cursor: "pointer", background: "transparent", color: section === "evolution" ? "#a855f7" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600, borderBottom: section === "evolution" ? "2px solid #a855f7" : "2px solid transparent", marginBottom: -1 }}>Packaging Evolution</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-gold" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddModal(true)}>+ Add SKU</button>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <button onClick={() => setActiveTab("tracker")} style={{ padding: "4px 12px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: activeTab === "tracker" ? "var(--gold-dim)" : "transparent", color: activeTab === "tracker" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Tracker</button>
            <button onClick={() => setActiveTab("confirmed")} style={{ padding: "4px 12px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: activeTab === "confirmed" ? "var(--gold-dim)" : "transparent", color: activeTab === "confirmed" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Confirmed</button>
          </div>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <button onClick={() => setViewMode("table")} title="Table view" style={{ padding: "4px 10px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: viewMode === "table" ? "var(--gold-dim)" : "transparent", color: viewMode === "table" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>☰ Table</button>
            <button onClick={() => setViewMode("cards")} title="Card view" style={{ padding: "4px 10px", fontSize: 10, borderRadius: 4, border: "none", cursor: "pointer", background: viewMode === "cards" ? "var(--gold-dim)" : "transparent", color: viewMode === "cards" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>▦ Cards</button>
          </div>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }}>
            <option value="all">All Brands</option>
            {brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU, supplier..." style={{ flex: 1, minWidth: 150, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontSize: 11, fontFamily: "var(--bf)", outline: "none" }} />
        </div>
      </div>
      {/* Add Modal */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="mhdr" style={{ borderTop: "2px solid var(--gold)", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle">Add Packaging SKU</div>
              <button className="mclose" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={{ padding: "18px 20px", overflowY: "auto", maxHeight: "60vh" }}>
              <div className="frow">
                <div className="ff"><label className="fl">Brand</label><select className="fsel" value={newItem.brand} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}>{brandList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
                <div className="ff"><label className="fl">Package Type</label><select className="fsel" value={newItem.packageType} onChange={e => setNewItem(p => ({ ...p, packageType: e.target.value }))}>{PKG_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="ff"><label className="fl">SKU / Product Name *</label>
                <input className="fi" placeholder="e.g. Rosin AIO 0.5g, Concentrate Box, etc." value={newItem.sku} onChange={e => setNewItem(p => ({ ...p, sku: e.target.value }))} autoFocus />
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Supplier</label><input className="fi" placeholder="Supplier name" value={newItem.supplier} onChange={e => setNewItem(p => ({ ...p, supplier: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Cost</label><input className="fi" placeholder="$0.00" value={newItem.cost} onChange={e => setNewItem(p => ({ ...p, cost: e.target.value }))} /></div>
              </div>
              <div className="frow">
                <div className="ff"><label className="fl">Contact</label><input className="fi" placeholder="Rep name or email" value={newItem.contact} onChange={e => setNewItem(p => ({ ...p, contact: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Status</label><select className="fsel" value={newItem.status} onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))}>{PKG_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="ff"><label className="fl">Notes</label><textarea className="fta" rows={2} placeholder="Any notes about this packaging..." value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div className="mfoot"><button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn btn-gold" disabled={!newItem.sku.trim()} onClick={addItem}>Add to {activeTab === "tracker" ? "Tracker" : "Confirmed"}</button></div>
          </div>
        </div>
      )}
      {/* Content area */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 20px" }}>
        <div style={{ minWidth: viewMode === "table" ? 800 : 0 }}>
          {Object.keys(groups).length === 0 && data.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: 40, opacity: .3, marginBottom: 16 }}>📦</div>
              <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>{isEvolution ? "Packaging Evolution" : "Current Packaging"} · {activeTab === "tracker" ? "Tracker" : "Confirmed"}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{isEvolution ? "No evolution concepts yet. Add a SKU to start exploring new directions." : "No items yet. Add a SKU to get started."}</div>
              <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>+ Add SKU</button>
            </div>
          )}
          {/* CARDS VIEW */}
          {viewMode === "cards" && Object.keys(groups).length > 0 && brandList.map(brand => {
            const items = groups[brand.name];
            if (!items) return null;
            const isCollapsed = collapsed[brand.name];
            return (
              <div key={brand.name} style={{ marginBottom: 22 }}>
                <div onClick={() => setCollapsed(p => ({ ...p, [brand.name]: !p[brand.name] }))} style={{ padding: "10px 4px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <span style={{ fontSize: 10, display: "inline-block", transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", color: brand.color }}>▶</span>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: brand.color }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: brand.color }}>{brand.name}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{items.length} SKU{items.length !== 1 ? "s" : ""}</span>
                </div>
                {!isCollapsed && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, paddingLeft: 4 }}>
                    {items.map(d => {
                      const statusColor = PKG_ST_CLR[d.status] || "#888";
                      const previewImg = isImageAttachment(d) ? d.attachment : ((d.moodboard || [])[0]?.url || null);
                      return (
                        <div key={d.id} onClick={() => setCardDetailId(d.id)}
                          style={{ cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)", borderTop: `3px solid ${brand.color}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform .12s, box-shadow .12s" }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                          <div style={{ aspectRatio: "4 / 3", background: previewImg ? "var(--surface2)" : "linear-gradient(135deg, var(--surface2), var(--surface3))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {previewImg ? (
                              <img src={previewImg} alt={d.sku || "preview"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{ fontSize: 32, opacity: .25 }}>📦</div>
                            )}
                            <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: "#fff", background: statusColor, textTransform: "uppercase", letterSpacing: ".06em" }}>{d.status || "Idea"}</div>
                            <button onClick={e => { e.stopPropagation(); setMoodModalId(d.id); }} title="Open mood board" style={{ position: "absolute", bottom: 8, right: 8, padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, color: "#fff", background: moodCount(d) > 0 ? "rgba(168,85,247,.9)" : "rgba(0,0,0,.55)", border: "none", cursor: "pointer", fontFamily: "var(--bf)", backdropFilter: "blur(6px)" }}>🎨 {moodCount(d)}</button>
                          </div>
                          <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{d.sku || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(no name)</span>}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              {d.packageType && <span style={{ padding: "1px 7px", borderRadius: 8, background: "var(--surface2)", color: "var(--text-dim)" }}>{d.packageType}</span>}
                              {d.supplier && <span title="Supplier">· {d.supplier}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 6, fontSize: 10, color: "var(--text-muted)" }}>
                              <span>{d.cost ? d.cost : "—"}</span>
                              <span style={{ display: "flex", gap: 8 }}>
                                <span title="Elements">⊞ {(d.elements || []).length}</span>
                                <span title="Comments">💬 {(d.comments || []).length}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* TABLE VIEW */}
          {viewMode === "table" && brandList.map(brand => {
            const items = groups[brand.name];
            if (!items && filterBrand === "all") return null;
            if (!items) return null;
            const isCollapsed = collapsed[brand.name];
            return (
              <div key={brand.name} style={{ marginBottom: 16 }}>
                <div onClick={() => setCollapsed(p => ({ ...p, [brand.name]: !p[brand.name] }))} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <span style={{ fontSize: 10, display: "inline-block", transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform .15s", color: brand.color }}>▶</span>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: brand.color }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: brand.color }}>{brand.name}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{items.length} SKU{items.length !== 1 ? "s" : ""}</span>
                </div>
                {isCollapsed && <div style={{ padding: "4px 16px 8px", fontSize: 11, color: "var(--text-muted)", borderLeft: `3px solid ${brand.color}`, marginLeft: 16 }}>{items.length} SKU{items.length !== 1 ? "s" : ""}</div>}
                {!isCollapsed && (
                  <div style={{ borderLeft: `3px solid ${brand.color}`, marginLeft: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: PGR, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                      {["", "SKU", "💬", "🎨", "Pkg Type", "Supplier", "Cost", "Contact", "Status", "File", ""].map((h, hi) => (
                        <div key={hi} style={{ padding: "6px 8px", fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-muted)", borderRight: "1px solid var(--border2)" }}>{h}</div>
                      ))}
                    </div>
                    {items.map(d => (
                      <div key={d.id}>
                      <div style={{ display: "grid", gridTemplateColumns: PGR, borderBottom: expandedRow === d.id ? "none" : "1px solid var(--border2)", minHeight: 36 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ ...cs, justifyContent: "center", cursor: "pointer" }} onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}>
                          <span style={{ fontSize: 9, display: "inline-block", transform: expandedRow === d.id ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s", color: "var(--text-muted)" }}>▶</span>
                        </div>
                        <div style={cs}><input value={d.sku||""} onChange={e => updateItem(d.id, "sku", e.target.value)} style={{ ...is8, fontWeight: 500, color: "var(--text)" }} /></div>
                        <div style={{ ...cs, overflow: "visible" }}><CommentBubble item={d} title={d.sku||d.brand} currentUser={currentUser} onUpdateComments={c => updateItem(d.id, "comments", c)} /></div>
                        <div style={{ ...cs, justifyContent: "center" }}>
                          <button onClick={() => setMoodModalId(d.id)} title="Open mood board" style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 10, border: "1px solid rgba(168,85,247,.25)", background: moodCount(d) > 0 ? "rgba(168,85,247,.12)" : "transparent", color: "#a855f7", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "var(--bf)" }}>🎨{moodCount(d) > 0 && <span>{moodCount(d)}</span>}</button>
                        </div>
                        <div style={cs}><select value={d.packageType||""} onChange={e => updateItem(d.id, "packageType", e.target.value)} style={{ ...is8, fontSize: 10 }}>{PKG_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                        <div style={cs}><input value={d.supplier||""} onChange={e => updateItem(d.id, "supplier", e.target.value)} style={is8} /></div>
                        <div style={cs}><input value={d.cost||""} onChange={e => updateItem(d.id, "cost", e.target.value)} style={{ ...is8, textAlign: "right" }} /></div>
                        <div style={cs}><input value={d.contact||""} onChange={e => updateItem(d.id, "contact", e.target.value)} style={is8} /></div>
                        <div style={cs}><div style={{ width: "100%", padding: "3px 0", borderRadius: 4, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#fff", background: PKG_ST_CLR[d.status] || "#888", cursor: "pointer" }} onClick={() => { const next = PKG_STATUSES[(PKG_STATUSES.indexOf(d.status) + 1) % PKG_STATUSES.length]; updateItem(d.id, "status", next); }}>{d.status || "Idea"}</div></div>
                        <div style={cs}>
                          {d.attachmentName ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
                              <span style={{ fontSize: 9, color: "var(--text-dim)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.attachmentName}</span>
                              {d.attachment && <button onClick={() => { const a = document.createElement("a"); a.href = d.attachment; a.download = d.attachmentName; a.click(); }} style={{ fontSize: 8, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--bf)" }}>DL</button>}
                              <button onClick={() => { updateItem(d.id, "attachment", null); updateItem(d.id, "attachmentName", ""); }} style={{ fontSize: 10, color: "#e07b6a", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
                            </div>
                          ) : (
                            <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.onchange = e => handleAttach(d.id, e.target.files[0]); inp.click(); }} style={{ fontSize: 9, color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "2px 6px", cursor: "pointer", fontFamily: "var(--bf)" }}>+ File</button>
                          )}
                        </div>
                        <div style={{ ...cs, borderRight: "none", justifyContent: "center", cursor: "pointer" }} onClick={() => { if (confirm("Delete?")) deleteItem(d.id); }}><span style={{ fontSize: 12, opacity: .3, color: "#e07b6a" }}>×</span></div>
                      </div>
                      {/* Expanded detail */}
                      {expandedRow === d.id && (
                        <div style={{ padding: "12px 16px 16px 46px", borderBottom: "1px solid var(--border2)", background: "var(--surface2)" }}>
                          {renderDetailBody(d)}
                        </div>
                      )}
                      </div>
                    ))}
                    <div onClick={() => setShowAddModal(true)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: .5 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>+ Add SKU</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Card detail modal */}
      {detailItem && (
        <div className="overlay" onClick={() => setCardDetailId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1100, width: "92vw" }}>
            <div className="mhdr" style={{ borderTop: `3px solid ${brandColor(detailItem.brand)}`, borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: brandColor(detailItem.brand) }} />
                <span>{detailItem.sku || "Untitled SKU"}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>· {detailItem.brand} · {detailItem.packageType || "—"}</span>
              </div>
              <button className="mclose" onClick={() => setCardDetailId(null)}>×</button>
            </div>
            <div style={{ padding: "18px 22px", overflowY: "auto", maxHeight: "78vh" }}>
              {/* Quick-edit header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div className="ff"><label className="fl">SKU</label><input className="fi" value={detailItem.sku||""} onChange={e => updateItem(detailItem.id, "sku", e.target.value)} /></div>
                <div className="ff"><label className="fl">Pkg Type</label><select className="fsel" value={detailItem.packageType||""} onChange={e => updateItem(detailItem.id, "packageType", e.target.value)}>{PKG_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="ff"><label className="fl">Supplier</label><input className="fi" value={detailItem.supplier||""} onChange={e => updateItem(detailItem.id, "supplier", e.target.value)} /></div>
                <div className="ff"><label className="fl">Cost</label><input className="fi" value={detailItem.cost||""} onChange={e => updateItem(detailItem.id, "cost", e.target.value)} /></div>
                <div className="ff"><label className="fl">Contact</label><input className="fi" value={detailItem.contact||""} onChange={e => updateItem(detailItem.id, "contact", e.target.value)} /></div>
                <div className="ff"><label className="fl">Status</label><select className="fsel" value={detailItem.status||"Idea"} onChange={e => updateItem(detailItem.id, "status", e.target.value)}>{PKG_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              {renderDetailBody(detailItem)}
            </div>
            <div className="mfoot">
              <button className="btn" style={{ borderColor: "rgba(224,123,106,.3)", color: "#e07b6a" }} onClick={() => { if (confirm("Delete this SKU?")) { deleteItem(detailItem.id); setCardDetailId(null); } }}>Delete</button>
              <button className="btn btn-gold" onClick={() => setCardDetailId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
      {/* Mood Board modal — drag-and-drop is scoped to the drop zone only */}
      {moodItem && (
        <div className="overlay" onClick={() => { setMoodModalId(null); setMoodDragOver(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1000, width: "92vw" }}>
            <div className="mhdr" style={{ borderTop: "3px solid #a855f7", borderRadius: "16px 16px 0 0" }}>
              <div className="mtitle" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span>🎨</span>
                <span>Mood Board — {moodItem.sku || "Untitled SKU"}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>· {moodItem.brand} · {moodCount(moodItem)} image{moodCount(moodItem) !== 1 ? "s" : ""}</span>
              </div>
              <button className="mclose" onClick={() => { setMoodModalId(null); setMoodDragOver(false); }}>×</button>
            </div>
            <div style={{ padding: "18px 22px", overflowY: "auto", maxHeight: "78vh", minHeight: 300 }}>
              {/* The drop zone — ONLY this box accepts drops */}
              <div
                onDragEnter={e => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setMoodDragOver(true); } }}
                onDragOver={e => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (!moodDragOver) setMoodDragOver(true); } }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setMoodDragOver(false); }}
                onDrop={e => handleMoodDrop(e, moodItem.id)}
                onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true; inp.onchange = e => { Array.from(e.target.files || []).forEach(f => addMoodImage(moodItem.id, f)); }; inp.click(); }}
                style={{
                  border: `2px dashed ${moodDragOver ? "#a855f7" : "var(--border)"}`,
                  borderRadius: 12,
                  padding: moodCount(moodItem) === 0 ? "56px 20px" : "20px",
                  marginBottom: 16,
                  textAlign: "center",
                  background: moodDragOver ? "rgba(168,85,247,.1)" : "transparent",
                  transition: "border-color .12s, background .12s",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                {/* Block pointer events on children so onDragLeave doesn't fire when moving over the icon/text */}
                <div style={{ pointerEvents: "none" }}>
                  {moodDragOver ? (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📥</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#a855f7" }}>Drop to add to mood board</div>
                    </>
                  ) : moodCount(moodItem) === 0 ? (
                    <>
                      <div style={{ fontSize: 40, opacity: .35, marginBottom: 12 }}>🎨</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>No mood images yet</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Drag image files into this box, or click to upload. Max 3 MB per image.</div>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-muted)", fontSize: 12 }}>
                      <span style={{ fontSize: 18, opacity: .6 }}>📥</span>
                      <span><span style={{ color: "#a855f7", fontWeight: 600 }}>Drag images here</span> or click to upload</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Image grid — outside the drop zone so dragging over thumbnails doesn't fire drop events */}
              {moodCount(moodItem) > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {(moodItem.moodboard || []).map(img => (
                    <div key={img.id} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
                      <img src={img.url} alt={img.name || "mood"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <button onClick={() => removeMoodImage(moodItem.id, img.id)} title="Remove" style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
                      {img.name && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px", background: "linear-gradient(to top, rgba(0,0,0,.7), transparent)", color: "#fff", fontSize: 9, fontFamily: "var(--bf)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{img.name}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mfoot">
              <button className="btn btn-gold" onClick={() => { setMoodModalId(null); setMoodDragOver(false); }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AGENCY PORTAL — HEADCHANGE STRATEGY HOMEWORK ──────────────────────────
const HC_SECTIONS = [
  { title: "GOAL SETTING", questions: [
    "List up to five of your main business challenges (anticipated or current).",
    "How would you like things to look for the brand this time next year?",
    "How would you like things to look in 5 years? Feel free to go big.",
    "How would/will you measure success?",
    "If there are any specific challenges you would like to discuss/resolve in the workshop, please detail them here.",
  ]},
  { title: "COMPETITORS & UNIQUE VALUE PROP", questions: [
    "Who are some brands that you admire? Why?",
    "Who do you see as your top 5 competitors? Why?",
    "What do you envision your business excels at vs. others?",
    "What is your unique selling point? How do you differentiate from your competitors?",
  ]},
  { title: "MISSION + VISION", questions: [
    "What does your business do?",
    "How do you do it?",
    "Why does your business do what it does? (Try to begin your answer with 'We believe...')",
    "What is the impact you want to make on the world?",
    "How will your business change the world?",
  ]},
  { title: "PERSONAS", questions: [
    "Who do you see as your target customer?",
    "How old are they?",
    "What is their gender?",
    "Where do they live?",
    "What is their income?",
    "What do they value most?",
    "What are their pet peeves?",
    "Where do they shop?",
    "What do they watch / listen to?",
    "Are there any other customers you think your brand will attract?",
    "How will you reach out to them? How will they reach out to you?",
  ]},
  { title: "VALUES", questions: [
    "How would you describe your company culture/values?",
    "What does your business stand for?",
    "What do you value in your employees?",
    "What's important to you as individuals?",
  ]},
  { title: "POSITIONING", questions: [
    "List up to 5 of your customers' main problems.",
    "List how you solve each of these problems.",
    "List the end benefits of your product/service for the customer.",
    "What are the primary sources of inspiration behind your brand and the work you share with the world?",
    "How do you want your incoming clients to feel when they visit or see your brand?",
    "Select 5 keywords to describe your business (ex. Cool, adventurous, scientific, lively, modern)",
    "What is the rationale for your business name?",
    "What is your brand story? (From Origin to Present to Future)",
  ]},
];

function AgencyPortal({ submissions, setSubmissions, currentUser }) {
  const [view, setView] = useState("form"); // "form" | "results"
  const [formData, setFormData] = useState(() => {
    const answers = {};
    HC_SECTIONS.forEach((sec, si) => sec.questions.forEach((_, qi) => { answers[`${si}-${qi}`] = ""; }));
    return { name: currentUser?.name || "", email: "", business: "Curador Brands", answers };
  });
  const [selectedSub, setSelectedSub] = useState(null);

  const updateAnswer = (key, val) => setFormData(p => ({ ...p, answers: { ...p.answers, [key]: val } }));
  const totalQuestions = HC_SECTIONS.reduce((s, sec) => s + sec.questions.length, 0);
  const answeredCount = Object.values(formData.answers).filter(a => a.trim()).length;

  const submitForm = () => {
    if (!formData.name.trim()) return;
    setSubmissions(p => [...p, { id: `sub-${Date.now()}`, ...formData, submittedAt: new Date().toISOString() }]);
    setView("results");
    // Reset form
    const answers = {};
    HC_SECTIONS.forEach((sec, si) => sec.questions.forEach((_, qi) => { answers[`${si}-${qi}`] = ""; }));
    setFormData({ name: currentUser?.name || "", email: "", business: "Curador Brands", answers });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>Agency Portal</div>
            <div style={{ fontFamily: "var(--df)", fontSize: 26, fontWeight: 300, color: "var(--text)" }}>Headchange Strategy Homework</div>
          </div>
          <div style={{ display: "flex", gap: 2, padding: 2, background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <button onClick={() => setView("form")} style={{ padding: "5px 14px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", background: view === "form" ? "var(--gold-dim)" : "transparent", color: view === "form" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Fill Out Form</button>
            <button onClick={() => setView("results")} style={{ padding: "5px 14px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer", background: view === "results" ? "var(--gold-dim)" : "transparent", color: view === "results" ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--bf)", fontWeight: 600 }}>Results ({submissions.length})</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {view === "form" ? (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
            {/* Identity */}
            <div style={{ padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 24, borderLeft: "3px solid var(--gold)" }}>
              <div className="frow">
                <div className="ff"><label className="fl">Your Name *</label><input className="fi" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="ff"><label className="fl">Email</label><input className="fi" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="ff"><label className="fl">Business Name</label><input className="fi" value={formData.business} onChange={e => setFormData(p => ({ ...p, business: e.target.value }))} /></div>
            </div>

            {/* Progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--surface2)", overflow: "hidden" }}>
                <div style={{ width: `${(answeredCount / totalQuestions) * 100}%`, height: "100%", background: "var(--gold)", borderRadius: 3, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{answeredCount}/{totalQuestions}</span>
            </div>

            {/* Sections */}
            {HC_SECTIONS.map((sec, si) => (
              <div key={si} style={{ marginBottom: 28, padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, borderLeft: "3px solid var(--gold)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>{sec.title}</div>
                {sec.questions.map((q, qi) => (
                  <div key={qi} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: 6 }}>{qi + 1}. {q}</div>
                    <textarea value={formData.answers[`${si}-${qi}`] || ""} onChange={e => updateAnswer(`${si}-${qi}`, e.target.value)}
                      placeholder="Your answer..."
                      style={{ width: "100%", minHeight: 70, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontSize: 13, fontFamily: "var(--bf)", outline: "none", resize: "vertical", lineHeight: 1.65 }} />
                  </div>
                ))}
              </div>
            ))}

            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 40px", gap: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>{answeredCount}/{totalQuestions} answered</span>
              <button className="btn btn-gold" style={{ fontSize: 13, padding: "10px 28px" }} disabled={!formData.name.trim()} onClick={submitForm}>Submit Homework</button>
            </div>
          </div>
        ) : (
          /* Results view */
          <div style={{ padding: "24px" }}>
            {submissions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 40px" }}>
                <div style={{ fontSize: 40, opacity: .3, marginBottom: 16 }}>📋</div>
                <div style={{ fontFamily: "var(--df)", fontSize: 22, fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>No Submissions Yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Switch to "Fill Out Form" to submit your answers.</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 20 }}>
                {/* Left — submission list */}
                <div style={{ width: 260, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 10 }}>Submissions ({submissions.length})</div>
                  {submissions.map((sub, i) => (
                    <button key={sub.id} onClick={() => setSelectedSub(i)} style={{
                      display: "block", width: "100%", padding: "12px 14px", borderRadius: 10, marginBottom: 6, cursor: "pointer", textAlign: "left", fontFamily: "var(--bf)", transition: "all .13s",
                      border: `1px solid ${selectedSub === i ? "rgba(184,150,58,.3)" : "var(--border)"}`,
                      background: selectedSub === i ? "var(--gold-dim)" : "var(--surface)",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: selectedSub === i ? "var(--gold)" : "var(--text)" }}>{sub.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sub.email || "No email"} · {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{Object.values(sub.answers).filter(a => a.trim()).length}/{totalQuestions} answered</div>
                    </button>
                  ))}
                </div>
                {/* Right — selected submission */}
                <div style={{ flex: 1 }}>
                  {selectedSub !== null && submissions[selectedSub] ? (() => {
                    const sub = submissions[selectedSub];
                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <div>
                            <div style={{ fontFamily: "var(--df)", fontSize: 24, fontWeight: 300, color: "var(--text)" }}>{sub.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub.email} · {sub.business} · {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-sm" onClick={() => {
                              let text = `HEADCHANGE STRATEGY HOMEWORK\n${sub.name} · ${sub.email} · ${sub.business}\nSubmitted: ${new Date(sub.submittedAt).toLocaleDateString()}\n\n`;
                              HC_SECTIONS.forEach((sec, si) => { text += `\n${sec.title}\n${"─".repeat(40)}\n`; sec.questions.forEach((q, qi) => { text += `\n${qi+1}. ${q}\n${sub.answers[`${si}-${qi}`] || "(no answer)"}\n`; }); });
                              const blob = new Blob([text], { type: "text/plain" });
                              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${sub.name.replace(/\s+/g, "_")}_HC_Strategy.txt`; a.click();
                            }}>Download</button>
                            <button className="btn btn-sm" style={{ borderColor: "rgba(224,123,106,.3)", color: "#e07b6a" }} onClick={() => { if (confirm(`Delete ${sub.name}'s submission?`)) { setSubmissions(p => p.filter((_, j) => j !== selectedSub)); setSelectedSub(null); } }}>Delete</button>
                          </div>
                        </div>
                        {HC_SECTIONS.map((sec, si) => (
                          <div key={si} style={{ marginBottom: 24, padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, borderLeft: "3px solid var(--gold)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>{sec.title}</div>
                            {sec.questions.map((q, qi) => (
                              <div key={qi} style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>{qi + 1}. {q}</div>
                                <div style={{ fontSize: 13, color: sub.answers[`${si}-${qi}`] ? "var(--text)" : "var(--text-muted)", lineHeight: 1.65, padding: "6px 0", fontStyle: sub.answers[`${si}-${qi}`] ? "normal" : "italic" }}>
                                  {sub.answers[`${si}-${qi}`] || "(no answer)"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </>
                    );
                  })() : (
                    <div style={{ textAlign: "center", padding: "60px 40px", color: "var(--text-muted)", fontSize: 13 }}>Select a submission to view.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

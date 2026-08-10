// ui-live-polish.js
// Dashboard UX : une seule source visuelle pour l'identité, l'état, les notifications et les statistiques.

const COUNTRY_FLAGS = { France:'🇫🇷',Espagne:'🇪🇸',Spain:'🇪🇸',Allemagne:'🇩🇪',Germany:'🇩🇪',Angleterre:'🇬🇧',England:'🇬🇧',Italie:'🇮🇹',Italy:'🇮🇹',Portugal:'🇵🇹',Brésil:'🇧🇷',Brazil:'🇧🇷',Argentine:'🇦🇷',Argentina:'🇦🇷',Belgique:'🇧🇪',PaysBas:'🇳🇱','Pays-Bas':'🇳🇱',Netherlands:'🇳🇱',Maroc:'🇲🇦',Morocco:'🇲🇦',Sénégal:'🇸🇳',Senegal:'🇸🇳','Côte d’Ivoire':'🇨🇮',Cameroun:'🇨🇲',Cameroon:'🇨🇲',Nigeria:'🇳🇬','États-Unis':'🇺🇸',USA:'🇺🇸',Canada:'🇨🇦',Japon:'🇯🇵',Japan:'🇯🇵','Corée du Sud':'🇰🇷',Korea:'🇰🇷'};
const firstValue=(...v)=>v.find(x=>x!==undefined&&x!==null&&String(x).trim()!=='');
function stat(s,keys){for(const k of keys){const n=Number(s?.[k]);if(Number.isFinite(n))return n;}return 0;}
function flag(p){const d=p?.countryFlag||p?.nationalityFlag||p?.flag;if(d&&String(d).length<=4)return d;const c=p?.countryCode||p?.nationalityCode||p?.nationCode;if(typeof c==='string'&&/^[A-Za-z]{2}$/.test(c))return [...c.toUpperCase()].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join('');const n=p?.country?.name||p?.country||p?.nationality||p?.nation;return typeof n==='string'?(COUNTRY_FLAGS[n]||''):'';}
function potentialStars(v){const n=Number(v);if(!Number.isFinite(n))return '☆☆☆☆☆';const c=Math.max(1,Math.min(5,Math.ceil(n/20)));return '★'.repeat(c)+'☆'.repeat(5-c);}
function academyStars(p){return firstValue(p?.academyStars,p?.trainingCenterStars,p?.trainingCentreStars,p?.formationCenterStars,p?.academyRating,p?.trainingCenterRating,p?.trainingCentreRating)??3;}
function academyText(v){const n=Number(v),c=Number.isFinite(n)?Math.max(0,Math.min(5,Math.round(n))):3;return '★'.repeat(c)+'☆'.repeat(5-c);}
function league(p,s){const l=p?.league;const x=firstValue(p?.championshipName,p?.championship,p?.leagueName,typeof l==='object'?l?.name:l,p?.competitionName,s?.club?.league?.name,s?.club?.championship?.name,s?.team?.league?.name,s?.team?.championship?.name,s?.currentLeague?.name,s?.competition?.name);if(x)return x;const c=String(p?.club||'').toLowerCase();if(c.includes('bordeaux'))return 'Ligue 2 BKT';if(c.includes('nuremberg')||c.includes('nürnberg'))return '2. Bundesliga';return '';}
function contract(p){return `${firstValue(p?.youthLevel,p?.teamLevel,p?.academyLevel,p?.category)||'U15'} · ${firstValue(p?.contractType,p?.contractName,p?.contract?.type)||'Contrat jeune'}`;}
function rating(s){const n=stat(s,['averageRating','average_rating','ratingAverage','avgRating','rating']);return n>0?n.toFixed(1):'—';}
function careerStats(p){const s=p?.stats||{},pos=String(p?.position||p?.positionId||'').toUpperCase(),m=stat(s,['matches','matchesPlayed','appearances','games']),a=stat(s,['assists','passesDecisives']),g=stat(s,['goals','buts']),t=stat(s,['tackles','tacles']),cs=stat(s,['cleanSheets','clean_sheets','cleanSheet','cleanSheetsCount']);if(['GK','GB','G'].includes(pos))return [['MATCHS',m],['CLEAN SHEETS',cs],['NOTE MOY.',rating(s)]];if(['DC','CB','DD','RB','DG','LB'].includes(pos))return [['MATCHS',m],['TACLES',t],['PASSES D.',a],['NOTE MOY.',rating(s)]];return [['MATCHS',m],['BUTS',g],['PASSES D.',a],['NOTE MOY.',rating(s)]];}
function loadStyles(){const id='street-live-polish-css',old=document.getElementById(id);if(old)old.remove();const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href='./ui-live-polish.css?v=11';document.head.appendChild(l);}
function ensureIdentity(widget,player,state){
    const old=widget.querySelector('.player-main-info');if(old)old.style.display='none';
    const badge=widget.querySelector('.player-image-badge');if(badge)badge.remove();
    let info=widget.querySelector('.live-identity-block');
    if(!info){info=document.createElement('div');info.className='live-identity-block';const anchor=widget.querySelector('.player-card-banner');if(anchor)anchor.insertAdjacentElement('afterend',info);else widget.prepend(info);}
    const name=`${player.firstname||player.firstName||''} ${player.lastname||player.lastName||''}`.trim()||'Joueur';
    const f=flag(player),pos=player.position||player.positionId||'—',shirtNumber=firstValue(player.number,player.shirtNumber,player.jerseyNumber);
    const nextHTML=`<div class="live-player-name-line"><span class="live-player-flag">${f}</span><span class="live-player-name">${name}</span></div><div class="live-player-position-row"><span class="live-player-position">${pos}</span><span class="live-player-age">${player.age??'—'} ans</span></div><div class="live-club-line">${player.club||'Sans club'}</div>${league(player,state)?`<div class="live-league-line">${league(player,state)}</div>`:''}<div class="live-academy-line"><span>Centre de formation</span><span class="live-academy-stars">${academyText(academyStars(player))}</span></div><div class="live-contract-line">${contract(player)}</div><div class="live-shirt-line">Numéro maillot : ${shirtNumber??'—'}</div>`;
    if(info.innerHTML!==nextHTML) info.innerHTML=nextHTML;
    widget.querySelectorAll('.widget-secret-tag,.player-secret,.player-balance,.balance-widget,.dashboard-career-stats,.career-stats,.player-career-stats,.career-stat-row').forEach(e=>e.remove());
    [...widget.children].forEach(e=>{if(e===info)return;const t=(e.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t.startsWith('centre de formation'))e.remove();if(t.includes('matchs')&&t.includes('note moy.'))e.remove();});
}
function renderNotifications(screen,state){
    let zone=screen.querySelector('.dashboard-notification-zone');
    if(!zone){zone=document.createElement('section');zone.className='dashboard-notification-zone';const apps=screen.querySelector('.apps-grid');if(apps)apps.parentNode.insertBefore(zone,apps);}
    const signals=(state?.notifications?.signals||[]).filter(n=>!n.archived&&!n.read).slice(-3).reverse();
    const key=signals.map(n=>n.id).join('|');
    if(zone.dataset.renderKey===key)return;
    zone.dataset.renderKey=key;
    zone.innerHTML='';
    if(!signals.length){zone.classList.add('is-empty');return;}
    zone.classList.remove('is-empty');
    zone.innerHTML=`<div class="live-notification-heading">Notifications</div><div class="live-notification-list"></div>`;
    const list=zone.querySelector('.live-notification-list');
    signals.forEach(note=>{const card=document.createElement('article');card.className='dashboard-notification-card';card.dataset.notificationId=note.id;const icon=note.category==='famille'?'👶':note.category==='mercato'?'⚽':'•';card.innerHTML=`<span class="notification-icon">${icon}</span><div><strong>${note.title||'Notification'}</strong><p>${note.body||''}</p></div>`;list.appendChild(card);card.addEventListener('click',()=>{const signal=state?.notifications?.signals?.find(n=>n.id===note.id);if(signal){signal.read=true;state.notifications.unreadCount=Math.max(0,(state.notifications.unreadCount||0)-1);card.classList.add('is-read');zone.dataset.renderKey='';}});});
}
function enhance(){const app=document.getElementById('app'),state=window.UI?.engine?.state,screen=app?.querySelector('.phone-home-screen'),widget=screen?.querySelector('.player-widget-enhanced');if(!screen||!widget||!state?.player)return;const p=state.player;ensureIdentity(widget,p,state);
    const grid=widget.querySelector('.widget-stats-grid');
    if(grid){const signature=JSON.stringify([p.overall,p.potential,p.fitness,p.morale,JSON.stringify(p.stats||{}),p.position]);if(grid.dataset.liveSignature!==signature){grid.className='widget-stats-grid live-core-stats';grid.innerHTML=`<div class="stat-pill"><span>GEN</span><strong>${p.overall??'—'}</strong></div><div class="stat-pill"><span>POTENTIEL</span><strong class="live-potential-stars">${potentialStars(p.potential)}</strong></div><div class="stat-pill"><span>FORME</span><strong>${p.fitness??'—'}</strong></div><div class="stat-pill"><span>MORAL</span><strong>${p.morale??'—'}</strong></div>`;widget.querySelectorAll('.live-career-stats').forEach(e=>e.remove());const c=document.createElement('div');c.className='live-career-stats';c.innerHTML=careerStats(p).map(([l,v])=>`<div class="live-career-stat"><span>${l}</span><strong>${v}</strong></div>`).join('');grid.insertAdjacentElement('afterend',c);grid.dataset.liveSignature=signature;}}
    renderNotifications(screen,state);
    const apps=screen.querySelector('.apps-grid');if(!apps)return;let heading=screen.querySelector('.live-section-title');if(!heading){heading=document.createElement('div');heading.className='live-section-title';heading.innerHTML='<span>Applications</span>';apps.parentNode.insertBefore(heading,apps);}const advance=screen.querySelector('#play-block-btn');if(advance){advance.textContent=p.careerEnded?'Carrière terminée':'Avancer';advance.classList.add('app-advance-icon');if(advance.parentNode!==apps)apps.appendChild(advance);}
}
let styleLoaded=false;const observer=new MutationObserver(()=>{if(enhance.scheduled)return;enhance.scheduled=true;requestAnimationFrame(()=>{enhance.scheduled=false;enhance();});});function start(){if(!styleLoaded){loadStyles();styleLoaded=true;}const app=document.getElementById('app')||document.body;observer.observe(app,{childList:true,subtree:true});requestAnimationFrame(enhance);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

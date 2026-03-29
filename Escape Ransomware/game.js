'use strict';

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let STATE = {
  current: 0,
  completed: new Set(),
  codeDigits: ['?','?','?','?'],
  timerSec: 60 * 60,
  timerInterval: null,
  paused: false,
  score: 0,
  wrongAttempts: {} // enigmaIdx -> count
};

const PENALTY_SEC = 300; // 5 minutes per wrong answer

// ═══════════════════════════════════════════════════════
// 25 ENIGMAS — accessibles à tous, fondamentaux sécu
// ═══════════════════════════════════════════════════════
const ENIGMAS = [

// ── 1 ─────────────────────────────────────────────────
{
  id:1, phase:"ACTE I — L'INTRUSION",
  title:"Le Mail du Président",
  subtitle:"Identifier un email frauduleux",
  story:`Il est <strong>08h47</strong>. Vous venez d'arriver au bureau. Un email marqué URGENT arrive dans votre boîte pro. Il prétend venir du <strong>Directeur Général</strong> et demande un virement de <strong>24 850 €</strong> avant 17h. Sandra, votre collègue, est sur le point de cliquer.`,
  visual:`<div class="visual-container"><div class="email-mockup">
    <div class="email-header">
      <div class="email-field"><span class="email-field-label">De :</span><span class="email-field-val sus">direction@groupe-verixa.net</span></div>
      <div class="email-field"><span class="email-field-label">À :</span><span class="email-field-val">equipe@votre-entreprise.fr</span></div>
      <div class="email-subject">⚠ URGENT — Virement fournisseur IT avant 17h AUJOURD'HUI</div>
    </div>
    <div class="email-body">
      Bonjour,<br><br>
      Suite à notre réunion de ce matin — à laquelle vous n'étiez pas convié pour des raisons de confidentialité — je vous demande d'effectuer un virement urgent.<br><br>
      <strong>Montant :</strong> 24 850 € &nbsp;|&nbsp; <strong>Bénéficiaire :</strong> GR1MF0X Solutions<br>
      <strong>IBAN :</strong> FR76 3000 6000 0112 3456 7890 189<br><br>
      <em>⚠ NE PAS en parler en interne — accord de confidentialité.</em><br><br>
      Jean-Pierre MOREAU — Directeur Général
    </div>
  </div></div>`,
  question:"Quel est le signal d'alarme le plus évident dans cet email ?",
  options:[
    {t:"L'email est envoyé depuis direction@groupe-verixa.net — le domaine est différent du domaine habituel de l'entreprise.", c:true},
    {t:"Le montant de 24 850 € est suspect car c'est un chiffre inhabituel.", c:false},
    {t:"Le directeur ne devrait jamais envoyer d'email directement aux équipes.", c:false},
    {t:"L'email ne contient pas de pièce jointe, ce qui est étrange pour un virement.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. L'adresse email est le premier signal à vérifier. Ici, le domaine .net est différent du .fr habituel — c'est un faux domaine créé pour imiter le vrai. L'urgence, le secret et la réunion fictive sont aussi des signaux d'alarme classiques du phishing.",
    ko:"Ce n'est pas la bonne piste. Regardez attentivement l'adresse email complète de l'expéditeur — pas juste le nom affiché. Les hackers utilisent des domaines très proches du vrai pour tromper."
  },
  hint:"Comparez l'adresse email complète de l'expéditeur avec le domaine habituel de l'entreprise.",
  lesson:"Vérifiez toujours l'adresse email complète, pas seulement le nom affiché. Un seul caractère différent révèle le phishing."
},

// ── 2 ─────────────────────────────────────────────────
{
  id:2, phase:"ACTE I — L'INTRUSION",
  title:"L'Urgence Fabriquée",
  subtitle:"Reconnaître les techniques de manipulation",
  story:`Sandra hésite. L'email dit qu'elle a <strong>raté une réunion importante</strong> et que chaque minute perdue coûte de l'argent à l'entreprise. Elle se sent coupable et pressée. C'est exactement ce que veulent les hackers.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--gray);letter-spacing:.2em;font-family:var(--display);margin-bottom:.75rem">TECHNIQUES DE MANIPULATION DANS CET EMAIL</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.7rem;background:rgba(255,32,32,.08);border-left:2px solid var(--red);color:var(--white)"><strong style="color:var(--red)">Urgence :</strong> "avant 17h AUJOURD'HUI" → vous empêche de réfléchir</div>
      <div style="padding:.7rem;background:rgba(255,32,32,.08);border-left:2px solid var(--red);color:var(--white)"><strong style="color:var(--red)">Culpabilité :</strong> "réunion à laquelle vous n'étiez pas convié" → vous met en faute</div>
      <div style="padding:.7rem;background:rgba(255,32,32,.08);border-left:2px solid var(--red);color:var(--white)"><strong style="color:var(--red)">Isolation :</strong> "NE PAS en parler en interne" → vous empêche de demander de l'aide</div>
      <div style="padding:.7rem;background:rgba(255,32,32,.08);border-left:2px solid var(--red);color:var(--white)"><strong style="color:var(--red)">Autorité :</strong> message prétendument du DG → vous intimide</div>
      <div style="padding:.7rem;background:rgba(0,255,65,.08);border-left:2px solid var(--green);color:var(--white)"><strong style="color:var(--green)">Règle d'or :</strong> Plus on vous presse, plus il faut ralentir et vérifier.</div>
    </div>
  </div>`,
  question:"Vous recevez un email urgent demandant un virement. Quelle est la bonne réaction ?",
  options:[
    {t:"Agir vite car l'email vient du DG et chaque minute compte.", c:false},
    {t:"Appeler le DG sur son numéro habituel (pas celui donné dans l'email) pour confirmer la demande avant tout paiement.", c:true},
    {t:"Répondre à l'email pour demander confirmation écrite.", c:false},
    {t:"Transférer l'email au service comptabilité qui saura quoi faire.", c:false}
  ],
  feedback:{
    ok:"✓ Correct. Toujours vérifier par un canal indépendant — appel téléphonique sur le numéro officiel, jamais celui fourni dans l'email suspect. Une vraie urgence légitime résiste toujours à 2 minutes de vérification. Répondre à l'email revient à écrire au hacker directement.",
    ko:"Ce n'est pas la meilleure approche. L'urgence est fabriquée pour vous empêcher de vérifier. La seule bonne réaction : appeler la personne concernée sur son numéro habituel, jamais via l'email suspect."
  },
  hint:"Si quelqu'un vous demande de l'argent en urgence, comment vérifier sans utiliser les coordonnées fournies dans le message ?",
  lesson:"Face à toute demande urgente par email : vérifiez par téléphone sur le numéro officiel. Ne répondez jamais à l'email suspect."
},

// ── 3 ─────────────────────────────────────────────────
{
  id:3, phase:"ACTE I — L'INTRUSION",
  title:"Le Mot de Passe Trop Simple",
  subtitle:"Comprendre la force d'un mot de passe",
  codeIndex:0, codeDigit:"7",
  story:`Sandra a cliqué sur le lien. En arrière-plan, GR1MF0X a aussi testé des mots de passe sur le compte admin de l'entreprise. En <strong>4 essais et 4 secondes</strong>, ils ont trouvé. Le mot de passe : <span class="hl">Verixa2026!</span>`,
  visual:`<div class="visual-container">
    <div class="log-window">
      <div class="log-line"><span class="log-time">08:12:01</span><span class="log-fail">ECHEC</span><span class="log-msg">admin → "password123"</span></div>
      <div class="log-line"><span class="log-time">08:12:02</span><span class="log-fail">ECHEC</span><span class="log-msg">admin → "Verixa2024"</span></div>
      <div class="log-line"><span class="log-time">08:12:03</span><span class="log-fail">ECHEC</span><span class="log-msg">admin → "Verixa2025!"</span></div>
      <div class="log-line"><span class="log-time">08:12:04</span><span class="log-ok" style="color:var(--red);font-weight:700">SUCCÈS</span><span class="log-msg" style="color:var(--red)">admin → "Verixa2026!" — ACCÈS ADMIN OUVERT</span></div>
    </div>
    <div style="padding:1rem;background:var(--bg3)">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.75rem">TEMPS POUR CRAQUER CES MOTS DE PASSE</div>
      <div class="pwd-row"><div><div class="pwd-label">Verixa2026!</div><div class="pwd-sub">Nom entreprise + année + !</div><div class="pwd-bar-wrap"><div class="pwd-bar-fill" style="width:15%;background:var(--red)"></div></div></div><div class="pwd-time" style="color:var(--red)">~3 heures</div></div>
      <div class="pwd-row"><div><div class="pwd-label">soleil-nuage-clavier-42</div><div class="pwd-sub">4 mots aléatoires (passphrase)</div><div class="pwd-bar-wrap"><div class="pwd-bar-fill" style="width:82%;background:var(--green)"></div></div></div><div class="pwd-time" style="color:var(--green)">+50 ans</div></div>
      <div class="pwd-row"><div><div class="pwd-label">K#9mP$xQ2!vL</div><div class="pwd-sub">Aléatoire dans un gestionnaire</div><div class="pwd-bar-wrap"><div class="pwd-bar-fill" style="width:97%;background:var(--green)"></div></div></div><div class="pwd-time" style="color:var(--green)">+200 ans</div></div>
    </div>
  </div>`,
  question:"Pourquoi 'Verixa2026!' est-il un mot de passe dangereux ?",
  options:[
    {t:"Il est trop court — un bon mot de passe doit faire au moins 20 caractères.", c:false},
    {t:"Il suit un schéma prévisible : nom de l'entreprise + année + symbole. Les hackers testent ces patterns en priorité.", c:true},
    {t:"Il contient le nom de l'entreprise, ce qui est interdit par la loi.", c:false},
    {t:"Il ne contient pas assez de chiffres.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. Les pirates utilisent des dictionnaires personnalisés : ils cherchent le nom de l'entreprise, l'année en cours, et ajoutent des symboles communs. Ce type de mot de passe se craque en quelques heures. Une passphrase (4 mots aléatoires) ou un mot de passe généré par un gestionnaire est bien plus solide.",
    ko:"Pas tout à fait. La longueur aide, mais le vrai problème c'est la prévisibilité. Les hackers savent que les gens utilisent le nom de leur entreprise et l'année — c'est même le premier pattern qu'ils testent."
  },
  hint:"Pensez à ce qu'un hacker essaierait en premier s'il connaît le nom de votre entreprise.",
  lesson:"Évitez les mots de passe prévisibles (nom + année + !). Utilisez une passphrase ou un gestionnaire de mots de passe.",
  codeReveal:"Premier chiffre du code débloqué : <span style='color:var(--green);font-family:var(--display);font-size:22px;font-weight:700'>7</span>"
},

// ── 4 ─────────────────────────────────────────────────
{
  id:4, phase:"ACTE I — L'INTRUSION",
  title:"La Double Vérification",
  subtitle:"Comprendre le MFA (authentification à deux facteurs)",
  story:`Le compte admin est compromis. Pourtant, une chose aurait pu tout bloquer : une option gratuite disponible sur presque tous les services. GR1MF0X avait le bon mot de passe — mais si la <strong>double authentification</strong> avait été activée, ça n'aurait pas suffi.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--gray);letter-spacing:.18em;font-family:var(--display);margin-bottom:.85rem">COMMENT FONCTIONNE LA DOUBLE AUTHENTIFICATION (MFA)</div>
    <div style="display:flex;flex-direction:column;gap:.75rem;font-family:var(--body);font-size:14px">
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--bg3);border:1px solid var(--border)">
        <div style="font-size:28px;flex-shrink:0">🔑</div>
        <div><strong style="color:var(--amber)">Étape 1 :</strong> Votre mot de passe (ce que vous connaissez)</div>
      </div>
      <div style="text-align:center;color:var(--gray);font-size:20px">+</div>
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--bg3);border:1px solid var(--border)">
        <div style="font-size:28px;flex-shrink:0">📱</div>
        <div><strong style="color:var(--green)">Étape 2 :</strong> Un code reçu sur votre téléphone (ce que vous possédez)</div>
      </div>
      <div style="padding:.75rem;background:rgba(0,255,65,.06);border:1px solid rgba(0,255,65,.25);border-left:3px solid var(--green);font-family:var(--body);font-size:14px;color:var(--white)">
        <strong style="color:var(--green)">Résultat :</strong> Même si un hacker vole votre mot de passe, il ne peut pas se connecter sans votre téléphone. Microsoft estime que le MFA bloque <strong>99,9%</strong> des attaques automatisées.
      </div>
    </div>
  </div>`,
  question:"Vous activez la double authentification (MFA) sur votre messagerie pro. Que se passe-t-il si un hacker obtient votre mot de passe ?",
  options:[
    {t:"Il peut quand même se connecter, le MFA ne protège que les données bancaires.", c:false},
    {t:"Il ne peut pas se connecter car il lui faudrait aussi le code envoyé sur votre téléphone.", c:true},
    {t:"Il peut se connecter mais seulement depuis votre pays.", c:false},
    {t:"Il est automatiquement bloqué et signalé à la police.", c:false}
  ],
  feedback:{
    ok:"✓ Exactement. Le MFA ajoute une barrière : même avec le bon mot de passe, il faut aussi le code à usage unique envoyé sur votre téléphone. Sans votre téléphone physique, le hacker est bloqué. C'est simple, gratuit sur la plupart des services, et extrêmement efficace.",
    ko:"Pas tout à fait. Le MFA fonctionne sur tous vos comptes en ligne — messagerie, réseaux sociaux, outils professionnels. Et il bloque effectivement l'accès même si le mot de passe est connu."
  },
  hint:"Si le hacker a votre mot de passe mais pas votre téléphone, que lui manque-t-il pour se connecter avec le MFA activé ?",
  lesson:"Activez le MFA (double authentification) sur tous vos comptes. C'est votre protection la plus efficace contre le vol de mot de passe."
},

// ── 5 ─────────────────────────────────────────────────
{
  id:5, phase:"ACTE II — LA PROPAGATION",
  title:"L'Appel du Faux Support",
  subtitle:"Reconnaître l'ingénierie sociale par téléphone",
  story:`Pendant que le ransomware se propage, un complice appelle le standard. Il dit s'appeler <strong>"Thomas du support informatique"</strong>. Il demande à parler à un employé pour "sécuriser son compte en urgence" et réclame le <strong>code SMS</strong> qu'il vient de recevoir.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div class="info-grid">
      <div class="info-box warn">
        <div class="info-title" style="color:var(--red)">CE QUE DIT LE HACKER</div>
        <div class="info-body">"Bonjour, c'est Thomas du support IT. J'ai une alerte sur votre compte. Pour le sécuriser, envoyez-moi le code SMS que vous venez de recevoir — c'est urgent, vous avez 2 minutes."</div>
      </div>
      <div class="info-box good">
        <div class="info-title" style="color:var(--green)">CE QUE VOUS DEVEZ SAVOIR</div>
        <div class="info-body">Le vrai support informatique ne vous demandera <strong>JAMAIS</strong> votre code SMS, votre mot de passe, ou tout autre code de sécurité. Jamais. Quelles que soient les circonstances.</div>
      </div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);margin-top:0;border-top:1px solid var(--border)">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:6px">POURQUOI DONNER LE CODE SMS EST CATASTROPHIQUE</div>
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7">Le code SMS est votre <strong>second facteur de sécurité</strong>. En le donnant, vous donnez vous-même les clés de votre compte au hacker — même si votre mot de passe est solide.</div>
    </div>
  </div>`,
  question:"Quelqu'un appelle et dit être du support IT. Il demande le code SMS que vous venez de recevoir. Que faites-vous ?",
  options:[
    {t:"Donner le code puisque l'appel semble professionnel et urgent.", c:false},
    {t:"Demander son matricule employé avant de donner le code.", c:false},
    {t:"Raccrocher immédiatement. Le vrai support IT ne demande jamais un code SMS. Signaler l'appel à votre responsable.", c:true},
    {t:"Donner seulement les 3 premiers chiffres du code pour vérifier si c'est légitime.", c:false}
  ],
  feedback:{
    ok:"✓ Parfait. Raccrocher sans hésiter est la seule bonne réponse. Le code SMS est votre protection — le donner revient à ouvrir vous-même la porte. Le matricule peut être inventé. Signaler l'appel permet à l'entreprise d'alerter les autres employés.",
    ko:"Ce n'est pas suffisant. Aucune partie du code ne doit être communiquée. Le matricule peut être inventé. La seule bonne réaction : raccrocher immédiatement. Le vrai support ne demande JAMAIS de code SMS."
  },
  hint:"Demandez-vous : est-ce que le vrai support IT aurait besoin de ce code pour faire son travail ?",
  lesson:"Le vrai support IT ne demande jamais votre code SMS ou mot de passe. Raccrochez et signalez l'appel immédiatement."
},

// ── 6 ─────────────────────────────────────────────────
{
  id:6, phase:"ACTE II — LA PROPAGATION",
  title:"Vos Données Personnelles Volées",
  subtitle:"Comprendre l'impact d'une fuite de données",
  codeIndex:1, codeDigit:"3",
  story:`En accédant aux systèmes RH, GR1MF0X a téléchargé les dossiers de <strong>1 247 employés</strong>. Parmi eux : le vôtre. Votre numéro de sécurité sociale, votre IBAN, votre adresse, vos informations médicales. Tout est maintenant en vente sur le dark web pour <strong>47 €</strong>.`,
  visual:`<div class="visual-container">
    <div class="pii-cards">
      <div class="pii-card leaked"><div class="pii-status leaked">CRITIQUE</div><div class="pii-icon">🪪</div><div class="pii-label">N° SÉCURITÉ SOCIALE</div><div class="pii-value">1 85 09 75 112...</div></div>
      <div class="pii-card leaked"><div class="pii-status leaked">CRITIQUE</div><div class="pii-icon">🏦</div><div class="pii-label">IBAN</div><div class="pii-value">FR76 3000 6000...</div></div>
      <div class="pii-card leaked"><div class="pii-status leaked">SENSIBLE</div><div class="pii-icon">⚕️</div><div class="pii-label">SANTÉ / ARRÊTS</div><div class="pii-value">3 arrêts en 2025</div></div>
      <div class="pii-card leaked"><div class="pii-status leaked">SENSIBLE</div><div class="pii-icon">📍</div><div class="pii-label">ADRESSE DOMICILE</div><div class="pii-value">12 rue des Acacias</div></div>
      <div class="pii-card leaked"><div class="pii-status leaked">CRITIQUE</div><div class="pii-icon">💰</div><div class="pii-label">SALAIRE</div><div class="pii-value">3 850 € / mois</div></div>
      <div class="pii-card safe"><div class="pii-status safe">FAIBLE</div><div class="pii-icon">📧</div><div class="pii-label">EMAIL PRO</div><div class="pii-value">j.martin@...</div></div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:6px">RGPD — VOS DROITS EN CAS DE FUITE</div>
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7">L'entreprise a <strong style="color:var(--red)">72 heures</strong> pour notifier la CNIL (autorité française de protection des données). Vous devez être informé si le risque pour vous est élevé.</div>
    </div>
  </div>`,
  question:"Vous apprenez que vos données personnelles (N° sécu, IBAN, adresse) ont fuité. Quelle est votre première action prioritaire ?",
  options:[
    {t:"Changer vos mots de passe sur tous vos sites et attendre de voir si quelque chose de suspect se produit.", c:false},
    {t:"Appeler votre banque pour les alerter et surveiller votre compte, contacter l'Assurance Maladie, et déposer plainte.", c:true},
    {t:"Aller sur le dark web pour vérifier si vos données sont vraiment en vente.", c:false},
    {t:"Ne rien faire si l'entreprise prend en charge la situation.", c:false}
  ],
  feedback:{
    ok:"✓ Correct. Alertez votre banque immédiatement : votre IBAN peut être utilisé pour des prélèvements frauduleux. Contactez l'Assurance Maladie : votre N° sécu permet d'usurper votre identité médicale. La plainte crée un dossier officiel utile si des crédits sont ouverts à votre nom. N'attendez pas.",
    ko:"Changer les mots de passe est utile mais insuffisant : vos données bancaires et administratives peuvent déjà être utilisées. Aller sur le dark web est dangereux. Attendre laisse le temps aux acheteurs de vos données d'agir contre vous."
  },
  hint:"Quelles institutions peuvent utiliser votre numéro de sécu ou votre IBAN pour créer des dossiers à votre nom ?",
  lesson:"En cas de fuite : alertez votre banque, l'Assurance Maladie, et déposez plainte. N'attendez pas — agissez dans les premières heures.",
  codeReveal:"Deuxième chiffre du code débloqué : <span style='color:var(--green);font-family:var(--display);font-size:22px;font-weight:700'>3</span>"
},

// ── 7 ─────────────────────────────────────────────────
{
  id:7, phase:"ACTE II — LA PROPAGATION",
  title:"Le SMS Piégé",
  subtitle:"Reconnaître un faux SMS (smishing)",
  story:`GR1MF0X envoie maintenant des SMS à tous les employés en utilisant les numéros volés. Un collègue vous montre son téléphone, l'air inquiet : il a reçu un message qui prétend que son <strong>compte Microsoft 365</strong> est compromis.`,
  visual:`<div class="visual-container" style="padding:1.25rem;display:flex;justify-content:center">
    <div class="phone-mockup">
      <div class="phone-top"><span>📶 SFR</span><span>10:23</span><span>🔋82%</span></div>
      <div style="background:var(--bg3);padding:5px 12px;text-align:center;font-size:11px;color:var(--gray)">+33 7 55 23 14 88 (Inconnu)</div>
      <div class="phone-screen">
        <div class="sms-bubble">
          <div class="sms-sender">Securite-IT</div>
          🔐 ALERTE — Votre compte Microsoft est compromis. Vérifiez maintenant :<br><br>
          <span class="sms-link">bit.ly/verif-compte-urgent</span><br><br>
          Sans action sous 15 min, votre accès sera suspendu.<br>— Équipe Sécurité
        </div>
        <div style="text-align:right;font-size:10px;color:var(--gray);margin-top:4px">10:23 ✓✓</div>
      </div>
    </div>
  </div>
  <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
    <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:6px">SIGNAUX D'ALARME DANS CE SMS</div>
    <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.8">
      ⚠ Expéditeur inconnu | ⚠ Urgence artificielle (15 min) | ⚠ Lien raccourci (bit.ly) qui cache la vraie destination | ⚠ Jamais Microsoft ne vous contacte par SMS pour cela
    </div>
  </div>`,
  question:"Votre collègue demande s'il doit cliquer sur le lien du SMS. Que lui conseillez-vous ?",
  options:[
    {t:"Cliquer depuis un navigateur sécurisé pour vérifier si le site semble légitime.", c:false},
    {t:"Ne pas cliquer. Pour vérifier son compte Microsoft, ouvrir le navigateur et aller directement sur office.com en tapant l'adresse à la main.", c:true},
    {t:"Appeler le numéro qui a envoyé le SMS pour confirmer.", c:false},
    {t:"Transférer le SMS au service IT avant de cliquer.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. La seule façon sûre de vérifier un compte : ouvrir le navigateur et taper soi-même l'adresse officielle (office.com, ou le portail de votre entreprise). Ne jamais cliquer sur un lien reçu par SMS ou email. Le numéro expéditeur peut être usurpé.",
    ko:"Pas la bonne approche. 'Sécurisé' ne protège pas contre les sites de phishing. Appeler le numéro expéditeur revient à appeler le hacker. Transférer prend du temps et votre collègue pourrait cliquer entre-temps."
  },
  hint:"Si quelqu'un vous dit que votre compte est compromis, comment le vérifier sans passer par leur lien ?",
  lesson:"Ne jamais cliquer sur un lien reçu par SMS. Tapez toujours l'adresse du site directement dans votre navigateur."
},

// ── 8 ─────────────────────────────────────────────────
{
  id:8, phase:"ACTE II — LA PROPAGATION",
  title:"La Clé USB du Parking",
  subtitle:"Reconnaître le piège physique",
  story:`Ce matin, avant l'attaque, une clé USB avait été trouvée dans le parking de l'entreprise. L'étiquette indiquait : <em>"SALAIRES 2026 — CONFIDENTIEL"</em>. La curiosité a fait le reste : un employé l'a branchée sur son poste "juste pour voir à qui elle appartient". En <strong>6 secondes</strong>, le ransomware était installé.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="text-align:center;margin-bottom:1.25rem">
      <div style="font-size:56px;margin-bottom:.5rem">💾</div>
      <div style="font-family:var(--mono);font-size:12px;color:var(--red)">SALAIRES_2026_CONFIDENTIEL.xlsx</div>
      <div style="font-size:11px;color:var(--gray);margin-top:4px">Trouvée dans le parking de l'entreprise</div>
    </div>
    <div class="log-window" style="font-size:12px">
      <div class="log-line"><span class="log-time">08:31:02</span><span class="log-warn">USB</span><span class="log-msg">Clé détectée et reconnue</span></div>
      <div class="log-line"><span class="log-time">08:31:03</span><span class="log-fail">AUTO</span><span class="log-msg">Programme caché lancé automatiquement</span></div>
      <div class="log-line"><span class="log-time">08:31:08</span><span class="log-fail">INFECT</span><span class="log-msg">Poste compromis. Backdoor installée.</span></div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);margin-top:0;border-top:1px solid var(--border)">
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7">GR1MF0X dépose intentionnellement des clés piégées dans des lieux stratégiques. Le programme malveillant s'installe <strong>automatiquement dès la connexion</strong> — sans même ouvrir le fichier.</div>
    </div>
  </div>`,
  question:"Vous trouvez une clé USB dans le couloir de votre bureau. Que faites-vous ?",
  options:[
    {t:"La brancher sur un ordinateur personnel (pas pro) pour regarder ce qu'il y a dedans.", c:false},
    {t:"La remettre au service informatique sans la brancher, en indiquant où vous l'avez trouvée.", c:true},
    {t:"Lancer une analyse antivirus dessus avant de l'ouvrir.", c:false},
    {t:"La jeter à la poubelle pour éviter que quelqu'un d'autre la branche.", c:false}
  ],
  feedback:{
    ok:"✓ C'est la seule bonne réponse. Ne jamais brancher une clé USB inconnue — ni sur un PC pro, ni sur un PC perso. Le programme malveillant s'installe automatiquement, avant même l'ouverture d'un fichier. Le service IT peut analyser la clé en toute sécurité. Signaler l'endroit aide à savoir si d'autres clés ont été déposées.",
    ko:"Aucun ordinateur n'est à l'abri. Le programme malveillant s'installe automatiquement, avant même que vous ouvriez quoi que ce soit. L'antivirus peut rater les menaces très récentes. Jeter la clé détruit des preuves et ne prévient pas l'entreprise."
  },
  hint:"Que se passe-t-il dans les logs au moment où la clé est branchée — avant même qu'un fichier soit ouvert ?",
  lesson:"Ne branchez jamais une clé USB inconnue. Remettez-la directement au service IT sans la connecter à quoi que ce soit."
},

// ── 9 ─────────────────────────────────────────────────
{
  id:9, phase:"ACTE II — LA PROPAGATION",
  title:"Le WiFi du Café",
  subtitle:"Les risques des réseaux WiFi publics",
  story:`Un collaborateur travaillait depuis un café ce matin. Il avait besoin d'envoyer un document confidentiel en urgence. Il a utilisé le WiFi gratuit du café. Ce qu'il ne savait pas : GR1MF0X avait créé un <strong>faux réseau WiFi</strong> portant un nom très similaire au vrai.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div class="info-grid">
      <div class="info-box good">
        <div class="info-title" style="color:var(--green)">RÉSEAU LÉGITIME DU CAFÉ</div>
        <div class="info-body" style="font-family:var(--mono);font-size:13px">📶 CafeParis_WiFi</div>
      </div>
      <div class="info-box warn">
        <div class="info-title" style="color:var(--red)">FAUX RÉSEAU (GR1MF0X)</div>
        <div class="info-body" style="font-family:var(--mono);font-size:13px">📶 <span style="color:var(--red)">CafeParis_WiFi_5G</span></div>
      </div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:6px">CE QUE PEUT VOIR LE HACKER</div>
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.8">Sur un réseau WiFi public ou compromis, tout ce que vous envoyez peut être intercepté : emails, fichiers, identifiants de connexion. <strong>Le cadenas HTTPS</strong> protège certains sites, mais pas toutes vos communications.</div>
    </div>
    <div style="padding:.85rem;background:rgba(0,255,65,.05);border-top:1px solid var(--border)">
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7"><strong style="color:var(--green)">La solution :</strong> Le VPN d'entreprise crée un "tunnel" chiffré. Même si quelqu'un intercepte votre connexion, il ne voit qu'un message illisible.</div>
    </div>
  </div>`,
  question:"Vous devez travailler depuis un café et envoyer un document confidentiel. Que faites-vous ?",
  options:[
    {t:"Utiliser le WiFi du café mais uniquement des sites avec HTTPS (cadenas dans le navigateur).", c:false},
    {t:"Activer le VPN de votre entreprise avant de vous connecter, et ne jamais envoyer de données sensibles sans VPN.", c:true},
    {t:"Créer un hotspot depuis votre téléphone personnel plutôt que d'utiliser le WiFi public.", c:false},
    {t:"Utiliser la navigation privée du navigateur pour rester anonyme.", c:false}
  ],
  feedback:{
    ok:"✓ Correct. Le VPN est la protection adaptée en dehors du bureau. Il chiffre toutes vos communications, rendant vos données illisibles même si quelqu'un les intercepte. Partager sa connexion 4G (option B) est aussi acceptable et souvent plus sûr — mais le VPN est la solution professionnelle recommandée.",
    ko:"HTTPS protège les sites web mais pas toutes vos applications. La navigation privée n'ajoute aucun chiffrement. Le hotspot perso est une alternative acceptable mais le VPN est la solution professionnelle. Demandez à votre service IT comment installer le VPN de l'entreprise."
  },
  hint:"Quelle technologie crée un tunnel chiffré qui protège toutes vos communications, pas seulement les sites web ?",
  lesson:"Utilisez toujours le VPN de votre entreprise sur un réseau WiFi public. Si vous n'en avez pas, utilisez votre connexion 4G personnelle."
},

// ── 10 ────────────────────────────────────────────────
{
  id:10, phase:"ACTE III — LE RANSOMWARE",
  title:"Le Cadenas sur les Fichiers",
  subtitle:"Comprendre ce qu'est un ransomware",
  codeIndex:2, codeDigit:"9",
  story:`C'est arrivé. À 09h03, tous les écrans de l'entreprise affichent le même message rouge. Les fichiers sont chiffrés — comme si quelqu'un avait mis un cadenas sur chaque document et avait jeté la clé. <strong>GR1MF0X exige 500 000 € en Bitcoin</strong> pour rendre accès.`,
  visual:`<div class="visual-container">
    <div style="background:#0a0000;border:2px solid var(--red);padding:1.5rem;text-align:center;font-family:var(--mono)">
      <div style="font-size:clamp(14px,3vw,20px);color:var(--red);font-weight:700;margin-bottom:.85rem;animation:blink 1s step-end infinite">⚠ VOS FICHIERS SONT CHIFFRÉS ⚠</div>
      <div style="font-size:12px;color:#ff6666;line-height:2;text-align:left;max-width:460px;margin:0 auto 1.25rem">
        Tous vos documents, photos et bases de données ont été verrouillés.<br>
        Sans notre clé, ils sont définitivement inaccessibles.<br><br>
        RANÇON : 500 000 € en Bitcoin<br>
        DÉLAI : 48 heures — après : rançon doublée<br>
        Fichiers concernés : rapport-annuel.pdf → rapport-annuel.blackout<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;client-database.xlsx → client-database.blackout
      </div>
      <div style="font-size:26px;color:var(--red);font-family:var(--display)">47:58:32</div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7"><strong style="color:var(--amber)">Qu'est-ce que le chiffrement ?</strong> C'est comme mettre vos fichiers dans un coffre-fort dont seul le hacker a la clé. Vos fichiers existent encore mais sont totalement illisibles.</div>
    </div>
  </div>`,
  question:"L'entreprise reçoit la demande de rançon. Payer est-il la bonne décision ?",
  options:[
    {t:"Oui, c'est le moyen le plus rapide de récupérer les données.", c:false},
    {t:"Non — payer ne garantit pas la récupération des données, finance les hackers, et fait de vous une cible pour de futures attaques.", c:true},
    {t:"Oui, mais seulement si l'assurance cyber couvre le paiement.", c:false},
    {t:"Oui, si les sauvegardes ne permettent pas de tout récupérer.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. L'ANSSI (agence nationale de cybersécurité) recommande de ne jamais payer. Raisons : 80% des entreprises qui paient sont ré-attaquées dans l'année car elles sont désormais identifiées comme 'payantes'. Aucune garantie que les fichiers seront vraiment déchiffrés. La solution : des sauvegardes récentes et déconnectées du réseau.",
    ko:"Payer ne résout pas le problème. Les hackers ne respectent pas leurs promesses dans de nombreux cas, et payer vous cible comme victime 'fiable' pour de futures attaques. L'ANSSI recommande formellement de ne pas payer."
  },
  hint:"Que se passe-t-il si une entreprise est connue pour payer les rançons ?",
  lesson:"Ne jamais payer une rançon. Signalez à l'ANSSI et aux autorités. La prévention (sauvegardes offline) est la seule vraie protection.",
  codeReveal:"Troisième chiffre du code débloqué : <span style='color:var(--green);font-family:var(--display);font-size:22px;font-weight:700'>9</span>"
},

// ── 11 ────────────────────────────────────────────────
{
  id:11, phase:"ACTE III — LE RANSOMWARE",
  title:"La Sauvegarde Sauvée",
  subtitle:"L'importance des sauvegardes",
  story:`L'équipe IT cherche désespérément. Les sauvegardes automatiques sont chiffrées — elles étaient connectées au réseau. Mais quelqu'un a appliqué la règle <strong>3-2-1</strong> il y a 6 jours. Il existe une sauvegarde sur un disque dur <strong>déconnecté</strong>. C'est l'espoir de l'entreprise.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.85rem">LA RÈGLE 3-2-1 DES SAUVEGARDES</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="display:flex;align-items:center;gap:.85rem;padding:.75rem;background:var(--bg3);border:1px solid var(--border)">
        <div style="font-size:32px;font-family:var(--display);color:var(--green);min-width:40px;text-align:center">3</div>
        <div><strong style="color:var(--green)">3 copies</strong> de vos données au minimum</div>
      </div>
      <div style="display:flex;align-items:center;gap:.85rem;padding:.75rem;background:var(--bg3);border:1px solid var(--border)">
        <div style="font-size:32px;font-family:var(--display);color:var(--amber);min-width:40px;text-align:center">2</div>
        <div><strong style="color:var(--amber)">2 supports différents</strong> (ex : disque dur ET cloud)</div>
      </div>
      <div style="display:flex;align-items:center;gap:.85rem;padding:.75rem;background:var(--bg3);border:1px solid var(--border)">
        <div style="font-size:32px;font-family:var(--display);color:var(--red);min-width:40px;text-align:center">1</div>
        <div><strong style="color:var(--red)">1 copie déconnectée</strong> du réseau (le ransomware ne peut pas l'atteindre)</div>
      </div>
    </div>
    <div style="padding:.85rem;background:rgba(0,255,65,.05);border-top:1px solid var(--border)">
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7">La sauvegarde <strong>déconnectée</strong> est l'unique solution contre un ransomware. Si elle est branché au réseau, le ransomware la chiffre aussi.</div>
    </div>
  </div>`,
  question:"Quelle est la meilleure stratégie de sauvegarde pour résister à un ransomware ?",
  options:[
    {t:"Sauvegarder tous les soirs sur un disque dur branché en permanence au réseau.", c:false},
    {t:"Utiliser uniquement le cloud (OneDrive, Google Drive) qui se sauvegarde automatiquement.", c:false},
    {t:"Avoir au moins une sauvegarde sur un support déconnecté du réseau, testé régulièrement.", c:true},
    {t:"Faire une sauvegarde par email en s'envoyant les fichiers importants.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. Un disque branché en permanence au réseau sera chiffré en même temps que tout le reste. Le cloud synchronisé peut aussi être chiffré (si les fichiers locaux sont chiffrés, la synchronisation propage la version chiffrée). Seule une copie déconnectée est à l'abri. Et tester régulièrement la restauration est essentiel.",
    ko:"Les supports connectés au réseau (disque dur réseau, cloud synchronisé) peuvent être atteints par le ransomware. La seule protection fiable : une copie physiquement déconnectée et régulièrement testée."
  },
  hint:"Si le ransomware peut accéder à votre réseau, quels supports de sauvegarde peut-il atteindre ?",
  lesson:"Appliquez la règle 3-2-1 : 3 copies, 2 supports différents, 1 déconnectée du réseau. Testez la restauration régulièrement."
},

// ── 12 ────────────────────────────────────────────────
{
  id:12, phase:"ACTE III — LE RANSOMWARE",
  title:"Le Poste Non Mis à Jour",
  subtitle:"Pourquoi les mises à jour sont critiques",
  story:`L'enquête révèle que GR1MF0X a exploité une faille connue dans Windows. Un correctif existait depuis <strong>6 semaines</strong>. 23 postes de l'entreprise n'avaient pas été mis à jour — le message "mettre à jour plus tard" avait été cliqué trop de fois.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div class="info-grid">
      <div class="info-box warn">
        <div class="info-title" style="color:var(--red)">POSTE NON MIS À JOUR</div>
        <div class="info-body">La faille existe. GR1MF0X peut l'exploiter pour entrer dans le système — même sans mot de passe, même sans phishing.</div>
      </div>
      <div class="info-box good">
        <div class="info-title" style="color:var(--green)">POSTE À JOUR</div>
        <div class="info-body">La faille est corrigée. GR1MF0X ne peut pas utiliser cette technique. Le correctif = la porte est réparée.</div>
      </div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:6px">COMMENT ÇA FONCTIONNE</div>
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.8">
        Une <strong>faille de sécurité</strong> = une erreur dans le code d'un logiciel qui permet à un hacker d'en prendre le contrôle. Les éditeurs publient des <strong>correctifs</strong> dès qu'ils découvrent ces failles. Chaque jour sans mise à jour = la porte reste ouverte.
      </div>
    </div>
  </div>`,
  question:"Vous recevez une notification de mise à jour Windows pendant que vous travaillez. Que faites-vous ?",
  options:[
    {t:"Cliquer 'Plus tard' car les mises à jour prennent du temps et perturbent le travail.", c:false},
    {t:"Programmer la mise à jour pour le soir ou le week-end afin qu'elle se fasse sans vous perturber.", c:true},
    {t:"Attendre que le service IT valide la mise à jour avant de l'installer.", c:false},
    {t:"Désactiver les mises à jour automatiques pour choisir quand les installer.", c:false}
  ],
  feedback:{
    ok:"✓ Exactement. Les mises à jour peuvent être programmées pour s'installer hors des heures de travail. L'important est qu'elles se fassent dans les jours qui suivent leur publication. Chaque jour de retard est une porte ouverte pour les hackers qui connaissent la faille.",
    ko:"Reporter ou désactiver les mises à jour laisse les failles connues exploitables. Les hackers connaissent souvent les failles avant les utilisateurs — ils attaquent les systèmes non mis à jour en priorité. Programmez-les pour le soir ou le week-end."
  },
  hint:"Si un correctif existe depuis 6 semaines mais n'est pas installé, quelle est la durée pendant laquelle la faille reste ouverte ?",
  lesson:"Installez les mises à jour de sécurité dès que possible. Programmez-les le soir si nécessaire, mais ne les reportez pas indéfiniment."
},

// ── 13 ────────────────────────────────────────────────
{
  id:13, phase:"ACTE III — LE RANSOMWARE",
  title:"Le Partage de Mot de Passe",
  subtitle:"Pourquoi ne pas partager ses accès",
  story:`En remontant la piste, l'équipe découvre que deux commerciaux partageaient le même mot de passe pour accéder au CRM. "C'est plus pratique quand l'un est absent." Ce compte partagé a été la porte d'entrée principale — et personne ne sait lequel des deux a été compromis en premier.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.8;margin-bottom:1rem">
      <strong style="color:var(--amber)">Pourquoi partager un mot de passe est dangereux :</strong>
    </div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.7rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">👤 Si l'un des deux est piraté, <strong>les deux comptes</strong> sont compromis</div>
      <div style="padding:.7rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">🔍 Impossible de savoir <strong>qui a fait quoi</strong> — plus de traçabilité</div>
      <div style="padding:.7rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">🚪 Un employé qui part <strong>garde l'accès</strong> si le mot de passe n'est pas changé</div>
      <div style="padding:.7rem;background:var(--gdim);border-left:2px solid var(--green);color:var(--white)">✓ <strong>Solution :</strong> Chaque personne a son propre compte. Les absences se gèrent autrement (droits délégués, comptes de service).</div>
    </div>
  </div>`,
  question:"Un collègue vous demande votre mot de passe professionnel car il doit accéder à un fichier pendant votre absence. Que faites-vous ?",
  options:[
    {t:"Lui donner le mot de passe car vous faites confiance à ce collègue.", c:false},
    {t:"Lui envoyer le mot de passe par SMS car c'est plus sécurisé que par email.", c:false},
    {t:"Refuser et chercher une solution alternative : partage de fichier, droits d'accès temporaires, ou intervention du service IT.", c:true},
    {t:"Changer le mot de passe à votre retour, donc donner le mot de passe temporairement.", c:false}
  ],
  feedback:{
    ok:"✓ Correct. Ce n'est pas une question de confiance — c'est une règle de sécurité. Si votre collègue se fait pirater, votre compte l'est aussi. La solution : partage de fichier direct, droits délégués, ou demande au service IT. Votre mot de passe est personnel, même dans l'entreprise.",
    ko:"Partager son mot de passe est interdit par la charte informatique de presque toutes les entreprises. Ce n'est pas une question de confiance dans le collègue — si son poste est compromis, votre compte le sera aussi. Il existe toujours une solution alternative."
  },
  hint:"Qu'arrive-t-il à votre compte si le poste de votre collègue est compromis après qu'il a votre mot de passe ?",
  lesson:"Ne partagez jamais votre mot de passe, même avec un collègue de confiance. Chaque personne doit avoir ses propres accès."
},

// ── 14 ────────────────────────────────────────────────
{
  id:14, phase:"ACTE IV — LA RÉSISTANCE",
  title:"L'Email Légitime ou Non ?",
  subtitle:"Vérifier l'authenticité d'un email",
  codeIndex:3, codeDigit:"5",
  story:`L'ANSSI envoie une alerte nationale sur les attaques GR1MF0X. Plusieurs entreprises reçoivent un email qui prétend venir de l'ANSSI avec des "instructions de sécurité urgentes" à appliquer immédiatement. Certains ont cliqué. D'autres ont vérifié.`,
  visual:`<div class="visual-container"><div class="email-mockup">
    <div class="email-header">
      <div class="email-field"><span class="email-field-label">De :</span><span class="email-field-val sus">alerte@anssi-securite-nationale.com</span></div>
      <div class="email-field"><span class="email-field-label">À :</span><span class="email-field-val">responsable.si@entreprise.fr</span></div>
      <div class="email-subject">🔴 ACTION URGENTE — Instructions de sécurité ANSSI — GR1MF0X</div>
    </div>
    <div class="email-body">
      Suite à l'attaque GR1MF0X, l'ANSSI vous demande d'installer immédiatement le patch de sécurité ci-joint.<br><br>
      <strong>⬇ Télécharger : patch_securite_ANSSI_v2.exe</strong><br><br>
      Ce patch doit être installé dans les 2 heures. Sans action, votre système reste vulnérable.<br><br>
      — ANSSI Cybervigilance
    </div>
  </div></div>
  <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
    <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7"><strong style="color:var(--amber)">À noter :</strong> Le vrai domaine de l'ANSSI est <strong>anssi.gouv.fr</strong> — pas anssi-securite-nationale.com. Les organismes officiels utilisent toujours des adresses en <strong>.gouv.fr</strong> en France.</div>
  </div>`,
  question:"Cet email prétend venir de l'ANSSI et demande d'installer un fichier .exe. Comment réagissez-vous ?",
  options:[
    {t:"Installer le fichier car l'ANSSI est une autorité officielle de confiance.", c:false},
    {t:"Vérifier le domaine de l'expéditeur (anssi-securite-nationale.com ≠ anssi.gouv.fr) et signaler à votre service IT sans rien installer.", c:true},
    {t:"Installer le fichier mais seulement depuis un poste dédié à la sécurité.", c:false},
    {t:"Appeler l'ANSSI en cherchant le numéro dans l'email.", c:false}
  ],
  feedback:{
    ok:"✓ Parfait. Le domaine est le premier indicateur. anssi.gouv.fr = officiel. anssi-securite-nationale.com = faux. L'ANSSI ne demande jamais d'installer un .exe par email. Signaler au service IT permet d'alerter toute l'entreprise. Pour vérifier : cherchez l'organisme directement sur Google et utilisez le site officiel.",
    ko:"Même une autorité légitime peut être usurpée. Le domaine est le premier signal : .gouv.fr est officiel, .com ne l'est pas pour les organismes français. L'ANSSI ne distribue pas de fichiers .exe par email. Le numéro de téléphone dans l'email peut aussi être frauduleux."
  },
  hint:"Quel est le domaine officiel des organismes gouvernementaux français ? Comparez avec le domaine de l'expéditeur.",
  lesson:"Les organismes officiels utilisent .gouv.fr en France. Ne jamais installer un fichier reçu par email, même d'une source apparemment officielle.",
  codeReveal:"Dernier chiffre du code débloqué : <span style='color:var(--green);font-family:var(--display);font-size:22px;font-weight:700'>5</span>"
},

// ── 15 ────────────────────────────────────────────────
{
  id:15, phase:"ACTE IV — LA RÉSISTANCE",
  title:"Le Réseau Social Indiscret",
  subtitle:"Faire attention à ce qu'on publie en ligne",
  story:`En préparant l'attaque, GR1MF0X a passé 2 semaines à étudier les profils LinkedIn et Facebook des employés. Ils ont trouvé : l'organigramme de l'entreprise, les outils utilisés, les noms des prestataires, et même des photos de badges pris lors de conférences.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--gray);letter-spacing:.18em;font-family:var(--display);margin-bottom:.75rem">CE QUE LES HACKERS TROUVENT SUR LES RÉSEAUX SOCIAUX</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;font-family:var(--body);font-size:13px">
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">"Fière de rejoindre l'équipe marketing de Verixa ! 🎉" → <strong style="color:var(--red)">organigramme révélé</strong></div>
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">"Présentation de notre nouveau CRM SAP lors du congrès" → <strong style="color:var(--red)">outils identifiés</strong></div>
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">Photo de badge avec nom complet et service → <strong style="color:var(--red)">usurpation d'identité</strong></div>
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">"En déplacement à Londres cette semaine ☀️" → <strong style="color:var(--red)">cible absente identifiée</strong></div>
    </div>
  </div>`,
  question:"Vous postulez à une conférence et souhaitez publier sur LinkedIn. Quelle publication est la plus prudente ?",
  options:[
    {t:"'Super conférence sur les nouveaux outils Microsoft que nous utilisons chez Verixa — hâte d'implémenter Azure AD !'", c:false},
    {t:"'Excellente journée de formation en cybersécurité — beaucoup appris sur la protection des données professionnelles.'", c:true},
    {t:"'Représente Verixa à la conférence SecurIT — notre RSSI Jean Dupont présentait notre stratégie de sécurité.'", c:false},
    {t:"'Notre équipe de 12 personnes au service IT travaille sur le projet de migration réseau ce trimestre.'", c:false}
  ],
  feedback:{
    ok:"✓ Bonne réponse. Cette publication partage votre enthousiasme sans révéler d'informations exploitables : pas de nom d'outil, pas d'organigramme, pas de stratégie interne. Les autres options révèlent des informations précieuses pour un attaquant qui prépare une attaque ciblée.",
    ko:"Cette publication révèle des informations que les hackers collectent activement : nom des outils utilisés, noms de personnes clés, taille des équipes, projets en cours. Partagez votre enthousiasme sans les détails techniques."
  },
  hint:"Quelles informations dans les autres réponses pourraient aider un hacker à cibler votre entreprise ?",
  lesson:"Sur les réseaux sociaux, évitez de mentionner les outils utilisés, l'organigramme, les projets en cours. Partagez l'enthousiasme, pas les détails."
},

// ── 16 ────────────────────────────────────────────────
{
  id:16, phase:"ACTE IV — LA RÉSISTANCE",
  title:"Le Bureau Encombré",
  subtitle:"La politique du bureau propre",
  story:`En visitant les bureaux pour l'enquête forensique, l'expert en sécurité fait un constat alarmant : post-its avec des mots de passe sur les écrans, documents confidentiels laissés sur les imprimantes, écrans non verrouillés à la pause déjeuner. La sécurité physique est aussi importante que la sécurité numérique.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.75rem">AUDIT DU BUREAU — RÉSULTATS</div>
    <div style="display:flex;flex-direction:column;gap:.55rem;font-family:var(--body);font-size:14px">
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">🗒️ Post-it "MDP Teams : Verixa2026!" collé sur l'écran</div>
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">🖨️ Contrat client confidentiel oublié sur l'imprimante depuis hier</div>
      <div style="padding:.65rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">💻 Poste non verrouillé depuis 45 minutes (déjeuner)</div>
      <div style="padding:.65rem;background:var(--gdim);border-left:2px solid var(--green);color:var(--white)">✓ Bureau rangé, écran verrouillé, aucun document confidentiel visible</div>
    </div>
  </div>`,
  question:"Vous partez déjeuner pour 1 heure. Que faites-vous avant de quitter votre bureau ?",
  options:[
    {t:"Rien — le bureau est dans l'open space et tout le monde se connaît.", c:false},
    {t:"Verrouiller votre ordinateur (Windows+L) et ranger les documents confidentiels.", c:true},
    {t:"Éteindre l'ordinateur pour être sûr.", c:false},
    {t:"Minimiser toutes les fenêtres ouvertes.", c:false}
  ],
  feedback:{
    ok:"✓ Correct. Le raccourci Windows+L verrouille l'écran en 1 seconde. C'est un réflexe à adopter à chaque départ, même pour 2 minutes. Les documents confidentiels à la vue de tous (clients, prestataires, livreurs) représentent un risque réel. Le badge d'un visiteur ou d'un prestataire suffit à lire un post-it.",
    ko:"La confiance dans les collègues ne protège pas des visiteurs externes, des prestataires ou de la livraison du midi. Éteindre l'ordinateur prend trop de temps à redémarrer. Minimiser les fenêtres ne protège rien. Seul le verrouillage (Win+L) protège réellement."
  },
  hint:"Quel raccourci clavier verrouille l'écran instantanément sous Windows ?",
  lesson:"Verrouillez votre écran (Windows+L) à chaque fois que vous quittez votre bureau, même pour quelques minutes."
},

// ── 17 ────────────────────────────────────────────────
{
  id:17, phase:"ACTE V — LA RECONSTRUCTION",
  title:"Signaler un Incident",
  subtitle:"Réflexe en cas de doute ou d'incident",
  story:`Un employé a reçu un email suspect mais n'a pas osé le signaler — "ça doit être normal, je ne veux pas déranger". Deux jours plus tard, il a cliqué sur un lien similaire sans réfléchir. La culture du silence est l'alliée des hackers.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.85rem;background:var(--bg3);border:1px solid var(--border)">
        <strong style="color:var(--amber)">Que signaler ?</strong><br><br>
        <div style="color:var(--white);line-height:1.8">
          ✦ Un email qui semble suspect ou inhabituel<br>
          ✦ Un appel téléphonique demandant des informations sensibles<br>
          ✦ Un comportement étrange de votre ordinateur (lenteur soudaine, pop-ups)<br>
          ✦ Un fichier ou lien sur lequel vous avez cliqué par erreur<br>
          ✦ Un accès inhabituel à vos comptes (alerte de connexion depuis un lieu inconnu)
        </div>
      </div>
      <div style="padding:.85rem;background:rgba(0,255,65,.05);border:1px solid rgba(0,255,65,.2);border-left:3px solid var(--green)">
        <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7"><strong style="color:var(--green)">Il vaut mieux signaler une fausse alerte que ne pas signaler une vraie attaque.</strong> Le service IT préfère recevoir 10 fausses alertes plutôt que de rater une vraie infection.</div>
      </div>
    </div>
  </div>`,
  question:"Vous avez cliqué par erreur sur un lien dans un email qui semblait suspect. La page s'est ouverte puis vous l'avez fermée rapidement. Que faites-vous ?",
  options:[
    {t:"Ne rien faire — vous avez fermé la page très vite donc le risque est nul.", c:false},
    {t:"Signaler immédiatement au service IT en précisant ce qui s'est passé, même si vous n'êtes pas sûr que c'était dangereux.", c:true},
    {t:"Lancer une analyse antivirus et ne signaler que si elle détecte quelque chose.", c:false},
    {t:"Attendre de voir si des problèmes apparaissent sur votre ordinateur dans les prochains jours.", c:false}
  ],
  feedback:{
    ok:"✓ Parfait. Signaler immédiatement même si vous n'êtes pas sûr. Le service IT peut analyser rapidement et confirmer. Certains malwares s'installent en quelques secondes, avant même que vous fermiez la page. Plus le signalement est rapide, plus la réponse est efficace et les dégâts limités.",
    ko:"Fermer rapidement ne garantit rien — certains scripts s'exécutent en millisecondes. L'antivirus peut rater les menaces récentes. Attendre laisse le malware s'installer confortablement. Le service IT préfère mille fausses alertes à un signalement tardif."
  },
  hint:"Combien de temps un script malveillant a-t-il besoin pour s'installer après l'ouverture d'une page web ?",
  lesson:"Signalez immédiatement tout incident, même mineur ou incertain. Il vaut mieux une fausse alerte qu'une infection non détectée."
},

// ── 18 ────────────────────────────────────────────────
{
  id:18, phase:"ACTE V — LA RECONSTRUCTION",
  title:"Le Gestionnaire de Mots de Passe",
  subtitle:"Comment gérer ses mots de passe en pratique",
  story:`L'enquête révèle que 67% des employés utilisaient le même mot de passe sur leur compte pro et leurs comptes personnels. Quand une base de données d'un site de shopping a fuité il y a 1 an, les hackers ont pu réutiliser ces mots de passe sur les comptes professionnels.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--gray);letter-spacing:.18em;font-family:var(--display);margin-bottom:.75rem">PROBLÈME : RETENIR DES DIZAINES DE MOTS DE PASSE DIFFÉRENTS</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        ❌ <strong>Solution dangereuse :</strong> Utiliser le même mot de passe partout (ou des variations légères : Verixa2026! / Verixa2026@ / Verixa2026#)
      </div>
      <div style="padding:.75rem;background:var(--gdim);border-left:2px solid var(--green);color:var(--white)">
        ✓ <strong>Solution recommandée :</strong> Un gestionnaire de mots de passe (Bitwarden, 1Password, KeePass). Il génère et mémorise des mots de passe uniques et complexes pour chaque site. Vous n'avez à retenir qu'un seul mot de passe maître.
      </div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:6px">ATTAQUE PAR "CREDENTIAL STUFFING"</div>
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7">Les hackers achètent des bases de données de mots de passe volés sur des sites compromis, puis les testent automatiquement sur des centaines d'autres services. Si vous réutilisez le même mot de passe, ils entrent.</div>
    </div>
  </div>`,
  question:"Quelle est la meilleure façon de gérer vos mots de passe professionnels et personnels ?",
  options:[
    {t:"Utiliser une variation du même mot de passe en changeant un chiffre ou un symbole selon le site.", c:false},
    {t:"Utiliser un gestionnaire de mots de passe qui génère et stocke des mots de passe uniques et complexes pour chaque site.", c:true},
    {t:"Noter ses mots de passe dans un carnet personnel gardé dans un tiroir fermé.", c:false},
    {t:"Utiliser le même mot de passe très complexe partout pour garantir la sécurité.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. Un gestionnaire de mots de passe est la solution recommandée par tous les experts. Il génère des mots de passe vraiment aléatoires et uniques pour chaque site. Vous n'avez qu'un seul mot de passe à retenir (le maître). En cas de fuite d'un site, seul ce site est compromis.",
    ko:"Les variations (Verixa2026! → Verixa2026@) sont prévisibles et testées par les hackers. Un carnet peut être volé ou photographié. Un même mot de passe complexe partout reste vulnérable si un seul site fuite. Le gestionnaire de mots de passe est la solution professionnelle."
  },
  hint:"Si un site que vous utilisez subit une fuite de données, quel est l'impact si vous utilisez un mot de passe unique pour ce site uniquement ?",
  lesson:"Utilisez un gestionnaire de mots de passe (Bitwarden, 1Password, KeePass). Un mot de passe unique par site, vous n'en retenez qu'un."
},

// ── 19 ────────────────────────────────────────────────
{
  id:19, phase:"ACTE V — LA RECONSTRUCTION",
  title:"La Mise en Situation Finale",
  subtitle:"Vous êtes ciblé personnellement",
  story:`GR1MF0X vous cible personnellement. Ils connaissent votre nom, votre fonction, le nom de votre manager. Un email arrive : <strong>"Voici le document que vous m'avez demandé hier lors de notre réunion."</strong> Votre manager est en copie. La pièce jointe s'appelle "compte-rendu-reunion.pdf".`,
  visual:`<div class="visual-container"><div class="email-mockup">
    <div class="email-header">
      <div class="email-field"><span class="email-field-label">De :</span><span class="email-field-val sus">p.martin.consultant@gmail.com</span></div>
      <div class="email-field"><span class="email-field-label">À :</span><span class="email-field-val">vous@votre-entreprise.fr</span></div>
      <div class="email-field"><span class="email-field-label">Cc :</span><span class="email-field-val">votre.manager@votre-entreprise.fr</span></div>
      <div class="email-subject">Compte-rendu de notre réunion d'hier</div>
    </div>
    <div class="email-body">
      Bonjour,<br><br>
      Comme convenu lors de notre réunion d'hier, je vous transmets le compte-rendu finalisé.<br><br>
      N'hésitez pas à me revenir si vous souhaitez y apporter des modifications.<br><br>
      Cordialement,<br>
      Pierre Martin — Consultant<br><br>
      <strong>📎 compte-rendu-reunion.pdf</strong>
    </div>
  </div></div>
  <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
    <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7"><strong style="color:var(--amber)">Spear phishing :</strong> Contrairement au phishing de masse, cette attaque est <strong>personnalisée</strong> pour vous. GR1MF0X a collecté les informations sur LinkedIn et vos réseaux sociaux. L'email semble crédible car il connaît votre contexte.</div>
  </div>`,
  question:"L'email semble lié à une vraie réunion. Vous ne vous souvenez pas d'un 'Pierre Martin'. Que faites-vous ?",
  options:[
    {t:"Ouvrir la pièce jointe pour vérifier si elle correspond bien à une réunion que vous auriez pu oublier.", c:false},
    {t:"Ne pas ouvrir la pièce jointe. Contacter votre manager en lui demandant s'il connaît ce Pierre Martin et s'il a bien participé à cette réunion.", c:true},
    {t:"Répondre à l'email pour demander des précisions sur la réunion en question.", c:false},
    {t:"Ouvrir la pièce jointe mais ne cliquer sur aucun lien à l'intérieur.", c:false}
  ],
  feedback:{
    ok:"✓ Parfait. Ne jamais ouvrir une pièce jointe en cas de doute — même si elle semble liée à quelque chose de réel. Votre manager peut confirmer en 30 secondes. Si la réunion est fictive, c'est un spear phishing. Si elle est réelle mais que vous avez oublié, le vrai Pierre Martin comprendra votre vérification.",
    ko:"Un PDF peut contenir du code malveillant qui s'exécute à l'ouverture. Répondre à l'email contacte le hacker. 'Ne pas cliquer sur les liens' ne protège pas des PDF ou Word malveillants. Le doute suffit à ne pas ouvrir — vérifiez d'abord."
  },
  hint:"Si vous ne vous souvenez pas d'une réunion, qui est la personne la mieux placée pour confirmer si elle a eu lieu ?",
  lesson:"En cas de doute sur une pièce jointe, ne l'ouvrez pas. Vérifiez d'abord par un autre canal (appel, message à votre manager)."
},

// ── 20 ────────────────────────────────────────────────
{
  id:20, phase:"ÉPILOGUE — LA VICTOIRE",
  title:"Le Code de Désactivation",
  subtitle:"Synthèse et désactivation du ransomware",
  story:`Vous avez les 4 chiffres. Le code de désactivation est prêt. Mais avant d'appuyer sur le bouton, une dernière question — la plus importante. GR1MF0X a laissé un message : <em>"Hello, friend. Back to basics."</em> Ils ont raison.`,
  visual:`<div class="visual-container" style="padding:1.5rem">
    <div style="text-align:center;margin-bottom:1.5rem">
      <div style="font-size:10px;color:var(--gray);letter-spacing:.25em;font-family:var(--display);margin-bottom:.85rem">CODE DE DÉSACTIVATION</div>
      <div style="display:flex;gap:12px;justify-content:center">
        <div style="width:60px;height:76px;border:2px solid var(--green);background:var(--bg3);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:30px;font-weight:700;color:var(--green);box-shadow:var(--gglow)">7</div>
        <div style="width:60px;height:76px;border:2px solid var(--green);background:var(--bg3);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:30px;font-weight:700;color:var(--green);box-shadow:var(--gglow)">3</div>
        <div style="width:60px;height:76px;border:2px solid var(--green);background:var(--bg3);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:30px;font-weight:700;color:var(--green);box-shadow:var(--gglow)">9</div>
        <div style="width:60px;height:76px;border:2px solid var(--green);background:var(--bg3);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:30px;font-weight:700;color:var(--green);box-shadow:var(--gglow)">5</div>
      </div>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border);padding:1.1rem">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.75rem">LES 5 ERREURS QUI ONT PERMIS L'ATTAQUE</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;font-family:var(--body);font-size:13px">
        <div style="padding:.6rem;background:var(--rdim);color:var(--white)">Email de phishing non détecté</div>
        <div style="padding:.6rem;background:var(--rdim);color:var(--white)">Mot de passe admin prévisible sans MFA</div>
        <div style="padding:.6rem;background:var(--rdim);color:var(--white)">Code SMS communiqué par téléphone</div>
        <div style="padding:.6rem;background:var(--rdim);color:var(--white)">Clé USB branchée dans le parking</div>
        <div style="padding:.6rem;background:var(--rdim);color:var(--white)">Sauvegardes connectées au réseau</div>
      </div>
    </div>
  </div>`,
  question:"Si votre entreprise ne peut activer qu'UNE mesure de sécurité immédiatement, laquelle aurait le plus grand impact ?",
  options:[
    {t:"Installer un antivirus de dernière génération sur tous les postes.", c:false},
    {t:"Activer la double authentification (MFA) sur tous les comptes de l'entreprise.", c:true},
    {t:"Former tous les employés à la cybersécurité pendant une journée complète.", c:false},
    {t:"Mettre à jour tous les logiciels et systèmes d'exploitation.", c:false}
  ],
  feedback:{
    ok:"✓ MISSION ACCOMPLIE. Le MFA est la mesure avec le meilleur rapport impact/effort. Il neutralise les conséquences du phishing (le mot de passe volé ne suffit plus), du credential stuffing (les mots de passe réutilisés ne fonctionnent plus), et de nombreuses autres attaques. Microsoft indique que le MFA bloque 99,9% des attaques automatisées sur les comptes. C'est gratuit sur la plupart des services, et s'active en 5 minutes.",
    ko:"Toutes ces mesures sont importantes — mais si une seule est possible : le MFA. L'antivirus ne protège pas contre le phishing ou les erreurs humaines. La formation est essentielle mais les gens font des erreurs même formés. Les mises à jour corrigent les failles logicielles mais pas l'erreur humaine. Le MFA protège même quand tout le reste échoue."
  },
  hint:"Quelle mesure aurait bloqué l'accès même si le hacker avait le bon mot de passe ?",
  lesson:"Le MFA est votre mesure numéro 1. Activez-le sur tous vos comptes — pro et perso. C'est simple, gratuit, et extrêmement efficace."
},

// ── 21 ────────────────────────────────────────────────
{
  id:21, phase:"ACTE V — LA RECONSTRUCTION",
  title:"Le Carnet de Mots de Passe",
  subtitle:"Où et comment stocker ses mots de passe ?",
  story:`En faisant le tour des bureaux après l'incident, le responsable sécurité découvre trois façons différentes dont les employés stockent leurs mots de passe : un fichier Excel sur le bureau intitulé "MDP_2026.xlsx", des post-its collés sous les claviers, et des mots de passe sauvegardés dans le navigateur Chrome. <strong>Aucune n'est vraiment sûre</strong> — mais certaines sont bien plus risquées que d'autres.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.85rem">COMPARATIF DES MÉTHODES DE STOCKAGE</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.85rem;background:var(--rdim);border-left:3px solid var(--red)">
        <div style="color:var(--red);font-weight:600;margin-bottom:4px">🗒️ Post-it / carnet papier</div>
        <div style="color:var(--white)">Visible par n'importe qui passant près du bureau, photographiable en 1 seconde, perdu ou volé facilement. <strong style="color:var(--red)">Risque très élevé.</strong></div>
      </div>
      <div style="padding:.85rem;background:var(--rdim);border-left:3px solid var(--red)">
        <div style="color:var(--red);font-weight:600;margin-bottom:4px">📊 Fichier Excel / Word / Notes</div>
        <div style="color:var(--white)">Non chiffré par défaut. Si le poste est compromis ou volé, tous vos mots de passe sont en clair. Souvent synchronisé dans le cloud sans protection. <strong style="color:var(--red)">Risque très élevé.</strong></div>
      </div>
      <div style="padding:.85rem;background:rgba(255,176,0,.08);border-left:3px solid var(--amber)">
        <div style="color:var(--amber);font-weight:600;margin-bottom:4px">🌐 Sauvegarde dans le navigateur (Chrome, Firefox…)</div>
        <div style="color:var(--white)">Pratique mais lié à votre compte Google/Microsoft. Si ce compte est compromis, tous vos mots de passe le sont aussi. Pas de chiffrement fort. <strong style="color:var(--amber)">Risque modéré.</strong></div>
      </div>
      <div style="padding:.85rem;background:rgba(0,255,65,.08);border-left:3px solid var(--green)">
        <div style="color:var(--green);font-weight:600;margin-bottom:4px">🔐 Gestionnaire de mots de passe dédié (Bitwarden, 1Password…)</div>
        <div style="color:var(--white)">Chiffrement fort, mot de passe maître unique, génération de mots de passe aléatoires. Même si compromis, les données restent chiffrées. <strong style="color:var(--green)">Solution recommandée.</strong></div>
      </div>
    </div>
  </div>`,
  question:"Un collègue vous dit : 'J'ai un fichier Excel protégé par un mot de passe avec tous mes accès dedans, c'est bien non ?' Que lui répondez-vous ?",
  options:[
    {t:"Oui, c'est une bonne méthode si le fichier est bien protégé par un mot de passe fort.", c:false},
    {t:"Non — la protection par mot de passe d'Excel est faible et contournable. Un gestionnaire de mots de passe dédié est bien plus sûr.", c:true},
    {t:"Oui, tant que le fichier est stocké sur un disque chiffré.", c:false},
    {t:"C'est acceptable si personne d'autre n'a accès à son ordinateur.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. La protection par mot de passe d'Excel peut être contournée avec des outils gratuits trouvables en ligne en quelques minutes. De plus, si le poste est infecté par un malware, le fichier sera lu avant même que vous l'ouvriez. Un gestionnaire de mots de passe dédié utilise un chiffrement AES-256 bien plus robuste.",
    ko:"La protection par mot de passe d'Excel donne une fausse impression de sécurité. Elle se contourne facilement. Et si le poste est compromis, le fichier est lu en clair par le malware. La bonne solution : un gestionnaire de mots de passe dédié comme Bitwarden (gratuit) ou 1Password."
  },
  hint:"Cherchez comment les hackers accèdent à un fichier Excel protégé par mot de passe. Est-ce vraiment difficile ?",
  lesson:"Ne stockez pas vos mots de passe dans Excel, Word, un post-it ou un carnet. Utilisez un gestionnaire dédié (Bitwarden, KeePass, 1Password)."
},

// ── 22 ────────────────────────────────────────────────
{
  id:22, phase:"ACTE V — LA RECONSTRUCTION",
  title:"Le Poste Personnel au Bureau",
  subtitle:"Utiliser son équipement perso ou celui de l'entreprise ?",
  story:`Le lundi suivant l'incident, un employé arrive avec son ordinateur personnel car son poste professionnel est en cours de réinstallation. Il propose de l'utiliser temporairement pour travailler sur les dossiers clients et se connecter à la messagerie professionnelle. <strong>"C'est juste pour quelques jours."</strong>`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div class="info-grid">
      <div class="info-box good">
        <div class="info-title" style="color:var(--green)">POSTE FOURNI PAR L'ENTREPRISE</div>
        <div class="info-body" style="line-height:1.8">
          ✓ Antivirus géré par l'IT<br>
          ✓ Mises à jour automatiques<br>
          ✓ Chiffrement du disque activé<br>
          ✓ VPN configuré<br>
          ✓ Politique de sécurité appliquée<br>
          ✓ Inventorié et supervisé
        </div>
      </div>
      <div class="info-box warn">
        <div class="info-title" style="color:var(--red)">POSTE PERSONNEL</div>
        <div class="info-body" style="line-height:1.8">
          ✗ Antivirus inconnu ou absent<br>
          ✗ Mises à jour non gérées<br>
          ✗ Logiciels non validés installés<br>
          ✗ Utilisé par d'autres membres de la famille<br>
          ✗ Non chiffré<br>
          ✗ Hors périmètre de sécurité de l'entreprise
        </div>
      </div>
    </div>
    <div style="padding:.85rem;background:var(--bg3);border-top:1px solid var(--border)">
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.7">Si le poste personnel est compromis (ce que l'IT ne peut pas savoir), les données professionnelles — dossiers clients, emails, mots de passe — sont exposées <strong style="color:var(--red)">hors du périmètre de contrôle de l'entreprise.</strong></div>
    </div>
  </div>`,
  question:"Votre poste professionnel est en maintenance. Peut-on utiliser son ordinateur personnel pour travailler sur des données de l'entreprise ?",
  options:[
    {t:"Oui, si on fait attention et qu'on n'installe rien de suspect dessus.", c:false},
    {t:"Oui, mais uniquement pour lire les emails — pas pour travailler sur des fichiers.", c:false},
    {t:"Non — contacter le service IT pour obtenir un poste de remplacement ou une solution validée. L'ordinateur personnel n'est pas sécurisé selon les standards de l'entreprise.", c:true},
    {t:"Oui, si on utilise une connexion VPN.", c:false}
  ],
  feedback:{
    ok:"✓ Correct. L'ordinateur personnel échappe au contrôle du service IT : pas d'antivirus géré, pas de chiffrement garanti, potentiellement utilisé par d'autres personnes, avec des logiciels non validés. Le VPN protège la communication mais pas le poste lui-même. La bonne démarche : appeler l'IT pour un prêt de matériel ou une solution de remplacement.",
    ko:"Même avec précaution ou VPN, le poste personnel reste en dehors du périmètre de sécurité de l'entreprise. L'IT ne peut pas vérifier son état. Un malware présent à l'insu de l'employé peut intercepter toutes les données professionnelles. Contactez toujours le service IT pour une solution officielle."
  },
  hint:"Si votre ordinateur personnel est infecté sans que vous le sachiez, qui peut le détecter et y remédier ?",
  lesson:"N'utilisez jamais votre ordinateur personnel pour travailler sur des données de l'entreprise. Contactez l'IT pour obtenir un équipement de remplacement."
},

// ── 23 ────────────────────────────────────────────────
{
  id:23, phase:"ACTE V — LA RECONSTRUCTION",
  title:"Le Logiciel Non Autorisé",
  subtitle:"Installer un logiciel sans accord du service IT",
  story:`Pour aller plus vite sur un projet, un chef de projet installe directement depuis Internet un outil de gestion gratuit qu'il a trouvé sur un forum. <strong>"C'est open source, c'est forcément sûr."</strong> Il n'a pas demandé à l'IT. L'outil en question collectait discrètement les frappes clavier depuis 3 semaines.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.85rem">CE QUI PEUT SE PASSER QUAND ON INSTALLE SANS VÉRIFICATION</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        <strong style="color:var(--red)">Keylogger caché :</strong> Le logiciel enregistre tout ce que vous tapez — mots de passe inclus — et envoie les données à un serveur distant.
      </div>
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        <strong style="color:var(--red)">Backdoor :</strong> Le logiciel ouvre une porte d'entrée cachée dans votre réseau, accessible à son créateur à distance.
      </div>
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        <strong style="color:var(--red)">Logiciel légitime + composant malveillant :</strong> L'outil fonctionne vraiment, mais embarque un malware invisible. Impossible à détecter par l'utilisateur.
      </div>
      <div style="padding:.75rem;background:rgba(0,255,65,.06);border-left:2px solid var(--green);color:var(--white)">
        <strong style="color:var(--green)">Open source ≠ sûr :</strong> Le code source est public mais personne n'a forcément vérifié qu'il ne contient rien de malveillant. Le service IT existe pour faire ces vérifications.
      </div>
    </div>
  </div>`,
  question:"Vous avez besoin d'un logiciel pour un projet. Votre service IT prend du temps à répondre. Que faites-vous ?",
  options:[
    {t:"Télécharger le logiciel depuis le site officiel de l'éditeur — au moins c'est la source officielle.", c:false},
    {t:"Attendre la validation du service IT ou relancer votre demande. En urgence, expliquer le contexte à votre responsable pour accélérer le processus.", c:true},
    {t:"Télécharger une version portable (sans installation) qui ne nécessite pas de droits admin.", c:false},
    {t:"Utiliser une version en ligne (SaaS) qui ne s'installe pas sur le poste.", c:false}
  ],
  feedback:{
    ok:"✓ Exact. Même depuis le site officiel, un logiciel non validé peut contenir des vulnérabilités, collecter des données, ou créer des conflits de sécurité. La version portable contourne les protections sans les autorisation nécessaires. Certains SaaS en ligne transmettent vos données à l'étranger. Le service IT valide non seulement la sécurité du logiciel, mais aussi sa compatibilité avec l'infrastructure.",
    ko:"Même depuis la source officielle ou en version portable, un logiciel non validé par l'IT échappe aux vérifications de sécurité de l'entreprise. Le service IT analyse les logiciels pour détecter les comportements suspects, les transmissions de données, et la compatibilité avec votre environnement sécurisé."
  },
  hint:"Qu'est-ce qu'un keylogger, et comment pourrait-il être dissimulé dans un logiciel en apparence utile ?",
  lesson:"N'installez jamais de logiciel sans validation du service IT, même depuis une source officielle. Relancez votre demande si nécessaire."
},

// ── 24 ────────────────────────────────────────────────
{
  id:24, phase:"ACTE V — LA RECONSTRUCTION",
  title:"Félicitations, vous avez gagné un iPhone !",
  subtitle:"Reconnaître les arnaques par SMS ou email",
  story:`Deux semaines après l'incident, votre téléphone professionnel reçoit un SMS : <em>"Félicitations ! Vous êtes le gagnant du tirage mensuel Verixa. Réclamez votre iPhone 16 Pro avant 24h :"</em> suivi d'un lien. Plusieurs collègues ont reçu le même message. L'un d'eux a déjà cliqué.`,
  visual:`<div class="visual-container" style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem">
    <div style="display:flex;justify-content:center">
      <div class="phone-mockup">
        <div class="phone-top"><span>📶 Orange</span><span>14:07</span><span>🔋91%</span></div>
        <div style="background:var(--bg3);padding:5px 12px;text-align:center;font-size:11px;color:var(--gray)">+33 6 78 90 12 34 (Inconnu)</div>
        <div class="phone-screen">
          <div class="sms-bubble">
            <div class="sms-sender">Verixa-Rewards</div>
            🎉 Félicitations ! Vous avez été sélectionné pour recevoir un iPhone 16 Pro (valeur 1 329€).<br><br>
            Réclamez votre cadeau avant 24h :<br>
            <span class="sms-link">bit.ly/verixa-reward-iphone</span><br><br>
            Seuls vos coordonnées de livraison et 2,99€ de frais de port sont demandés.
          </div>
        </div>
      </div>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border);padding:1rem">
      <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.75rem">POURQUOI C'EST UNE ARNAQUE — LES SIGNAUX</div>
      <div style="font-family:var(--body);font-size:14px;color:var(--white);line-height:1.9">
        ⚠ Vous n'avez participé à aucun tirage<br>
        ⚠ Expéditeur inconnu — jamais "Verixa" n'enverrait depuis un numéro mobile<br>
        ⚠ Lien raccourci (bit.ly) qui masque la vraie destination<br>
        ⚠ Urgence (24h) pour empêcher la réflexion<br>
        ⚠ Les "2,99€ de frais" : technique pour récupérer votre numéro de carte bancaire
      </div>
    </div>
  </div>`,
  question:"Vous recevez ce SMS sur votre téléphone pro. Un collègue dit 'J'ai cliqué mais je n'ai rien renseigné.' Que faites-vous pour vous et pour lui ?",
  options:[
    {t:"Cliquer pour voir à quoi ressemble le site — juste regarder ne peut pas faire de mal.", c:false},
    {t:"Ignorer le SMS et supprimer. Pour le collègue qui a cliqué : ne rien faire puisqu'il n'a rien saisi.", c:false},
    {t:"Ne pas cliquer, supprimer. Pour le collègue : signaler au service IT immédiatement — cliquer suffit parfois à déclencher un téléchargement automatique.", c:true},
    {t:"Transférer le SMS au service IT pour analyse avant de décider.", c:false}
  ],
  feedback:{
    ok:"✓ Parfait. Le simple clic sur certains liens peut déclencher un téléchargement automatique de malware — sans que l'utilisateur ne saisisse quoi que ce soit. C'est ce qu'on appelle un 'drive-by download'. Signaler au service IT même sans saisie de données permet une vérification rapide du poste. Pour vous : supprimez sans cliquer.",
    ko:"'Juste regarder' peut suffire pour certains sites malveillants à télécharger un malware automatiquement. Et pour le collègue : ne rien faire serait une erreur — un simple clic peut déclencher un téléchargement silencieux. Le service IT doit être alerté pour analyser son poste."
  },
  hint:"Qu'est-ce qu'un 'drive-by download' ? Est-il nécessaire de télécharger manuellement un fichier pour être infecté ?",
  lesson:"Ne cliquez jamais sur un lien promettant un gain inattendu. Si un collègue a cliqué, signalez-le à l'IT même sans saisie — le simple clic peut suffire à infecter."
},

// ── 25 ────────────────────────────────────────────────
{
  id:25, phase:"ÉPILOGUE — LA VICTOIRE",
  title:"La Conversion PDF Urgente",
  subtitle:"Sites web non vérifiés et risques de fuite de données",
  story:`Dernier jour avant la présentation au client. Votre logiciel PDF ne fonctionne plus. Un collègue propose une solution rapide : <strong>"Va sur SuperPdfGenerator.ru, c'est gratuit et ça marche super bien."</strong> Le fichier à convertir contient le contrat client avec les tarifs confidentiels de l'entreprise.`,
  visual:`<div class="visual-container" style="padding:1.25rem">
    <div style="background:#000;border:1px solid #333;border-radius:4px;padding:8px 12px;display:flex;align-items:center;gap:8px;margin-bottom:1rem">
      <span style="font-size:14px">🔒</span>
      <span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:#ff6666">https://superpdfgenerator.ru/convert</span>
    </div>
    <div style="font-size:10px;color:var(--amber);letter-spacing:.18em;font-family:var(--display);margin-bottom:.85rem">CE QUI SE PASSE QUAND VOUS UPLOADEZ UN FICHIER</div>
    <div style="display:flex;flex-direction:column;gap:.6rem;font-family:var(--body);font-size:14px">
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        <strong style="color:var(--red)">Votre fichier est envoyé sur un serveur inconnu</strong> — probablement hors de France, hors Union Européenne, sans politique de confidentialité vérifiable.
      </div>
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        <strong style="color:var(--red)">Le contenu peut être lu, copié, revendu</strong> — contrats, tarifs, données clients, informations RH. Tout ce qui est dans le fichier est désormais accessible à l'opérateur du site.
      </div>
      <div style="padding:.75rem;background:var(--rdim);border-left:2px solid var(--red);color:var(--white)">
        <strong style="color:var(--red)">Le fichier "converti" peut contenir un malware</strong> — le PDF renvoyé peut embarquer du code malveillant qui s'exécute à l'ouverture.
      </div>
      <div style="padding:.75rem;background:rgba(0,255,65,.06);border-left:2px solid var(--green);color:var(--white)">
        <strong style="color:var(--green)">Alternatives sûres :</strong> "Imprimer en PDF" natif dans Windows/Mac, Word → Fichier → Exporter en PDF, LibreOffice, ou demander à l'IT un outil validé.
      </div>
    </div>
  </div>`,
  question:"Votre logiciel PDF est en panne et vous devez convertir un document confidentiel avant une présentation. Que faites-vous ?",
  options:[
    {t:"Utiliser superpdfgenerator.ru ou un site similaire — c'est rapide et votre fichier ne restera pas longtemps sur leur serveur.", c:false},
    {t:"Utiliser la fonction native 'Imprimer → Microsoft Print to PDF' ou 'Fichier → Exporter' disponible dans Word, et signaler la panne à l'IT.", c:true},
    {t:"Envoyer le fichier à un collègue qui a un logiciel PDF fonctionnel pour qu'il le convertisse.", c:false},
    {t:"Utiliser Google Drive ou Google Docs pour convertir le fichier.", c:false}
  ],
  feedback:{
    ok:"✓ Parfait. Windows et macOS intègrent nativement la conversion en PDF : dans n'importe quelle application, faites 'Fichier → Imprimer → choisir Microsoft Print to PDF (Windows) ou PDF (Mac)'. Word, Excel et PowerPoint ont aussi une option 'Exporter en PDF' directe. Zéro upload, zéro risque. Signalez la panne à l'IT pour qu'il répare ou remplace l'outil.",
    ko:"Même pour quelques secondes, uploader un document confidentiel sur un site non validé expose son contenu. Votre collègue ne devrait pas non plus recevoir des données confidentielles sans nécessité. Google Drive envoie vos données sur des serveurs Google — acceptable selon la politique de votre entreprise, mais à valider avec l'IT. La solution la plus sûre est native à votre système."
  },
  hint:"Est-ce que votre ordinateur (Windows ou Mac) a déjà intégré une façon de créer des PDF sans logiciel externe ?",
  lesson:"Pour convertir en PDF, utilisez la fonction native de votre OS (Imprimer → PDF). Ne jamais uploader un document confidentiel sur un site web non validé.",
  isFinal:true
}

];

// ═══════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════
const BOOT_MSGS = [
  "BLACKOUT v3.0 — Système d'entraînement cybersécurité","Chargement du moteur d'incident... [OK]",
  "Connexion au serveur de simulation... [OK]","Vérification des modules d'enquête... [25 modules chargés]","",
  "⚠ ALERTE CRITIQUE — 08h47","Ransomware détecté sur le réseau interne : BlackoutRANS v3.1",
  "Fichiers chiffrés : 847 Go sur 1.2 To","Origine : GR1MF0X — Tor exit node (185.220.101.47)","",
  "MISSION : Résoudre 25 modules pour obtenir","le code de désactivation du ransomware.",
  "Chaque erreur coûte 5 minutes.","Le maître du jeu valide les réponses de l'équipe.","",
  "Règle : Discutez ensemble, mettez-vous d'accord,","le maître du jeu sélectionne la réponse choisie par l'équipe.","",
  "[ EN ATTENTE DU SIGNAL DE DÉPART ]"
];

function runBoot() {
  const c = document.getElementById('boot-lines');
  let i = 0;
  const iv = setInterval(() => {
    if (i >= BOOT_MSGS.length) { clearInterval(iv); setTimeout(() => { document.getElementById('boot-start').style.display = 'inline-flex'; }, 300); return; }
    const d = document.createElement('div');
    const m = BOOT_MSGS[i];
    if (m.includes('⚠') || m.includes('ALERTE') || m.includes('Ransomware') || m.includes('chiffrés')) d.style.color = '#ff2020';
    else if (m.includes('[OK]') || m.includes('chargés')) d.style.color = '#00cc33';
    else if (m.includes('GR1MF0X') || m.includes('MISSION') || m.includes('Règle') || m.includes('Discutez')) d.style.color = '#ffb000';
    else if (m.includes('[EN ATTENTE]') || m.includes('maître')) d.style.color = '#00ff41';
    d.textContent = m || '\u00a0';
    c.appendChild(d); c.scrollTop = c.scrollHeight; i++;
  }, 100);
}

// ═══════════════════════════════════════════════════════
// START / TIMER / PAUSE
// ═══════════════════════════════════════════════════════
function startGame() {
  const boot = document.getElementById('boot-screen');
  boot.style.opacity = '0'; boot.style.transition = 'opacity .7s';
  setTimeout(() => boot.style.display = 'none', 700);
  document.getElementById('app').style.display = 'flex';
  buildNav(); startTimer(); showWelcome(); updateStoryBanner(0);
}

function startTimer() {
  updateTimerDisplay();
  STATE.timerInterval = setInterval(() => {
    if (STATE.paused) return;
    STATE.timerSec--;
    updateTimerDisplay();
    if (STATE.timerSec <= 0) { clearInterval(STATE.timerInterval); gameOver(); }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(STATE.timerSec / 60);
  const s = STATE.timerSec % 60;
  const disp = document.getElementById('timer');
  const fill = document.getElementById('timer-fill');
  disp.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const pct = (STATE.timerSec / (90 * 60)) * 100;
  fill.style.width = pct + '%';
  disp.classList.toggle('urgent', STATE.timerSec < 600);
  fill.style.background = STATE.timerSec < 600 ? '#ff2020' : STATE.timerSec < 1800 ? '#ffb000' : '#cc0000';
}

function togglePause() {
  STATE.paused = !STATE.paused;
  const btn = document.getElementById('pause-btn');
  const overlay = document.getElementById('pause-overlay');
  const icon = document.getElementById('pause-icon');
  const label = document.getElementById('pause-label');
  if (STATE.paused) {
    btn.classList.add('paused'); icon.textContent = '▶'; label.textContent = 'REPRENDRE';
    overlay.style.display = 'flex';
  } else {
    btn.classList.remove('paused'); icon.textContent = '⏸'; label.textContent = 'PAUSE';
    overlay.style.display = 'none';
  }
}

function applyPenalty() {
  STATE.timerSec = Math.max(0, STATE.timerSec - PENALTY_SEC);
  updateTimerDisplay();
  // Flash penalty notice in header
  const el = document.getElementById('timer-penalty');
  el.style.display = 'block';
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = 'penaltyFade 2s forwards'; });
  setTimeout(() => el.style.display = 'none', 2000);
}

// ═══════════════════════════════════════════════════════
// STORY BANNER
// ═══════════════════════════════════════════════════════
const STORIES = [
  "GR1MF0X vient de lancer le ransomware. 90 minutes avant chiffrement total. L'équipe est mobilisée.",
  "Un email frauduleux frappe le service financier. Sandra est sur le point de cliquer.",
  "La manipulation psychologique est au cœur de l'attaque. Urgence, culpabilité, isolation.",
  "Le compte admin est compromis. Le mot de passe prévisible n'a résisté que 4 secondes.",
  "La double authentification aurait tout stoppé. En 5 minutes d'activation.",
  "Un complice appelle le standard. Il veut votre code SMS. Il semble très professionnel.",
  "1 247 dossiers personnels téléchargés. Vos données sont en vente sur le dark web pour 47€.",
  "Les SMS piégés arrivent en masse. GR1MF0X utilise les numéros volés dans les RH.",
  "Une clé USB dans le parking. La curiosité a suffi. 6 secondes pour compromettre un poste.",
  "Le WiFi du café était un piège. Un faux réseau interceptait toutes les communications.",
  "L'écran rouge. Le ransomware est actif. 847 Go chiffrés. 500 000€ demandés.",
  "La sauvegarde offline est intacte. La règle 3-2-1 a sauvé l'essentiel.",
  "23 postes non mis à jour depuis 6 semaines. La faille était connue, le correctif existait.",
  "Deux comptes partagés. Plus de traçabilité, double exposition. La confiance ne suffit pas.",
  "Un faux email de l'ANSSI demande d'installer un patch. Le domaine révèle tout.",
  "LinkedIn a fourni aux hackers l'organigramme complet et les outils utilisés.",
  "Bureau non verrouillé, post-its, imprimante abandonnée. La sécurité physique compte.",
  "Un incident non signalé aujourd'hui devient une attaque réussie demain.",
  "67% des employés réutilisaient le même mot de passe sur plusieurs sites.",
  "L'attaque finale vous cible personnellement. GR1MF0X connaît votre nom et votre manager.",
  "Vous avez les 4 chiffres. Une dernière question avant de désactiver le ransomware.",
  "Post-its, fichiers Excel, navigateur... Où sont stockés vos mots de passe ?",
  "Le poste perso au bureau : pratique ou dangeureux ? L'IT n'a aucun contrôle dessus.",
  "Un logiciel installé sans accord IT a ouvert une porte dérobée pendant 3 semaines.",
  "Un SMS promet un iPhone gratuit. L'un de vos collègues a déjà cliqué sur le lien.",
  "Le logiciel PDF est en panne. SuperPdfGenerator.ru attend votre contrat confidentiel."
];
function updateStoryBanner(i) {
  const el = document.getElementById('story-text');
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = STORIES[Math.min(i, STORIES.length-1)]; el.style.opacity = '1'; }, 280);
}

// ═══════════════════════════════════════════════════════
// WELCOME
// ═══════════════════════════════════════════════════════
const WELCOME = [
  {t:"blackout@incident-response:~# cat mission.txt", cl:"t-green"},
  {t:" ", cl:""},
  {t:"═══ BLACKOUT — MISSION DE L'ÉQUIPE ═══", cl:"t-amber"},
  {t:" ", cl:""},
  {t:"HEURE : 08h47 | RANSOMWARE ACTIF | DÉLAI : 60 MINUTES", cl:"t-red"},
  {t:" ", cl:""},
  {t:"GR1MF0X a chiffré les systèmes de l'entreprise.", cl:""},
  {t:"Pour obtenir le code de désactivation, résolvez", cl:""},
  {t:"les 25 modules d'enquête dans l'ordre.", cl:""},
  {t:" ", cl:""},
  {t:"RÈGLES DE L'ÉQUIPE :", cl:"t-amber"},
  {t:"  → Tout le monde discute et propose des réponses", cl:""},
  {t:"  → L'équipe se met d'accord", cl:""},
  {t:"  → Le maître du jeu sélectionne la réponse choisie", cl:""},
  {t:"  → Chaque erreur = -5 minutes sur le chrono", cl:"t-red"},
  {t:"  → Bouton PAUSE pour un débrief collectif", cl:""},
  {t:" ", cl:""},
  {t:"4 chiffres à trouver → code de désactivation.", cl:"t-cyan"},
  {t:" ", cl:""},
  {t:"Hello, friend. Bonne chance.", cl:"t-green terminal-cursor"},
];
function showWelcome() {
  const t = document.getElementById('welcome-terminal'); t.innerHTML = '';
  let i = 0;
  const iv = setInterval(() => {
    if (i >= WELCOME.length) { clearInterval(iv); return; }
    const s = document.createElement('span');
    s.className = `t-line ${WELCOME[i].cl}`; s.textContent = WELCOME[i].t || '\u00a0';
    t.appendChild(s); i++;
  }, 55);
}

// ═══════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════
function buildNav() {
  const c = document.getElementById('nav-items'); c.innerHTML = '';
  ENIGMAS.forEach((e, i) => {
    const d = document.createElement('div');
    d.className = 'nav-item' + (i === 0 ? ' active' : ' locked');
    d.id = `nav-${i}`;
    d.innerHTML = `<span class="nav-num">${String(e.id).padStart(2,'0')}</span><span style="flex:1;line-height:1.3">${e.title}</span><span class="nav-check">○</span>`;
    d.onclick = () => { if (!d.classList.contains('locked')) goTo(i); };
    c.appendChild(d);
  });
}
function updateNav() {
  const maxUnlocked = STATE.completed.size;
  ENIGMAS.forEach((_, i) => {
    const d = document.getElementById(`nav-${i}`); if (!d) return;
    d.className = 'nav-item';
    if (STATE.completed.has(i)) { d.classList.add('completed'); d.querySelector('.nav-check').textContent = '✓'; }
    else if (i === STATE.current) d.classList.add('active');
    else if (i <= maxUnlocked) { /* unlocked */ }
    else d.classList.add('locked');
  });
}
function updateThreat() {
  const pct = (STATE.score / 25) * 100;
  const threat = Math.max(5, 100 - pct);
  const f = document.getElementById('threat-fill');
  const t = document.getElementById('threat-text');
  f.style.width = threat + '%';
  if (threat > 70) { t.textContent = 'CRITIQUE'; f.style.background = '#ff2020'; }
  else if (threat > 45) { t.textContent = 'ÉLEVÉ'; f.style.background = '#ffb000'; }
  else if (threat > 20) { t.textContent = 'MODÉRÉ'; f.style.background = '#ffcc60'; }
  else { t.textContent = 'MAÎTRISÉ'; f.style.background = '#00ff41'; }
}

// ═══════════════════════════════════════════════════════
// NAVIGATE & RENDER
// ═══════════════════════════════════════════════════════
function goTo(i) {
  STATE.current = i;
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('enigma-view').style.display = 'block';
  renderEnigma(i); updateNav(); updateStoryBanner(i);
  const ca = document.getElementById('content-area'); ca.scrollTop = 0;
}

function renderEnigma(i) {
  const e = ENIGMAS[i];
  const done = STATE.completed.has(i);
  const view = document.getElementById('enigma-view');

  const dots = ENIGMAS.map((_, j) => `<div class="dot${STATE.completed.has(j) ? ' done' : j===i ? ' current' : ''}"></div>`).join('');

  const optHtml = e.options.map((o, oi) => {
    let cls = '';
    if (done && o.c) cls = 'correct';
    return `<button class="option ${cls}" id="opt-${i}-${oi}" onclick="pick(${i},${oi})" ${done ? 'disabled' : ''}>
      <span class="opt-letter" id="ol-${i}-${oi}">${['A','B','C','D'][oi]}</span>
      <span>${o.t}</span>
    </button>`;
  }).join('');

  const fbHtml = done
    ? `<div class="feedback-box correct-fb"><div class="fb-title">✓ RÉPONSE CORRECTE</div>${e.feedback.ok}</div>`
    : `<div class="feedback-box" id="fb-${i}"></div>`;

  const penaltyHtml = `<div class="penalty-notice" id="pen-${i}">⏱ −5 minutes de pénalité appliquées</div>`;

  const codeHtml = done && e.codeReveal
    ? `<div class="code-unlock show"><div class="cu-label">CODE DÉBLOQUÉ</div>${e.codeReveal}</div>` : '';

  const hintHtml = `<div class="hint-wrap">
    <button class="hint-btn" onclick="toggleHint(${i})">💡 Afficher l'indice</button>
    <div class="hint-content" id="hc-${i}">${e.hint}</div>
  </div>`;

  let nextHtml = '';
  if (done) {
    if (e.isFinal) nextHtml = `<button class="btn-primary" onclick="showVictory()">DÉSACTIVER LE RANSOMWARE ▶</button>`;
    else nextHtml = `<button class="btn-primary" onclick="goTo(${i+1})">MODULE SUIVANT →</button>`;
  }

  view.innerHTML = `
    <div class="progress-dots">${dots}</div>
    <div class="enigma-header">
      <div class="enigma-phase">${e.phase}</div>
      <div class="enigma-title" data-text="${e.title}">${e.title}</div>
      <div class="enigma-subtitle">${e.subtitle}</div>
    </div>
    <div class="story-card"><div class="story-card-text">${e.story}</div></div>
    ${e.visual}
    <div class="question-block">
      <div class="q-label">QUESTION DU MODULE ${String(e.id).padStart(2,'0')}</div>
      <div class="q-text">${e.question}</div>
      <div class="options" id="opts-${i}">${optHtml}</div>
      ${hintHtml}
      ${penaltyHtml}
      ${fbHtml}
      ${codeHtml}
    </div>
    <div class="btn-next" id="bnext-${i}">${nextHtml}</div>
  `;
}

// ═══════════════════════════════════════════════════════
// ANSWER SELECTION — no reveal on wrong
// ═══════════════════════════════════════════════════════
function pick(ei, oi) {
  if (STATE.completed.has(ei)) return;
  const e = ENIGMAS[ei];
  const selected = e.options[oi];
  const fb = document.getElementById(`fb-${ei}`);
  const pen = document.getElementById(`pen-${ei}`);
  const btn = document.getElementById(`opt-${ei}-${oi}`);
  const ol = document.getElementById(`ol-${ei}-${oi}`);

  if (selected.c) {
    // CORRECT
    btn.classList.add('correct'); btn.disabled = true; ol.style.color = 'var(--green)';
    // Disable all
    e.options.forEach((_, j) => {
      const b = document.getElementById(`opt-${ei}-${j}`); if (b) b.disabled = true;
    });
    fb.className = 'feedback-box correct-fb';
    fb.innerHTML = `<div class="fb-title">✓ RÉPONSE CORRECTE</div>${e.feedback.ok}`;

    STATE.completed.add(ei); STATE.score++;
    document.getElementById('score-display').textContent = STATE.score;

    if (e.codeIndex !== null) {
      STATE.codeDigits[e.codeIndex] = e.codeDigit;
      const cd = document.getElementById(`cd${e.codeIndex+1}`);
      if (cd) { cd.textContent = e.codeDigit; cd.classList.add('revealed'); }
    }
    if (e.codeReveal) {
      setTimeout(() => {
        const q = document.querySelector(`#enigma-view .question-block`);
        if (q && !q.querySelector('.code-unlock')) {
          const cu = document.createElement('div');
          cu.className = 'code-unlock show';
          cu.innerHTML = `<div class="cu-label">CODE DÉBLOQUÉ</div>${e.codeReveal}`;
          fb.after(cu);
        }
      }, 400);
    }

    // Show next button
    const bnext = document.getElementById(`bnext-${ei}`);
    if (e.isFinal) bnext.innerHTML = `<button class="btn-primary" onclick="showVictory()">DÉSACTIVER LE RANSOMWARE ▶</button>`;
    else bnext.innerHTML = `<button class="btn-primary" onclick="goTo(${ei+1})">MODULE SUIVANT →</button>`;

    updateNav(); updateThreat();
    updateVictoryCode();

  } else {
    // WRONG — shake, penalty, no reveal
    btn.classList.add('wrong-try'); ol.style.color = 'var(--red)';
    setTimeout(() => { btn.classList.remove('wrong-try'); ol.style.color = ''; }, 500);

    if (!STATE.wrongAttempts[ei]) STATE.wrongAttempts[ei] = 0;
    STATE.wrongAttempts[ei]++;

    // Apply penalty
    applyPenalty();

    // Show penalty notice briefly
    pen.classList.add('show');
    setTimeout(() => pen.classList.remove('show'), 3000);

    // Show wrong feedback without revealing correct answer
    fb.className = 'feedback-box wrong-fb';
    fb.innerHTML = `<div class="fb-title">✗ MAUVAISE RÉPONSE — −5 minutes</div>${e.feedback.ko}`;
    setTimeout(() => {
      if (!STATE.completed.has(ei)) { fb.className = 'feedback-box'; fb.innerHTML = ''; }
    }, 4000);
  }
}

function updateVictoryCode() {
  const d = document.getElementById('victory-code-display');
  if (d) d.textContent = STATE.codeDigits.join(' — ');
}
function toggleHint(i) {
  const hc = document.getElementById(`hc-${i}`); if (hc) hc.classList.toggle('show');
}

// ═══════════════════════════════════════════════════════
// VICTORY / GAME OVER / RESET
// ═══════════════════════════════════════════════════════
function showVictory() {
  clearInterval(STATE.timerInterval);
  const m = Math.floor(STATE.timerSec/60), s = STATE.timerSec%60;
  document.getElementById('victory-time-left').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  document.getElementById('victory-code-display').textContent = STATE.codeDigits.join(' — ');
  const grid = document.getElementById('debrief-grid');
  grid.innerHTML = ENIGMAS.map(e => `<div class="debrief-item"><div class="debrief-num">MODULE ${String(e.id).padStart(2,'0')}</div><div class="debrief-lesson">${e.lesson}</div></div>`).join('');
  document.getElementById('victory-screen').style.display = 'flex';
}
function gameOver() {
  document.getElementById('gameover-screen').style.display = 'flex';
}
function resetGame() {
  clearInterval(STATE.timerInterval);
  STATE = { current:0, completed:new Set(), codeDigits:['?','?','?','?'], timerSec:90*60, timerInterval:null, paused:false, score:0, wrongAttempts:{} };
  ['victory-screen','gameover-screen'].forEach(id => document.getElementById(id).style.display='none');
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('score-display').textContent = '0';
  ['cd1','cd2','cd3','cd4'].forEach(id => { const el=document.getElementById(id); el.textContent='?'; el.classList.remove('revealed'); });
  document.getElementById('timer').classList.remove('urgent');
  document.getElementById('pause-btn').classList.remove('paused');
  document.getElementById('pause-icon').textContent = '⏸';
  document.getElementById('pause-label').textContent = 'PAUSE';
  document.getElementById('app').style.display='none';
  const boot=document.getElementById('boot-screen');
  boot.style.display='flex'; boot.style.opacity='1';
  document.getElementById('boot-lines').innerHTML='';
  document.getElementById('boot-start').style.display='none';
  runBoot();
}

document.addEventListener('DOMContentLoaded', runBoot);

/* MON CODE JAVASCRIPT
   C'est ici que se trouve le cerveau du site.
   On gère les clics sur les boutons et le calcul du mot de passe.
*/

// --- 1. ON RÉCUPÈRE LES ÉLÉMENTS DE LA PAGE (HTML) ---
// On crée des raccourcis pour pouvoir modifier les éléments de la page
const ecranResultat = document.getElementById('result');
const champLongueur = document.getElementById('length');
const caseMajuscule = document.getElementById('uppercase');
const caseMinuscule = document.getElementById('lowercase');
const caseChiffre   = document.getElementById('numbers');
const caseSymbole   = document.getElementById('symbols');
const boutonGenerer = document.getElementById('generate');
const boutonCopier  = document.getElementById('clipboard');
const barreSecurite = document.getElementById('strength-bar');
const labelForce    = document.getElementById('strength-label');
const labelEntropie = document.getElementById('strength-entropy');

// Éléments du panneau "TESTER"
const champTest        = document.getElementById('test-input');
const barreTest        = document.getElementById('test-strength-bar');
const labelForceTest   = document.getElementById('test-strength-label');
const labelEntropieTest= document.getElementById('test-strength-entropy');
const listeChecks      = document.getElementById('test-checks');

// --- LES JEUX DE CARACTÈRES (un seul endroit pour tout définir) ---
const MINUSCULES = 'abcdefghijklmnopqrstuvwxyz';
const MAJUSCULES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHIFFRES   = '0123456789';
const SYMBOLES   = '!@#$%^&*(){}[]=<>/,.';

// --- 2. QUAND ON CLIQUE SUR "GÉNÉRER" ---
boutonGenerer.addEventListener('click', () => {
    
    // On récupère le nombre que l'utilisateur a écrit
    let longueurvoulue = +champLongueur.value;

    // SÉCURITÉ : On empêche de mettre n'importe quoi
    // Si c'est plus grand que 50, on bloque à 50
    if (longueurvoulue > 50) {
        longueurvoulue = 50;
        champLongueur.value = 50; 
    }
    // Si c'est trop petit ou vide, on force à 12 (minimum recommandé par la CNIL)
    if (longueurvoulue < 12 || isNaN(longueurvoulue)) {
        longueurvoulue = 12;
        champLongueur.value = 12;
    }

    // On vérifie quelles cases sont cochées (vrai ou faux)
    const options = {
        minuscule: caseMinuscule.checked,
        majuscule: caseMajuscule.checked,
        chiffre: caseChiffre.checked,
        symbole: caseSymbole.checked
    };

    // On lance la fabrication du mot de passe
    const motDePasse = fabriquerMotDePasse(options, longueurvoulue);

    // On affiche le résultat sur la page
    ecranResultat.innerText = motDePasse;

    // Taille du "pool" de caractères possibles d'après les options cochées.
    // C'est CE chiffre qui détermine la vraie force (pas juste la longueur).
    let taillePool = 0;
    if (options.minuscule) taillePool += MINUSCULES.length;
    if (options.majuscule) taillePool += MAJUSCULES.length;
    if (options.chiffre)   taillePool += CHIFFRES.length;
    if (options.symbole)   taillePool += SYMBOLES.length;

    // On met à jour la barre selon l'entropie réelle
    const entropie = motDePasse.length * Math.log2(taillePool);
    rendreForce(entropie, {
        barre: barreSecurite,
        label: labelForce,
        entropie: labelEntropie
    });
});

// --- 3. QUAND ON CLIQUE SUR "COPIER" ---
boutonCopier.addEventListener('click', () => {
    const texte = ecranResultat.innerText;

    // Si y'a rien à copier ou si c'est un message d'erreur, on arrête tout
    if (!texte || texte.includes('_') || texte.includes('REQUIRED')) return;

    // Commande spéciale pour copier dans le presse-papier de l'ordi
    navigator.clipboard.writeText(texte);
    
    // Petit effet visuel pour dire "C'est copié !"
    const texteOriginal = boutonCopier.innerText;
    boutonCopier.innerText = 'COPIÉ!';
    boutonCopier.style.color = '#00ff41'; // Vert

    // On remet le bouton normal après 1 seconde et demie (1500ms)
    setTimeout(() => {
        boutonCopier.innerText = texteOriginal;
        boutonCopier.style.color = '';
    }, 1500);
});

// --- 4. HASARD SÉCURISÉ (le cœur de la sécurité) ---
// Math.random() est PRÉVISIBLE : interdit pour de la crypto.
// On utilise crypto.getRandomValues() (vrai générateur sécurisé du navigateur).
// Rejet d'échantillon ("rejection sampling") pour éviter le biais modulo :
// sans ça, les premiers caractères du jeu sortiraient un peu plus souvent.
function hasardSecurise(max) {
    const limite = Math.floor(0x100000000 / max) * max;
    const tampon = new Uint32Array(1);
    let valeur;
    do {
        crypto.getRandomValues(tampon);
        valeur = tampon[0];
    } while (valeur >= limite);
    return valeur % max;
}

// --- LA RECETTE DE FABRICATION DU MOT DE PASSE ---
function fabriquerMotDePasse(options, longueur) {
    // On rassemble les jeux de caractères des cases cochées
    const ensembles = [];
    if (options.minuscule) ensembles.push(MINUSCULES);
    if (options.majuscule) ensembles.push(MAJUSCULES);
    if (options.chiffre)   ensembles.push(CHIFFRES);
    if (options.symbole)   ensembles.push(SYMBOLES);

    // Si aucune case n'est cochée, on prévient l'utilisateur
    if (ensembles.length === 0) return 'SELECT_OPTION_REQUIRED';

    // Le "pool" = tous les caractères autorisés réunis
    const pool = ensembles.join('');
    const caracteres = [];

    // 1) On garantit AU MOINS un caractère de chaque type coché
    //    (tant qu'il reste de la place dans la longueur demandée)
    for (const jeu of ensembles) {
        if (caracteres.length < longueur) {
            caracteres.push(jeu[hasardSecurise(jeu.length)]);
        }
    }

    // 2) On remplit le reste en tirant indépendamment dans le pool complet
    while (caracteres.length < longueur) {
        caracteres.push(pool[hasardSecurise(pool.length)]);
    }

    // 3) Mélange Fisher-Yates (vrai mélange uniforme, contrairement à sort(random))
    //    Sinon les caractères garantis resteraient toujours au début.
    for (let i = caracteres.length - 1; i > 0; i--) {
        const j = hasardSecurise(i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }

    return caracteres.join('');
}

// --- 5. LA BARRE DE PUISSANCE (basée sur l'ENTROPIE réelle) ---
// Entropie en bits = longueur × log2(taille du pool).
// Elle reflète À LA FOIS la longueur ET la variété de caractères.
// Fonction réutilisée par le générateur ET par le testeur, d'où le paramètre
// "els" qui pointe vers les bons éléments HTML (barre / label / entropie).
function rendreForce(entropie, els) {
    // Cas vide / état initial : on remet la barre à zéro
    if (!entropie || !isFinite(entropie)) {
        els.barre.style.width = '0%';
        els.barre.style.boxShadow = 'none';
        els.label.innerText = '';
        els.entropie.innerText = '';
        return;
    }

    // Largeur : on plafonne à 100 bits = barre pleine
    els.barre.style.width = `${Math.min(entropie, 100)}%`;

    // Seuils de force (recommandations courantes de sécurité)
    let couleur, libelle;
    if (entropie < 40) {
        couleur = '#d32f2f'; libelle = 'FAIBLE';        // rouge
    } else if (entropie < 60) {
        couleur = '#ffa000'; libelle = 'MOYEN';         // orange
    } else if (entropie < 80) {
        couleur = '#ffe000'; libelle = 'FORT';          // jaune
    } else {
        couleur = '#00ff41'; libelle = 'EXCELLENT';     // vert
    }

    els.barre.style.backgroundColor = couleur;
    els.barre.style.boxShadow = `0 0 10px ${couleur}`;
    els.label.style.color = couleur;
    els.label.innerText = libelle;
    els.entropie.innerText = `${Math.round(entropie)} bits`;
}

// --- 6b. LES ONGLETS (bascule Générer / Tester) ---
const boutonsOnglet = document.querySelectorAll('.tab-btn');
const panneaux = document.querySelectorAll('.panel');

boutonsOnglet.forEach(bouton => {
    bouton.addEventListener('click', () => {
        // On enlève "active" partout, puis on l'ajoute sur le bon onglet/panneau
        boutonsOnglet.forEach(b => b.classList.remove('active'));
        panneaux.forEach(p => p.classList.remove('active'));
        bouton.classList.add('active');
        document.getElementById('panel-' + bouton.dataset.tab).classList.add('active');
    });
});

// --- 6c. L'ANALYSEUR DE MOT DE PASSE (onglet TESTER) ---
// Estime la force par l'entropie = longueur × log2(taille du pool des types présents),
// puis vérifie les critères de la CNIL.
function analyserMotDePasse(mdp) {
    // Champ vide : on remet tout à zéro
    if (!mdp) {
        rendreForce(0, { barre: barreTest, label: labelForceTest, entropie: labelEntropieTest });
        listeChecks.innerHTML = '';
        return;
    }

    // Quels types de caractères sont présents ?
    const aMinuscule = /[a-z]/.test(mdp);
    const aMajuscule = /[A-Z]/.test(mdp);
    const aChiffre   = /[0-9]/.test(mdp);
    const aSymbole   = /[^A-Za-z0-9]/.test(mdp);
    const nbTypes = aMinuscule + aMajuscule + aChiffre + aSymbole;

    // Taille du pool = somme des jeux détectés (33 ≈ symboles ASCII imprimables)
    let taillePool = 0;
    if (aMinuscule) taillePool += 26;
    if (aMajuscule) taillePool += 26;
    if (aChiffre)   taillePool += 10;
    if (aSymbole)   taillePool += 33;

    const entropie = mdp.length * Math.log2(taillePool);

    // Barre + label
    rendreForce(entropie, { barre: barreTest, label: labelForceTest, entropie: labelEntropieTest });

    // Liste des critères (reco CNIL : ≥ 12 caractères ET 4 types)
    const criteres = [
        { ok: mdp.length >= 12,      texte: `Au moins 12 caractères (actuel : ${mdp.length})` },
        { ok: aMajuscule,            texte: 'Contient des MAJUSCULES' },
        { ok: aMinuscule,            texte: 'Contient des minuscules' },
        { ok: aChiffre,              texte: 'Contient des chiffres' },
        { ok: aSymbole,              texte: 'Contient des symboles' },
        { ok: nbTypes === 4,         texte: 'Les 4 types de caractères présents (CNIL)' }
    ];
    listeChecks.innerHTML = criteres
        .map(c => `<li class="${c.ok ? 'ok' : 'fail'}">${c.texte}</li>`)
        .join('');
}

// On analyse à chaque frappe dans le champ de test
champTest.addEventListener('input', () => analyserMotDePasse(champTest.value));

// Bouton œil : bascule entre mot de passe masqué (•••) et visible
const boutonOeil = document.getElementById('toggle-visibility');
boutonOeil.addEventListener('click', () => {
    const visible = champTest.type === 'text';
    champTest.type = visible ? 'password' : 'text';
    boutonOeil.classList.toggle('revealed', !visible);
    boutonOeil.setAttribute('aria-pressed', String(!visible));
    boutonOeil.setAttribute('aria-label', visible ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
});

// --- 7. L'ANIMATION DE FOND (Pluie de code) ---
// Note : Cette partie sert juste à faire joli, ça ne change pas la sécurité.

const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

// On ajuste la taille du dessin à la taille de la fenêtre
function ajusterTaille() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', ajusterTaille);
ajusterTaille(); // On le fait une première fois au démarrage

// Configuration des gouttes
const taillePolice = 14;
const colonnes = canvas.width / taillePolice;
const gouttes = Array(Math.floor(colonnes)).fill(1);
// Les caractères qui tombent (mélange japonais + chiffres)
const caracteres = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアァカサタナハマヤャラワガザダバパイ';

function dessinerMatrice() {
    // On met un voile noir transparent pour faire l'effet de traînée
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff3333'; // Couleur rouge
    ctx.font = `${taillePolice}px monospace`;

    // On dessine chaque colonne
    for (let i = 0; i < gouttes.length; i++) {
        const texte = caracteres[Math.floor(Math.random() * caracteres.length)];
        ctx.fillText(texte, i * taillePolice, gouttes[i] * taillePolice);

        // Si la goutte est en bas de l'écran, on la remet en haut (de façon aléatoire)
        if (gouttes[i] * taillePolice > canvas.height && Math.random() > 0.975) {
            gouttes[i] = 0;
        }
        gouttes[i]++; // On fait descendre la goutte
    }
}

// On lance l'animation (80ms = vitesse lente)

setInterval(dessinerMatrice, 80);





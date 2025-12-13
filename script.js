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
    // Si c'est trop petit ou vide, on force à 4 caractères
    if (longueurvoulue < 4 || isNaN(longueurvoulue)) {
        longueurvoulue = 4;
        champLongueur.value = 4;
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
    
    // On met à jour la barre de couleur (rouge/orange/vert)
    calculerForce(motDePasse);
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

// --- 4. LA RECETTE DE FABRICATION DU MOT DE PASSE ---
function fabriquerMotDePasse(options, longueur) {
    let resultat = '';
    
    // On regarde quels types de caractères on a le droit d'utiliser
    // Exemple : si on veut que des chiffres, on ne garde que la fonction 'chiffre'
    const typesDisponibles = [];
    if (options.minuscule) typesDisponibles.push(donneUneMinuscule);
    if (options.majuscule) typesDisponibles.push(donneUneMajuscule);
    if (options.chiffre)   typesDisponibles.push(donneUnChiffre);
    if (options.symbole)   typesDisponibles.push(donneUnSymbole);

    // Si aucune case n'est cochée, on prévient l'utilisateur
    if (typesDisponibles.length === 0) return 'SELECT_OPTION_REQUIRED';

    // On boucle autant de fois que la longueur demandée
    // À chaque tour, on ajoute des caractères
    for (let i = 0; i < longueur; i += typesDisponibles.length) {
        typesDisponibles.forEach(fonction => {
            resultat += fonction();
        });
    }

    // On coupe pour avoir la longueur exacte et on mélange tout
    // Le mélange sert à ce que l'ordre ne soit pas prévisible
    const motDePasseFinal = resultat.slice(0, longueur);
    return motDePasseFinal.split('').sort(() => 0.5 - Math.random()).join('');
}

// --- 5. LA BARRE DE PUISSANCE (Rouge / Orange / Vert) ---
function calculerForce(mdp) {
    let point = 0;
    
    // On garde le système de points juste pour la LARGEUR de la barre
    if (mdp.length >= 8) point++;           
    if (mdp.length >= 12) point++;          
    if (/[A-Z]/.test(mdp)) point++;         
    if (/[0-9]/.test(mdp)) point++;         
    if (/[^A-Za-z0-9]/.test(mdp)) point++;  

    // Calcul de la largeur (remplissage visuel)
    const largeur = (point / 5) * 100;
    barreSecurite.style.width = `${largeur}%`;
    
    // --- GESTION DES COULEURS (SELON LA LONGUEUR) ---
    
    if (mdp.length < 8) {
        // Moins de 8 caractères : ROUGE
        barreSecurite.style.backgroundColor = '#d32f2f'; 
        barreSecurite.style.boxShadow = '0 0 10px #d32f2f';

    } else if (mdp.length <= 11) {
        // Entre 8 et 11 caractères : ORANGE
        barreSecurite.style.backgroundColor = '#ffa000'; 
        barreSecurite.style.boxShadow = '0 0 10px #ffa000';

    } else {
        // Plus de 12 caractères (12 inclu) : VERT
        barreSecurite.style.backgroundColor = '#00ff41'; 
        barreSecurite.style.boxShadow = '0 0 10px #00ff41';
    }
}

// --- 6. PETITES FONCTIONS UTILES (Les ingrédients) ---
// Ces fonctions tirent un caractère au hasard dans la table ASCII (le code des ordis)

function donneUneMinuscule() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
}
function donneUneMajuscule() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
}
function donneUnChiffre() {
    return String.fromCharCode(Math.floor(Math.random() * 10) + 48);
}
function donneUnSymbole() {
    const listeSymboles = '!@#$%^&*(){}[]=<>/,.';
    return listeSymboles[Math.floor(Math.random() * listeSymboles.length)];
}

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





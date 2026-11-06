import { firebaseConfig } from './firebase-config.js';

const loginButton = document.querySelector('#loginButton');
const loginText = document.querySelector('#loginText');
const profileButton = document.querySelector('#profileButton');
const profilePhoto = document.querySelector('#profilePhoto');
const profileInitials = document.querySelector('#profileInitials');
const profileName = document.querySelector('#profileName');
const profileEmail = document.querySelector('#profileEmail');
const profileMenu = document.querySelector('#profileMenu');
const logoutButton = document.querySelector('#logoutButton');

let auth = null;
let provider = null;
let signInWithPopupFn = null;
let signOutFn = null;
let toastFn = (msg) => console.info(msg);

function setUser(user) {
  const loggedIn = Boolean(user);
  loginButton.hidden = loggedIn;
  profileButton.hidden = !loggedIn;
  profileMenu.hidden = true;
  profileButton.setAttribute('aria-expanded', 'false');
  if (!user) return;

  const name = user.displayName || 'Minha conta';
  profileName.textContent = name.split(' ')[0];
  profileEmail.textContent = user.email || 'Conta Google';
  profileInitials.textContent = name.slice(0, 1).toUpperCase();
  const photo = typeof user.photoURL === 'string' && /^https:\/\//.test(user.photoURL) ? user.photoURL : '';
  profilePhoto.hidden = !photo;
  profileInitials.hidden = Boolean(photo);
  if (photo) profilePhoto.src = photo;
  else profilePhoto.removeAttribute('src');
}

function humanError(error) {
  switch (error?.code) {
    case 'auth/popup-closed-by-user': return 'Login cancelado.';
    case 'auth/cancelled-popup-request': return 'Já existe uma tentativa de login em andamento.';
    case 'auth/popup-blocked': return 'O navegador bloqueou a janela de login. Permita pop-ups para este site.';
    case 'auth/unauthorized-domain': return 'Adicione este domínio nos domínios autorizados do Firebase Authentication.';
    case 'auth/operation-not-allowed': return 'Ative o provedor Google nas configurações do Firebase Authentication.';
    case 'auth/network-request-failed': return 'Falha de rede. Verifique sua conexão.';
    default: return 'Não foi possível entrar com Google. Verifique a configuração do Firebase.';
  }
}

export async function initGoogleAuth(showToast) {
  toastFn = showToast;
  profileButton.addEventListener('click', () => {
    const opening = profileMenu.hidden;
    profileMenu.hidden = !opening;
    profileButton.setAttribute('aria-expanded', String(opening));
  });
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.account-area')) {
      profileMenu.hidden = true;
      profileButton.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      profileMenu.hidden = true;
      profileButton.setAttribute('aria-expanded', 'false');
    }
  });
  profilePhoto.addEventListener('error', () => {
    profilePhoto.hidden = true;
    profileInitials.hidden = false;
  });

  if (!firebaseConfig?.apiKey || !firebaseConfig?.authDomain || !firebaseConfig?.projectId || !firebaseConfig?.appId) {
    loginButton.addEventListener('click', () => toastFn('Login Google pendente: configure firebase-config.js e ative o provedor no Firebase.'));
    return;
  }

  try {
    const [appModule, authModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    ]);
    auth = authModule.getAuth(appModule.initializeApp(firebaseConfig));
    provider = new authModule.GoogleAuthProvider();
    signInWithPopupFn = authModule.signInWithPopup;
    signOutFn = authModule.signOut;
    authModule.onAuthStateChanged(auth, setUser, (error) => toastFn(humanError(error)));
  } catch (error) {
    console.error('Falha ao inicializar Firebase:', error);
    loginButton.addEventListener('click', () => toastFn('Não foi possível carregar o Firebase. Verifique a rede e a configuração.'));
    return;
  }

  loginButton.addEventListener('click', async () => {
    if (!auth || !provider) return;
    loginButton.disabled = true;
    loginText.textContent = 'Conectando...';
    try { await signInWithPopupFn(auth, provider); }
    catch (error) { if (error?.code !== 'auth/popup-closed-by-user') console.error(error); toastFn(humanError(error)); }
    finally { loginButton.disabled = false; loginText.textContent = 'Entrar com Google'; }
  });
  logoutButton.addEventListener('click', async () => {
    try { await signOutFn(auth); toastFn('Você saiu da conta.'); }
    catch (error) { console.error(error); toastFn('Não foi possível sair da conta.'); }
  });
}

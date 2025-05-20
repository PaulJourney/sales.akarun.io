// BSC Configuration
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const PAYMENT_ADDRESS = "0x874de45cb51694ca59626d24928a8cebfcefa9fc"; // Nuovo indirizzo per i pagamenti effettivi
const BSC_CHAIN_ID = "0x38";
const TOKEN_PRICE = 0.006; // Prezzo del token aggiornato per i calcoli

// Password Configuration
const CORRECT_PASSWORD = 'Priv4t3'; // Nuova password di accesso

// Limiti di contribuzione
const MIN_CONTRIBUTION_USD = 1000;
const MAX_CONTRIBUTION_USD = 30000;
const TEST_CONTRIBUTION_USD = 1; // Importo per il test

// DOM Elements
const passwordSection = document.getElementById('password-section');
const mainContent = document.getElementById('main-content');
const passwordInput = document.getElementById('password-input');
const submitPassword = document.getElementById('submit-password');
const passwordError = document.getElementById('password-error');
const connectWalletBtn = document.getElementById('connect-wallet');
const walletStatus = document.getElementById('wallet-status');
const saleSection = document.getElementById('sale-section');

// Purchase elements
const amountSelect = document.getElementById('amount-select');
const tokenDisplay = document.getElementById('token-display');
const tokenAmount = document.getElementById('token-amount');
const payButton = document.getElementById('pay-button');
const transactionStatus = document.getElementById('transaction-status');
const loadingSpinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const statusDetails = document.getElementById('status-details');

// Event Listeners
submitPassword.addEventListener('click', validatePassword);
connectWalletBtn.addEventListener('click', connectWallet);
amountSelect.addEventListener('change', updateTokenAmount);
payButton.addEventListener('click', initiatePayment);

// Check if MetaMask is installed
if (typeof window.ethereum !== 'undefined') {
    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    // Listen for network changes
    window.ethereum.on('chainChanged', handleChainChanged);
}

// Handle account changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        walletStatus.textContent = 'Please connect your MetaMask wallet';
        walletStatus.className = 'status-text error';
        saleSection.classList.add('hidden');
        connectWalletBtn.textContent = 'Connect MetaMask';
        connectWalletBtn.disabled = false;
    } else {
        // Update the current account
        const userAddress = accounts[0];
        walletStatus.textContent = 'Connected: ' + userAddress.slice(0, 6) + '...' + userAddress.slice(-4);
        walletStatus.className = 'status-text connected';
        saleSection.classList.remove('hidden');
        connectWalletBtn.textContent = 'Wallet Connected';
        connectWalletBtn.disabled = true;
    }
}

// Handle chain changes
function handleChainChanged(chainId) {
    if (chainId !== BSC_CHAIN_ID) {
        walletStatus.textContent = 'Please switch to Binance Smart Chain';
        walletStatus.className = 'status-text error';
        saleSection.classList.add('hidden');
    } else {
        saleSection.classList.remove('hidden');
    }
}

// Connect wallet function
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        walletStatus.textContent = 'Please install MetaMask';
        walletStatus.className = 'status-text error';
        return;
    }

    connectWalletBtn.disabled = true;
    connectWalletBtn.textContent = 'Connecting...';

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Check if we're on the correct network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_CHAIN_ID) {
            await switchToBSC();
        }

        handleAccountsChanged(accounts);
    } catch (error) {
        console.error('Error connecting wallet:', error);
        walletStatus.textContent = 'Failed to connect wallet';
        walletStatus.className = 'status-text error';
        connectWalletBtn.disabled = false;
        connectWalletBtn.textContent = 'Connect MetaMask';
    }
}

// Password validation
function validatePassword() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        passwordSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } else {
        passwordError.textContent = 'Incorrect password. Please try again.';
        passwordInput.value = '';
    }
}

// Update token amount based on selected USD amount
function updateTokenAmount() {
    const selectedAmount = parseFloat(amountSelect.value); // Usa parseFloat per importi con decimali (anche se qui sono interi)
    if (!isNaN(selectedAmount) && selectedAmount > 0) { // Controlla che sia un numero valido e maggiore di 0
        const tokens = selectedAmount / TOKEN_PRICE;
        tokenDisplay.classList.remove('hidden');
        tokenAmount.textContent = tokens.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }); // Formatta per evitare troppi decimali
        payButton.disabled = false;

        // Potenziale validazione visiva qui (opzionale, la facciamo nella logica di pagamento)
        // if (selectedAmount !== TEST_CONTRIBUTION_USD && selectedAmount < MIN_CONTRIBUTION_USD) {
        //     // Mostra un avviso visivo all'utente
        // }

    } else {
        tokenDisplay.classList.add('hidden');
        payButton.disabled = true;
    }
}

// Check if network is BSC
async function checkNetwork() {
    if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to proceed.");
        return false;
    }

    try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (chainId !== BSC_CHAIN_ID) {
            const switched = await switchToBSC();
            return switched;
        }
        return true;
    } catch (error) {
        console.error("Error checking network:", error);
        return false;
    }
}

// Switch to BSC Network
async function switchToBSC() {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BSC_CHAIN_ID }],
        });
        return true;
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: BSC_CHAIN_ID,
                        chainName: "Binance Smart Chain",
                        nativeCurrency: {
                            name: "BNB",
                            symbol: "BNB",
                            decimals: 18
                        },
                        rpcUrls: ["https://bsc-dataseed.binance.org/"],
                        blockExplorerUrls: ["https://bscscan.com/"]
                    }]
                });
                return true;
            } catch (addError) {
                console.error("Error adding BSC network:", addError);
                return false;
            }
        }
        console.error("Error switching to BSC:", switchError);
        return false;
    }
}

// Initialize payment process
async function initiatePayment() {
    if (!window.ethereum || !window.ethers) {
        showTransactionError("Please install MetaMask to proceed");
        return;
    }

    showTransactionStatus('Connecting to wallet...', '', true);
    payButton.disabled = true;

    try {
        // 1. Connect to wallet and verify network
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId !== parseInt(BSC_CHAIN_ID)) {
            await switchToBSC();
            showTransactionError("Please switch to Binance Smart Chain and try again");
            return;
        }

        // 2. Get user's address
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAddress = accounts[0];

        // 3. Setup USDT contract
        const usdtContract = new ethers.Contract(
            USDT_CONTRACT_ADDRESS,
            [
                "function transfer(address to, uint256 value) returns (bool)",
                "function balanceOf(address) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ],
            provider.getSigner() // Usa il signer per inviare transazioni
        );

        // 4. Get amount to send (in USD)
        const selectedAmountUSD = parseFloat(amountSelect.value); // Usa parseFloat
        if (isNaN(selectedAmountUSD) || selectedAmountUSD <= 0) {
             showTransactionError("Please select a valid amount");
             payButton.disabled = false;
             return;
        }

        // Validazione dei limiti di contribuzione
        if (selectedAmountUSD !== TEST_CONTRIBUTION_USD && (selectedAmountUSD < MIN_CONTRIBUTION_USD || selectedAmountUSD > MAX_CONTRIBUTION_USD)) {
            showTransactionError(`Contribution must be between $${MIN_CONTRIBUTION_USD} and $${MAX_CONTRIBUTION_USD}, or the $${TEST_CONTRIBUTION_USD} test amount.`);
            payButton.disabled = false;
            return;
        }


        // Convert amount to send from USD to USDT units (assuming 1 USDT = 1 USD and 18 decimals)
        // Recupera i decimali esatti dal contratto USDT
        const decimals = await usdtContract.decimals();
        // Converti l'importo USD selezionato (es. 1, 5000) in BigNumber scalato per i decimali di USDT.
        const amountToSendInUsdtUnits = ethers.utils.parseUnits(selectedAmountUSD.toString(), decimals); // Converte selectedAmountUSD in stringa per parseUnits


        // 5. Check user's USDT balance (con l'importo corretto in unità USDT)
        const balance = await usdtContract.balanceOf(userAddress);

        if (balance.lt(amountToSendInUsdtUnits)) {
            showTransactionError(`Insufficient USDT balance. You have ${ethers.utils.formatUnits(balance, decimals)} USDT`);
            return;
        }

        // 6. Send transaction
        showTransactionStatus('Please confirm the transaction in MetaMask...', '', true);

        // Usiamo l'indirizzo di pagamento aggiornato (PAYMENT_ADDRESS) e l'importo corretto in unità USDT
        const tx = await usdtContract.transfer(PAYMENT_ADDRESS, amountToSendInUsdtUnits, {
            gasLimit: 100000 // Potrebbe essere necessario aggiustare il gas limit in base al network e alla congestione
        });

        showTransactionStatus('Transaction submitted, waiting for confirmation...', `Hash: ${tx.hash}`, true);

        const receipt = await tx.wait();

        // Transaction successful
        console.log("Transaction successful:", receipt);
        showTransactionSuccess();

    } catch (error) {
        console.error('Transaction failed:', error);
        // Mostra un messaggio di errore più specifico se disponibile nell'oggetto errore
        const errorMessage = error.message || 'Unknown error';
        showTransactionError(`Transaction failed: ${errorMessage}`);
        payButton.disabled = false; // Riabilita il pulsante dopo un errore
    }
}

// Helper functions for transaction status
function showTransactionStatus(message, details = '', loading = false) {
    transactionStatus.classList.remove('hidden', 'success', 'error');
    transactionStatus.classList.add('loading');
    statusMessage.textContent = message;
    statusDetails.textContent = details;
    if (loading) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

function showTransactionSuccess() {
    transactionStatus.classList.remove('hidden', 'loading', 'error');
    transactionStatus.classList.add('success');
    statusMessage.textContent = 'Transaction successful!';
    statusDetails.textContent = 'Your tokens will be sent to your wallet shortly.'; // Messaggio generico
    loadingSpinner.classList.add('hidden');
    payButton.disabled = true; // Disabilita il pulsante dopo il successo
}

function showTransactionError(message) {
    transactionStatus.classList.remove('hidden', 'loading', 'success');
    transactionStatus.classList.add('error');
    statusMessage.textContent = 'Transaction failed:';
    statusDetails.textContent = message;
    loadingSpinner.classList.add('hidden');
    payButton.disabled = false; // Riabilita il pulsante dopo un errore
}

// Language switching logic (dal file translations.js, se presente e caricato prima)
// Queste funzioni potrebbero dipendere dal caricamento di translations.js e dalla struttura di localizzazione
// Se non funzionano, potrebbe essere necessario verificarle nel contesto di translations.js e index.html
document.querySelectorAll('.language-selector a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        const lang = this.getAttribute('data-lang');
        changeLanguage(lang);
        // Aggiorna la classe 'active'
        document.querySelectorAll('.language-selector a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// Funzione per cambiare lingua (da translations.js)
// Assicurati che questa funzione sia definita e disponibile globalmente tramite translations.js
// if (typeof changeLanguage === 'function') {
//     // Esegui il cambio lingua iniziale o altro setup
//     changeLanguage('en'); // Esempio: imposta l'inglese come default
// } else {
//     console.error("La funzione changeLanguage non è disponibile. Assicurati che translations.js sia caricato correttamente.");
// }

// Nota: La logica di cambio lingua sembra dipendere da una funzione 'changeLanguage' definita in translations.js.
// Assicurati che translations.js sia caricato correttamente PRIMA di app.js in index.html.
// L'index.html che mi hai mostrato carica translations.js prima di app.js, quindi dovrebbe essere ok.

// Inizializza lo stato del wallet e della rete all'apertura della pagina
async function initializeApp() {
    // Verifica la rete all'avvio
    await checkNetwork();

    // Controlla se MetaMask è già connesso all'avvio
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                handleAccountsChanged(accounts);
            } else {
                 // Utente non connesso o account bloccato, mostra lo stato di disconnessione
                 walletStatus.textContent = 'Please connect your MetaMask wallet';
                 walletStatus.className = 'status-text'; // Rimuovi classi di stato precedenti
                 saleSection.classList.add('hidden');
                 connectWalletBtn.textContent = 'Connect MetaMask';
                 connectWalletBtn.disabled = false;
            }
        } catch (error) {
            console.error("Error checking initial accounts:", error);
             walletStatus.textContent = 'Could not check wallet status';
             walletStatus.className = 'status-text error';
             connectWalletBtn.textContent = 'Connect MetaMask';
             connectWalletBtn.disabled = false;
        }
    } else {
         walletStatus.textContent = 'Please install MetaMask';
         walletStatus.className = 'status-text error';
         connectWalletBtn.disabled = false; // Abilita il pulsante per mostrare il messaggio
         connectWalletBtn.textContent = 'Install MetaMask'; // Cambia testo pulsante
    }

     // Inizializza la lingua (dipende da translations.js)
    if (typeof changeLanguage === 'function') {
        // Cerca la lingua salvata in localStorage o usa il default
        const savedLang = localStorage.getItem('lang') || 'en'; // 'en' come default se non c'è nulla in localStorage
        changeLanguage(savedLang);
         // Imposta la classe 'active' sul selettore lingua corretto
         document.querySelectorAll('.language-selector a').forEach(link => {
            if (link.getAttribute('data-lang') === savedLang) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
         });
    }
}

// Esegui l'inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initializeApp);

// BSC Configuration
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const PAYMENT_ADDRESS = "0x12889B20F20A513E23c47FcEe3E1d8536e49B7c6";
const BSC_CHAIN_ID = "0x38";
const TOKEN_PRICE = 0.006;

// Password Configuration
const CORRECT_PASSWORD = 'FR13NDS';

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
    const selectedAmount = parseInt(amountSelect.value);
    if (selectedAmount) {
        const tokens = selectedAmount / TOKEN_PRICE;
        tokenDisplay.classList.remove('hidden');
        tokenAmount.textContent = tokens.toLocaleString();
        payButton.disabled = false;
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
            provider.getSigner()
        );

        // 4. Get amount to send
        const selectedAmount = amountSelect.value;
        if (!selectedAmount) {
            showTransactionError("Please select an amount");
            return;
        }

        // 5. Check user's USDT balance
        const balance = await usdtContract.balanceOf(userAddress);
        const decimals = await usdtContract.decimals();
        const amount = ethers.utils.parseUnits(selectedAmount, decimals);

        if (balance.lt(amount)) {
            showTransactionError(`Insufficient USDT balance. You have ${ethers.utils.formatUnits(balance, decimals)} USDT`);
            return;
        }

        // 6. Send transaction
        showTransactionStatus('Please confirm the transaction in MetaMask...', '', true);
        
        const tx = await usdtContract.transfer(PAYMENT_ADDRESS, amount, {
            gasLimit: 100000
        });

        showTransactionStatus('Transaction submitted, waiting for confirmation...', `Hash: ${tx.hash}`, true);
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            showTransactionSuccess();
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error) {
        console.error('Transaction error:', error);
        
        if (error.code === 4001) {
            showTransactionError('You rejected the transaction');
        } else if (error.message.includes('user rejected')) {
            showTransactionError('You rejected the transaction');
        } else if (error.message.includes('insufficient funds')) {
            showTransactionError('Insufficient BNB for gas fees');
        } else if (error.data?.message?.includes('transfer amount exceeds')) {
            showTransactionError('Insufficient USDT balance');
        } else {
            showTransactionError('Transaction failed. Please make sure you have enough USDT and BNB');
        }
    } finally {
        payButton.disabled = false;
    }
}

// Show transaction status
function showTransactionStatus(message, details = '', loading = false) {
    transactionStatus.classList.remove('hidden');
    statusMessage.textContent = message;
    statusDetails.textContent = details;
    loadingSpinner.classList.toggle('hidden', !loading);
}

// Show transaction success
function showTransactionSuccess() {
    showTransactionStatus(
        '🎉 Transaction successful!',
        'Your tokens will be distributed according to the vesting schedule:\n' +
        '• 10% at TGE\n' +
        '• 90% over 2 months',
        false
    );
    statusMessage.style.color = 'var(--success-color)';
}

// Show transaction error
function showTransactionError(message) {
    showTransactionStatus('❌ ' + message, '', false);
    statusMessage.style.color = 'var(--error-color)';
    payButton.disabled = false;
}

// Funzione per cambiare lingua
function changeLanguage(lang) {
    if (!translations || !translations[lang]) {
        console.error('Translations not found for language:', lang);
        return;
    }

    // Salva la lingua selezionata
    localStorage.setItem('selectedLanguage', lang);
    
    // Aggiorna la classe active sul selettore della lingua
    document.querySelectorAll('.language-selector a').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-lang') === lang) {
            el.classList.add('active');
        }
    });

    // Aggiorna tutti gli elementi con attributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        }
    });

    // Aggiorna i placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Aggiorna il titolo della pagina
    document.title = `Akarun Token - ${translations[lang].title}`;
}

// Aggiungi event listener per i link delle lingue
document.querySelectorAll('.language-selector a').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.getAttribute('data-lang');
        changeLanguage(lang);
    });
});

// Imposta la lingua iniziale quando il DOM è completamente caricato
window.addEventListener('DOMContentLoaded', () => {
    // Verifica che le traduzioni siano disponibili
    if (typeof translations === 'undefined') {
        console.error('Translations not loaded!');
        return;
    }

    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    changeLanguage(savedLang);
});
